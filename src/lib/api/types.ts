// API response envelope + shared contracts.
// Mirrors the backend integration guide §3 (envelope) and §4 (pagination).

/** Pagination metadata — present only on paginated list responses. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** A single field-level validation error. */
export interface ApiFieldError {
  field?: string;
  message: string;
}

/** Successful response envelope. */
export interface ApiSuccess<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

/** Error response envelope. */
export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: ApiFieldError[];
  timestamp: string;
  path?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** A paginated list result, after unwrapping the envelope. */
export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Common query params every list endpoint accepts (§4). */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
