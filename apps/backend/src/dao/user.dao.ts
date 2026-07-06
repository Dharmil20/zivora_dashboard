// ──────────────────────────────────────────────
// DAO: Users — Pure Database Access
// ──────────────────────────────────────────────
// No business logic. Just Drizzle queries.

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const userDao = {
  /** Fetch all users. */
  async findAll(): Promise<SelectUser[]> {
    return db.select().from(users);
  },

  /** Fetch a single user by ID. */
  async findById(id: string): Promise<SelectUser | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0];
  },

  /** Fetch a single user by email. */
  async findByEmail(email: string): Promise<SelectUser | undefined> {
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0];
  },

  /** Insert a new user and return the created record. */
  async create(data: InsertUser): Promise<SelectUser> {
    const rows = await db.insert(users).values(data).returning();
    return rows[0]!;
  },

  /** Update an existing user by ID and return the updated record. */
  async update(id: string, data: Partial<InsertUser>): Promise<SelectUser | undefined> {
    const rows = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return rows[0];
  },

  /** Delete a user by ID and return the deleted record. */
  async delete(id: string): Promise<SelectUser | undefined> {
    const rows = await db.delete(users).where(eq(users.id, id)).returning();
    return rows[0];
  },
};
