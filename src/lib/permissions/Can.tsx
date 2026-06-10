"use client";

import { usePermissions, type PermissionAction } from './usePermissions';

/**
 * Conditionally render children based on the permission map (§5.7).
 * - Pass `section` alone to gate on `canAccess`.
 * - Pass `section` + `action` to gate on a specific verb.
 * - Pass `apiKey` for exact endpoint gating.
 */
export function Can({
  section,
  action,
  apiKey,
  fallback = null,
  children,
}: {
  section: string;
  action?: PermissionAction;
  apiKey?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { canAccess, can, hasApiKey } = usePermissions();

  let allowed = canAccess(section);
  if (allowed && apiKey) allowed = hasApiKey(section, apiKey);
  if (allowed && action) allowed = can(section, action);

  return <>{allowed ? children : fallback}</>;
}
