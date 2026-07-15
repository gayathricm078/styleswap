"""Row -> JSON shaping.

The database is snake_case; the frontend's src/types.ts is camelCase. That
translation lives here and nowhere else, so a column rename touches one file.
Every key below is dictated by src/types.ts — don't drift from it.
"""


def user_json(row: dict, addresses: list[dict] | None = None) -> dict:
    """Matches UserProfileData. Never includes password_hash."""
    return {
        "id": row["user_id"],
        "name": row["name"],
        "email": row["email"],
        "phone": row["phone"],
        "role": row["role"],
        "profilePic": row["profile_pic"],
        "sustainabilityScore": row["sustainability_score"],
        "rewardPoints": row["reward_points"],
        "tier": row["tier"],
        "addresses": [address_json(a) for a in (addresses or [])],
    }


def address_json(row: dict) -> dict:
    return {
        "id": row["address_id"],
        "label": row["label"],
        "street": row["street"],
        "city": row["city"],
        "state": row["state"],
        "zip": row["zip"],
        "isDefault": row["is_default"],
    }


def product_json(row: dict, reviews: list[dict] | None = None) -> dict:
    """Matches Product. `rating` must be a float — NUMERIC arrives as Decimal,
    which json.dumps cannot encode."""
    return {
        "id": row["product_id"],
        "name": row["name"],
        "category": row["category"],
        "subCategory": row["sub_category"],
        "brand": row["brand"],
        "description": row["description"],
        "image": row["image"],
        "gallery": row["gallery"],
        "sizes": row["sizes"],
        "colors": row["colors"],
        "rentalPrice": row["rental_price"],
        "securityDeposit": row["security_deposit"],
        "vendorName": row["vendor_name"],
        "vendorUserId": row.get("vendor_user_id"),
        "vendorVerified": row["vendor_verified"],
        "rating": float(row["rating"]),
        "reviewsCount": row["reviews_count"],
        "badge": row["badge"],
        "status": row["status"],
        "deliveryDate": row["delivery_date"],
        "reviews": [review_json(r) for r in (reviews or [])],
    }


def review_json(row: dict) -> dict:
    return {
        "id": row["review_id"],
        "userName": row["user_name"],
        "userAvatar": row["user_avatar"],
        "rating": row["rating"],
        "comment": row["comment"],
        "date": row["date"],
        "variant": row["variant"],
    }


def cart_item_json(row: dict, product: dict) -> dict:
    """Matches CartItem. `product` is the already-serialized product."""
    return {
        "id": row["cart_item_id"],
        "product": product,
        "selectedSize": row["selected_size"],
        "selectedColor": row["selected_color"],
        "rentalDuration": row["rental_duration"],
        "startDate": row["start_date"],
        "securityDeposit": row["security_deposit"],
        "totalPrice": row["total_price"],
    }


def order_item_json(row: dict) -> dict:
    """Order items read from product_snapshot, not the live catalog, so
    history stays accurate after a product changes or is delisted."""
    return {
        "id": f"item-{row['id']}",
        "product": row["product_snapshot"],
        "selectedSize": row["selected_size"],
        "selectedColor": row["selected_color"],
        "rentalDuration": row["rental_duration"],
        "startDate": row["start_date"],
        "securityDeposit": row["security_deposit"],
        "totalPrice": row["total_price"],
    }


def order_json(row: dict, items: list[dict]) -> dict:
    return {
        "id": row["order_id"],
        "items": [order_item_json(i) for i in items],
        "totalAmount": row["total_amount"],
        "status": row["status"],
        "date": row["date"],
        "deliveryAddress": row["delivery_address"],
        "paymentMethod": row["payment_method"],
        "returnStatus": row["return_status"],
        "damageReport": row["damage_report"],
    }


def coupon_json(row: dict) -> dict:
    return {
        "code": row["code"],
        "discountType": row["discount_type"],
        "value": row["value"],
        "description": row["description"],
    }


def notification_json(row: dict) -> dict:
    return {
        "id": row["notification_id"],
        "title": row["title"],
        "message": row["message"],
        "type": row["type"],
        "date": row["date"],
        "read": row["read"],
    }
