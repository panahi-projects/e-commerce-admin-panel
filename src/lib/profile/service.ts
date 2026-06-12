import { apiData } from '@/lib/api';
import type { Address, AddressInput, DeviceSession, Profile, UpdateProfileRequest } from './types';

/**
 * Profile + addresses API calls. All go through the shared envelope-aware
 * `apiData` helper (unwraps `data`, normalizes errors to ApiException).
 */
export const profileService = {
  /** GET /profile — current user's full profile incl. addresses. */
  get: () => apiData<Profile>({ method: 'GET', url: '/profile' }),

  /** PATCH /profile — update basic info. */
  update: (body: UpdateProfileRequest) =>
    apiData<Profile>({ method: 'PATCH', url: '/profile', data: body }),

  /** POST /profile/addresses — add an address. */
  createAddress: (body: AddressInput) =>
    apiData<Address>({ method: 'POST', url: '/profile/addresses', data: body }),

  /** PATCH /profile/addresses/:id — edit an address (also used for "set default"). */
  updateAddress: (id: string, body: Partial<AddressInput>) =>
    apiData<Address>({ method: 'PATCH', url: `/profile/addresses/${id}`, data: body }),

  /** DELETE /profile/addresses/:id. */
  deleteAddress: (id: string) =>
    apiData<unknown>({ method: 'DELETE', url: `/profile/addresses/${id}` }),
};

/** Active-session manager (Sessions tab) — GET/DELETE /auth/sessions. */
export const sessionsService = {
  /** GET /auth/sessions — active sessions for the current user. */
  list: () => apiData<DeviceSession[]>({ method: 'GET', url: '/auth/sessions' }),

  /** DELETE /auth/sessions/:id — revoke a single session. */
  revoke: (id: string) =>
    apiData<unknown>({ method: 'DELETE', url: `/auth/sessions/${id}` }),

  /** POST /auth/sessions/logout-others — revoke every session except the current one. */
  logoutOthers: () =>
    apiData<unknown>({ method: 'POST', url: '/auth/sessions/logout-others' }),
};
