import { AxiosError } from 'axios';
import type { ApiError, ApiFieldError } from './types';

/**
 * Normalized API error thrown by the client. Carries the already-localized
 * `message` (from the server) plus field-level `errors[]` for form mapping (§3).
 */
export class ApiException extends Error {
  readonly statusCode: number;
  readonly errors: ApiFieldError[];
  readonly path?: string;

  constructor(message: string, statusCode: number, errors: ApiFieldError[] = [], path?: string) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.errors = errors;
    this.path = path;
  }

  /** Map field-level errors to a `{ field: message }` object for forms. */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const e of this.errors) {
      if (e.field) out[e.field] = e.message;
    }
    return out;
  }
}

function isApiError(data: unknown): data is ApiError {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    (data as { success: unknown }).success === false
  );
}

/** Convert any thrown value (mostly AxiosError) into a typed ApiException. */
export function toApiException(err: unknown): ApiException {
  if (err instanceof ApiException) return err;

  if (err instanceof AxiosError) {
    const data = err.response?.data;
    if (isApiError(data)) {
      return new ApiException(data.message, data.statusCode, data.errors ?? [], data.path);
    }
    const status = err.response?.status ?? 0;
    return new ApiException(err.message || 'Network error', status);
  }

  return new ApiException(err instanceof Error ? err.message : 'Unknown error', 0);
}
