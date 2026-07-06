// ──────────────────────────────────────────────
// DAO: Products & Variants — Pure Database Access
// ──────────────────────────────────────────────

import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { products, productVariants } from "../db/schema/index.js";

export type InsertProduct = typeof products.$inferInsert;
export type SelectProduct = typeof products.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;
export type SelectProductVariant = typeof productVariants.$inferSelect;

export type ProductWithVariants = SelectProduct & { variants: SelectProductVariant[] };

export const productDao = {
  /** Fetch all products with their variants. */
  async findAll(filters?: { categoryId?: string; isActive?: boolean }): Promise<ProductWithVariants[]> {
    let conditions = [];
    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(products.isActive, filters.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(products)
      .leftJoin(productVariants, eq(products.id, productVariants.productId))
      .where(whereClause);

    // Group rows by product
    const productMap = new Map<string, ProductWithVariants>();

    for (const row of rows) {
      const prod = row.products;
      const variant = row.product_variants;

      if (!productMap.has(prod.id)) {
        productMap.set(prod.id, { ...prod, variants: [] });
      }

      if (variant) {
        productMap.get(prod.id)!.variants.push(variant);
      }
    }

    return Array.from(productMap.values());
  },

  /** Fetch a single product with its variants by ID. */
  async findById(id: string): Promise<ProductWithVariants | undefined> {
    const rows = await db
      .select()
      .from(products)
      .leftJoin(productVariants, eq(products.id, productVariants.productId))
      .where(eq(products.id, id));

    if (rows.length === 0) return undefined;

    const product = rows[0].products;
    const variants: SelectProductVariant[] = [];

    for (const row of rows) {
      if (row.product_variants) {
        variants.push(row.product_variants);
      }
    }

    return { ...product, variants };
  },

  /** Create a product and its initial variants in a transaction. */
  async create(
    productData: InsertProduct,
    variantsData?: Omit<InsertProductVariant, "productId">[],
  ): Promise<ProductWithVariants> {
    return db.transaction(async (tx) => {
      const [product] = await tx.insert(products).values(productData).returning();
      if (!product) {
        throw new Error("Failed to create product");
      }

      const createdVariants: SelectProductVariant[] = [];
      if (variantsData && variantsData.length > 0) {
        const itemsToInsert = variantsData.map((v) => ({
          ...v,
          productId: product.id,
        })) as InsertProductVariant[];

        const inserted = await tx.insert(productVariants).values(itemsToInsert).returning();
        createdVariants.push(...inserted);
      }

      return { ...product, variants: createdVariants };
    });
  },

  /** Update an existing product. */
  async update(id: string, data: Partial<InsertProduct>): Promise<SelectProduct | undefined> {
    const rows = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return rows[0];
  },

  /** Soft delete a product (marks product and its variants inactive). */
  async delete(id: string): Promise<SelectProduct | undefined> {
    return db.transaction(async (tx) => {
      // Deactivate variants
      await tx
        .update(productVariants)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(productVariants.productId, id));

      // Deactivate product
      const [product] = await tx
        .update(products)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();

      return product;
    });
  },

  // ── Variant Specific DAO Methods ─────────────────

  async findVariantById(id: string): Promise<SelectProductVariant | undefined> {
    const rows = await db.select().from(productVariants).where(eq(productVariants.id, id));
    return rows[0];
  },

  async findVariantBySku(sku: string): Promise<SelectProductVariant | undefined> {
    const rows = await db.select().from(productVariants).where(eq(productVariants.sku, sku));
    return rows[0];
  },

  async findAllVariants(filters?: { isActive?: boolean }): Promise<SelectProductVariant[]> {
    let query = db.select().from(productVariants);
    if (filters?.isActive !== undefined) {
      return query.where(eq(productVariants.isActive, filters.isActive));
    }
    return query;
  },

  async createVariant(data: InsertProductVariant): Promise<SelectProductVariant> {
    const rows = await db.insert(productVariants).values(data).returning();
    return rows[0]!;
  },

  async updateVariant(id: string, data: Partial<InsertProductVariant>): Promise<SelectProductVariant | undefined> {
    const rows = await db
      .update(productVariants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(productVariants.id, id))
      .returning();
    return rows[0];
  },

  async deleteVariant(id: string): Promise<SelectProductVariant | undefined> {
    const rows = await db
      .update(productVariants)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(productVariants.id, id))
      .returning();
    return rows[0];
  },
};
