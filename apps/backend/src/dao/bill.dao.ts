// ──────────────────────────────────────────────
// DAO: Bills — Pure Database Access & Transactions
// ──────────────────────────────────────────────

import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "../db/index.js";
import { bills, billItems, billPayments, productVariants, inventoryTransactions, products } from "../db/schema/index.js";

export type InsertBill = typeof bills.$inferInsert;
export type SelectBill = typeof bills.$inferSelect;
export type InsertBillItem = typeof billItems.$inferInsert;
export type SelectBillItem = typeof billItems.$inferSelect;
export type InsertBillPayment = typeof billPayments.$inferInsert;
export type SelectBillPayment = typeof billPayments.$inferSelect;

export const billDao = {
  /** Fetch bills based on filters. */
  async findAll(filters?: {
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
    paymentStatus?: string;
    billStatus?: string;
  }): Promise<SelectBill[]> {
    let conditions = [];

    if (filters?.customerId) {
      conditions.push(eq(bills.customerId, filters.customerId));
    }
    if (filters?.paymentStatus) {
      conditions.push(eq(bills.paymentStatus, filters.paymentStatus));
    }
    if (filters?.billStatus) {
      conditions.push(eq(bills.billStatus, filters.billStatus));
    }
    if (filters?.startDate) {
      conditions.push(gte(bills.billDate, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(bills.billDate, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db.select().from(bills).where(whereClause).orderBy(bills.billDate);
  },

  /** Fetch a single bill with items and payments. */
  async findById(id: string) {
    const [bill] = await db.select().from(bills).where(eq(bills.id, id));
    if (!bill) return undefined;

    const items = await db
      .select({
        id: billItems.id,
        billId: billItems.billId,
        variantId: billItems.variantId,
        quantity: billItems.quantity,
        sellingPrice: billItems.sellingPrice,
        costPriceSnapshot: billItems.costPriceSnapshot,
        discount: billItems.discount,
        total: billItems.total,
        returnedQuantity: billItems.returnedQuantity,
        createdAt: billItems.createdAt,
        updatedAt: billItems.updatedAt,
        sku: productVariants.sku,
        productName: products.name,
      })
      .from(billItems)
      .innerJoin(productVariants, eq(billItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(billItems.billId, id));

    const payments = await db
      .select()
      .from(billPayments)
      .where(eq(billPayments.billId, id));

    return {
      ...bill,
      items,
      payments,
    };
  },

  /** Create a bill along with items, stock adjustments, ledger transaction, and payments in a transaction. */
  async create(data: {
    billData: Omit<InsertBill, "billNumber" | "subtotal" | "total" | "amountPaid" | "amountDue" | "paymentStatus"> & { billNumber?: string };
    items: (Omit<InsertBillItem, "billId" | "costPriceSnapshot" | "total"> & { quantity: number })[];
    payments: Omit<InsertBillPayment, "billId">[];
  }): Promise<SelectBill> {
    return db.transaction(async (tx) => {
      // 1. Generate unique bill number if not provided
      let billNumber = data.billData.billNumber;
      if (!billNumber) {
        const timestamp = Date.now().toString().slice(-6);
        const rand = Math.floor(100 + Math.random() * 900);
        billNumber = `INV-${timestamp}-${rand}`;
      }

      let computedSubtotal = 0;
      const computedItems: (InsertBillItem & { quantity: number })[] = [];

      // 2. Process items, verify & deduct stock, compile item models
      for (const item of data.items) {
        const [variant] = await tx
          .select()
          .from(productVariants)
          .where(eq(productVariants.id, item.variantId));

        if (!variant) {
          throw new Error(`Product variant with ID ${item.variantId} not found`);
        }

        if (variant.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for variant ${variant.sku}. Available: ${variant.currentStock}, Requested: ${item.quantity}`);
        }

        // Deduct stock
        await tx
          .update(productVariants)
          .set({
            currentStock: variant.currentStock - item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, item.variantId));

        const itemTotal = Number(item.sellingPrice) * item.quantity - Number(item.discount || 0);
        computedSubtotal += itemTotal;

        computedItems.push({
          variantId: item.variantId,
          quantity: item.quantity,
          sellingPrice: String(item.sellingPrice),
          costPriceSnapshot: variant.costPrice,
          discount: String(item.discount || 0),
          total: String(itemTotal),
          returnedQuantity: 0,
        } as InsertBillItem & { quantity: number });
      }

      // Calculate totals
      const discount = Number(data.billData.discount || 0);
      const gst = Number(data.billData.gst || 0);
      const total = computedSubtotal - discount + gst;

      let amountPaid = 0;
      for (const p of data.payments) {
        amountPaid += Number(p.amount);
      }
      const amountDue = Math.max(0, total - amountPaid);
      const paymentStatus = amountDue <= 0 ? "PAID" : amountPaid > 0 ? "PARTIAL" : "DUE";

      // 3. Create main bill record
      const [bill] = await tx
        .insert(bills)
        .values({
          ...data.billData,
          billNumber,
          subtotal: String(computedSubtotal),
          discount: String(discount),
          gst: String(gst),
          total: String(total),
          amountPaid: String(amountPaid),
          amountDue: String(amountDue),
          paymentStatus,
          billStatus: "COMPLETED",
        })
        .returning();

      if (!bill) {
        throw new Error("Failed to insert bill record");
      }

      // 4. Save bill items & write to inventory ledger
      for (const item of computedItems) {
        await tx.insert(billItems).values({
          ...item,
          billId: bill.id,
        });

        // Insert sale ledger item
        await tx.insert(inventoryTransactions).values({
          variantId: item.variantId,
          transactionType: "SALE",
          referenceType: "bill",
          referenceId: bill.id,
          quantity: -item.quantity, // Outwards stock
        });
      }

      // 5. Save payments
      for (const p of data.payments) {
        await tx.insert(billPayments).values({
          ...p,
          billId: bill.id,
        });
      }

      return bill;
    });
  },

  /** Record a partial payment for a bill. */
  async addPayment(billId: string, paymentData: Omit<InsertBillPayment, "billId">): Promise<SelectBillPayment> {
    return db.transaction(async (tx) => {
      const [bill] = await tx.select().from(bills).where(eq(bills.id, billId));
      if (!bill) {
        throw new Error("Bill not found");
      }

      const [payment] = await tx
        .insert(billPayments)
        .values({
          ...paymentData,
          billId,
        })
        .returning();

      const newPaid = Number(bill.amountPaid) + Number(paymentData.amount);
      const newDue = Math.max(0, Number(bill.total) - newPaid);
      const newPaymentStatus = newDue <= 0 ? "PAID" : "PARTIAL";

      await tx
        .update(bills)
        .set({
          amountPaid: String(newPaid),
          amountDue: String(newDue),
          paymentStatus: newPaymentStatus,
          updatedAt: new Date(),
        })
        .where(eq(bills.id, billId));

      return payment;
    });
  },

  /** Cancel bill, restore stock, and write return records to ledger. */
  async cancel(billId: string): Promise<SelectBill> {
    return db.transaction(async (tx) => {
      const [bill] = await tx.select().from(bills).where(eq(bills.id, billId));
      if (!bill) throw new Error("Bill not found");
      if (bill.billStatus === "CANCELLED") throw new Error("Bill is already cancelled");

      const items = await tx.select().from(billItems).where(eq(billItems.billId, billId));

      for (const item of items) {
        const [variant] = await tx.select().from(productVariants).where(eq(productVariants.id, item.variantId));
        if (variant) {
          // Restore stock
          await tx
            .update(productVariants)
            .set({
              currentStock: variant.currentStock + item.quantity,
              updatedAt: new Date(),
            })
            .where(eq(productVariants.id, item.variantId));

          // Log return transaction in inventory ledger
          await tx.insert(inventoryTransactions).values({
            variantId: item.variantId,
            transactionType: "RETURN",
            referenceType: "bill",
            referenceId: billId,
            quantity: item.quantity, // Inwards stock
          });
        }
      }

      const [updatedBill] = await tx
        .update(bills)
        .set({
          billStatus: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(bills.id, billId))
        .returning();

      return updatedBill;
    });
  },
};
