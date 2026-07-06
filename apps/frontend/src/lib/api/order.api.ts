// ──────────────────────────────────────────────
// API: Orders — Frontend API Layer
// ──────────────────────────────────────────────
// Mirrors the backend's /api/orders resource routes.

import { apiClient } from "../api-client";
import type { Order, CreateOrderDto, UpdateOrderDto } from "@jewellery-pos/shared-types";

export const orderApi = {
  /** GET /api/orders */
  getAll(): Promise<Order[]> {
    return apiClient.get<Order[]>("/orders");
  },

  /** GET /api/orders/:id */
  getById(id: string): Promise<Order> {
    return apiClient.get<Order>(`/orders/${id}`);
  },

  /** GET /api/orders/user/:userId */
  getByUserId(userId: string): Promise<Order[]> {
    return apiClient.get<Order[]>(`/orders/user/${userId}`);
  },

  /** POST /api/orders */
  create(data: CreateOrderDto): Promise<Order> {
    return apiClient.post<Order>("/orders", data);
  },

  /** PUT /api/orders/:id */
  update(id: string, data: UpdateOrderDto): Promise<Order> {
    return apiClient.put<Order>(`/orders/${id}`, data);
  },

  /** DELETE /api/orders/:id */
  delete(id: string): Promise<Order> {
    return apiClient.delete<Order>(`/orders/${id}`);
  },
};
