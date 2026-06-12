// Users + user-manager domain types.
//
// OPEN QUESTIONS (verify against live API; shapes below are best-effort from the
// prompt + the existing AuthUser/§3 envelope conventions):
//  - GET /users item id field: `_id` vs `id` (handled by `userIdOf`).
//  - Cart/orders/reviews/coupons exact field names (rendered defensively).
//  - Coupon used/unused flag name (`used` | `isUsed` | `usedAt`) — see `isCouponUsed`.
//  - Registration-date range filter support on GET /users.

export type UserRole = 'super_admin' | 'tenant_admin' | 'tenant_staff' | 'end_user' | (string & {});

export interface UserListItem {
  _id?: string;
  id?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  isActive: boolean;
  isDeleted?: boolean;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** GET /user-manager/users/:id — "all user fields"; kept extensible. */
export interface UserDetail extends UserListItem {
  tenantId?: string | null;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  [key: string]: unknown;
}

export interface CartItem {
  productId?: string;
  name?: string;
  title?: string;
  image?: string | null;
  quantity?: number;
  price?: number;
  total?: number;
}
export interface Cart {
  items: CartItem[];
  total?: number;
}

export interface UserOrder {
  _id?: string;
  id?: string;
  orderNumber?: string;
  status?: string;
  total?: number;
  createdAt?: string;
}

export interface UserReview {
  _id?: string;
  id?: string;
  productName?: string;
  product?: { name?: string | { en?: string; fa?: string } } | string;
  rating?: number;
  comment?: string;
  createdAt?: string;
}

export interface UserCoupon {
  _id?: string;
  id?: string;
  code?: string;
  used?: boolean;
  isUsed?: boolean;
  usedAt?: string | null;
  discount?: number;
  type?: string;
  expiresAt?: string;
}

/** §10.12 audit action enum + the user-manager force-logout action. */
export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'LOGOUT_ALL'
  | 'PASSWORD_SET'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET'
  | 'ROLE_CHANGED'
  | 'SUSPICIOUS'
  | 'ADMIN_FORCE_LOGOUT'
  | (string & {});

export interface AuditLog {
  _id?: string;
  id?: string;
  action: AuditAction;
  userId?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ResetPasswordPayload {
  newPassword?: string;
  generate?: boolean;
  notify?: boolean;
}

/** Normalizes the id field across the two backend conventions (§12.6). */
export const userIdOf = (u: { id?: string; _id?: string }): string => u.id ?? u._id ?? '';

/** Best-effort used/unused detection for coupons (field name unconfirmed). */
export const isCouponUsed = (c: UserCoupon): boolean =>
  c.used === true || c.isUsed === true || Boolean(c.usedAt);
