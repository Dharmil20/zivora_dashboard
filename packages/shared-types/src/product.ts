// ──────────────────────────────────────────────
// Product & Variant DTOs / Interfaces
// ──────────────────────────────────────────────

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  brand: string | null;
  material: string | null;
  description: string | null;
  reorderLevel: number;
  priceTiers: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  color: string | null;
  size: string | null;
  finish: string | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reservedStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductVariantDto {
  sku: string;
  color?: string;
  size?: string;
  finish?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock?: number;
  reservedStock?: number;
  isActive?: boolean;
}

export interface CreateProductDto {
  categoryId: string;
  name: string;
  brand?: string;
  material?: string;
  description?: string;
  reorderLevel?: number;
  priceTiers?: unknown;
  isActive?: boolean;
  variants?: CreateProductVariantDto[];
}

export interface UpdateProductVariantDto {
  sku?: string;
  color?: string;
  size?: string;
  finish?: string;
  costPrice?: number;
  sellingPrice?: number;
  currentStock?: number;
  reservedStock?: number;
  isActive?: boolean;
}

export interface UpdateProductDto {
  categoryId?: string;
  name?: string;
  brand?: string;
  material?: string;
  description?: string;
  reorderLevel?: number;
  priceTiers?: unknown;
  isActive?: boolean;
}
