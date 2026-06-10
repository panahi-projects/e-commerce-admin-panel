import { apiData } from '@/lib/api';
import type { PluginKey } from './types';

/** GET /admin/tenants/:tenantId/plugins — super_admin only (§9, §10.13). Shape is
 *  loosely typed; we normalize it in the hook. */
export const pluginService = {
  statusFor: (tenantId: string) =>
    apiData<unknown>({ method: 'GET', url: `/admin/tenants/${tenantId}/plugins` }),
};

/** Normalize the (loosely-typed) plugin status payload into the set of enabled keys. */
export function parseEnabledPlugins(payload: unknown): Set<PluginKey> {
  const enabled = new Set<PluginKey>();
  if (!payload || typeof payload !== 'object') return enabled;

  const consider = (key: string, value: unknown) => {
    const on =
      value === true ||
      (typeof value === 'object' && value !== null && (value as { enabled?: boolean }).enabled === true);
    if (on) enabled.add(key as PluginKey);
  };

  if (Array.isArray(payload)) {
    for (const entry of payload) {
      if (entry && typeof entry === 'object') {
        const e = entry as { key?: string; plugin?: string; enabled?: boolean };
        const key = e.key ?? e.plugin;
        if (key && e.enabled) enabled.add(key as PluginKey);
      }
    }
  } else {
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      consider(key, value);
    }
  }
  return enabled;
}
