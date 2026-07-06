// ──────────────────────────────────────────────
// API: Users — Frontend API Layer
// ──────────────────────────────────────────────
// Mirrors the backend's /api/users resource routes.

import { apiClient } from "../api-client";
import type { User, CreateUserDto, UpdateUserDto } from "@jewellery-pos/shared-types";

export const userApi = {
  /** GET /api/users */
  getAll(): Promise<User[]> {
    return apiClient.get<User[]>("/users");
  },

  /** GET /api/users/:id */
  getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  /** POST /api/users */
  create(data: CreateUserDto): Promise<User> {
    return apiClient.post<User>("/users", data);
  },

  /** PUT /api/users/:id */
  update(id: string, data: UpdateUserDto): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, data);
  },

  /** DELETE /api/users/:id */
  delete(id: string): Promise<User> {
    return apiClient.delete<User>(`/users/${id}`);
  },
};
