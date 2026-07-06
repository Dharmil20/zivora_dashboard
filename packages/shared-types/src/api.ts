// ──────────────────────────────────────────────
// Standard API Response Envelope
// ──────────────────────────────────────────────

/**
 * Every backend response is wrapped in this envelope.
 * Frontend API client should always expect this shape.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Pagination metadata returned alongside list endpoints.
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Paginated list response — extends ApiResponse with pagination info.
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationMeta;
}
