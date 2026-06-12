# Prompt: Admin Panel — "Users" Section (formerly "Customers") + Generic Advanced DataTable

## Context

This is the **admin panel** for a multi-tenant e-commerce platform, built with **Next.js**, already integrated with a NestJS backend. A "Customers" menu item currently exists and must be **renamed/migrated to "Users" (کاربران)**, becoming the entry point for a new, more powerful user management section backed by the recently implemented `user-manager` plugin APIs.

This prompt covers **two deliverables**:
1. A **generic, reusable, advanced DataTable component** (not specific to users — usable for any list-based data in the app).
2. The **Users section** built on top of that component, using the listed APIs.

---

## Part 1 — Generic Advanced DataTable Component

Audit the current/existing simple data table implementation first. Identify its location, props API, and styling approach so the new component fits the existing design system and can realistically replace or wrap it.

### Required Features

- **Two view modes**: row/list (traditional table) and **card view** (grid of cards). Both must render from the same data + column/field config — no duplicated data-fetching logic.
- **Search**: a configurable search input (debounced) that maps to a query param.
- **Advanced filters**: a filter panel/drawer supporting common filter types (select, multi-select, boolean toggle, date range, text). Filters are config-driven (passed as a schema), not hardcoded per feature.
- **Pagination**: page number + page size, page-size selector.
- **Sorting**: sortable columns (click header), with sort field + direction.
- **Persisted view state**: view mode (list/card), page size, column visibility, and active sort should persist in **localStorage** per table instance (use a unique storage key per table), so they survive page refreshes.
- **URL/route sync**: search query, filters, pagination, and sort must be reflected in the URL query string, so that a shared/bookmarked/refreshed URL reproduces the same table state. Use Next.js router (App Router preferred if that's what the project uses — confirm from audit).
- **Column configuration**: support custom cell renderers (e.g., avatar + name, status badge, action buttons/menu per row).
- **Loading/empty/error states**.
- **Row actions**: configurable action menu per row (e.g., "View details", "Force logout", etc.) — generic, action list passed via config.

### Component API (proposed — adjust to match project conventions found in audit)

```tsx
<AdvancedDataTable
  storageKey="users-table"
  columns={columnsConfig}
  filters={filtersConfig}
  fetcher={fetchUsers} // function(params) => { data, meta }
  cardRenderer={UserCard} // component used in card view
  rowActions={rowActionsConfig}
  defaultView="list" // "list" | "card"
/>
```

Deliverable: a single reusable component (+ supporting hooks, e.g., `useTableState`, `useUrlSync`, `useTablePersistence`) placed in the project's shared/common component directory, with TypeScript types for all config shapes.

---

## Part 2 — "Users" Section

### Menu Migration
- Rename the existing "Customers" menu item to **"Users"** (label: کاربران).
- Point it to a new route (e.g., `/admin/users`), reusing the existing route's layout/permission wrapper if applicable.

### Users List Page (`/admin/users`)

Built using the AdvancedDataTable from Part 1.

**API**: `GET /api/v1/users`
- Query params: `q`, `role`, `isActive`, `page`, `limit`, `sortBy`, `sortOrder`.

**Columns / Card fields**:
- Avatar: show user's avatar image if present; otherwise render a circular badge with the **first letters of first name + last name** (e.g., "AB"), with a consistent generated background color per user (e.g., hash-based color).
- Name (first + last)
- Identifier (email or phone)
- Role
- Status (`isActive`, `isDeleted`, badge-styled)
- Verification flags (email verified / mobile verified — icon indicators)
- ID (with copy-to-clipboard)

**Search**: searches by first/last name and identifiers (email/phone) and id — maps to `q`.

**Filters**: role (enum: super_admin, tenant_admin, tenant_staff, end_user), isActive, isDeleted, email/mobile verification status, registration date range (if supported by API — verify, otherwise mark as future).

**Row click / "View" action** → navigates to the User Detail page (`/admin/users/[userId]`).

### User Detail Page (`/admin/users/[userId]`)

A tabbed or sectioned layout showing:

**The below ones are only available for the super-admin or the tenants that have the userManager plugin enabled:**

#### 1. Profile / Overview
- **API**: `GET /api/v1/user-manager/users/{userId}`
- Show all returned user fields in a structured profile layout.
- Action buttons (visible per permission):
  - **Force Logout** → `POST /api/v1/user-manager/users/{userId}/force-logout` (confirmation dialog)
  - **Activate/Deactivate toggle** → `PATCH /api/v1/user-manager/users/{userId}/status` with `{ isActive: boolean }` (confirmation dialog for deactivation)
  - **Reset Password** → opens a modal/form → `POST /api/v1/user-manager/users/{userId}/reset-password`
    - Form supports: manual new password input, OR "generate password" toggle (`generate: true`), plus "notify user" toggle (`notify: true`)
    - Payload: `{ newPassword, generate, notify }`

#### 2. Activity Logs
- **API**: `GET /api/v1/audit-logs?userId={userId}`
- Use the AdvancedDataTable (list view, possibly without card mode) for this — query params: `action`, `from`, `to`, `page`, `limit`, `sortBy`, `sortOrder`.
- Display: action type (human-readable label/badge per enum value — map e.g. `ADMIN_FORCE_LOGOUT` → "Force logout by admin"), timestamp (`createdAt`), IP, user agent (parsed into readable browser/OS if feasible).
- Filter UI for action type (multi-select from the enum), date range (`from`/`to`).
- Handle the `403` response ("Plugin not enabled for this tenant") with a clear inline message/empty state — not a generic error.

#### 3. Cart
- **API**: `GET /api/v1/user-manager/users/{userId}/cart` — display cart items (product, qty, price, total).
- **Action**: "Empty Cart" → `DELETE /api/v1/user-manager/users/{userId}/cart` (confirmation dialog).

#### 4. Orders / Purchases
- **API**: `GET /api/v1/user-manager/users/{userId}/orders`
- List of orders (use AdvancedDataTable if paginated) with order id, date, status, total.

#### 5. Reviews
- **API**: `GET /api/v1/user-manager/users/{userId}/reviews`
- List of reviews submitted by the user (product, rating, comment, date).

#### 6. Coupons
- **API**: `GET /api/v1/user-manager/users/{userId}/coupons`
- Two groups/tabs: **Used** vs **Unused** (split based on whatever field the API returns — verify field name during implementation).

### Permission Gating
- All `user-manager` actions and tabs must check the current admin's permission/plugin-subscription status (consistent with backend gating) and hide/disable controls gracefully with an explanatory message if unavailable (mirroring the 403 handling above).

### Localization
- All new labels must support the existing i18n setup, with Persian (فارسی) as the primary labels (e.g., menu item "کاربران").

---

## Deliverables

1. `AdvancedDataTable` generic component + hooks, with TypeScript types, placed per project conventions.
2. Updated navigation: "Customers" → "Users" (کاربران), new route.
3. `/admin/users` list page wired to `GET /api/v1/users`.
4. `/admin/users/[userId]` detail page with all 6 sections above, wired to listed APIs.
5. Avatar/initials component (generic, reusable).
6. Updated i18n resource files for new labels.
7. Short documentation note (README or `/docs`) describing the new `AdvancedDataTable` API/props for reuse in other sections.

## Constraints

- Reuse existing UI primitives (buttons, modals, badges, tabs) and styling/theme tokens — do not introduce a new design system.
- Follow existing project conventions for API calls (data fetching library, error handling, auth headers).
- No flattery or filler — direct technical output only.
- If an API field referenced above (e.g., coupon used/unused flag, registration date) is not confirmed to exist in the actual response shape, verify against the real API response before implementing; flag any mismatch as an open question rather than guessing.

