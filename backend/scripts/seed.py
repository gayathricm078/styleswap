"""Load seed data into Postgres.

    python -m scripts.seed          # insert missing rows, leave existing alone
    python -m scripts.seed --reset  # wipe all app tables first

Idempotent: every insert is ON CONFLICT DO NOTHING, so re-running never
duplicates and never clobbers rows you changed by hand.
"""
import argparse
import json
import sys
from pathlib import Path

import psycopg
from werkzeug.security import generate_password_hash

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from scripts import seed_data  # noqa: E402
from shared import config  # noqa: E402

# Order matters: children before parents.
TABLES_IN_WIPE_ORDER = [
    "orders.order_items",
    "orders.orders",
    "cart.cart_items",
    "wishlist.wishlist_items",
    "notifications.notifications",
    "catalog.reviews",
    "catalog.products",
    "coupons.coupons",
    "auth.addresses",
    "auth.users",
]


def reset(conn) -> None:
    for table in TABLES_IN_WIPE_ORDER:
        conn.execute(f"TRUNCATE TABLE {table} CASCADE")
    print(f"wiped {len(TABLES_IN_WIPE_ORDER)} tables")


def seed_users(conn) -> int:
    n = 0
    for u in seed_data.USERS:
        cur = conn.execute(
            """
            INSERT INTO auth.users (user_id, email, password_hash, name, phone, role,
                                    profile_pic, sustainability_score, reward_points, tier)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO NOTHING
            """,
            (
                u["user_id"],
                u["email"],
                generate_password_hash(u["password"]),
                u["name"],
                u["phone"],
                u["role"],
                u["profile_pic"],
                u["sustainability_score"],
                u["reward_points"],
                u["tier"],
            ),
        )
        n += cur.rowcount
    return n


def seed_addresses(conn) -> int:
    n = 0
    for a in seed_data.ADDRESSES:
        cur = conn.execute(
            """
            INSERT INTO auth.addresses (address_id, user_id, label, street, city, state, zip, is_default)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (address_id) DO NOTHING
            """,
            (
                a["address_id"],
                a["user_id"],
                a["label"],
                a["street"],
                a["city"],
                a["state"],
                a["zip"],
                a["is_default"],
            ),
        )
        n += cur.rowcount
    return n


def seed_products(conn) -> int:
    n = 0
    for p in seed_data.PRODUCTS:
        cur = conn.execute(
            """
            INSERT INTO catalog.products (
                product_id, name, category, sub_category, brand, description, image,
                gallery, sizes, colors, rental_price, security_deposit, vendor_name,
                vendor_user_id, vendor_verified, rating, reviews_count, badge, status,
                delivery_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (product_id) DO NOTHING
            """,
            (
                p["product_id"],
                p["name"],
                p["category"],
                p["sub_category"],
                p["brand"],
                p["description"],
                p["image"],
                json.dumps(p["gallery"]),
                json.dumps(p["sizes"]),
                json.dumps(p["colors"]),
                p["rental_price"],
                p["security_deposit"],
                p["vendor_name"],
                p["vendor_user_id"],
                p["vendor_verified"],
                p["rating"],
                p["reviews_count"],
                p["badge"],
                p["status"],
                p["delivery_date"],
            ),
        )
        n += cur.rowcount
    return n


def seed_reviews(conn) -> int:
    n = 0
    for r in seed_data.REVIEWS:
        cur = conn.execute(
            """
            INSERT INTO catalog.reviews (review_id, product_id, user_id, user_name,
                                         user_avatar, rating, comment, date, variant)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (review_id) DO NOTHING
            """,
            (
                r["review_id"],
                r["product_id"],
                r["user_id"],
                r["user_name"],
                r["user_avatar"],
                r["rating"],
                r["comment"],
                r["date"],
                r["variant"],
            ),
        )
        n += cur.rowcount
    return n


def seed_coupons(conn) -> int:
    n = 0
    for c in seed_data.COUPONS:
        cur = conn.execute(
            """
            INSERT INTO coupons.coupons (code, discount_type, value, description)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (code) DO NOTHING
            """,
            (c["code"], c["discount_type"], c["value"], c["description"]),
        )
        n += cur.rowcount
    return n


def seed_notifications(conn) -> int:
    n = 0
    for x in seed_data.NOTIFICATIONS:
        cur = conn.execute(
            """
            INSERT INTO notifications.notifications (notification_id, user_id, title,
                                                     message, type, date, read)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (notification_id) DO NOTHING
            """,
            (
                x["notification_id"],
                x["user_id"],
                x["title"],
                x["message"],
                x["type"],
                x["date"],
                x["read"],
            ),
        )
        n += cur.rowcount
    return n


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="truncate all tables first")
    args = parser.parse_args()

    try:
        conn = psycopg.connect(config.dsn(), autocommit=False)
    except psycopg.OperationalError as exc:
        print(f"Cannot connect to {config.PG_DB}: {exc}\nRun: python -m scripts.create_db")
        return 1

    with conn:
        if args.reset:
            reset(conn)

        print(f"users............. {seed_users(conn)} inserted")
        print(f"addresses......... {seed_addresses(conn)} inserted")
        print(f"products.......... {seed_products(conn)} inserted")
        print(f"reviews........... {seed_reviews(conn)} inserted")
        print(f"coupons........... {seed_coupons(conn)} inserted")
        print(f"notifications..... {seed_notifications(conn)} inserted")

    print("\nSeed complete. Demo logins (password123):")
    for u in seed_data.USERS:
        print(f"  {u['email']:<26} {u['role']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
