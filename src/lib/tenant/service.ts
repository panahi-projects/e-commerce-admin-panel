import { apiList } from '@/lib/api';

/** Minimal tenant shape for the switcher; confirm full shape in Swagger (§10.13). */
export interface TenantSummary {
  tenantId: string;
  name: string;
  plan?: string;
  isActive?: boolean;
}

export const tenantService = {
  /** GET /admin/tenants — super_admin only. */
  list: () => apiList<TenantSummary>({ method: 'GET', url: '/admin/tenants', params: { limit: 100 } }),
};
