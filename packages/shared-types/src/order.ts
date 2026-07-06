// ──────────────────────────────────────────────
// Order DTOs / Interfaces
// ──────────────────────────────────────────────

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";

export interface OrderItem {
  id: string;
  orderId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderDto {
  userId: string;
  items: CreateOrderItemDto[];
}

export interface CreateOrderItemDto {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
}
