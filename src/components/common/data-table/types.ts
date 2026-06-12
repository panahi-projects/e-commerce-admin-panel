import type { ReactNode } from "react";
import type { Paginated } from "@/lib/api";

export type ViewMode = "list" | "card";
export type SortOrder = "asc" | "desc";
export type Align = "start" | "center" | "end";

/** A column definition. `cell` lets callers render avatars, badges, etc. */
export interface ColumnDef<T> {
  /** Unique key; also the default sort field and the localStorage visibility key. */
  key: string;
  /** Already-translated header label. */
  header: string;
  /** Custom cell renderer; defaults to `String(row[key])`. */
  cell?: (row: T) => ReactNode;
  /** Enables click-to-sort on the header. */
  sortable?: boolean;
  /** Sort field sent to the API (defaults to `key`). */
  sortField?: string;
  align?: Align;
  /** Header/cell extra classes. */
  className?: string;
  /** Can be toggled in the column-visibility menu (default true). */
  hideable?: boolean;
  /** Hidden by default until the user enables it. */
  defaultHidden?: boolean;
}

export type FilterType = "select" | "multiselect" | "boolean" | "daterange" | "text";

export interface FilterOption {
  value: string;
  label: string;
}

/** A config-driven filter. `key` is the query param it maps to. */
export interface FilterDef {
  key: string;
  label: string;
  type: FilterType;
  /** For select / multiselect. */
  options?: FilterOption[];
  /** For boolean — labels for the true/false choices (defaults Yes/No). */
  trueLabel?: string;
  falseLabel?: string;
  /** For daterange — the two query params produced (default `${key}From`/`${key}To`). */
  fromKey?: string;
  toKey?: string;
  placeholder?: string;
}

/** A row action shown in the per-row menu. */
export interface RowAction<T> {
  key: string;
  label: string | ((row: T) => string);
  icon?: ReactNode;
  onClick?: (row: T) => void;
  href?: (row: T) => string;
  danger?: boolean;
  /** Hide this action for a given row. */
  hidden?: (row: T) => boolean;
}

/** Resolved, flat params handed to the fetcher (already cleaned of empties). */
export type FetchParams = Record<string, unknown>;

export type Fetcher<T> = (params: FetchParams) => Promise<Paginated<T>>;

/** The shareable + persisted state of a table instance. */
export interface TableState {
  page: number;
  limit: number;
  q: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  view: ViewMode;
  /** filterKey -> value (string for most, string[] for multiselect). */
  filters: Record<string, string | string[]>;
}

export interface AdvancedDataTableProps<T> {
  /** Keys localStorage prefs (view, page size, sort, column visibility). */
  storageKey: string;
  /** Namespaces URL params (e.g. `act_page`) so several tables share one route. */
  paramPrefix?: string;
  columns: ColumnDef<T>[];
  fetcher: Fetcher<T>;
  /** react-query key prefix; the resolved params are appended automatically. */
  queryKey: readonly unknown[];
  filters?: FilterDef[];
  rowActions?: RowAction<T>[];
  /** Card renderer for card view. Omit to disable card view entirely. */
  cardRenderer?: (row: T, ctx: { actions?: RowAction<T>[] }) => ReactNode;
  /** Stable row id for React keys (defaults to `row.id ?? row._id`). */
  rowId?: (row: T) => string;
  /** Clicking a row (list) or card invokes this (e.g. navigate to detail). */
  onRowClick?: (row: T) => void;
  defaultView?: ViewMode;
  defaultLimit?: number;
  defaultSort?: { sortBy: string; sortOrder: SortOrder };
  /** Hide the search box (e.g. when `q` isn't supported). */
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSizeOptions?: number[];
  /** Empty-state copy. */
  emptyTitle?: string;
  emptyHint?: string;
  /** Custom error renderer (e.g. a friendly 403 "plugin not enabled" message). */
  renderError?: (error: unknown) => ReactNode;
}
