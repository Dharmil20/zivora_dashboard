// ──────────────────────────────────────────────
// Service: Categories — All Business Logic
// ──────────────────────────────────────────────

import { z } from "zod";
import { categoryDao } from "../dao/category.dao.js";
import type { SelectCategory } from "../dao/category.dao.js";

// ── Validation Schemas ──────────────────────

const createCategorySchema = z.object({
  id: z.string().uuid("Invalid category ID format").optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ── Service ─────────────────────────────────

export const categoryService = {
  async getAll(activeOnly?: boolean): Promise<SelectCategory[]> {
    if (activeOnly) {
      return categoryDao.findActive();
    }
    return categoryDao.findAll();
  },

  async getById(id: string): Promise<SelectCategory> {
    const category = await categoryDao.findById(id);
    if (!category) {
      throw new Error("Category not found");
    }
    return category;
  },

  async create(data: unknown): Promise<SelectCategory> {
    const validated = createCategorySchema.parse(data);
    return categoryDao.create(validated);
  },

  async update(id: string, data: unknown): Promise<SelectCategory> {
    const validated = updateCategorySchema.parse(data);
    const existing = await categoryDao.findById(id);
    if (!existing) {
      throw new Error("Category not found");
    }
    const updated = await categoryDao.update(id, validated);
    if (!updated) {
      throw new Error("Failed to update category");
    }
    return updated;
  },

  async delete(id: string): Promise<SelectCategory> {
    const deleted = await categoryDao.delete(id);
    if (!deleted) {
      throw new Error("Category not found");
    }
    return deleted;
  },
};
