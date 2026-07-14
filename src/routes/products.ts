import { Router, Response } from "express";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth.ts";
import { db, products, reviews } from "../db/index.ts";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

// Get all products with filters
router.get("/", async (req, res: Response) => {
  const { category, badge, status, search } = req.query;
  try {
    let query = db.select().from(products);
    const conditions = [];

    if (category) {
      conditions.push(eq(products.category, category as string));
    }
    if (badge) {
      conditions.push(eq(products.badge, badge as string));
    }
    if (status) {
      conditions.push(eq(products.status, status as string));
    }
    if (search) {
      conditions.push(
        sql`(${products.name} ILIKE ${`%"${search}"%`} OR ${products.brand} ILIKE ${`%"${search}"%`} OR ${products.description} ILIKE ${`%"${search}"%`})`
      );
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where(and(...conditions));
    }

    const list = await query;
    return res.json(list);
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Failed to fetch products." });
  }
});

// Get single product details with reviews
router.get("/:id", async (req, res: Response) => {
  const pid = parseInt(req.params.id);
  if (isNaN(pid)) {
    // Try to find by custom productId string (e.g. prod-1)
    try {
      const prodList = await db
        .select()
        .from(products)
        .where(eq(products.productId, req.params.id))
        .limit(1);

      if (prodList.length === 0) {
        return res.status(404).json({ error: "Product not found." });
      }

      const prod = prodList[0];
      const prodReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.productId, prod.id));

      return res.json({
        ...prod,
        reviews: prodReviews,
      });
    } catch (err) {
      return res.status(404).json({ error: "Product not found." });
    }
  }

  try {
    const list = await db
      .select()
      .from(products)
      .where(eq(products.id, pid))
      .limit(1);

    if (list.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    const prod = list[0];
    const prodReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, prod.id));

    return res.json({
      ...prod,
      reviews: prodReviews,
    });
  } catch (error: any) {
    console.error("Error fetching single product:", error);
    return res.status(500).json({ error: "Failed to fetch product details." });
  }
});

// Create new product (Vendor or Admin only)
router.post(
  "/",
  requireAuth,
  requireRole(["vendor", "admin"]),
  async (req: AuthRequest, res: Response) => {
    const {
      name,
      category,
      subCategory,
      brand,
      description,
      image,
      gallery,
      sizes,
      colors,
      rentalPrice,
      securityDeposit,
      badge,
    } = req.body;

    if (!name || !category || !subCategory || !brand || !rentalPrice || !securityDeposit) {
      return res.status(400).json({ error: "Missing required product fields." });
    }

    try {
      const customId = `prod-${Date.now()}`;
      const inserted = await db
        .insert(products)
        .values({
          productId: customId,
          name,
          category,
          subCategory,
          brand,
          description: description || "",
          image: image || "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600",
          gallery: gallery || [],
          sizes: sizes || ["S", "M", "L"],
          colors: colors || [{ name: "Neutral", hex: "#cccccc" }],
          rentalPrice: parseInt(rentalPrice),
          securityDeposit: parseInt(securityDeposit),
          vendorName: req.dbUser.name || "Verified Vendor",
          vendorVerified: "Verified Vendor",
          rating: "5.0",
          reviewsCount: 0,
          badge: badge || "New",
          status: "Available",
          deliveryDate: "Tomorrow",
        })
        .returning();

      return res.json(inserted[0]);
    } catch (error: any) {
      console.error("Error creating product:", error);
      return res.status(500).json({ error: "Failed to create product." });
    }
  }
);

// Update product (Vendor or Admin)
router.put(
  "/:id",
  requireAuth,
  requireRole(["vendor", "admin"]),
  async (req: AuthRequest, res: Response) => {
    const pid = parseInt(req.params.id);
    const {
      name,
      category,
      subCategory,
      brand,
      description,
      image,
      gallery,
      sizes,
      colors,
      rentalPrice,
      securityDeposit,
      badge,
      status,
      deliveryDate,
    } = req.body;

    try {
      const updated = await db
        .update(products)
        .set({
          ...(name !== undefined && { name }),
          ...(category !== undefined && { category }),
          ...(subCategory !== undefined && { subCategory }),
          ...(brand !== undefined && { brand }),
          ...(description !== undefined && { description }),
          ...(image !== undefined && { image }),
          ...(gallery !== undefined && { gallery }),
          ...(sizes !== undefined && { sizes }),
          ...(colors !== undefined && { colors }),
          ...(rentalPrice !== undefined && { rentalPrice: parseInt(rentalPrice) }),
          ...(securityDeposit !== undefined && { securityDeposit: parseInt(securityDeposit) }),
          ...(badge !== undefined && { badge }),
          ...(status !== undefined && { status }),
          ...(deliveryDate !== undefined && { deliveryDate }),
        })
        .where(eq(products.id, pid))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Product not found." });
      }

      return res.json(updated[0]);
    } catch (error: any) {
      console.error("Error updating product:", error);
      return res.status(500).json({ error: "Failed to update product." });
    }
  }
);

// Add product review (Authenticated customer)
router.post("/:id/reviews", requireAuth, async (req: AuthRequest, res: Response) => {
  const pid = parseInt(req.params.id);
  const { rating, comment, variant } = req.body;

  if (!rating || !comment) {
    return res.status(400).json({ error: "Rating and comment are required." });
  }

  try {
    const prodList = await db.select().from(products).where(eq(products.id, pid)).limit(1);
    if (prodList.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    const inserted = await db
      .insert(reviews)
      .values({
        productId: pid,
        userId: req.dbUser.id,
        userName: req.dbUser.name || "Valued Swapper",
        userAvatar: req.dbUser.profilePic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
        rating: parseInt(rating),
        comment,
        date: new Date().toISOString().split("T")[0],
        variant: variant || "Standard Selection",
      })
      .returning();

    // Recalculate average rating and review count
    const allReviews = await db.select().from(reviews).where(eq(reviews.productId, pid));
    const count = allReviews.length;
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / count;

    await db
      .update(products)
      .set({
        rating: avg.toFixed(1),
        reviewsCount: count,
      })
      .where(eq(products.id, pid));

    return res.json(inserted[0]);
  } catch (error: any) {
    console.error("Error posting review:", error);
    return res.status(500).json({ error: "Failed to publish review." });
  }
});

// Delete product
router.delete(
  "/:id",
  requireAuth,
  requireRole(["vendor", "admin"]),
  async (req: AuthRequest, res: Response) => {
    const pid = parseInt(req.params.id);
    try {
      const deleted = await db.delete(products).where(eq(products.id, pid)).returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: "Product not found." });
      }
      return res.json({ success: true, deleted: deleted[0] });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      return res.status(500).json({ error: "Failed to delete product." });
    }
  }
);

export default router;
