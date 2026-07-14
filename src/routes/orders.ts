import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.ts";
import { db, orders, orderItems, products, addresses } from "../db/index.ts";
import { eq, and } from "drizzle-orm";

const router = Router();

// Fetch logged-in user orders
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, req.dbUser.id));

    // For each order, fetch items
    const ordersWithItems = await Promise.all(
      list.map(async (order) => {
        const itemsList = await db
          .select({
            id: orderItems.id,
            selectedSize: orderItems.selectedSize,
            selectedColor: orderItems.selectedColor,
            rentalDuration: orderItems.rentalDuration,
            startDate: orderItems.startDate,
            securityDeposit: orderItems.securityDeposit,
            totalPrice: orderItems.totalPrice,
            product: products,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        const deliveryAddr = await db
          .select()
          .from(addresses)
          .where(eq(addresses.id, order.deliveryAddressId))
          .limit(1);

        return {
          id: order.orderId, // Return standard orderId (e.g. ord-123)
          totalAmount: order.totalAmount,
          status: order.status,
          date: order.date,
          paymentMethod: order.paymentMethod,
          returnStatus: order.returnStatus,
          damageReport: order.damageReport,
          deliveryAddress: deliveryAddr[0] || null,
          items: itemsList.map((item) => ({
            id: `item-${item.id}`,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor,
            rentalDuration: item.rentalDuration,
            startDate: item.startDate,
            securityDeposit: item.securityDeposit,
            totalPrice: item.totalPrice,
            product: item.product,
          })),
        };
      })
    );

    return res.json(ordersWithItems);
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// Create new order
router.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { items, totalAmount, deliveryAddressId, paymentMethod } = req.body;

  if (!items || items.length === 0 || !totalAmount || !deliveryAddressId || !paymentMethod) {
    return res.status(400).json({ error: "Missing required order parameters." });
  }

  try {
    const customOrderId = `ord-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create the order
    const [insertedOrder] = await db
      .insert(orders)
      .values({
        orderId: customOrderId,
        userId: req.dbUser.id,
        totalAmount: parseInt(totalAmount),
        status: "Booked",
        date: new Date().toISOString().split("T")[0],
        deliveryAddressId: parseInt(deliveryAddressId),
        paymentMethod,
        returnStatus: "Pending",
      })
      .returning();

    // Insert order items
    for (const item of items) {
      await db.insert(orderItems).values({
        orderId: insertedOrder.id,
        productId: parseInt(item.product.id),
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        rentalDuration: parseInt(item.rentalDuration),
        startDate: item.startDate,
        securityDeposit: parseInt(item.securityDeposit),
        totalPrice: parseInt(item.totalPrice),
      });

      // Update product status to Booked
      await db
        .update(products)
        .set({ status: "Booked" })
        .where(eq(products.id, parseInt(item.product.id)));
    }

    // Return full details of created order
    const deliveryAddr = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, insertedOrder.deliveryAddressId))
      .limit(1);

    return res.json({
      success: true,
      order: {
        id: insertedOrder.orderId,
        totalAmount: insertedOrder.totalAmount,
        status: insertedOrder.status,
        date: insertedOrder.date,
        paymentMethod: insertedOrder.paymentMethod,
        returnStatus: insertedOrder.returnStatus,
        deliveryAddress: deliveryAddr[0] || null,
        items,
      },
    });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Failed to create order." });
  }
});

// Update order status (Admin/Vendor or delivery flows)
router.put("/:orderId/status", requireAuth, async (req: AuthRequest, res: Response) => {
  const { status, returnStatus, damageReport } = req.body;

  try {
    const updated = await db
      .update(orders)
      .set({
        ...(status && { status }),
        ...(returnStatus && { returnStatus }),
        ...(damageReport && { damageReport }),
      })
      .where(eq(orders.orderId, req.params.orderId))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    return res.json(updated[0]);
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ error: "Failed to update order status." });
  }
});

export default router;
