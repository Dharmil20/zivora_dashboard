// ──────────────────────────────────────────────
// Schema: Inventory Transactions (Ledger)
// ──────────────────────────────────────────────

import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { productVariants } from "./product.js";

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => productVariants.id),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // PURCHASE, SALE, RETURN, MANUAL_ADJUSTMENT
  referenceType: varchar("reference_type", { length: 50 }).notNull(), // bill, purchase_invoice, manual, initial
  referenceId: uuid("reference_id"), // references bills.id or purchase_invoices.id
  quantity: integer("quantity").notNull(), // positive for stock in, negative for stock out
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
