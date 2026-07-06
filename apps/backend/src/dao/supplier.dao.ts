// ──────────────────────────────────────────────
// DAO: Suppliers & Purchases — Pure Database Access
// ──────────────────────────────────────────────

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { suppliers, purchaseInvoices, productVariants, inventoryTransactions } from "../db/schema/index.js";

export type InsertSupplier = typeof suppliers.$inferInsert;
export type SelectSupplier = typeof suppliers.$inferSelect;
export type InsertPurchaseInvoice = typeof purchaseInvoices.$inferInsert;
export type SelectPurchaseInvoice = typeof purchaseInvoices.$inferSelect;

export const supplierDao = {
  // ── Supplier CRUD ────────────────────────────

  async findAllSuppliers(): Promise<SelectSupplier[]> {
    return db.select().from(suppliers);
  },

  async findSupplierById(id: string): Promise<SelectSupplier | undefined> {
    const rows = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return rows[0];
  },

  async findSupplierByPhone(phone: string): Promise<SelectSupplier | undefined> {
    const rows = await db.select().from(suppliers).where(eq(suppliers.phone, phone));
    return rows[0];
  },

  async createSupplier(data: InsertSupplier): Promise<SelectSupplier> {
    const rows = await db.insert(suppliers).values(data).returning();
    return rows[0]!;
  },

  async updateSupplier(id: string, data: Partial<InsertSupplier>): Promise<SelectSupplier | undefined> {
    const rows = await db
      .update(suppliers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return rows[0];
  },

  async deleteSupplier(id: string): Promise<SelectSupplier | undefined> {
    // Hard delete since suppliers doesn't have an isActive soft delete flag in current schema (only category, product, variant, customer do)
    const rows = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
    return rows[0];
  },

  // ── Purchase Invoice CRUD ──────────────────────

  async findAllPurchaseInvoices(): Promise<SelectPurchaseInvoice[]> {
    return db.select().from(purchaseInvoices);
  },

  async findPurchaseInvoiceById(id: string): Promise<SelectPurchaseInvoice | undefined> {
    const rows = await db.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, id));
    return rows[0];
  },

  /** Record a purchase invoice: inserts the invoice, increments product variants stock, and logs to ledger. */
  async createPurchaseInvoice(
    invoiceData: InsertPurchaseInvoice,
    items: { variantId: string; quantity: number; costPrice?: number }[],
  ): Promise<SelectPurchaseInvoice> {
    return db.transaction(async (tx) => {
      // 1. Insert purchase invoice
      const [invoice] = await tx.insert(purchaseInvoices).values(invoiceData).returning();
      if (!invoice) {
        throw new Error("Failed to record purchase invoice");
      }

      // 2. Adjust stock & log ledger
      for (const item of items) {
        const [variant] = await tx
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId));

        if (!variant) {
          throw new Error(`Product variant with ID ${item.variantId} not found`);
        }

        // Increment stock and optionally update costPrice
        const updateFields: any = {
          currentStock: variant.currentStock + item.quantity,
          updatedAt: new Date(),
        };

        if (item.costPrice !== undefined) {
          updateFields.costPrice = String(item.costPrice);
        }

        await tx
          .update(productVariants)
          .set(updateFields)
          .where(eq(productVariants.id, item.variantId));

        // Write ledger transaction
        await tx.insert(inventoryTransactions).values({
          variantId: item.variantId,
          transactionType: "PURCHASE",
          referenceType: "purchase_invoice",
          referenceId: invoice.id,
          quantity: item.quantity, // Inwards stock
        });
      }

      return invoice;
    });
  },
};
