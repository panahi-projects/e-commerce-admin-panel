import axios, { type AxiosRequestConfig } from 'axios';
import { session } from './session';
import { toApiException } from './errors';
import type { ApiSuccess, Paginated } from './types';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

/**
 * Shared axios instance.
 * - `withCredentials: true` so the httpOnly refresh cookie is sent/received (§2, §5.1).
 * - Request interceptor injects the in-memory access token, the tenant header,
 *   and the language header.
 */
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = session.getAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);

  const tenantId = session.getTenantId();
  if (tenantId) config.headers.set('X-Tenant-ID', tenantId);

  config.headers.set('x-lang', session.getLang());
  return config;
});

// NOTE: the 401 → /auth/refresh retry interceptor is added in Phase 2 (auth),
// where the token store and login flow live. Keeping it out here avoids a
// circular dependency between the client and the auth layer.

// --- Envelope-aware request helpers -------------------------------------------
// Every endpoint returns the §3 envelope; these unwrap `data` (and `meta`) and
// normalize errors into ApiException. Prefer these over calling `api` directly.

async function request<T>(config: AxiosRequestConfig): Promise<ApiSuccess<T>> {
  try {
    const res = await api.request<ApiSuccess<T>>(config);
    return res.data;
  } catch (err) {
    throw toApiException(err);
  }
}

/** Unwrap a single-resource response to its `data` payload. */
export async function apiData<T>(config: AxiosRequestConfig): Promise<T> {
  const body = await request<T>(config);
  return body.data;
}

/** Unwrap a paginated list response to `{ items, meta }` (§4). */
export async function apiList<T>(config: AxiosRequestConfig): Promise<Paginated<T>> {
  const body = await request<T[]>(config);
  return {
    items: body.data,
    meta: body.meta ?? { total: body.data.length, page: 1, limit: body.data.length, totalPages: 1 },
  };
}

/** Access the raw envelope (e.g. when you need `message`). */
export async function apiRaw<T>(config: AxiosRequestConfig): Promise<ApiSuccess<T>> {
  return request<T>(config);
}
