// ──────────────────────────────────────────────
// DAO: Orders — Pure Database Access
// ──────────────────────────────────────────────
// No business logic. Just Drizzle queries.

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders } from "../db/schema/index.js";

export type InsertOrder = typeof orders.$inferInsert;
export type SelectOrder = typeof orders.$inferSelect;

export const orderDao = {
  /** Fetch all orders. */
  async findAll(): Promise<SelectOrder[]> {
    return db.select().from(orders);
  },

  /** Fetch a single order by ID. */
  async findById(id: string): Promise<SelectOrder | undefined> {
    const rows = await db.select().from(orders).where(eq(orders.id, id));
    return rows[0];
  },

  /** Fetch all orders belonging to a specific user. */
  async findByUserId(userId: string): Promise<SelectOrder[]> {
    return db.select().from(orders).where(eq(orders.userId, userId));
  },

  /** Insert a new order and return the created record. */
  async create(data: InsertOrder): Promise<SelectOrder> {
    const rows = await db.insert(orders).values(data).returning();
    return rows[0]!;
  },

  /** Update an existing order by ID and return the updated record. */
  async update(id: string, data: Partial<InsertOrder>): Promise<SelectOrder | undefined> {
    const rows = await db
      .update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return rows[0];
  },

  /** Delete an order by ID and return the deleted record. */
  async delete(id: string): Promise<SelectOrder | undefined> {
    const rows = await db.delete(orders).where(eq(orders.id, id)).returning();
    return rows[0];
  },
};
