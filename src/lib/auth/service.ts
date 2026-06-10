import { apiData } from '@/lib/api';
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  AuthUser,
  EffectivePermissions,
  RequestOtpResponse,
  ResetPasswordRequest,
} from './types';

/**
 * Auth API calls (§5). All use the dedicated admin endpoints where relevant so
 * `end_user` accounts are rejected with 403 auth.not_admin (§5.3).
 */
export const authService = {
  /** POST /auth/admin/login — password and/or OTP `code`. Returns user + token + permissions. */
  adminLogin: (body: AdminLoginRequest) =>
    apiData<AdminLoginResponse>({ method: 'POST', url: '/auth/admin/login', data: body }),

  /** POST /auth/request-otp — sends a login code; issues no tokens. */
  requestOtp: (identifier: string) =>
    apiData<RequestOtpResponse>({ method: 'POST', url: '/auth/request-otp', data: { identifier } }),

  /** GET /auth/me — current authenticated user. */
  me: () => apiData<AuthUser>({ method: 'GET', url: '/auth/me' }),

  /** GET /auth/permissions — refetch the effective permission map (§5.7). */
  permissions: () =>
    apiData<EffectivePermissions>({ method: 'GET', url: '/auth/permissions' }),

  /** POST /auth/logout — revokes refresh + denylists current access; clears cookie. */
  logout: () => apiData<unknown>({ method: 'POST', url: '/auth/logout' }),

  /** POST /auth/logout-all — revokes all sessions for the user. */
  logoutAll: () => apiData<unknown>({ method: 'POST', url: '/auth/logout-all' }),

  /** POST /auth/reset-password — accept-invite / forgot-password completion (§5.6). */
  resetPassword: (body: ResetPasswordRequest) =>
    apiData<unknown>({ method: 'POST', url: '/auth/reset-password', data: body }),

  /** POST /auth/forgot-password — request a reset code. */
  forgotPassword: (identifier: string) =>
    apiData<unknown>({ method: 'POST', url: '/auth/forgot-password', data: { identifier } }),

  /** POST /auth/set-password — first-time password for an OTP-only account (Bearer). */
  setPassword: (newPassword: string) =>
    apiData<unknown>({ method: 'POST', url: '/auth/set-password', data: { newPassword } }),
};
