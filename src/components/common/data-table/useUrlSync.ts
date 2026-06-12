"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ParamPatch = Record<string, string | string[] | null | undefined>;

/**
 * Reads and writes the table's shareable state to the URL query string, so a
 * refreshed/bookmarked URL reproduces the same view. Writes use `router.replace`
 * with `scroll: false` and only fire on user actions (never on mount).
 *
 * `prefix` namespaces the params (e.g. `act_page`) so multiple tables can live on
 * one route without colliding. Omit it for clean single-table URLs.
 */
export function useUrlSync(prefix = "") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pk = useCallback((k: string) => (prefix ? `${prefix}_${k}` : k), [prefix]);

  const get = useCallback((k: string) => searchParams.get(pk(k)), [searchParams, pk]);

  const setParams = useCallback(
    (patch: ParamPatch) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        const key = pk(k);
        if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) next.delete(key);
        else next.set(key, Array.isArray(v) ? v.join(",") : v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, pk],
  );

  return { get, setParams, searchParams };
}
