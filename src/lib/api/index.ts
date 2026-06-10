// Public surface of the API layer. Import from '@/lib/api'.
export { api, apiData, apiList, apiRaw } from './client';
export { ApiException, toApiException } from './errors';
export { buildListParams, DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from './pagination';
export { session } from './session';
export type { Lang } from './session';
export type {
  ApiSuccess,
  ApiError,
  ApiResponse,
  ApiFieldError,
  PaginationMeta,
  PaginationQuery,
  Paginated,
} from './types';
