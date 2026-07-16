"""Additive migrations for an existing database.

schema.sql is CREATE TABLE IF NOT EXISTS, so it will not add a column to a
table that already exists. This applies those separately.

    python -m scripts.migrate

Idempotent — every statement is IF NOT EXISTS or guarded.
"""
import sys
from pathlib import Path

import psycopg

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from shared import config  # noqa: E402

MIGRATIONS = [
    (
        "catalog.products.tryon_image",
        "ALTER TABLE catalog.products ADD COLUMN IF NOT EXISTS tryon_image TEXT",
    ),
]


def main() -> int:
    try:
        conn = psycopg.connect(config.dsn(), autocommit=True)
    except psycopg.OperationalError as exc:
        print(f"Cannot connect to {config.PG_DB}: {exc}")
        return 1

    with conn:
        for label, sql in MIGRATIONS:
            conn.execute(sql)
            print(f"  applied: {label}")

    print("\nMigrations complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
