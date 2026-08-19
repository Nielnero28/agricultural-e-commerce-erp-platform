import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  date,
} from "drizzle-orm/pg-core";

export const cooperatives = pgTable("cooperatives", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  town: varchar("town", { length: 60 }).notNull(),
  description: text("description"),
  contactPerson: varchar("contact_person", { length: 120 }),
  phone: varchar("phone", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("buyer"), // admin | cooperative | vendor | buyer
  cooperativeId: integer("cooperative_id").references(() => cooperatives.id),
  town: varchar("town", { length: 60 }),
  phone: varchar("phone", { length: 30 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  description: text("description"),
  pricePerUnit: integer("price_per_unit").notNull(),
  unit: varchar("unit", { length: 30 }).notNull().default("kg"),
  stock: integer("stock").notNull().default(0),
  cooperativeId: integer("cooperative_id").references(() => cooperatives.id),
  vendorUserId: integer("vendor_user_id").references(() => users.id),
  town: varchar("town", { length: 60 }).notNull(),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 24 }).notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  buyerName: varchar("buyer_name", { length: 120 }).notNull(),
  buyerEmail: varchar("buyer_email", { length: 160 }).notNull(),
  buyerPhone: varchar("buyer_phone", { length: 30 }),
  address: text("address"),
  note: text("note"),
  total: integer("total").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("processing"), // processing | confirmed | completed | cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 160 }).notNull(),
  unit: varchar("unit", { length: 30 }).notNull(),
  price: integer("price").notNull(),
  qty: integer("qty").notNull(),
  subtotal: integer("subtotal").notNull(),
  cooperativeId: integer("cooperative_id").references(() => cooperatives.id),
  vendorUserId: integer("vendor_user_id").references(() => users.id),
  town: varchar("town", { length: 60 }),
});

export const inventoryMovements = pgTable("inventory_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull().default("adjustment"), // restock | sale | adjustment | return
  delta: integer("delta").notNull(),
  note: text("note"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  cooperativeId: integer("cooperative_id").references(() => cooperatives.id),
  vendorUserId: integer("vendor_user_id").references(() => users.id),
  type: varchar("type", { length: 10 }).notNull().default("income"), // income | expense
  category: varchar("category", { length: 60 }).notNull(),
  amount: integer("amount").notNull(),
  note: text("note"),
  txDate: date("tx_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  cooperativeId: integer("cooperative_id").references(() => cooperatives.id),
  vendorUserId: integer("vendor_user_id").references(() => users.id),
  name: varchar("name", { length: 140 }).notNull(),
  contactPerson: varchar("contact_person", { length: 120 }),
  phone: varchar("phone", { length: 30 }),
  supplies: text("supplies"),
  town: varchar("town", { length: 60 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
});
