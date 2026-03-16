/**
 * Shared API types that mirror the backend's common DTOs.
 * These are used across features and lib utilities.
 */

/**
 * Standard API response wrapper (mirrors backend ApiResponse<T> DTO)
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  errors?: Record<string, string>;
}
