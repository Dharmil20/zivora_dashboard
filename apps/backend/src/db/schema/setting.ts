// ──────────────────────────────────────────────
// Schema: Shop Settings Table
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const shopSettings = pgTable("shop_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  address: text("address"),
  gstin: varchar("gstin", { length: 15 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  upiId: varchar("upi_id", { length: 100 }),
  invoicePrefix: varchar("invoice_prefix", { length: 20 }).notNull().default("INV"),
  billTerms: text("bill_terms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
