// Profile domain types — backs the /settings/profile section.
// The `/profile` endpoint returns its own shape (`_id`, `isTwoFactorEnabled`),
// distinct from the auth `/auth/me` view (`id`, `twoFactorEnabled`).

export interface Address {
  _id: string;
  label: string;
  fullName: string;
  phone?: string;
  line1?: string;
  line2?: string;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string; // ISO 2-letter code, e.g. "ir"
  isDefault: boolean;
}

export interface Profile {
  _id: string;
  email: string;
  tenantId: string | null;
  role: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isTwoFactorEnabled: boolean;
  isActive: boolean;
  isDeleted: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  wishlist: unknown[];
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

/** PATCH /profile body. */
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
}

/** POST/PATCH /profile/addresses body. `_id` is never sent. */
export type AddressInput = Omit<Address, '_id'>;

// --- Sessions (Tab 4) — GET /auth/sessions. ---------------------------------

export interface DeviceSession {
  id: string;
  /** True for the session making this request. */
  current: boolean;
  /** Human label, e.g. "Chrome on Windows". */
  device: string;
  userAgent: string;
  ip: string;
  location: string | null;
  loginAt: string;
  lastActiveAt: string;
  expiresAt: string;
}
