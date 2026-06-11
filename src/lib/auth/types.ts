// Auth domain types — mirrors integration guide §5.

/** Built-in roles; the `role` field may also carry a custom role slug (§10.15). */
export type BuiltInRole = 'super_admin' | 'tenant_admin' | 'tenant_staff' | 'end_user';
export type Role = BuiltInRole | (string & {});

/** The authenticated user (login / verify-otp / GET /auth/me). Note: `id`, not `_id` (§5.2). */
export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  role: Role;
  tenantId: string | null; // null = super_admin (platform-wide)
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  hasPassword: boolean; // false = OTP-only → offer "set password"
  twoFactorEnabled: boolean; // true = login requires password AND OTP
  twoFactorChannel: 'email' | 'phone' | null;
}

// --- Effective permissions (§5.7) -------------------------------------------

export interface SectionPermission {
  key: string; // stable section key, e.g. "products", "admin.tenants"
  module: string; // human label, e.g. "Admin / Users", "[Plugin] Coupons"
  canAccess: boolean; // user may reach SOME endpoint here → show the menu item
  actions: { view: boolean; create: boolean; update: boolean; delete: boolean };
  allowedApiKeys: string[];
}

export interface EffectivePermissions {
  role: BuiltInRole;
  isSuperAdmin: boolean; // true → unconditional full access
  sections: Record<string, SectionPermission>;
}

// --- Request / response DTOs ------------------------------------------------

/**
 * POST /auth/admin/login/options — step 1 of the login wizard. Probes how the
 * account signs in and (if OTP is enabled) auto-sends the code.
 */
export interface AdminLoginOptions {
  identifier: string;
  method: 'password' | 'otp' | 'both' | string;
  passwordRequired: boolean;
  otpRequired: boolean;
  /** Which channels a code was just sent to. */
  otpSent: { email: boolean; mobile: boolean };
  /** Channel the OTP was delivered on, when applicable. */
  channel: 'phone' | 'email' | null;
}

/** POST /auth/admin/login — send `password` and/or `code` (§5.3). */
export interface AdminLoginRequest {
  identifier: string;
  password?: string;
  code?: string;
}

export interface AdminLoginResponse {
  user: AuthUser;
  accessToken: string;
  permissions: EffectivePermissions;
}

export interface RequestOtpResponse {
  codeSent: { email?: string; mobile?: string };
}

/** POST /auth/reset-password — used by the accept-invite flow (§5.6, Phase 5). */
export interface ResetPasswordRequest {
  identifier: string;
  code: string;
  newPassword: string;
}
