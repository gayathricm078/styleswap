-- StyleSwap schema. One Postgres schema per microservice; no cross-schema
-- foreign keys, so each service owns its tables outright and could be moved
-- to its own database later without rewriting anything.
--
-- Idempotent: safe to re-run.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS cart;
CREATE SCHEMA IF NOT EXISTS wishlist;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS coupons;
CREATE SCHEMA IF NOT EXISTS notifications;

-- ---------------------------------------------------------------
-- auth-service
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth.users (
    user_id             TEXT PRIMARY KEY,
    email               TEXT NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    name                TEXT NOT NULL DEFAULT 'Valued Customer',
    phone               TEXT NOT NULL DEFAULT '',
    role                TEXT NOT NULL DEFAULT 'customer'
                        CHECK (role IN ('customer', 'vendor', 'admin')),
    profile_pic         TEXT NOT NULL DEFAULT '',
    sustainability_score INTEGER NOT NULL DEFAULT 100,
    reward_points       INTEGER NOT NULL DEFAULT 0,
    tier                TEXT NOT NULL DEFAULT 'Silver',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive login lookups.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx
    ON auth.users (lower(email));

CREATE TABLE IF NOT EXISTS auth.addresses (
    address_id  TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES auth.users(user_id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    street      TEXT NOT NULL,
    city        TEXT NOT NULL,
    state       TEXT NOT NULL,
    zip         TEXT NOT NULL,
    is_default  BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS addresses_user_idx ON auth.addresses (user_id);

-- At most one default address per user.
CREATE UNIQUE INDEX IF NOT EXISTS addresses_one_default_idx
    ON auth.addresses (user_id) WHERE is_default;

-- ---------------------------------------------------------------
-- catalog-service
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalog.products (
    product_id       TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    category         TEXT NOT NULL CHECK (category IN (
                        'Women', 'Men', 'Kids', 'Wedding',
                        'Jewellery', 'Shoes', 'Handbags', 'Home Decoration')),
    sub_category     TEXT NOT NULL,
    brand            TEXT NOT NULL,
    description      TEXT NOT NULL DEFAULT '',
    image            TEXT NOT NULL,
    -- A flat, isolated shot of the garment on a plain background — NOT a model
    -- wearing it. The virtual try-on model needs the garment separated from a
    -- body; fed a lifestyle shot it produces nonsense. NULL means this product
    -- cannot be tried on, which is correct for a vase or a handbag.
    tryon_image      TEXT,
    gallery          JSONB NOT NULL DEFAULT '[]'::jsonb,
    sizes            JSONB NOT NULL DEFAULT '[]'::jsonb,
    colors           JSONB NOT NULL DEFAULT '[]'::jsonb,
    rental_price     INTEGER NOT NULL CHECK (rental_price >= 0),
    security_deposit INTEGER NOT NULL CHECK (security_deposit >= 0),
    vendor_name      TEXT NOT NULL,
    vendor_user_id   TEXT,
    vendor_verified  TEXT NOT NULL DEFAULT 'Standard'
                     CHECK (vendor_verified IN ('Verified Vendor', 'Trusted Vendor', 'Standard')),
    rating           NUMERIC(2,1) NOT NULL DEFAULT 5.0,
    reviews_count    INTEGER NOT NULL DEFAULT 0,
    badge            TEXT,
    status           TEXT NOT NULL DEFAULT 'Available'
                     CHECK (status IN ('Available', 'Booked', 'Out For Delivery',
                                       'Currently Rented', 'Returned', 'Under Maintenance')),
    delivery_date    TEXT NOT NULL DEFAULT 'Tomorrow',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON catalog.products (category);
CREATE INDEX IF NOT EXISTS products_vendor_idx   ON catalog.products (vendor_user_id);
CREATE INDEX IF NOT EXISTS products_status_idx   ON catalog.products (status);

-- Backs the substring search the old backend got wrong.
CREATE INDEX IF NOT EXISTS products_name_trgm_idx
    ON catalog.products USING gin (lower(name) gin_trgm_ops);

CREATE TABLE IF NOT EXISTS catalog.reviews (
    review_id   TEXT PRIMARY KEY,
    product_id  TEXT NOT NULL REFERENCES catalog.products(product_id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL,
    user_name   TEXT NOT NULL,
    user_avatar TEXT NOT NULL DEFAULT '',
    rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT NOT NULL,
    date        TEXT NOT NULL,
    variant     TEXT NOT NULL DEFAULT 'Standard Selection',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_product_idx ON catalog.reviews (product_id);

-- One review per user per product.
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_product_idx
    ON catalog.reviews (user_id, product_id);

-- ---------------------------------------------------------------
-- cart-service
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart.cart_items (
    cart_item_id     TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL,
    product_id       TEXT NOT NULL,
    selected_size    TEXT NOT NULL,
    selected_color   TEXT NOT NULL,
    rental_duration  INTEGER NOT NULL DEFAULT 4 CHECK (rental_duration > 0),
    start_date       TEXT NOT NULL,
    security_deposit INTEGER NOT NULL DEFAULT 0,
    total_price      INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cart_user_idx ON cart.cart_items (user_id);

-- One row per (user, product, size, color); adding again bumps duration.
CREATE UNIQUE INDEX IF NOT EXISTS cart_unique_variant_idx
    ON cart.cart_items (user_id, product_id, selected_size, selected_color);

-- ---------------------------------------------------------------
-- wishlist-service
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist.wishlist_items (
    id         BIGSERIAL PRIMARY KEY,
    user_id    TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS wishlist_user_idx ON wishlist.wishlist_items (user_id);

-- ---------------------------------------------------------------
-- order-service
-- ---------------------------------------------------------------
-- delivery_address is a JSONB snapshot, not an FK into auth.addresses: an
-- order must keep the address it actually shipped to even if the user later
-- edits or deletes that address.
CREATE TABLE IF NOT EXISTS orders.orders (
    order_id         TEXT PRIMARY KEY,
    user_id          TEXT NOT NULL,
    total_amount     INTEGER NOT NULL,
    status           TEXT NOT NULL DEFAULT 'Booked'
                     CHECK (status IN ('Booked', 'Out For Delivery', 'Currently Rented',
                                       'Returned', 'Under Maintenance',
                                       'Pending Approval', 'Rejected')),
    date             TEXT NOT NULL,
    delivery_address JSONB NOT NULL,
    payment_method   TEXT NOT NULL
                     CHECK (payment_method IN ('Razorpay (Online)', 'Cash on Delivery')),
    return_status    TEXT NOT NULL DEFAULT 'Pending'
                     CHECK (return_status IN ('Pending', 'Under Inspection',
                                              'Returned In Perfect Condition',
                                              'Damage Detected', 'Resolved')),
    damage_report    JSONB,
    coupon_code      TEXT,
    discount_amount  INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_idx   ON orders.orders (user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders.orders (status);

-- product_snapshot freezes name/brand/image/price at purchase time so order
-- history stays truthful when the catalog changes underneath it.
CREATE TABLE IF NOT EXISTS orders.order_items (
    id               BIGSERIAL PRIMARY KEY,
    order_id         TEXT NOT NULL REFERENCES orders.orders(order_id) ON DELETE CASCADE,
    product_id       TEXT NOT NULL,
    product_snapshot JSONB NOT NULL,
    selected_size    TEXT NOT NULL,
    selected_color   TEXT NOT NULL,
    rental_duration  INTEGER NOT NULL CHECK (rental_duration > 0),
    start_date       TEXT NOT NULL,
    security_deposit INTEGER NOT NULL DEFAULT 0,
    total_price      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON orders.order_items (order_id);

-- ---------------------------------------------------------------
-- coupon-service
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons.coupons (
    code          TEXT PRIMARY KEY,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    value         INTEGER NOT NULL CHECK (value > 0),
    description   TEXT NOT NULL,
    active        BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- notification-service
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications.notifications (
    notification_id TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    title           TEXT NOT NULL,
    message         TEXT NOT NULL,
    type            TEXT NOT NULL
                    CHECK (type IN ('reminder', 'delivery', 'return', 'ai', 'promo')),
    date            TEXT NOT NULL,
    read            BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx
    ON notifications.notifications (user_id, created_at DESC);
