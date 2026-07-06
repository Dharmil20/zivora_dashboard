// ──────────────────────────────────────────────
// Schema: Bills, Bill Items & Bill Payments
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { customers } from "./customer.js";
import { users } from "./user.js";
import { productVariants } from "./product.js";

export const bills = pgTable("bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  billNumber: varchar("bill_number", { length: 100 }).notNull().unique(),
  customerId: uuid("customer_id")
    .references(() => customers.id), // optional for walk-ins
  soldById: uuid("sold_by_id")
    .references(() => users.id), // staff attribution
  billDate: timestamp("bill_date", { withTimezone: true }).notNull().defaultNow(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  gst: numeric("gst", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  paymentStatus: varchar("payment_status", { length: 50 }).notNull().default("PAID"), // PAID, PARTIAL, DUE
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  amountDue: numeric("amount_due", { precision: 12, scale: 2 }).notNull().default("0"),
  billStatus: varchar("bill_status", { length: 50 }).notNull().default("COMPLETED"), // COMPLETED, CANCELLED, REFUNDED
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const billItems = pgTable("bill_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  billId: uuid("bill_id")
    .notNull()
    .references(() => bills.id),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => productVariants.id),
  quantity: integer("quantity").notNull().default(1),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }).notNull().default("0"),
  costPriceSnapshot: numeric("cost_price_snapshot", { precision: 12, scale: 2 }).notNull().default("0"), // historical profit calculations
  discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull().default("0"),
  returnedQuantity: integer("returned_quantity").notNull().default(0), // partial returns support
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const billPayments = pgTable("bill_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  billId: uuid("bill_id")
    .notNull()
    .references(() => bills.id),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // CASH, CARD, UPI
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull().default("0"),
  transactionRef: varchar("transaction_ref", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
