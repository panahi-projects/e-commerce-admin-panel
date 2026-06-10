import type { PaginationQuery } from './types';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Build a clean query-params object for a list request, dropping undefined/empty
 * values and clamping `limit` to the server max (§4). Pass extra feature filters
 * via `filters` — they're merged and emptied-out the same way.
 */
export function buildListParams(
  query: PaginationQuery = {},
  filters: Record<string, unknown> = {},
): Record<string, unknown> {
  const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, sortBy, sortOrder } = query;

  const params: Record<string, unknown> = {
    page,
    limit: Math.min(Math.max(1, limit), MAX_LIMIT),
    sortBy,
    sortOrder,
    ...filters,
  };

  for (const key of Object.keys(params)) {
    const v = params[key];
    if (v === undefined || v === null || v === '') delete params[key];
  }
  return params;
}
