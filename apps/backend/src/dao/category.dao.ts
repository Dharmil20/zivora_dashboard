// ──────────────────────────────────────────────
// DAO: Categories — Pure Database Access
// ──────────────────────────────────────────────

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { categories } from "../db/schema/index.js";

export type InsertCategory = typeof categories.$inferInsert;
export type SelectCategory = typeof categories.$inferSelect;

export const categoryDao = {
  /** Fetch all categories. */
  async findAll(): Promise<SelectCategory[]> {
    return db.select().from(categories);
  },

  /** Fetch active categories only. */
  async findActive(): Promise<SelectCategory[]> {
    return db.select().from(categories).where(eq(categories.isActive, true));
  },

  /** Fetch a single category by ID. */
  async findById(id: string): Promise<SelectCategory | undefined> {
    const rows = await db.select().from(categories).where(eq(categories.id, id));
    return rows[0];
  },

  /** Create a new category. */
  async create(data: InsertCategory): Promise<SelectCategory> {
    const rows = await db.insert(categories).values(data).returning();
    return rows[0]!;
  },

  /** Update an existing category. */
  async update(id: string, data: Partial<InsertCategory>): Promise<SelectCategory | undefined> {
    const rows = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return rows[0];
  },

  /** Soft delete a category. */
  async delete(id: string): Promise<SelectCategory | undefined> {
    const rows = await db
      .update(categories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return rows[0];
  },
};
