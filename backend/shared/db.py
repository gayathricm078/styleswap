"""Postgres access. One connection pool per service process."""
from contextlib import contextmanager

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from shared import config

_pool: ConnectionPool | None = None


def pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(
            conninfo=config.dsn(),
            min_size=1,
            max_size=8,
            timeout=15,
            kwargs={"row_factory": dict_row},
            open=True,
        )
    return _pool


@contextmanager
def cursor(commit: bool = False):
    """Hand out a dict-row cursor. Commits on clean exit when asked."""
    with pool().connection() as conn:
        with conn.cursor() as cur:
            yield cur
        if commit:
            conn.commit()


def query(sql: str, params: tuple = ()) -> list[dict]:
    with cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def query_one(sql: str, params: tuple = ()) -> dict | None:
    with cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchone()


def execute(sql: str, params: tuple = ()) -> dict | None:
    """Run a write. Returns the first RETURNING row when there is one."""
    with cursor(commit=True) as cur:
        cur.execute(sql, params)
        if cur.description is None:
            return None
        return cur.fetchone()


def execute_all(sql: str, params: tuple = ()) -> list[dict]:
    with cursor(commit=True) as cur:
        cur.execute(sql, params)
        if cur.description is None:
            return []
        return cur.fetchall()
