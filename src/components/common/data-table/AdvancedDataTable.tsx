"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { useTableState } from "./useTableState";
import FilterPanel from "./FilterPanel";
import RowActionsMenu from "./RowActionsMenu";
import type { AdvancedDataTableProps, ColumnDef, FetchParams } from "./types";

const alignClass = { start: "text-start", center: "text-center", end: "text-end" } as const;

function defaultRowId<T>(row: T): string {
  const r = row as Record<string, unknown>;
  return String(r.id ?? r._id ?? JSON.stringify(row));
}

export default function AdvancedDataTable<T>(props: AdvancedDataTableProps<T>) {
  const {
    storageKey,
    paramPrefix,
    columns,
    fetcher,
    queryKey,
    filters = [],
    rowActions = [],
    cardRenderer,
    rowId = defaultRowId,
    onRowClick,
    defaultView = "list",
    defaultLimit = 20,
    defaultSort,
    searchable = true,
    searchPlaceholder,
    pageSizeOptions = [10, 20, 50, 100],
    emptyTitle,
    emptyHint,
    renderError,
  } = props;

  const { t } = useI18n();
  const table = useTableState<T>({ storageKey, paramPrefix, columns, filters, defaultView, defaultLimit, defaultSort });
  const { state } = table;

  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);

  // Debounced search: keep a local input, push to the URL only when it changes.
  const [searchInput, setSearchInput] = useState(state.q);
  useEffect(() => {
    if (searchInput === state.q) return; // skip mount + already-synced
    const id = setTimeout(() => table.setQuery(searchInput), 350);
    return () => clearTimeout(id);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const params: FetchParams = useMemo(() => {
    const flat: FetchParams = {
      page: state.page,
      limit: state.limit,
      q: state.q || undefined,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
    };
    for (const [k, v] of Object.entries(state.filters)) flat[k] = Array.isArray(v) ? v.join(",") : v;
    return flat;
  }, [state]);

  const query = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => fetcher(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const rows = Array.isArray(query.data?.items) ? query.data.items : [];
  const meta = query.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const colSpan = table.visibleColumns.length + (rowActions.length ? 1 : 0);
  const canCard = Boolean(cardRenderer);
  const view = canCard ? state.view : "list";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {searchable && (
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-gray-400">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M9.16 3a6.16 6.16 0 1 0 3.86 10.97l3.5 3.5a.75.75 0 1 0 1.06-1.06l-3.5-3.5A6.16 6.16 0 0 0 9.16 3Zm-4.66 6.16a4.66 4.66 0 1 1 9.32 0 4.66 4.66 0 0 1-9.32 0Z" fill="currentColor" />
              </svg>
            </span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={searchPlaceholder ?? t("common.search")}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent ps-10 pe-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
        )}

        {filters.length > 0 && (
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            {t("table.filters")}
            {table.activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-xs text-white">
                {table.activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Column visibility */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColumns((v) => !v)}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            {t("table.columns")}
          </button>
          {showColumns && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowColumns(false)} />
              <div className="absolute end-0 z-40 mt-1 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">
                {columns
                  .filter((c) => c.hideable !== false)
                  .map((c) => (
                    <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]">
                      <input
                        type="checkbox"
                        checked={table.isColumnVisible(c)}
                        onChange={(e) => table.toggleColumn(c.key, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500"
                      />
                      {c.header}
                    </label>
                  ))}
              </div>
            </>
          )}
        </div>

        {/* View toggle */}
        {canCard && (
          <div className="inline-flex h-11 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700">
            {(["list", "card"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => table.setView(v)}
                className={`px-3 text-sm font-medium ${
                  view === v
                    ? "bg-brand-500 text-white"
                    : "bg-transparent text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.03]"
                }`}
              >
                {t(v === "list" ? "table.viewList" : "table.viewCard")}
              </button>
            ))}
          </div>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <FilterPanel filters={filters} state={state} onChange={table.setFilter} onClear={table.clearFilters} />
      )}

      {/* Body */}
      {query.isError ? (
        renderError ? (
          renderError(query.error)
        ) : (
          <ErrorState message={t("table.error")} onRetry={() => query.refetch()} retryLabel={t("common.retry")} />
        )
      ) : query.isLoading ? (
        view === "list" ? <ListSkeleton cols={colSpan} /> : <CardSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyTitle ?? t("table.empty")} hint={emptyHint} />
      ) : view === "card" && cardRenderer ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div key={rowId(row)} onClick={() => onRowClick?.(row)} className={onRowClick ? "cursor-pointer" : undefined}>
              {cardRenderer(row, { actions: rowActions })}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <Table>
            <TableHeader className="border-b border-gray-200 dark:border-gray-800">
              <TableRow>
                {table.visibleColumns.map((c) => (
                  <HeaderCell key={c.key} col={c} state={state} onSort={table.setSort} />
                ))}
                {rowActions.length > 0 && (
                  <TableCell isHeader className="px-4 py-3 text-end text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t("table.actions")}
                  </TableCell>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={rowId(row)}
                  className={`border-b border-gray-100 last:border-0 dark:border-gray-800 ${
                    onRowClick ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]" : ""
                  }`}
                >
                  {table.visibleColumns.map((c) => (
                    <TableCell
                      key={c.key}
                      className={`px-4 py-3 text-sm text-gray-700 dark:text-gray-300 ${alignClass[c.align ?? "start"]} ${c.className ?? ""}`}
                    >
                      <div onClick={() => onRowClick?.(row)}>{c.cell ? c.cell(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}</div>
                    </TableCell>
                  ))}
                  {rowActions.length > 0 && (
                    <TableCell className="px-4 py-3 text-end">
                      <div className="flex justify-end">
                        <RowActionsMenu row={row} actions={rowActions} ariaLabel={t("table.actions")} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer */}
      {meta && rows.length > 0 && (
        <Footer
          page={state.page}
          totalPages={totalPages}
          total={meta.total}
          limit={state.limit}
          pageSizeOptions={pageSizeOptions}
          onPage={table.setPage}
          onLimit={table.setLimit}
        />
      )}
    </div>
  );
}

function HeaderCell<T>({
  col,
  state,
  onSort,
}: {
  col: ColumnDef<T>;
  state: { sortBy?: string; sortOrder?: "asc" | "desc" };
  onSort: (field: string) => void;
}) {
  const field = col.sortField ?? col.key;
  const active = state.sortBy === field;
  return (
    <TableCell
      isHeader
      className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 ${alignClass[col.align ?? "start"]} ${
        col.sortable ? "cursor-pointer select-none" : ""
      }`}
    >
      <span className="inline-flex items-center gap-1" onClick={col.sortable ? () => onSort(field) : undefined}>
        {col.header}
        {col.sortable && (
          <span className={active ? "text-brand-500" : "text-gray-300 dark:text-gray-600"}>
            {active && state.sortOrder === "asc" ? "▲" : "▼"}
          </span>
        )}
      </span>
    </TableCell>
  );
}

function Footer({
  page,
  totalPages,
  total,
  limit,
  pageSizeOptions,
  onPage,
  onLimit,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  pageSizeOptions: number[];
  onPage: (p: number) => void;
  onLimit: (n: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span>{t("table.rowsPerPage")}</span>
        <select
          value={limit}
          onChange={(e) => onLimit(Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-300 bg-transparent px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="ms-2">{t("table.totalCount").replace("{count}", String(total))}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          {t("table.prev")}
        </button>
        <span className="px-2 text-sm text-gray-600 dark:text-gray-400">
          {t("table.pageOf").replace("{page}", String(page)).replace("{total}", String(totalPages))}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
        >
          {t("table.next")}
        </button>
      </div>
    </div>
  );
}

function ListSkeleton({ cols }: { cols: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
      {Array.from({ length: 6 }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-gray-100 p-4 last:border-0 dark:border-gray-800">
          {Array.from({ length: Math.min(cols, 5) }).map((__, c) => (
            <div key={c} className="h-4 flex-1 animate-pulse rounded bg-gray-100 dark:bg-white/[0.06]" />
          ))}
        </div>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]" />
      ))}
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 py-14 text-center dark:border-gray-800">
      <p className="text-base font-medium text-gray-700 dark:text-gray-300">{title}</p>
      {hint && <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

function ErrorState({ message, onRetry, retryLabel }: { message: string; onRetry: () => void; retryLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 py-12 text-center dark:border-gray-800">
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
      >
        {retryLabel}
      </button>
    </div>
  );
}
