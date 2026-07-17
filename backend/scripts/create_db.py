"""Bootstrap the database.

Two modes, chosen automatically:

* Local Postgres (default): connects as the superuser, creates the app role
  and the `styleswap` database, enables pg_trgm, and applies schema.sql.

* Managed DB (DATABASE_URL set, e.g. Supabase): the provider already owns the
  role and database, so those steps are skipped. Connects via the URL, enables
  pg_trgm, and applies schema.sql into the existing database.

Idempotent either way.

    python -m scripts.create_db
"""
import sys
from pathlib import Path

import psycopg
from psycopg import sql

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from shared import config  # noqa: E402

SCHEMA_FILE = Path(__file__).resolve().parent / "schema.sql"

# The trigram index lives here, not in schema.sql, so a missing pg_trgm degrades
# to plain (still-correct) search instead of aborting the whole schema.
TRGM_INDEX = (
    "CREATE INDEX IF NOT EXISTS products_name_trgm_idx "
    "ON catalog.products USING gin (lower(name) gin_trgm_ops)"
)


def _try_trgm_index(conn) -> None:
    try:
        conn.execute(TRGM_INDEX)
        print("trigram search index: ready")
    except psycopg.Error as exc:
        conn.rollback() if not conn.autocommit else None
        print(f"note: trigram index skipped ({exc.diag.message_primary or exc}); "
              "search still works, just without trigram acceleration")


def _setup_managed() -> int:
    """Managed DB path: no role/database creation, just extension + schema."""
    try:
        conn = psycopg.connect(config.dsn(), autocommit=True)
    except psycopg.OperationalError as exc:
        print(f"Could not connect via DATABASE_URL: {exc}")
        return 1

    with conn:
        try:
            # On Supabase pg_trgm lives in the `extensions` schema and is often
            # pre-installed; IF NOT EXISTS makes this a no-op when so.
            conn.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
            print("extension pg_trgm: ready")
        except psycopg.errors.InsufficientPrivilege:
            # Some managed roles can't create extensions; the trigram index in
            # schema.sql is the only thing that needs it. Warn, don't abort.
            print("warning: could not create pg_trgm (insufficient privilege); "
                  "enable it in the Supabase dashboard if search is slow")

        conn.execute(SCHEMA_FILE.read_text(encoding="utf-8"))
        print("schema.sql applied")
        _try_trgm_index(conn)

    print("\nManaged database ready. Next: python -m scripts.seed")
    return 0


def main() -> int:
    if config.MANAGED_DB:
        return _setup_managed()

    if not config.PG_SUPERPASSWORD:
        print(
            "PG_SUPERPASSWORD is empty in backend/.env.\n"
            "Set it to your Postgres superuser password so the role and database "
            "can be created, then re-run."
        )
        return 1

    # Superuser connection to the maintenance database.
    admin_dsn = config.dsn(superuser=True, dbname="postgres")

    try:
        with psycopg.connect(admin_dsn, autocommit=True) as conn:
            cur = conn.cursor()

            cur.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (config.PG_USER,))
            if cur.fetchone():
                print(f"role {config.PG_USER}: already exists")
                cur.execute(
                    sql.SQL("ALTER ROLE {} WITH LOGIN PASSWORD {}").format(
                        sql.Identifier(config.PG_USER),
                        sql.Literal(config.PG_PASSWORD),
                    )
                )
            else:
                cur.execute(
                    sql.SQL("CREATE ROLE {} WITH LOGIN PASSWORD {}").format(
                        sql.Identifier(config.PG_USER),
                        sql.Literal(config.PG_PASSWORD),
                    )
                )
                print(f"role {config.PG_USER}: created")

            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (config.PG_DB,))
            if cur.fetchone():
                print(f"database {config.PG_DB}: already exists")
            else:
                cur.execute(
                    sql.SQL("CREATE DATABASE {} OWNER {}").format(
                        sql.Identifier(config.PG_DB),
                        sql.Identifier(config.PG_USER),
                    )
                )
                print(f"database {config.PG_DB}: created")
    except psycopg.OperationalError as exc:
        print(f"Could not connect to Postgres as {config.PG_SUPERUSER}: {exc}")
        return 1

    # pg_trgm needs superuser (or a trusted-extension path) and must live in
    # the target database, so create it here rather than in schema.sql.
    with psycopg.connect(
        config.dsn(superuser=True, dbname=config.PG_DB), autocommit=True
    ) as conn:
        conn.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
        conn.execute(
            sql.SQL("GRANT ALL ON DATABASE {} TO {}").format(
                sql.Identifier(config.PG_DB), sql.Identifier(config.PG_USER)
            )
        )
        conn.execute(
            sql.SQL("GRANT ALL ON SCHEMA public TO {}").format(
                sql.Identifier(config.PG_USER)
            )
        )
        print("extension pg_trgm: ready")

    # Apply schema as the app role so it owns every object it creates.
    with psycopg.connect(config.dsn(), autocommit=True) as conn:
        conn.execute(SCHEMA_FILE.read_text(encoding="utf-8"))
        print(f"schema.sql applied as {config.PG_USER}")
        _try_trgm_index(conn)

    print("\nDatabase ready. Next: python -m scripts.seed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
