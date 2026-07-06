// ──────────────────────────────────────────────
// Service: Orders — All Business Logic
// ──────────────────────────────────────────────
// Validation, computation, multi-DAO coordination.

import { z } from "zod";
import { orderDao } from "../dao/order.dao.js";
import { userDao } from "../dao/user.dao.js";
import type { SelectOrder } from "../dao/order.dao.js";

// ── Validation Schemas ──────────────────────

const createOrderSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  totalAmount: z.union([z.string(), z.number()]).transform((v) => String(v)),
  status: z.enum(["pending", "confirmed", "processing", "completed", "cancelled"]).optional().default("pending"),
});

const updateOrderSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "completed", "cancelled"]).optional(),
  totalAmount: z
    .union([z.string(), z.number()])
    .transform((v) => String(v))
    .optional(),
});

// ── Service ─────────────────────────────────

export const orderService = {
  async getAll(): Promise<SelectOrder[]> {
    return orderDao.findAll();
  },

  async getById(id: string): Promise<SelectOrder> {
    const order = await orderDao.findById(id);
    if (!order) {
      throw new Error("Order not found");
    }
    return order;
  },

  async getByUserId(userId: string): Promise<SelectOrder[]> {
    // Ensure user exists
    const user = await userDao.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return orderDao.findByUserId(userId);
  },

  async create(data: unknown): Promise<SelectOrder> {
    const validated = createOrderSchema.parse(data);

    // Business rule: user must exist
    const user = await userDao.findById(validated.userId);
    if (!user) {
      throw new Error("Cannot create order: user not found");
    }

    return orderDao.create(validated);
  },

  async update(id: string, data: unknown): Promise<SelectOrder> {
    const validated = updateOrderSchema.parse(data);

    // Ensure order exists
    const existing = await orderDao.findById(id);
    if (!existing) {
      throw new Error("Order not found");
    }

    // Business rule: cannot update a cancelled order
    if (existing.status === "cancelled") {
      throw new Error("Cannot update a cancelled order");
    }

    const updated = await orderDao.update(id, validated);
    if (!updated) {
      throw new Error("Failed to update order");
    }
    return updated;
  },

  async delete(id: string): Promise<SelectOrder> {
    const deleted = await orderDao.delete(id);
    if (!deleted) {
      throw new Error("Order not found");
    }
    return deleted;
  },
};
