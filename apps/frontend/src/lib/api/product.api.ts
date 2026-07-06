// ──────────────────────────────────────────────
// API: Products & Variants — Frontend API Layer
// ──────────────────────────────────────────────

import { apiClient } from "../api-client";
import type {
  Product,
  ProductVariant,
  CreateProductDto,
  UpdateProductDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from "@jewellery-pos/shared-types";

export const productApi = {
  // ── Product Endpoints ─────────────────────────

  /** GET /api/products */
  getAll(filters?: { categoryId?: string; isActive?: boolean }): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filters?.categoryId) {
      params.append("categoryId", filters.categoryId);
    }
    if (filters?.isActive !== undefined) {
      params.append("isActive", String(filters.isActive));
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<Product[]>(`/products${query}`);
  },

  /** GET /api/products/:id */
  getById(id: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`);
  },

  /** POST /api/products */
  create(data: CreateProductDto): Promise<Product> {
    return apiClient.post<Product>("/products", data);
  },

  /** PUT /api/products/:id */
  update(id: string, data: UpdateProductDto): Promise<Product> {
    return apiClient.put<Product>(`/products/${id}`, data);
  },

  /** DELETE /api/products/:id */
  delete(id: string): Promise<Product> {
    return apiClient.delete<Product>(`/products/${id}`);
  },

  // ── Variant Endpoints ─────────────────────────

  /** GET /api/products/variants/:id */
  getVariantById(id: string): Promise<ProductVariant> {
    return apiClient.get<ProductVariant>(`/products/variants/${id}`);
  },

  /** GET /api/products/variants/sku/:sku */
  getVariantBySku(sku: string): Promise<ProductVariant> {
    return apiClient.get<ProductVariant>(`/products/variants/sku/${sku}`);
  },

  /** POST /api/products/:productId/variants */
  addVariant(productId: string, data: CreateProductVariantDto): Promise<ProductVariant> {
    return apiClient.post<ProductVariant>(`/products/${productId}/variants`, data);
  },

  /** PUT /api/products/variants/:id */
  updateVariant(id: string, data: UpdateProductVariantDto): Promise<ProductVariant> {
    return apiClient.put<ProductVariant>(`/products/variants/${id}`, data);
  },

  /** DELETE /api/products/variants/:id */
  deleteVariant(id: string): Promise<ProductVariant> {
    return apiClient.delete<ProductVariant>(`/products/variants/${id}`);
  },
};
