import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.ts";
import { db, users, addresses } from "../db/index.ts";
import { eq, and } from "drizzle-orm";

const router = Router();

// Get logged-in user profile with addresses
router.get("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, req.dbUser.id));

    return res.json({
      ...req.dbUser,
      addresses: userAddresses,
    });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ error: "Failed to fetch profile." });
  }
});

// Update user profile info
router.put("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  const { name, phone, profilePic, sustainabilityScore, rewardPoints, tier } = req.body;
  try {
    const updated = await db
      .update(users)
      .set({
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(profilePic !== undefined && { profilePic }),
        ...(sustainabilityScore !== undefined && { sustainabilityScore }),
        ...(rewardPoints !== undefined && { rewardPoints }),
        ...(tier !== undefined && { tier }),
      })
      .where(eq(users.id, req.dbUser.id))
      .returning();

    return res.json(updated[0]);
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return res.status(500).json({ error: "Failed to update profile." });
  }
});

// Get user addresses
router.get("/addresses", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, req.dbUser.id));
    return res.json(list);
  } catch (error: any) {
    console.error("Error fetching addresses:", error);
    return res.status(500).json({ error: "Failed to fetch addresses." });
  }
});

// Create address
router.post("/addresses", requireAuth, async (req: AuthRequest, res: Response) => {
  const { label, street, city, state, zip, isDefault } = req.body;
  if (!label || !street || !city || !state || !zip) {
    return res.status(400).json({ error: "Missing required address fields." });
  }

  try {
    // If setting default, unset others first
    if (isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, req.dbUser.id));
    }

    const inserted = await db
      .insert(addresses)
      .values({
        userId: req.dbUser.id,
        label,
        street,
        city,
        state,
        zip,
        isDefault: isDefault || false,
      })
      .returning();

    return res.json(inserted[0]);
  } catch (error: any) {
    console.error("Error creating address:", error);
    return res.status(500).json({ error: "Failed to create address." });
  }
});

// Update address
router.put("/addresses/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const addressId = parseInt(req.params.id);
  const { label, street, city, state, zip, isDefault } = req.body;

  try {
    if (isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, req.dbUser.id));
    }

    const updated = await db
      .update(addresses)
      .set({
        ...(label !== undefined && { label }),
        ...(street !== undefined && { street }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zip !== undefined && { zip }),
        ...(isDefault !== undefined && { isDefault }),
      })
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, req.dbUser.id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Address not found or unauthorized." });
    }

    return res.json(updated[0]);
  } catch (error: any) {
    console.error("Error updating address:", error);
    return res.status(500).json({ error: "Failed to update address." });
  }
});

// Delete address
router.delete("/addresses/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const addressId = parseInt(req.params.id);

  try {
    const deleted = await db
      .delete(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, req.dbUser.id)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: "Address not found or unauthorized." });
    }

    return res.json({ success: true, deleted: deleted[0] });
  } catch (error: any) {
    console.error("Error deleting address:", error);
    return res.status(500).json({ error: "Failed to delete address." });
  }
});

export default router;
