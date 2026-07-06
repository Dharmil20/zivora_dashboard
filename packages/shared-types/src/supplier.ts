// ──────────────────────────────────────────────
// Supplier & Purchase Invoice DTOs / Interfaces
// ──────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  gstin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseInvoice {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  purchaseDate: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  gstin?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstin?: string;
}

export interface PurchaseInvoiceItemDto {
  variantId: string;
  quantity: number;
  costPrice: number;
}

export interface CreatePurchaseInvoiceDto {
  supplierId: string;
  invoiceNumber: string;
  purchaseDate: string; // ISO date string YYYY-MM-DD
  totalAmount: number;
  items: PurchaseInvoiceItemDto[];
}
