// ──────────────────────────────────────────────
// Service: Products & Variants — Business Logic
// ──────────────────────────────────────────────

import { z } from "zod";
import { productDao } from "../dao/product.dao.js";
import { categoryService } from "./category.service.js";
import type { SelectProduct, SelectProductVariant, ProductWithVariants } from "../dao/product.dao.js";

// ── Validation Schemas ──────────────────────

const createVariantSchema = z.object({
  id: z.string().uuid("Invalid variant ID format").optional(),
  sku: z.string().min(1, "SKU is required"),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  finish: z.string().optional().nullable(),
  costPrice: z.union([z.string(), z.number()]).transform(v => String(v)),
  sellingPrice: z.union([z.string(), z.number()]).transform(v => String(v)),
  currentStock: z.number().int().optional().default(0),
  reservedStock: z.number().int().optional().default(0),
  isActive: z.boolean().optional(),
});

const createProductSchema = z.object({
  id: z.string().uuid("Invalid product ID format").optional(),
  categoryId: z.string().uuid("Invalid category ID"),
  name: z.string().min(1, "Product name is required"),
  brand: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  reorderLevel: z.number().int().optional(),
  priceTiers: z.unknown().optional(),
  isActive: z.boolean().optional(),
  variants: z.array(createVariantSchema).optional(),
});

const updateProductSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID").optional(),
  name: z.string().min(1).optional(),
  brand: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  reorderLevel: z.number().int().optional(),
  priceTiers: z.unknown().optional(),
  isActive: z.boolean().optional(),
});

const updateVariantSchema = z.object({
  sku: z.string().min(1).optional(),
  color: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  finish: z.string().optional().nullable(),
  costPrice: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),
  sellingPrice: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),
  currentStock: z.number().int().optional(),
  reservedStock: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// ── Service ─────────────────────────────────

export const productService = {
  // ── Product Operations ─────────────────────

  async getAll(filters?: { categoryId?: string; isActive?: boolean }): Promise<ProductWithVariants[]> {
    return productDao.findAll(filters);
  },

  async getById(id: string): Promise<ProductWithVariants> {
    const product = await productDao.findById(id);
    if (!product) {
      throw new Error("Product not found");
    }
    return product;
  },

  async create(data: unknown): Promise<ProductWithVariants> {
    const validated = createProductSchema.parse(data);

    // Business rule: category must exist
    await categoryService.getById(validated.categoryId);

    // Business rule: SKU uniqueness
    if (validated.variants && validated.variants.length > 0) {
      for (const variant of validated.variants) {
        const existing = await productDao.findVariantBySku(variant.sku);
        if (existing) {
          throw new Error(`SKU "${variant.sku}" is already in use by another product variant.`);
        }
      }
    }

    return productDao.create(validated, validated.variants);
  },

  async update(id: string, data: unknown): Promise<SelectProduct> {
    const validated = updateProductSchema.parse(data);

    const existing = await productDao.findById(id);
    if (!existing) {
      throw new Error("Product not found");
    }

    if (validated.categoryId) {
      await categoryService.getById(validated.categoryId);
    }

    const updated = await productDao.update(id, validated);
    if (!updated) {
      throw new Error("Failed to update product");
    }
    return updated;
  },

  async delete(id: string): Promise<SelectProduct> {
    const deleted = await productDao.delete(id);
    if (!deleted) {
      throw new Error("Product not found");
    }
    return deleted;
  },

  // ── Variant Operations ─────────────────────

  async getVariantById(id: string): Promise<SelectProductVariant> {
    const variant = await productDao.findVariantById(id);
    if (!variant) {
      throw new Error("Product variant not found");
    }
    return variant;
  },

  async getVariantBySku(sku: string): Promise<SelectProductVariant> {
    const variant = await productDao.findVariantBySku(sku);
    if (!variant) {
      throw new Error("Product variant with specified SKU not found");
    }
    return variant;
  },

  async addVariant(productId: string, data: unknown): Promise<SelectProductVariant> {
    // Validate variant payload
    const validated = createVariantSchema.parse(data);

    // Ensure product exists
    const product = await productDao.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    // SKU unique check
    const existing = await productDao.findVariantBySku(validated.sku);
    if (existing) {
      throw new Error(`SKU "${validated.sku}" is already in use.`);
    }

    return productDao.createVariant({
      ...validated,
      productId,
    });
  },

  async updateVariant(id: string, data: unknown): Promise<SelectProductVariant> {
    const validated = updateVariantSchema.parse(data);

    const existing = await productDao.findVariantById(id);
    if (!existing) {
      throw new Error("Product variant not found");
    }

    if (validated.sku && validated.sku !== existing.sku) {
      const isSkuTaken = await productDao.findVariantBySku(validated.sku);
      if (isSkuTaken) {
        throw new Error(`SKU "${validated.sku}" is already in use.`);
      }
    }

    const updated = await productDao.updateVariant(id, validated);
    if (!updated) {
      throw new Error("Failed to update product variant");
    }
    return updated;
  },

  async deleteVariant(id: string): Promise<SelectProductVariant> {
    const deleted = await productDao.deleteVariant(id);
    if (!deleted) {
      throw new Error("Product variant not found");
    }
    return deleted;
  },
};
