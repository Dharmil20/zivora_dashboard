// ──────────────────────────────────────────────
// Service: Users — All Business Logic
// ──────────────────────────────────────────────
// Validation, computation, multi-DAO coordination.

import { z } from "zod";
import { userDao } from "../dao/user.dao.js";
import type { SelectUser } from "../dao/user.dao.js";

// ── Validation Schemas ──────────────────────

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(255),
  role: z.enum(["admin", "staff", "viewer"]).optional().default("staff"),
});

const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().min(1).max(255).optional(),
  role: z.enum(["admin", "staff", "viewer"]).optional(),
});

// ── Service ─────────────────────────────────

export const userService = {
  async getAll(): Promise<SelectUser[]> {
    return userDao.findAll();
  },

  async getById(id: string): Promise<SelectUser> {
    const user = await userDao.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  },

  async create(data: unknown): Promise<SelectUser> {
    const validated = createUserSchema.parse(data);

    // Business rule: email must be unique
    const existing = await userDao.findByEmail(validated.email);
    if (existing) {
      throw new Error("A user with this email already exists");
    }

    return userDao.create(validated);
  },

  async update(id: string, data: unknown): Promise<SelectUser> {
    const validated = updateUserSchema.parse(data);

    // Ensure user exists
    const existing = await userDao.findById(id);
    if (!existing) {
      throw new Error("User not found");
    }

    // Business rule: if changing email, ensure uniqueness
    if (validated.email && validated.email !== existing.email) {
      const emailTaken = await userDao.findByEmail(validated.email);
      if (emailTaken) {
        throw new Error("A user with this email already exists");
      }
    }

    const updated = await userDao.update(id, validated);
    if (!updated) {
      throw new Error("Failed to update user");
    }
    return updated;
  },

  async delete(id: string): Promise<SelectUser> {
    const deleted = await userDao.delete(id);
    if (!deleted) {
      throw new Error("User not found");
    }
    return deleted;
  },
};
