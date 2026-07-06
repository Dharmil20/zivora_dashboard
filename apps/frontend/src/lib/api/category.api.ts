// ──────────────────────────────────────────────
// API: Categories — Frontend API Layer
// ──────────────────────────────────────────────

import { apiClient } from "../api-client";
import type { Category, CreateCategoryDto, UpdateCategoryDto } from "@jewellery-pos/shared-types";

export const categoryApi = {
  /** GET /api/categories */
  getAll(activeOnly?: boolean): Promise<Category[]> {
    const query = activeOnly ? "?active=true" : "";
    return apiClient.get<Category[]>(`/categories${query}`);
  },

  /** GET /api/categories/:id */
  getById(id: string): Promise<Category> {
    return apiClient.get<Category>(`/categories/${id}`);
  },

  /** POST /api/categories */
  create(data: CreateCategoryDto): Promise<Category> {
    return apiClient.post<Category>("/categories", data);
  },

  /** PUT /api/categories/:id */
  update(id: string, data: UpdateCategoryDto): Promise<Category> {
    return apiClient.put<Category>(`/categories/${id}`, data);
  },

  /** DELETE /api/categories/:id */
  delete(id: string): Promise<Category> {
    return apiClient.delete<Category>(`/categories/${id}`);
  },
};
