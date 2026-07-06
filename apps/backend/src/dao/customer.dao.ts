// ──────────────────────────────────────────────
// DAO: Customers — Pure Database Access
// ──────────────────────────────────────────────

import { eq, or, ilike } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers } from "../db/schema/index.js";

export type InsertCustomer = typeof customers.$inferInsert;
export type SelectCustomer = typeof customers.$inferSelect;

export const customerDao = {
  /** Fetch all customers. */
  async findAll(search?: string): Promise<SelectCustomer[]> {
    if (search) {
      const searchPattern = `%${search}%`;
      return db
        .select()
        .from(customers)
        .where(
          or(
            ilike(customers.name, searchPattern),
            ilike(customers.mobile, searchPattern)
          )
        );
    }
    return db.select().from(customers);
  },

  /** Fetch a single customer by ID. */
  async findById(id: string): Promise<SelectCustomer | undefined> {
    const rows = await db.select().from(customers).where(eq(customers.id, id));
    return rows[0];
  },

  /** Fetch customer by mobile number (used for unique check). */
  async findByMobile(mobile: string): Promise<SelectCustomer | undefined> {
    const rows = await db.select().from(customers).where(eq(customers.mobile, mobile));
    return rows[0];
  },

  /** Create a new customer. */
  async create(data: InsertCustomer): Promise<SelectCustomer> {
    const rows = await db.insert(customers).values(data).returning();
    return rows[0]!;
  },

  /** Update customer details. */
  async update(id: string, data: Partial<InsertCustomer>): Promise<SelectCustomer | undefined> {
    const rows = await db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return rows[0];
  },

  /** Soft delete customer. */
  async delete(id: string): Promise<SelectCustomer | undefined> {
    const rows = await db
      .update(customers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return rows[0];
  },
};
