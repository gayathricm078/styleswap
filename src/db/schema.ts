import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  name: text("name").notNull().default("Valued Customer"),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  role: text("role").notNull().default("customer"), // customer, vendor, admin
  profilePic: text("profile_pic").notNull().default("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"),
  sustainabilityScore: integer("sustainability_score").notNull().default(100),
  rewardPoints: integer("reward_points").notNull().default(0),
  tier: text("tier").notNull().default("Silver"), // Silver, Gold, Premium
  createdAt: timestamp("created_at").defaultNow(),
});

// Addresses Table
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  label: text("label").notNull(), // Home, Work, etc.
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

// Products Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  productId: text("product_id").notNull().unique(), // e.g. prod-1, prod-2
  name: text("name").notNull(),
  category: text("category").notNull(), // Women, Men, Kids, Wedding, Jewellery, Shoes, Handbags, Home Decoration
  subCategory: text("sub_category").notNull(),
  brand: text("brand").notNull(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  gallery: jsonb("gallery").notNull().default([]), // array of strings
  sizes: jsonb("sizes").notNull().default([]), // array of strings
  colors: jsonb("colors").notNull().default([]), // array of {name, hex}
  rentalPrice: integer("rental_price").notNull(), // price per day
  securityDeposit: integer("security_deposit").notNull(),
  vendorName: text("vendor_name").notNull(),
  vendorVerified: text("vendor_verified").notNull().default("Standard"), // Verified Vendor, Trusted Vendor, Standard
  rating: numeric("rating").notNull().default("5.0"),
  reviewsCount: integer("reviews_count").notNull().default(0),
  badge: text("badge"), // Trending, Bestseller, Premium, New, etc.
  status: text("status").notNull().default("Available"), // Available, Booked, Out For Delivery, Currently Rented, Returned, Under Maintenance
  deliveryDate: text("delivery_date").notNull().default("Tomorrow"),
});

// Wishlists Table
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
});

// Cart Items Table
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  selectedSize: text("selected_size").notNull(),
  selectedColor: text("selected_color").notNull(),
  rentalDuration: integer("rental_duration").notNull().default(4),
  startDate: text("start_date").notNull(),
  securityDeposit: integer("security_deposit").notNull(),
  totalPrice: integer("total_price").notNull(),
});

// Orders Table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(), // e.g. ord-123456
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("Booked"), // Booked, Out For Delivery, Currently Rented, Returned, Under Maintenance, Pending Approval, Rejected
  date: text("date").notNull(),
  deliveryAddressId: integer("delivery_address_id")
    .references(() => addresses.id)
    .notNull(),
  paymentMethod: text("payment_method").notNull(), // Razorpay (Online), Cash on Delivery
  returnStatus: text("return_status").notNull().default("Pending"), // Pending, Under Inspection, Returned In Perfect Condition, Damage Detected, Resolved
  damageReport: jsonb("damage_report"), // { severity: "None" | "Minor" | "Major", description: string, charge: number, imageUrl?: string }
});

// Order Items Table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  selectedSize: text("selected_size").notNull(),
  selectedColor: text("selected_color").notNull(),
  rentalDuration: integer("rental_duration").notNull(),
  startDate: text("start_date").notNull(),
  securityDeposit: integer("security_deposit").notNull(),
  totalPrice: integer("total_price").notNull(),
});

// Reviews Table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  userName: text("user_name").notNull(),
  userAvatar: text("user_avatar").notNull(),
  rating: integer("rating").notNull().default(5),
  comment: text("comment").notNull(),
  date: text("date").notNull(),
  variant: text("variant").notNull(), // Size & Color details
});

// Coupons Table
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // percentage, fixed
  value: integer("value").notNull(),
  description: text("description").notNull(),
});

// Notifications Table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // reminder, delivery, return, ai, promo
  date: text("date").notNull(),
  read: boolean("read").notNull().default(false),
});

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  wishlists: many(wishlists),
  cartItems: many(cartItems),
  notifications: many(notifications),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  deliveryAddress: one(addresses, {
    fields: [orders.deliveryAddressId],
    references: [addresses.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
