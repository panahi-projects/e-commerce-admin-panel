"use client";

import { useCallback, useMemo } from "react";
import { useUrlSync } from "./useUrlSync";
import { useTablePersistence } from "./useTablePersistence";
import type { ColumnDef, FilterDef, SortOrder, TableState, ViewMode } from "./types";

interface Options<T> {
  storageKey: string;
  columns: ColumnDef<T>[];
  filters: FilterDef[];
  defaultView: ViewMode;
  defaultLimit: number;
  defaultSort?: { sortBy: string; sortOrder: SortOrder };
  /** Namespaces URL params so multiple tables can coexist on one route. */
  paramPrefix?: string;
}

const toInt = (v: string | null, fallback: number) => {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/**
 * Single source of truth for a table instance. Resolves state with the priority
 * URL > localStorage prefs > config defaults, and exposes setters that write the
 * URL (shareable bits) and/or localStorage (preferences).
 */
export function useTableState<T>({
  storageKey,
  columns,
  filters,
  defaultView,
  defaultLimit,
  defaultSort,
  paramPrefix,
}: Options<T>) {
  const { get, setParams } = useUrlSync(paramPrefix);
  const { prefs, update } = useTablePersistence(storageKey, {
    view: defaultView,
    limit: defaultLimit,
    sortBy: defaultSort?.sortBy,
    sortOrder: defaultSort?.sortOrder,
    columnVisibility: {},
  });

  const state: TableState = useMemo(() => {
    const g = get;
    const resolvedFilters: Record<string, string | string[]> = {};
    for (const f of filters) {
      if (f.type === "daterange") {
        const from = g(f.fromKey ?? `${f.key}From`);
        const to = g(f.toKey ?? `${f.key}To`);
        if (from) resolvedFilters[f.fromKey ?? `${f.key}From`] = from;
        if (to) resolvedFilters[f.toKey ?? `${f.key}To`] = to;
      } else if (f.type === "multiselect") {
        const raw = g(f.key);
        if (raw) resolvedFilters[f.key] = raw.split(",").filter(Boolean);
      } else {
        const raw = g(f.key);
        if (raw) resolvedFilters[f.key] = raw;
      }
    }
    return {
      page: toInt(g("page"), 1),
      limit: toInt(g("limit"), prefs.limit),
      q: g("q") ?? "",
      sortBy: g("sortBy") ?? prefs.sortBy,
      sortOrder: (g("sortOrder") as SortOrder | null) ?? prefs.sortOrder,
      view: (g("view") as ViewMode | null) ?? prefs.view,
      filters: resolvedFilters,
    };
  }, [get, filters, prefs]);

  const setPage = useCallback((page: number) => setParams({ page: String(page) }), [setParams]);

  const setLimit = useCallback(
    (limit: number) => {
      update({ limit });
      setParams({ limit: String(limit), page: "1" });
    },
    [setParams, update],
  );

  const setQuery = useCallback((q: string) => setParams({ q, page: "1" }), [setParams]);

  const setView = useCallback(
    (view: ViewMode) => {
      update({ view });
      setParams({ view });
    },
    [setParams, update],
  );

  const setSort = useCallback(
    (field: string) => {
      // Toggle asc/desc on the same field; new field starts desc.
      const sameField = state.sortBy === field;
      const sortOrder: SortOrder = sameField && state.sortOrder === "desc" ? "asc" : "desc";
      update({ sortBy: field, sortOrder });
      setParams({ sortBy: field, sortOrder, page: "1" });
    },
    [setParams, update, state.sortBy, state.sortOrder],
  );

  const setFilter = useCallback(
    (patch: Record<string, string | string[] | null>) => {
      setParams({ ...patch, page: "1" });
    },
    [setParams],
  );

  const clearFilters = useCallback(() => {
    const cleared: Record<string, null> = { q: null };
    for (const f of filters) {
      if (f.type === "daterange") {
        cleared[f.fromKey ?? `${f.key}From`] = null;
        cleared[f.toKey ?? `${f.key}To`] = null;
      } else {
        cleared[f.key] = null;
      }
    }
    setParams({ ...cleared, page: "1" });
  }, [setParams, filters]);

  // Column visibility (localStorage only).
  const isColumnVisible = useCallback(
    (col: ColumnDef<T>) => {
      const stored = prefs.columnVisibility[col.key];
      if (stored !== undefined) return stored;
      return !col.defaultHidden;
    },
    [prefs.columnVisibility],
  );

  const toggleColumn = useCallback(
    (key: string, visible: boolean) =>
      update({ columnVisibility: { ...prefs.columnVisibility, [key]: visible } }),
    [update, prefs.columnVisibility],
  );

  const visibleColumns = useMemo(
    () => columns.filter((c) => isColumnVisible(c)),
    [columns, isColumnVisible],
  );

  const activeFilterCount = useMemo(
    () => Object.keys(state.filters).length + (state.q ? 1 : 0),
    [state.filters, state.q],
  );

  return {
    state,
    setPage,
    setLimit,
    setQuery,
    setView,
    setSort,
    setFilter,
    clearFilters,
    isColumnVisible,
    toggleColumn,
    visibleColumns,
    activeFilterCount,
  };
}
