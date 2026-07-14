import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.ts";
import { db, notifications } from "../db/index.ts";
import { eq, and } from "drizzle-orm";

const router = Router();

// Get user notifications
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.dbUser.id));

    return res.json(list);
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ error: "Failed to fetch notifications." });
  }
});

// Mark notification as read
router.post("/:id/read", requireAuth, async (req: AuthRequest, res: Response) => {
  const nid = parseInt(req.params.id);

  try {
    const updated = await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, nid), eq(notifications.userId, req.dbUser.id)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Notification not found." });
    }

    return res.json(updated[0]);
  } catch (error: any) {
    console.error("Error updating notification status:", error);
    return res.status(500).json({ error: "Failed to update notification." });
  }
});

// Create notification
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { title, message, type } = req.body;

  if (!title || !message || !type) {
    return res.status(400).json({ error: "Missing required notification fields." });
  }

  try {
    const inserted = await db
      .insert(notifications)
      .values({
        userId: req.dbUser.id,
        title,
        message,
        type,
        date: "Just now",
        read: false,
      })
      .returning();

    return res.json(inserted[0]);
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return res.status(500).json({ error: "Failed to create notification." });
  }
});

export default router;
