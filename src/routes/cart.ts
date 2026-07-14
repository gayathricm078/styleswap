import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.ts";
import { db, cartItems, products } from "../db/index.ts";
import { eq, and } from "drizzle-orm";

const router = Router();

// Get cart items
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        cartItemId: cartItems.id,
        selectedSize: cartItems.selectedSize,
        selectedColor: cartItems.selectedColor,
        rentalDuration: cartItems.rentalDuration,
        startDate: cartItems.startDate,
        securityDeposit: cartItems.securityDeposit,
        totalPrice: cartItems.totalPrice,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, req.dbUser.id));

    // Map to CartItem interface format
    const formatted = list.map((item) => ({
      id: `cart-${item.cartItemId}`,
      product: item.product,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      rentalDuration: item.rentalDuration,
      startDate: item.startDate,
      securityDeposit: item.securityDeposit,
      totalPrice: item.totalPrice,
    }));

    return res.json(formatted);
  } catch (error: any) {
    console.error("Error fetching cart items:", error);
    return res.status(500).json({ error: "Failed to fetch cart." });
  }
});

// Add item to cart
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { productId, selectedSize, selectedColor, rentalDuration, startDate, securityDeposit, totalPrice } = req.body;

  if (!productId || !selectedSize || !selectedColor || !rentalDuration || !startDate || securityDeposit === undefined || totalPrice === undefined) {
    return res.status(400).json({ error: "Missing required cart parameters." });
  }

  try {
    const inserted = await db
      .insert(cartItems)
      .values({
        userId: req.dbUser.id,
        productId: parseInt(productId),
        selectedSize,
        selectedColor,
        rentalDuration: parseInt(rentalDuration),
        startDate,
        securityDeposit: parseInt(securityDeposit),
        totalPrice: parseInt(totalPrice),
      })
      .returning();

    return res.json({
      success: true,
      cartItem: inserted[0],
    });
  } catch (error: any) {
    console.error("Error adding to cart:", error);
    return res.status(500).json({ error: "Failed to add item to cart." });
  }
});

// Update cart item
router.put("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const cartItemId = parseInt(req.params.id.replace("cart-", ""));
  const { selectedSize, selectedColor, rentalDuration, startDate, totalPrice, securityDeposit } = req.body;

  try {
    const updated = await db
      .update(cartItems)
      .set({
        ...(selectedSize !== undefined && { selectedSize }),
        ...(selectedColor !== undefined && { selectedColor }),
        ...(rentalDuration !== undefined && { rentalDuration: parseInt(rentalDuration) }),
        ...(startDate !== undefined && { startDate }),
        ...(totalPrice !== undefined && { totalPrice: parseInt(totalPrice) }),
        ...(securityDeposit !== undefined && { securityDeposit: parseInt(securityDeposit) }),
      })
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, req.dbUser.id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Cart item not found or unauthorized." });
    }

    return res.json(updated[0]);
  } catch (error: any) {
    console.error("Error updating cart item:", error);
    return res.status(500).json({ error: "Failed to update cart item." });
  }
});

// Delete item from cart
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const cartItemId = parseInt(req.params.id.replace("cart-", ""));

  try {
    const deleted = await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, cartItemId), eq(cartItems.userId, req.dbUser.id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: "Cart item not found or unauthorized." });
    }

    return res.json({ success: true, deleted: deleted[0] });
  } catch (error: any) {
    console.error("Error deleting cart item:", error);
    return res.status(500).json({ error: "Failed to delete cart item." });
  }
});

// Clear entire cart
router.delete("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    await db.delete(cartItems).where(eq(cartItems.userId, req.dbUser.id));
    return res.json({ success: true, message: "Cart cleared successfully." });
  } catch (error: any) {
    console.error("Error clearing cart:", error);
    return res.status(500).json({ error: "Failed to clear cart." });
  }
});

export default router;
