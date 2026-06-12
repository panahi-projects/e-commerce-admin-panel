"use client";

import { useCallback, useEffect, useState } from "react";
import type { SortOrder, ViewMode } from "./types";

/** The subset of table state we remember across refreshes, per table instance. */
export interface TablePrefs {
  view: ViewMode;
  limit: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  /** columnKey -> visible. Absent keys are visible by default. */
  columnVisibility: Record<string, boolean>;
}

const keyFor = (storageKey: string) => `table.${storageKey}`;

function read(storageKey: string): Partial<TablePrefs> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(storageKey));
    return raw ? (JSON.parse(raw) as Partial<TablePrefs>) : null;
  } catch {
    return null;
  }
}

/**
 * Persists view mode, page size, sort, and column visibility in localStorage,
 * keyed per table instance. Starts from `defaults` (SSR-safe) and hydrates the
 * stored prefs on mount to avoid a hydration mismatch.
 */
export function useTablePersistence(storageKey: string, defaults: TablePrefs) {
  const [prefs, setPrefs] = useState<TablePrefs>(defaults);

  useEffect(() => {
    const stored = read(storageKey);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefs((p) => ({ ...p, ...stored, columnVisibility: { ...p.columnVisibility, ...stored.columnVisibility } }));
    }
    // Re-read only when the instance key changes.
  }, [storageKey]);

  const update = useCallback(
    (patch: Partial<TablePrefs>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...patch };
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(keyFor(storageKey), JSON.stringify(next));
          } catch {
            // ignore quota / serialization errors
          }
        }
        return next;
      });
    },
    [storageKey],
  );

  return { prefs, update };
}
