// ──────────────────────────────────────────────
// API: Bills & Sales — Frontend API Layer
// ──────────────────────────────────────────────

import { apiClient } from "../api-client";
import type { Bill, BillPayment, CreateBillDto, AddPaymentDto } from "@jewellery-pos/shared-types";

export const billApi = {
  /** GET /api/bills */
  getAll(filters?: {
    customerId?: string;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
    billStatus?: string;
  }): Promise<Bill[]> {
    const params = new URLSearchParams();
    if (filters?.customerId) params.append("customerId", filters.customerId);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.paymentStatus) params.append("paymentStatus", filters.paymentStatus);
    if (filters?.billStatus) params.append("billStatus", filters.billStatus);

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<Bill[]>(`/bills${query}`);
  },

  /** GET /api/bills/:id */
  getById(id: string): Promise<Bill & { items: any[]; payments: BillPayment[] }> {
    return apiClient.get<Bill & { items: any[]; payments: BillPayment[] }>(`/bills/${id}`);
  },

  /** POST /api/bills */
  create(data: CreateBillDto): Promise<Bill> {
    return apiClient.post<Bill>("/bills", data);
  },

  /** POST /api/bills/:id/payments */
  addPayment(billId: string, data: AddPaymentDto): Promise<BillPayment> {
    return apiClient.post<BillPayment>(`/bills/${billId}/payments`, data);
  },

  /** POST /api/bills/:id/cancel */
  cancel(billId: string): Promise<Bill> {
    return apiClient.post<Bill>(`/bills/${billId}/cancel`, {});
  },
};
