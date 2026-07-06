// ──────────────────────────────────────────────
// API: Suppliers & Purchases — Frontend API Layer
// ──────────────────────────────────────────────

import { apiClient } from "../api-client";
import type {
  Supplier,
  PurchaseInvoice,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreatePurchaseInvoiceDto,
} from "@jewellery-pos/shared-types";

export const supplierApi = {
  // ── Supplier Methods ──────────────────────────

  /** GET /api/suppliers */
  getAllSuppliers(): Promise<Supplier[]> {
    return apiClient.get<Supplier[]>("/suppliers");
  },

  /** GET /api/suppliers/:id */
  getSupplierById(id: string): Promise<Supplier> {
    return apiClient.get<Supplier>(`/suppliers/${id}`);
  },

  /** POST /api/suppliers */
  createSupplier(data: CreateSupplierDto): Promise<Supplier> {
    return apiClient.post<Supplier>("/suppliers", data);
  },

  /** PUT /api/suppliers/:id */
  updateSupplier(id: string, data: UpdateSupplierDto): Promise<Supplier> {
    return apiClient.put<Supplier>(`/suppliers/${id}`, data);
  },

  /** DELETE /api/suppliers/:id */
  deleteSupplier(id: string): Promise<Supplier> {
    return apiClient.delete<Supplier>(`/suppliers/${id}`);
  },

  // ── Purchase Invoice Methods ──────────────────

  /** GET /api/purchases */
  getAllPurchaseInvoices(): Promise<PurchaseInvoice[]> {
    return apiClient.get<PurchaseInvoice[]>("/purchases");
  },

  /** GET /api/purchases/:id */
  getPurchaseInvoiceById(id: string): Promise<PurchaseInvoice> {
    return apiClient.get<PurchaseInvoice>(`/purchases/${id}`);
  },

  /** POST /api/purchases */
  createPurchaseInvoice(data: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice> {
    return apiClient.post<PurchaseInvoice>("/purchases", data);
  },
};
