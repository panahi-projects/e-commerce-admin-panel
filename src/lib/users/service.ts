import { apiData, apiList } from '@/lib/api';
import type { FetchParams } from '@/components/common/data-table';
import type {
  AuditLog,
  Cart,
  ResetPasswordPayload,
  UserCoupon,
  UserDetail,
  UserListItem,
  UserOrder,
  UserReview,
} from './types';

/**
 * Users (core) + user-manager plugin API. List endpoints return the §4 paginated
 * envelope; `apiList` tolerates a plain array too (synthesizes meta).
 */
export const usersService = {
  /** GET /users — hierarchy-scoped list (§8.2). */
  list: (params: FetchParams) => apiList<UserListItem>({ method: 'GET', url: '/users', params }),

  // --- user-manager plugin (super_admin or tenants with userManager enabled) ---

  /** GET /user-manager/users/:id — full profile. */
  get: (id: string) => apiData<UserDetail>({ method: 'GET', url: `/user-manager/users/${id}` }),

  /** POST /user-manager/users/:id/force-logout. */
  forceLogout: (id: string) =>
    apiData<unknown>({ method: 'POST', url: `/user-manager/users/${id}/force-logout` }),

  /** PATCH /user-manager/users/:id/status { isActive }. */
  setStatus: (id: string, isActive: boolean) =>
    apiData<unknown>({ method: 'PATCH', url: `/user-manager/users/${id}/status`, data: { isActive } }),

  /** POST /user-manager/users/:id/reset-password { newPassword?, generate?, notify? }. */
  resetPassword: (id: string, payload: ResetPasswordPayload) =>
    apiData<{ password?: string }>({
      method: 'POST',
      url: `/user-manager/users/${id}/reset-password`,
      data: payload,
    }),

  /** GET /user-manager/users/:id/cart. */
  cart: (id: string) => apiData<Cart>({ method: 'GET', url: `/user-manager/users/${id}/cart` }),

  /** DELETE /user-manager/users/:id/cart. */
  emptyCart: (id: string) =>
    apiData<unknown>({ method: 'DELETE', url: `/user-manager/users/${id}/cart` }),

  /** GET /user-manager/users/:id/orders. */
  orders: (id: string, params: FetchParams) =>
    apiList<UserOrder>({ method: 'GET', url: `/user-manager/users/${id}/orders`, params }),

  /** GET /user-manager/users/:id/reviews. */
  reviews: (id: string, params: FetchParams) =>
    apiList<UserReview>({ method: 'GET', url: `/user-manager/users/${id}/reviews`, params }),

  /** GET /user-manager/users/:id/coupons — plain array (used + unused). */
  coupons: (id: string) =>
    apiData<UserCoupon[]>({ method: 'GET', url: `/user-manager/users/${id}/coupons` }),

  /** GET /audit-logs?userId=:id — activity log (auditLogs plugin). */
  activity: (params: FetchParams) =>
    apiList<AuditLog>({ method: 'GET', url: '/audit-logs', params }),
};
