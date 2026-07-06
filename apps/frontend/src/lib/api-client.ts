// ──────────────────────────────────────────────
// API Client — Typed Fetch Wrapper
// ──────────────────────────────────────────────
// Reads NEXT_PUBLIC_API_URL, handles the ApiResponse<T> envelope,
// and provides a clean interface for resource-specific API files.

import type { ApiResponse } from "@jewellery-pos/shared-types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * Generic fetch wrapper that expects an ApiResponse<T> envelope.
 * Throws on non-success responses.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const body: ApiResponse<T> = await response.json();

  if (!body.success) {
    throw new Error(body.error || `Request failed: ${response.statusText}`);
  }

  return body.data as T;
}

// ── HTTP Method Helpers ─────────────────────

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "GET" });
  },

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: "DELETE" });
  },
};
