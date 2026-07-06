// ──────────────────────────────────────────────
// DAO: Inventory Transactions — Pure Database Access
// ──────────────────────────────────────────────

import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { inventoryTransactions, productVariants } from "../db/schema/index.js";

export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;
export type SelectInventoryTransaction = typeof inventoryTransactions.$inferSelect;

export const inventoryDao = {
  /** Fetch all ledger transactions with optional filters. */
  async findAll(filters?: { variantId?: string; transactionType?: string }): Promise<SelectInventoryTransaction[]> {
    let conditions = [];

    if (filters?.variantId) {
      conditions.push(eq(inventoryTransactions.variantId, filters.variantId));
    }
    if (filters?.transactionType) {
      conditions.push(eq(inventoryTransactions.transactionType, filters.transactionType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db.select().from(inventoryTransactions).where(whereClause).orderBy(inventoryTransactions.createdAt);
  },

  /** Create manual stock adjustment: updates currentStock and writes to the ledger. */
  async adjustStock(variantId: string, quantity: number): Promise<SelectInventoryTransaction> {
    return db.transaction(async (tx) => {
      const [variant] = await tx
        .select()
        .from(productVariants)
        .where(eq(productVariants.id, variantId));

      if (!variant) {
        throw new Error("Product variant not found");
      }

      const newStock = variant.currentStock + quantity;
      if (newStock < 0) {
        throw new Error(`Cannot adjust stock: adjustment results in negative stock (${newStock})`);
      }

      // Update variant stock
      await tx
        .update(productVariants)
        .set({
          currentStock: newStock,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, variantId));

      // Insert transaction ledger record
      const [txn] = await tx
        .insert(inventoryTransactions)
        .values({
          variantId,
          transactionType: "MANUAL_ADJUSTMENT",
          referenceType: "manual",
          quantity,
        })
        .returning();

      return txn!;
    });
  },
};
