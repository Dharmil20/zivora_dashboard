// ──────────────────────────────────────────────
// Response Helpers
// ──────────────────────────────────────────────
// Every controller uses these — no raw res.json() calls.

import type { Response } from "express";
import type { ApiResponse } from "@jewellery-pos/shared-types";

/**
 * Send a success response with a consistent envelope shape.
 *
 * @param res     - Express Response object
 * @param data    - Payload to include in the response
 * @param message - Optional human-readable message
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
): void {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.status(statusCode).json(body);
}

/**
 * Send an error response with a consistent envelope shape.
 *
 * @param res        - Express Response object
 * @param error      - Error message or Error instance
 * @param statusCode - HTTP status code (default: 500)
 */
export function sendError(
  res: Response,
  error: string | Error,
  statusCode: number = 500,
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const body: ApiResponse = {
    success: false,
    error: errorMessage,
  };
  res.status(statusCode).json(body);
}
