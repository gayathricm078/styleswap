import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.ts";
import { db, coupons } from "../db/index.ts";
import { eq } from "drizzle-orm";

const router = Router();

// Validate Coupon Code
router.get("/:code", requireAuth, async (req: AuthRequest, res: Response) => {
  const code = req.params.code.toUpperCase();

  try {
    const list = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code))
      .limit(1);

    if (list.length === 0) {
      return res.status(404).json({ error: "Invalid coupon code." });
    }

    return res.json(list[0]);
  } catch (error: any) {
    console.error("Error validating coupon:", error);
    return res.status(500).json({ error: "Failed to validate coupon." });
  }
});

export default router;
