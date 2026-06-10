// In-memory session state the axios interceptors read from.
// The access token lives ONLY in memory (never localStorage) per guide §5.1.
// Phase 2 (auth) and Phase 3 (tenant/i18n) build their stores on top of this.

export type Lang = 'en' | 'fa';

let accessToken: string | null = null;
let tenantId: string | null = null;
let lang: Lang = 'en';

export const session = {
  getAccessToken: () => accessToken,
  setAccessToken: (token: string | null) => {
    accessToken = token;
  },

  /** Active tenant slug for the `X-Tenant-ID` header (super_admin switcher, §6). */
  getTenantId: () => tenantId,
  setTenantId: (id: string | null) => {
    tenantId = id;
  },

  /** Response language for the `x-lang` header (§7). */
  getLang: () => lang,
  setLang: (next: Lang) => {
    lang = next;
  },

  clear: () => {
    accessToken = null;
    tenantId = null;
  },
};
