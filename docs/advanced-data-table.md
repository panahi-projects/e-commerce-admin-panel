# AdvancedDataTable

A generic, config-driven list component for any paginated resource in the admin panel.
Location: [`src/components/common/data-table/`](../src/components/common/data-table/).

It handles, from one config:

- **List + card views** (card view optional — omit `cardRenderer` to disable).
- **Debounced search** (`q`), **config-driven filters**, **pagination** + page-size, **click-to-sort**.
- **URL sync** — search, filters, page, sort, page-size, and view live in the query string, so a refreshed/shared URL reproduces the view.
- **localStorage persistence** (per `storageKey`) for view mode, page size, sort, and column visibility.
- **Custom cell renderers**, **per-row action menu**, **column visibility**, and **loading / empty / error** states (incl. a custom `renderError`).

## Usage

```tsx
import { AdvancedDataTable, type ColumnDef, type FilterDef, type RowAction } from "@/components/common/data-table";

const columns: ColumnDef<User>[] = [
  { key: "user", header: t("users.col.user"), cell: (u) => <UserCell user={u} />, hideable: false },
  { key: "createdAt", header: t("users.col.registered"), sortable: true, cell: (u) => <DateText value={u.createdAt} /> },
];

const filters: FilterDef[] = [
  { key: "role", label: t("users.filter.role"), type: "select", options: [...] },
  { key: "isActive", label: t("users.filter.isActive"), type: "boolean" },
  { key: "createdAt", label: t("users.filter.registered"), type: "daterange", fromKey: "from", toKey: "to" },
];

<AdvancedDataTable<User>
  storageKey="users"               // localStorage namespace for prefs
  queryKey={["users", "list"]}     // react-query key prefix (resolved params appended)
  columns={columns}
  filters={filters}
  rowActions={[{ key: "view", label: t("users.action.view"), href: (u) => `/admin/users/${u.id}` }]}
  fetcher={(params) => usersService.list(params)}   // (params) => Promise<{ items, meta }>
  cardRenderer={(u, ctx) => <UserCard user={u} actions={ctx.actions} />}
  onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
  defaultSort={{ sortBy: "createdAt", sortOrder: "desc" }}
/>
```

The page must wrap the table in a `<Suspense>` boundary (it reads `useSearchParams`).

## Key props

| Prop | Purpose |
|---|---|
| `storageKey` | localStorage namespace for view/page-size/sort/column-visibility. |
| `paramPrefix` | Namespaces URL params (e.g. `act_page`). **Required when multiple tables share one route** (e.g. the user-detail tabs use `act`/`ord`/`rev`). Omit for clean single-table URLs. |
| `queryKey` | react-query key prefix; the resolved fetch params are appended. |
| `fetcher` | `(params) => Promise<Paginated<T>>`. Params: `page`, `limit`, `q`, `sortBy`, `sortOrder`, plus each active filter key. Multi-select values arrive comma-joined. |
| `columns` | `ColumnDef<T>[]` — `cell` renderer, `sortable`, `align`, `hideable`, `defaultHidden`. |
| `filters` | `FilterDef[]` — `select`, `multiselect`, `boolean`, `daterange`, `text`. `daterange` emits `fromKey`/`toKey` params. |
| `rowActions` | `RowAction<T>[]` — `onClick` or `href`, optional `danger`, `hidden(row)`. |
| `cardRenderer` | Enables card view. Omit to show list only. |
| `renderError` | Custom error UI — used for the activity log's 403 "plugin not enabled" message. |
| `searchable` | Set `false` when the endpoint has no `q`. |

## Hooks (exported for advanced use)

- `useTableState` — resolves state (URL > localStorage > defaults) and exposes setters.
- `useUrlSync(prefix?)` — read/write the query string (`router.replace`, never on mount).
- `useTablePersistence(storageKey, defaults)` — the localStorage layer.

## Notes / conventions

- RTL-first: logical utilities (`ms`/`me`/`ps`/`pe`/`start`/`end`/`text-start`), LTR-pinned data (emails, IDs, IPs, dates).
- Reuses the project primitives (`Table`, `Badge`, `Select`, `MultiSelect`, `DatePicker`, `Input`) and react-query.
