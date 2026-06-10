"use client";

import { useQuery, type QueryKey } from '@tanstack/react-query';
import { ApiException } from '@/lib/api';

/**
 * Minimal integration-proof placeholder (§0.1): calls one endpoint and renders
 * the raw result. Rich screens are built later, per-feature. Handles the plugin
 * 403 / boot 404 cases gracefully (§9, §12.10).
 */
export default function EndpointPreview<T>({
  title,
  description,
  endpoint,
  queryKey,
  fetcher,
  enabled = true,
}: {
  title: string;
  description?: string;
  /** Human-readable endpoint label, e.g. "GET /orders". */
  endpoint: string;
  queryKey: QueryKey;
  fetcher: () => Promise<T>;
  enabled?: boolean;
}) {
  const { data, error, isLoading, isError } = useQuery({
    queryKey,
    queryFn: fetcher,
    enabled,
  });

  const apiErr = error instanceof ApiException ? error : null;
  const isPluginOff = apiErr?.statusCode === 403;
  const isNotFound = apiErr?.statusCode === 404;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        <code className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
          {endpoint}
        </code>
      </div>

      {isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}

      {isError && (
        <div className="rounded-lg border border-warning-300 bg-warning-50 p-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
          {isPluginOff
            ? 'This feature is not enabled for the current tenant (403). Enable the plugin to use it.'
            : isNotFound
              ? 'Not available on this deployment (404).'
              : (apiErr?.message ?? 'Request failed.')}
        </div>
      )}

      {!isLoading && !isError && (
        <pre className="max-h-[480px] overflow-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700 dark:bg-white/[0.03] dark:text-gray-300">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
