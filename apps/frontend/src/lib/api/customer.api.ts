// ──────────────────────────────────────────────
// API: Customers — Frontend API Layer
// ──────────────────────────────────────────────

import { apiClient } from "../api-client";
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from "@jewellery-pos/shared-types";

export const customerApi = {
  /** GET /api/customers */
  getAll(search?: string): Promise<Customer[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiClient.get<Customer[]>(`/customers${query}`);
  },

  /** GET /api/customers/:id */
  getById(id: string): Promise<Customer> {
    return apiClient.get<Customer>(`/customers/${id}`);
  },

  /** POST /api/customers */
  create(data: CreateCustomerDto): Promise<Customer> {
    return apiClient.post<Customer>("/customers", data);
  },

  /** PUT /api/customers/:id */
  update(id: string, data: UpdateCustomerDto): Promise<Customer> {
    return apiClient.put<Customer>(`/customers/${id}`, data);
  },

  /** DELETE /api/customers/:id */
  delete(id: string): Promise<Customer> {
    return apiClient.delete<Customer>(`/customers/${id}`);
  },
};
