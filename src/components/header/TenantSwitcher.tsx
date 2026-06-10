"use client";

import { useQuery } from '@tanstack/react-query';
import { useTenant, tenantService } from '@/lib/tenant';
import { useI18n } from '@/lib/i18n';

/** Super-admin tenant switcher — sets the global `X-Tenant-ID` header (§6). Hidden for operators. */
export default function TenantSwitcher() {
  const { canSwitch, activeTenantId, setActiveTenant } = useTenant();
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tenants', 'switcher'],
    queryFn: () => tenantService.list(),
    enabled: canSwitch,
    staleTime: 5 * 60_000,
  });

  if (!canSwitch) return null;

  return (
    <select
      value={activeTenantId ?? ''}
      onChange={(e) => setActiveTenant(e.target.value || null)}
      aria-label={t('common.tenant')}
      disabled={isLoading}
      className="h-11 rounded-lg border border-gray-200 bg-transparent px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-hidden dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
    >
      <option value="">{t('common.allTenants')}</option>
      {data?.items.map((tenant) => (
        <option key={tenant.tenantId} value={tenant.tenantId}>
          {tenant.name}
        </option>
      ))}
    </select>
  );
}
