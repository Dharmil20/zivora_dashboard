// ──────────────────────────────────────────────
// Bill, BillItem & Payment DTOs / Interfaces
// ──────────────────────────────────────────────

export interface Bill {
  id: string;
  billNumber: string;
  customerId: string | null;
  soldById: string | null;
  billDate: string;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  paymentStatus: "PAID" | "PARTIAL" | "DUE";
  amountPaid: number;
  amountDue: number;
  billStatus: "COMPLETED" | "CANCELLED" | "REFUNDED";
  createdAt: string;
  updatedAt: string;
  items?: BillItem[];
  payments?: BillPayment[];
}

export interface BillItem {
  id: string;
  billId: string;
  variantId: string;
  quantity: number;
  sellingPrice: number;
  costPriceSnapshot: number;
  discount: number;
  total: number;
  returnedQuantity: number;
  createdAt: string;
  updatedAt: string;
  sku?: string; // product variant SKU, helpful for UI
  productName?: string; // product name, helpful for UI
}

export interface BillPayment {
  id: string;
  billId: string;
  paymentMethod: "CASH" | "CARD" | "UPI";
  amount: number;
  transactionRef: string | null;
  createdAt: string;
}

export interface CreateBillItemDto {
  variantId: string;
  quantity: number;
  sellingPrice: number;
  discount?: number;
}

export interface CreateBillPaymentDto {
  paymentMethod: "CASH" | "CARD" | "UPI";
  amount: number;
  transactionRef?: string;
}

export interface CreateBillDto {
  customerId?: string;
  soldById?: string;
  discount?: number;
  gst?: number;
  items: CreateBillItemDto[];
  payments: CreateBillPaymentDto[];
}

export interface AddPaymentDto {
  paymentMethod: "CASH" | "CARD" | "UPI";
  amount: number;
  transactionRef?: string;
}
