// ──────────────────────────────────────────────
// Schema: Products & Product Variants Tables
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, text, boolean, numeric, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { categories } from "./category.js";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  material: varchar("material", { length: 100 }),
  description: text("description"),
  reorderLevel: integer("reorder_level").notNull().default(5),
  priceTiers: jsonb("price_tiers"), // e.g., customer tiers or bulk pricing parameters
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  sku: varchar("sku", { length: 100 }).notNull().unique(), // barcode scanner or custom SKU
  color: varchar("color", { length: 50 }),
  size: varchar("size", { length: 50 }),
  finish: varchar("finish", { length: 50 }),
  costPrice: numeric("cost_price", { precision: 12, scale: 2 }).notNull().default("0"),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull().default("0"),
  currentStock: integer("current_stock").notNull().default(0),
  reservedStock: integer("reserved_stock").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
