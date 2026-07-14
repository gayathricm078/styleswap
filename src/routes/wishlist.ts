import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.ts";
import { db, wishlists, products } from "../db/index.ts";
import { eq, and } from "drizzle-orm";

const router = Router();

// Get wishlist items
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        wishlistId: wishlists.id,
        product: products,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, req.dbUser.id));

    return res.json(list.map((item) => item.product));
  } catch (error: any) {
    console.error("Error fetching wishlist:", error);
    return res.status(500).json({ error: "Failed to fetch wishlist." });
  }
});

// Toggle wishlist item (Add or Remove)
router.post("/:productId", requireAuth, async (req: AuthRequest, res: Response) => {
  const prodId = parseInt(req.params.productId);
  if (isNaN(prodId)) {
    return res.status(400).json({ error: "Invalid product ID." });
  }

  try {
    const existing = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, req.dbUser.id), eq(wishlists.productId, prodId)))
      .limit(1);

    if (existing.length > 0) {
      // Remove it
      await db
        .delete(wishlists)
        .where(and(eq(wishlists.userId, req.dbUser.id), eq(wishlists.productId, prodId)));
      return res.json({ wishlisted: false, message: "Removed from wishlist." });
    } else {
      // Add it
      await db.insert(wishlists).values({
        userId: req.dbUser.id,
        productId: prodId,
      });
      return res.json({ wishlisted: true, message: "Added to wishlist." });
    }
  } catch (error: any) {
    console.error("Error toggling wishlist item:", error);
    return res.status(500).json({ error: "Failed to update wishlist." });
  }
});

// Delete wishlist item
router.delete("/:productId", requireAuth, async (req: AuthRequest, res: Response) => {
  const prodId = parseInt(req.params.productId);
  try {
    await db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, req.dbUser.id), eq(wishlists.productId, prodId)));
    return res.json({ success: true, message: "Removed from wishlist." });
  } catch (error: any) {
    console.error("Error removing from wishlist:", error);
    return res.status(500).json({ error: "Failed to remove from wishlist." });
  }
});

export default router;
