# Build the Admin Panel — Frontend Integration Guide (for AI engineers)

> **Audience:** an AI (or human) building the **admin panel** SPA that integrates
> with this project's backend (a multi-tenant, white-label e-commerce REST API:
> NestJS 11 + MongoDB + Redis). This document is the single source of truth for
> how to talk to the API. Read it fully before writing code.
>
> **Golden rule:** the backend's OpenAPI spec is authoritative for exact
> request/response _shapes_. This guide gives you the model, the auth, the
> conventions, and a complete endpoint map. For field-level DTO details always
> cross-check the live spec:
>
> - **Swagger UI:** `{baseUrl}/api/v1/docs`
> - **OpenAPI JSON:** `{baseUrl}/api/v1/docs-json` (use this to generate a typed client)
> - **Scalar reference:** `{baseUrl}/api/v1/reference`

> **The baseUrl of the backend on local is on port `3000`**

---

## 0. STOP — read the existing admin-panel project first

⚠️ **The admin panel already exists in part.** Its base structure, layout, menu,
navbar, routing shell, and several screens/components are **already implemented**.
**Do not scaffold from scratch and do not assume conventions.** Before writing or
changing any code, you MUST first explore the current frontend project and build a
mental model of it. Only then proceed to the steps in this guide.

**Discovery checklist — do this before any coding:**

1. **Project layout** — read the directory tree. Identify where pages/routes,
   shared components, layouts, the navbar/menu, stores, hooks, services, and
   styles live.
2. **Config & tooling** — read `package.json` (framework, scripts, deps: HTTP
   client, data-fetching, forms, i18n, UI lib), the build config
   (Vite/Next/Angular/etc.), `tsconfig`, `.env`/env files, path aliases, and any
   lin/format config. Match the existing toolchain — **don't introduce a parallel
   stack.**
3. **HTTP / API layer** — find the existing API client (axios/fetch wrapper,
   generated OpenAPI client, base URL handling, the auth/refresh interceptor, the
   `X-Tenant-ID` and `x-lang` header logic). **Reuse it.** Only extend it if a
   capability is genuinely missing.
4. **Auth & state** — locate how the access token is stored, how the user/session
   is held, route guards, and login flow. Wire new screens into the existing
   auth, don't reinvent it.
5. **i18n & RTL** — find the translation setup, locale files, and how
   direction (LTR/RTL) is switched. Add new strings to the existing catalogs.
6. **Navbar / menu / routing** — see how nav items and routes are registered and
   how they're gated by role/permission. Add new screens the same way.
7. **UI components & design system** — inventory the existing reusable components
   (tables, forms, modals, buttons, toasts, layout primitives) and styling
   approach (CSS framework / tokens / theme). **Compose with them**; match naming,
   structure, and patterns of the surrounding code.
8. **What's already done vs. missing** — map implemented screens/features against
   §10 and §11 so you build only the gaps and follow the established patterns.

**Then, and only then,** continue to the integration model below (auth, tenancy,
i18n, endpoints) and the milestone checklist in §13 — adapting every step to the
conventions you just discovered rather than the generic examples here. The code
samples in this document are **illustrative**; prefer the project's own patterns.

---

## 0.1 Scope of THIS task — integration base only (keep it lightweight)

⚠️ **Do NOT fully build out every feature now.** The goal of this pass is a clean,
correct **integration foundation** between the existing admin panel and the
backend — **not** finished screens. Keep everything minimal to save time and
tokens; the user will flesh out each section later, **one at a time**.

**Do now (the plumbing — make these solid):**

- API client + the response-envelope/error handling (§3), pagination helper (§4).
- Auth: admin login + refresh interceptor + logout + `GET /auth/me` (§5).
- The **permission map → menu/route gating** (§5.7, §8), the **tenant header**
  (§6), and **i18n/RTL** (§7) wired into the existing shell.
- Register the real **routes/menu entries** that map to this backend (§10/§11).

**Don't do now (defer to later, per-feature passes):**

- Rich screens, complex forms, validation niceties, tables with every
  filter/sort, optimistic updates, edge-case polish. For each section build only a
  **minimal placeholder/skeleton** that calls the correct endpoint and renders the
  raw list/result — just enough to prove the integration works. Leave clear seams
  to expand later.

**Clean up the starter:** **remove the template's sample/demo pages** (example
dashboards, mock/placeholder screens, demo routes and their menu items) that ship
with the base project. **Keep only the pages/routes that correspond to this
backend** (the modules in §10/§11). Don't leave unrelated boilerplate in the nav.

> Treat §10–§13 as the **map of what exists**, not an instruction to implement it
> all in one go. Build the base; then stop and let the user pick the next feature.

---

## 1. What you're building

A back-office **admin panel** consumed by three operator roles:

| Role           | Scope                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| `super_admin`  | Platform owner. Cross-tenant. Manages tenants, plugins per tenant, sees everything. |
| `tenant_admin` | Full admin of **one** tenant (catalog, orders, staff, plugins' data, permissions).  |
| `tenant_staff` | Operational staff of one tenant (subset of admin actions).                          |

There is also `end_user` (storefront customer) — **not** an admin-panel user, but
you manage them from the Users screen.

The panel must be **role-aware** (show/hide nav and actions by role + hierarchy)
and **tenant-aware** (super admin can switch tenants; tenant operators are pinned
to their own tenant).

### Suggested tech (non-prescriptive)

Any SPA stack works (React/Vue/Angular/Svelte). Recommended: a typed HTTP client
generated from the OpenAPI JSON (`openapi-typescript` + `openapi-fetch`, or
`@openapitools/openapi-generator-cli`), a data-fetching layer (TanStack Query /
RTK Query), a state store for the in-memory access token, a forms+validation lib,
and an **RTL-capable UI library** (Farsi is a first-class language — see §7).

---

## 2. Connection basics

- **Base URL:** everything lives under the global prefix `…/api/v1`.
  - Local dev: `http://localhost:3000/api/v1`.
- **CORS:** your panel's origin must be in the backend `CORS_ORIGINS` allowlist.
  If you get a CORS error, that's a backend env change — ask the backend team.
- **Cookies matter:** the refresh token is an **httpOnly cookie**. Every request
  that should send/receive it (login, verify-otp, refresh, logout) **must** use
  `credentials: 'include'` (fetch) / `withCredentials: true` (axios).

### Request headers

| Header            | When                              | Value                         |
| ----------------- | --------------------------------- | ----------------------------- |
| `Content-Type`    | Any request with a JSON body      | `application/json`            |
| `Authorization`   | Every authenticated request       | `Bearer <accessToken>`        |
| `X-Tenant-ID`     | Target a specific tenant (see §6) | tenant slug, e.g. `acme-corp` |
| `x-lang`          | Force response language           | `fa` or `en`                  |
| `Accept-Language` | Alternative to `x-lang`           | `fa-IR,fa;q=0.9,en;q=0.8`     |

---

## 3. Response envelope (every response has the same shape)

**Success:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {
    /* the payload — object, array, or primitive */
  },
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 5 },
  "timestamp": "2026-06-09T12:00:00.000Z"
}
```

- `message` defaults to `"OK"`; mutating endpoints return a localized message.
- `meta` is present **only** on paginated list responses.

**Error:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "identifier", "message": "identifier should not be empty" }],
  "timestamp": "2026-06-09T12:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

- `errors[]` appears on validation failures — each item is `{ field?, message }`.
  Map `field` → your form field to show inline errors.
- `message` is already localized to the requested language.

**TypeScript:**

```typescript
interface ApiSuccess<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}
interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: { field?: string; message: string }[];
  timestamp: string;
  path?: string;
}
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

> ⚠️ **Always unwrap `data`.** A list endpoint returns `{ data: T[], meta }`;
> a single-resource endpoint returns `{ data: T }`.

---

## 4. Pagination, sorting, filtering

All list endpoints extend a common pagination contract:

| Query param | Type   | Default | Notes                        |
| ----------- | ------ | ------- | ---------------------------- |
| `page`      | number | `1`     | 1-based                      |
| `limit`     | number | `20`    | max `100`                    |
| `sortBy`    | string | —       | field name, e.g. `createdAt` |
| `sortOrder` | string | `desc`  | `asc` or `desc`              |

> There is **no** `sort=-field` syntax. Use `sortBy` + `sortOrder`.

Each list endpoint adds its own filters (documented per feature in §10). Read
`meta.totalPages` / `meta.total` to render your pager.

---

## 5. Authentication (OTP-first + optional password)

The API is **OTP-first / passwordless**. The login identity field is always
**`identifier`** — an email **or** an Iranian mobile number (auto-detected). A
password is **optional**; admins typically get one during onboarding (see below).

> ⚠️ The API uses `forbidNonWhitelisted` validation — **never send fields the DTO
> doesn't define** (e.g. sending `{ email, password }` to login fails; it must be
> `{ identifier, password }`).

### 5.1 Tokens

- **Access token (JWT):** returned in the response **body** (`data.accessToken`).
  Short-lived (default 15 min; deployment may set `JWT_ACCESS_EXPIRES_IN=1h`).
  **Store it in memory only** (a store/variable) — never `localStorage`.
- **Refresh token:** httpOnly cookie `refresh_token` (7 days), `sameSite=strict`,
  rotated on every refresh. You never read it in JS; the browser sends it
  automatically when `credentials:'include'` is set.

### 5.2 The authenticated user object (`data.user`)

Returned by login / verify-otp and by `GET /auth/me`:

```typescript
interface AuthUser {
  id: string; // NOT _id
  email?: string;
  phone?: string;
  // A built-in role OR a custom role's name (slug). See §10.15.
  role: 'super_admin' | 'tenant_admin' | 'tenant_staff' | 'end_user' | string;
  tenantId: string | null; // null = super_admin (platform-wide)
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  hasPassword: boolean; // false = OTP-only account → offer "set password"
  twoFactorEnabled: boolean; // true = login requires password AND OTP
  twoFactorChannel: 'email' | 'phone' | null; // where the 2FA login OTP is sent
}
```

Drive the whole UI off the **§5.7 permission map** (not the raw role string) plus
`tenantId` — that way custom roles work without any role-name special-casing. The
`role` may be a custom slug; don't hard-code logic against the four built-ins.

### 5.3 Admin login flows — use the dedicated admin endpoints

> 🔒 **This app is admin-only.** End users (`end_user`) must never log into the
> admin panel. The backend enforces this on **dedicated admin endpoints** that
> reject `end_user` with **`403 auth.not_admin`**. **Always use these — not the
> storefront `/auth/login`.** They also return the user's **permission map** (see
> §5.7) so you can gate the menu in one round-trip.

**Password login (typical for admins who set a password):**

```
POST /auth/admin/login   { identifier, password }
  → { data: { user, accessToken, permissions } } + refresh cookie
  → 403 auth.not_admin   if the account is an end_user
```

**OTP login (admins may also log in by code) — same endpoint, send `code` instead of `password`:**

```
POST /auth/request-otp   { identifier }                 → 200 { data: { codeSent: { email, mobile } } }
POST /auth/admin/login   { identifier, code }
  → { data: { user, accessToken, permissions } } + refresh cookie
  → 403 auth.not_admin   if the account is an end_user
```

(`request-otp` just sends a code — it issues no tokens, so it stays shared. There
is no separate admin verify-otp endpoint; `/auth/admin/login` accepts password
and/or code.)

**Two-factor (when `twoFactorEnabled`):**

```
POST /auth/admin/login  { identifier, password, code }  → both required
```

### 5.4 Token lifecycle

```
POST /auth/refresh      (cookie sent automatically)  → { data: { accessToken } } + rotated cookie
POST /auth/logout       (Bearer)                     → revokes refresh + denylists current access; clears cookie
POST /auth/logout-all   (Bearer)                     → revokes all sessions for the user
GET  /auth/me           (Bearer)                     → current AuthUser
```

On any `401` → call `/auth/refresh`; if that fails, redirect to login.

> If an account is **deactivated** while logged in, protected requests return
> `401` with message `auth.account_inactive` ("Unauthorized — your account is
> inactive"). Surface that message rather than a generic "Unauthorized", and don't
> bother retrying via refresh (it will keep failing until the account is reactivated).

**Axios interceptor pattern:**

```typescript
const api = axios.create({ baseURL: '/api/v1', withCredentials: true });
let accessToken = '';
api.interceptors.request.use((c) => {
  if (accessToken) c.headers.Authorization = `Bearer ${accessToken}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const r = await api.post('/auth/refresh');
      accessToken = r.data.data.accessToken;
      err.config.headers.Authorization = `Bearer ${accessToken}`;
      return api(err.config);
    }
    return Promise.reject(err);
  },
);
```

### 5.5 Password management (optional, per account)

- `hasPassword: false` → `POST /auth/set-password { newPassword }` (Bearer, first time only).
- `hasPassword: true` → `POST /auth/change-password { currentPassword, newPassword }` (revokes all sessions).
- Forgot → `POST /auth/forgot-password { identifier }` then `POST /auth/reset-password { identifier, code, newPassword }`.
- **Enable 2FA (two steps, Bearer):** `POST /auth/2fa/enable { channel: 'email' | 'mobile' }`
  → backend checks the account has that contact + a password, then sends a code to
  it; then `POST /auth/2fa/confirm { code }` activates it. Disable with
  `POST /auth/2fa/disable`. (Enabling requires a password to be set first; the
  chosen channel must have an email/phone on file or you get a 400.)
- The confirmed channel is stored as `twoFactorChannel`. **Once 2FA is on, the
  login OTP from `/auth/request-otp` is delivered to that channel** regardless of
  which identifier the user typed. To **change** the channel, disable 2FA then
  re-enable with the new channel.

**Password rules** (enforce client-side to match server): **min 8 chars, ≥1
uppercase, ≥1 digit, ≥1 special character (any non-alphanumeric).** There is **no**
lowercase requirement.

### 5.6 How admins are onboarded

- **Super admin** is created out-of-band (server env `SUPER_ADMIN_EMAIL` /
  `SUPER_ADMIN_PASSWORD`, or CLI `npm run cli bootstrap:superadmin`). Your panel
  just logs them in.
- **Tenant admins** are provisioned by a super admin via
  `POST /admin/tenants/:tenantId/provision-admin { identifier, firstName, lastName }`.
  The invitee receives a one-time code and sets their password via
  `POST /auth/reset-password { identifier, code, newPassword }`. Build this
  "accept invite / set password" screen.

### 5.7 Effective permissions (drives menu + control gating)

Every admin login response embeds `data.permissions`, and you can refetch it any
time (e.g. after a permissions change, or on app reload) via:

```
GET /auth/permissions   (Bearer)   → { data: EffectivePermissions }
```

```typescript
interface EffectivePermissions {
  role: 'super_admin' | 'tenant_admin' | 'tenant_staff' | 'end_user';
  isSuperAdmin: boolean; // true → unconditional full access
  sections: Record<string, SectionPermission>; // keyed by stable section key
}
interface SectionPermission {
  key: string; // stable section key, e.g. "products", "orders", "admin.tenants"
  module: string; // human label/tag, e.g. "Admin / Users", "[Plugin] Coupons"
  canAccess: boolean; // user may reach SOME endpoint here → show the menu item
  actions: { view: boolean; create: boolean; update: boolean; delete: boolean };
  allowedApiKeys: string[]; // exact endpoint keys allowed, for precise control gating
}
```

**How to use it:**

- **Menu visibility:** show/enable a nav item only if its section's
  `canAccess === true`; otherwise **hide it** (or render disabled).
- **Control gating:** enable a Create/Edit/Delete button from
  `sections[key].actions.{create|update|delete}`; for finer control, check
  `allowedApiKeys`.
- **Section keys** are stable, derived from the route group (e.g. `products`,
  `orders`, `categories`, `users` → likely `users`, `admin.tenants`,
  `permissions`, `auditlogs`, `coupons`, `analytics`, …). Map them to your menu.
  Sections you can't access at all may still appear with `canAccess:false` — treat
  that as "hide/disable".

**How the backend computes it (so the behavior is predictable):**

- `super_admin` → `isSuperAdmin:true`; **every section is `canAccess:true` and all
  four `actions` are `true`** — unconditional, unlimited access (it never reports a
  `false`). Once the super admin exists it has full access until it's deleted.
- `tenant_admin` → allowed by default for every endpoint their role can reach,
  **minus** anything a super_admin explicitly denied (tenant-scoped).
- `tenant_staff` → **default-deny**: only endpoints a tenant_admin has explicitly
  granted are allowed. A fresh staff member sees an empty/locked panel until
  granted.
- Permissions are managed via the `/permissions` API (§10.14). This is the SAME
  enforcement the server applies — the response is a faithful mirror, **but the
  server re-checks every request**, so never treat the client copy as security.

> **What a `false` action means (non-super roles):** `actions[x] === false` means
> "no endpoint of that verb is allowed to you in this section" — which can be
> either _not granted_ **or** _the section simply has no endpoint of that verb_
> (e.g. a section whose only admin endpoint is a POST will have `view:false`; a
> section whose read route is public isn't counted). For precise control gating
> prefer `allowedApiKeys`. For `super_admin` all four are always `true`.

> The permission map only covers **admin-relevant** (role-gated) endpoints —
> public/storefront and self-service routes are intentionally omitted. (So a
> section may show `view:false` even though the data is readable via a public
> route; load such reads without gating on `view`.)

---

## 6. Multi-tenancy

The backend resolves the tenant per request in this priority:
**subdomain → `X-Tenant-ID` header → JWT `tenantId` claim → `default`.**

- **Tenant operators** (`tenant_admin`/`tenant_staff`) are **pinned** to their own
  tenant by a server guard — they cannot act outside it even by changing
  `X-Tenant-ID`. You don't strictly need to send the header for them (the JWT
  carries it), but sending the matching one is harmless.
- **Super admin** is unscoped. To operate on a specific tenant's data, send
  `X-Tenant-ID: <tenantId>`. Build a **tenant switcher** in the super-admin shell
  that sets this header globally for subsequent requests.

---

## 7. Internationalization (i18n) & RTL

- Supported languages: **`en`** and **`fa`** (Farsi/Persian).
- Send `x-lang: fa|en` (or `Accept-Language`) on every request. Localized
  `message` and validation `errors[].message` come back in that language.
- **Farsi is RTL.** The admin panel must support full **right-to-left** layout,
  mirrored components, and a Farsi UI translation set of its own (the API only
  localizes _server messages_, not your UI chrome).
- **Localized content fields:** catalog content is stored as a localized object
  `{ en: string, fa?: string }` (e.g. product/category `name`, `description`).
  Your create/edit forms must offer both-language inputs; render the field for the
  active locale, falling back to `en`.
- Suggest a language toggle in the panel that (a) switches your UI locale + text
  direction and (b) sets the `x-lang` header for API calls.

---

## 8. Authorization model — gate the UI correctly

Three layers enforce access server-side. Mirror them in the UI to avoid dead
clicks, but **never rely on the client for security** — the server re-checks.

> ✅ **The simplest correct way to gate the UI is the permission map from §5.7**
> (`data.permissions` / `GET /auth/permissions`). It already resolves the layers
> below into ready-to-use `canAccess` + per-action booleans per section. Use it
> for the menu and buttons; the details below explain what it encodes.

### 8.1 Static roles

Most admin endpoints are gated with `@Roles(...)`. `super_admin` passes every
role check. The per-endpoint role is listed in §10 — and is already folded into
the §5.7 permission map.

### 8.2 Hierarchical + tenant-scoped visibility (User management)

On the **Users** endpoints, a caller sees and manages only accounts **in their own
tenant** whose role is **strictly below their own**:

- Rank: `super_admin (3) > tenant_admin (2) > tenant_staff (1) > end_user (0)`.
- `tenant_admin` sees `tenant_staff` + `end_user` (not peer admins); `tenant_staff`
  sees only `end_user`.
- Out-of-scope target → **404** (hidden, not 403).
- A non-super-admin can **never** assign a role at/above their own →
  `403 users.role_escalation_forbidden`. In role-select dropdowns, only offer
  roles strictly below the current operator's role.

### 8.3 Dynamic permissions (fine-grained, runtime-editable)

Access is governed by a `permissions` collection (`allow`/`deny` rules per
`(tenant, role, apiKey)`) overlaid on the static roles. This is exactly what the
§5.7 permission map resolves for the current user. Defaults (see §5.7): super_admin
= all; tenant_admin = all-eligible **minus** super_admin denies; tenant_staff =
**default-deny**, explicit grants only.

Build a **permissions-management screen** so a tenant_admin can grant/restrict
their staff (and a super_admin can restrict tenant_admins):

- **`GET /permissions/catalog`** — the one-stop feed to render the "create rule"
  form, **scoped to the caller**: the valid `effects` (`allow`/`deny`), the
  `roles` the caller may target, and `groups` of selectable apiKeys (each with
  method/path/description and a `grantable` flag — a tenant_admin may always
  `deny` but only `allow` non-platform keys). Prefer this over hard-coding values.
- `GET /admin/api-registry` — raw list of every endpoint + `apiKey` grouped by
  module (super-set; the catalog is the form-ready, scoped view).
- `GET/POST /permissions`, `PATCH /permissions/:id`, `DELETE /permissions/:id` —
  CRUD policy rules (tenant_admin scoped to own tenant; super_admin global). A
  tenant_admin cannot grant platform/escalating keys.
- After changing rules, **refetch `GET /auth/permissions`** for affected users (or
  instruct them to re-login) so their menu reflects the change.
- `super_admin` bypasses this entirely.

---

## 9. Feature flags & plugins (conditionally render features)

Two layers decide whether a feature exists:

1. **Boot layer** — the deployment's `ENABLED_PLUGINS` decides which plugin modules
   are even loaded. A disabled-at-boot plugin's routes return 404.
2. **Runtime layer** — per-tenant `enabledPlugins` + `featureFlags`. Calling a
   plugin endpoint for a tenant that hasn't enabled it returns **403**
   ("The '<plugin>' feature is not enabled for your account.").

> **super_admin bypasses the runtime layer (god mode).** An authenticated
> super_admin reaches every **boot-loaded** plugin endpoint regardless of the
> tenant's `enabledPlugins` — so no per-tenant enabling is needed for the super
> admin's own panel access. (Boot layer still applies: a plugin not in
> `ENABLED_PLUGINS` has no routes → 404.) This bypass needs an authenticated
> request, so it does **not** apply to **public/storefront** plugin endpoints
> (e.g. `GET /coupons/free-shipping`) — those still depend on the resolved
> tenant having the plugin + flag enabled.

**Plugin keys (camelCase, canonical):**
`coupons`, `reviews`, `compareProducts`, `wishlist`, `marketing`, `analytics`,
`loyaltyPoints`, `notifications`, `auditLogs`.

**To know what to show for the current tenant:**
`GET /admin/tenants/:tenantId/plugins` → per-plugin enabled/flag status. Hide nav
items and screens for plugins that aren't enabled. Also handle the 403
("plugin not enabled") gracefully if a tenant disables something mid-session.

**Granting a plugin to a tenant** (super_admin): `PATCH /admin/tenants/:tenantId/plugins/:key/enable`
and toggle its flags via `PATCH /admin/tenants/:tenantId/flags/:key { flags: { <flag>: true } }`.
This is what makes a plugin's **public storefront** endpoints work for that tenant.

---

## 10. Feature-by-feature API map

Paths are relative to `/api/v1`. **Auth legend:** `Public` = no auth · `Bearer` =
any logged-in user · `Admin` = `tenant_admin`+`tenant_staff` · `Admin*` =
`tenant_admin` only · `Super` = `super_admin` only. Plugin endpoints additionally
require the plugin enabled for the tenant.

### 10.1 Dashboard & Analytics _(plugin: `analytics`)_

| Method | Path                       | Auth  | Purpose                                                    |
| ------ | -------------------------- | ----- | ---------------------------------------------------------- |
| GET    | `/analytics/dashboard`     | Admin | KPI counters (today/week/month/customers)                  |
| GET    | `/analytics/sales`         | Admin | Sales bucketed by day (`from`,`to`)                        |
| GET    | `/analytics/products/top`  | Admin | Top products (`from`,`to`,`limit`≤100)                     |
| GET    | `/analytics/customers/top` | Admin | Top customers (`from`,`to`,`limit`)                        |
| GET    | `/analytics/funnel`        | Admin | Order funnel (created vs paid)                             |
| GET    | `/analytics/events`        | Admin | Aggregated event log (`event`,`from`,`to` as `YYYY-MM-DD`) |

Build the landing dashboard from `/analytics/dashboard` + `/analytics/sales`
(chart) + the two "top" lists. Date filters use `from`/`to` (ISO date).

### 10.2 Users management _(core; hierarchy-scoped — see §8.2)_

| Method | Path                  | Auth  | Purpose                                                      |
| ------ | --------------------- | ----- | ------------------------------------------------------------ |
| GET    | `/users`              | Admin | List (filters: `q`, `role`, `isActive`) + pagination         |
| GET    | `/users/:id`          | Admin | Get one (scoped)                                             |
| PATCH  | `/users/:id`          | Admin | Update `{ firstName?, lastName?, phone?, role?, isActive? }` |
| DELETE | `/users/:id`          | Admin | Soft-delete                                                  |
| PATCH  | `/users/:id/activate` | Admin | Body `{ isActive: boolean }`                                 |

Notes: `role` options offered must be strictly below the operator's role.
`passwordHash` is **never** returned. Changing a phone that already exists →
`400 users.phone_immutable`.

### 10.3 Categories _(core)_

| Method | Path                | Auth    | Purpose                   |
| ------ | ------------------- | ------- | ------------------------- |
| GET    | `/categories`       | Public  | Flat list                 |
| GET    | `/categories/tree`  | Public  | Nested tree (for tree UI) |
| GET    | `/categories/:slug` | Public  | By slug                   |
| POST   | `/categories`       | Admin   | Create                    |
| PATCH  | `/categories/:id`   | Admin   | Update                    |
| DELETE | `/categories/:id`   | Admin\* | Soft-delete               |

Create/update body: `name: { en, fa? }` (localized), `slug`, optional
`description: { en, fa? }`, `parentId` (Mongo id), `image`, `isActive`, `sortOrder`.

### 10.4 Products & Inventory _(core)_

| Method | Path                           | Auth    | Purpose                                        |
| ------ | ------------------------------ | ------- | ---------------------------------------------- |
| GET    | `/products`                    | Public  | Storefront list (published only)               |
| GET    | `/products/featured`           | Public  | Featured                                       |
| GET    | `/products/:slug`              | Public  | Detail by slug                                 |
| GET    | `/products/admin/list`         | Admin   | **Admin** list incl. drafts/archived           |
| POST   | `/products`                    | Admin   | Create                                         |
| PATCH  | `/products/:id`                | Admin   | Update                                         |
| PATCH  | `/products/:id/status`         | Admin   | Change status (`draft`/`published`/`archived`) |
| DELETE | `/products/:id`                | Admin\* | Soft-delete                                    |
| GET    | `/inventory`                   | Admin   | Stock rows (per variant)                       |
| GET    | `/inventory/alerts/low-stock`  | Admin   | At/below threshold                             |
| GET    | `/inventory/:productId`        | Admin   | Rows for a product                             |
| PATCH  | `/inventory/:productId/adjust` | Admin   | Adjust stock (delta + reason)                  |

Admin listing filters (`/products/admin/list`): `q`, `category`, `minPrice`,
`maxPrice`, `tags[]`, `inStock` (`"true"`/`"false"`), `status` + pagination.

Product create body (key fields): `name: { en, fa? }`, `slug`, `basePrice`,
optional `description: { en, fa? }`, `categoryId`, `images[]`, `tags[]`,
`attributes: Record<string,string>`, `status`, `lowStockThreshold`, `isFeatured`,
`isDigital`, `seoTitle`, `seoDescription`, and `variants[]` where each variant is
`{ sku, price, stock, name?, lowStockThreshold?, attributes? }`. Confirm the full
shape in Swagger before building the form.

### 10.5 Orders _(core)_

| Method | Path                 | Auth    | Purpose                                  |
| ------ | -------------------- | ------- | ---------------------------------------- |
| GET    | `/orders`            | Admin   | All orders (filters: `status`, `userId`) |
| GET    | `/orders/:id`        | Bearer  | Detail (owner or admin)                  |
| PATCH  | `/orders/:id/status` | Admin   | `{ status, note? }`                      |
| POST   | `/orders/:id/refund` | Admin\* | Mark refund-requested                    |

`OrderStatus`: `PENDING_PAYMENT`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`,
`COMPLETED`, `CANCELLED`, `REFUND_REQUESTED`, `REFUNDED`, `PARTIALLY_REFUNDED`.
Render a status badge + a guarded status-transition control.

### 10.6 Payments _(core)_

| Method | Path                     | Auth    | Purpose          |
| ------ | ------------------------ | ------- | ---------------- |
| GET    | `/payments/transactions` | Admin   | Transaction list |
| POST   | `/payments/refund`       | Admin\* | Process a refund |

(`/payments/verify` and `/payments/webhook` are public gateway callbacks — not
admin-panel concerns.)

### 10.7 Coupons _(plugin: `coupons`)_

| Method | Path           | Auth    | Purpose    |
| ------ | -------------- | ------- | ---------- |
| GET    | `/coupons`     | Admin   | List       |
| POST   | `/coupons`     | Admin\* | Create     |
| PATCH  | `/coupons/:id` | Admin\* | Update     |
| DELETE | `/coupons/:id` | Admin\* | Deactivate |

Create body: `code`, `type` (`percentage`/`fixed`/`free-shipping`), `value`, plus
optional `minOrderAmount`, `maxDiscountAmount`, `usageLimit`, `perUserLimit`,
`applicableProducts[]`, `applicableCategories[]`, `startsAt`/`expiresAt` (ISO
date-time strings), `isActive`.

### 10.8 Reviews moderation _(plugin: `reviews`)_

| Method | Path           | Auth    | Purpose                     |
| ------ | -------------- | ------- | --------------------------- |
| PATCH  | `/reviews/:id` | Admin   | Moderate (approve / reject) |
| DELETE | `/reviews/:id` | Admin\* | Delete                      |

(Public submission/listing is under `/products/:productId/reviews` — storefront.)
Build a moderation queue filtered to pending reviews.

### 10.9 Marketing — banners & newsletter _(plugin: `marketing`)_

| Method | Path                        | Auth    | Purpose                      |
| ------ | --------------------------- | ------- | ---------------------------- |
| POST   | `/banners`                  | Admin   | Create banner                |
| PATCH  | `/banners/:id`              | Admin   | Update                       |
| DELETE | `/banners/:id`              | Admin\* | Delete                       |
| GET    | `/newsletter/subscribers`   | Admin   | List subscribers             |
| POST   | `/newsletter/sms-broadcast` | Admin\* | SMS blast `{ text }` (≤2000) |

Banner body: `title`, `imageUrl`, optional `linkUrl`, `position`, `isActive`,
`startsAt`/`expiresAt`, `sortOrder`. (Public `GET /banners` + newsletter
subscribe/unsubscribe are storefront.)

### 10.10 Loyalty points _(plugin: `loyaltyPoints`; base path `/loyalty`)_

| Method | Path                      | Auth  | Purpose                                           |
| ------ | ------------------------- | ----- | ------------------------------------------------- |
| GET    | `/loyalty/admin/accounts` | Admin | List loyalty accounts                             |
| POST   | `/loyalty/admin/adjust`   | Admin | `{ userId, delta, reason, type? }` (signed delta) |

(`/loyalty/balance`, `/loyalty/transactions`, `/loyalty/redeem` are end-user.)

### 10.11 Notifications _(plugin: `notifications`)_

| Method | Path                      | Auth    | Purpose                                          |
| ------ | ------------------------- | ------- | ------------------------------------------------ |
| POST   | `/notifications/email`    | Admin   | `{ recipient, subject, body }`                   |
| POST   | `/notifications/sms`      | Admin   | `{ recipient, subject, body }`                   |
| POST   | `/notifications/push`     | Admin   | `{ recipient, subject, body }`                   |
| POST   | `/notifications/sms/bulk` | Admin\* | `{ mobiles: string[], text }` (≤1000 recipients) |

### 10.12 Audit logs _(plugin: `auditLogs`)_

| Method | Path          | Auth                                      | Purpose            |
| ------ | ------------- | ----------------------------------------- | ------------------ |
| GET    | `/audit-logs` | super_admin / tenant_admin / tenant_staff | Security event log |

Filters: `userId`, `action`, `from`/`to` (ISO-8601) + pagination. `action` enum:
`LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `LOGOUT_ALL`, `PASSWORD_SET`,
`PASSWORD_CHANGED`, `PASSWORD_RESET`, `ROLE_CHANGED`, `SUSPICIOUS`. Entries
auto-expire after the server's retention window (`AUDIT_LOG_RETENTION_DAYS`).

### 10.13 Tenants & platform admin _(super_admin)_

| Method | Path                                            | Auth          | Purpose                                       |
| ------ | ----------------------------------------------- | ------------- | --------------------------------------------- |
| GET    | `/admin/tenants`                                | Super         | List tenants                                  |
| POST   | `/admin/tenants`                                | Super         | Create tenant                                 |
| GET    | `/admin/tenants/:tenantId`                      | Super         | Get tenant                                    |
| GET    | `/admin/tenants/:tenantId/effective`            | Super         | Effective (resolved) config                   |
| PATCH  | `/admin/tenants/:tenantId`                      | Super         | Update tenant                                 |
| DELETE | `/admin/tenants/:tenantId`                      | Super         | Soft-delete (deactivate)                      |
| GET    | `/admin/tenants/:tenantId/plugins`              | Super         | Per-plugin status                             |
| PATCH  | `/admin/tenants/:tenantId/plugins/:key/enable`  | Super         | Enable a plugin                               |
| PATCH  | `/admin/tenants/:tenantId/plugins/:key/disable` | Super         | Disable a plugin                              |
| PATCH  | `/admin/tenants/:tenantId/flags/:plugin`        | Super         | Update flags `{ flags: { <flag>: boolean } }` |
| POST   | `/admin/tenants/:tenantId/provision-admin`      | Super         | Provision first tenant admin                  |
| GET    | `/admin/plugins`                                | Super         | Deployment plugin registry                    |
| GET    | `/admin/api-registry`                           | Admin\*       | All endpoints + `apiKey`                      |
| POST   | `/admin/sms/test`                               | Super/Admin\* | Send a test SMS (query overrides)             |

Create-tenant body: `tenantId` (lowercase slug `^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$`),
`name`, `contactEmail`, `plan` (`starter`/`growth`/`enterprise`), optional
`subscriptionStatus` (`active`/`trial`/`past_due`/`canceled`/`suspended`),
`enabledPlugins[]`, `featureFlags`, `isActive`. Update uses the same fields minus
`tenantId`.

### 10.14 Permissions (policy engine) _(see §8.3)_

| Method | Path                   | Auth    | Purpose                                                                 |
| ------ | ---------------------- | ------- | ----------------------------------------------------------------------- |
| GET    | `/permissions/catalog` | Admin\* | Form metadata: grantable apiKeys (grouped) + effects + targetable roles |
| GET    | `/permissions`         | Admin\* | List override rules                                                     |
| POST   | `/permissions`         | Admin\* | **Create or update** a role's rules — upsert many apiKeys in one call   |
| PATCH  | `/permissions/:id`     | Admin\* | Update a single rule's effect                                           |
| DELETE | `/permissions/:id`     | Admin\* | Delete a rule                                                           |

**Setting a role's permissions** — the single `POST /permissions` (no separate
bulk/single endpoints):

```jsonc
{
  "role": "inventory-manager",
  "effect": "allow",
  "apiKeys": ["products:create", "products:update", "inventory:adjust"],
  "tenantId": null, // tenantId: super_admin only; tenant_admins are forced to their own
  "replace": false,
} // true = wipe the role's current rules first (full overwrite)
```

Each apiKey is **upserted** — created if missing, effect refreshed if it already
exists (no duplicate error). With **`replace: true`** the role's existing rules in
that scope are deleted first, so the role ends up with **exactly** the apiKeys you
send — ideal for a "save the whole permissions form" action. With `replace`
omitted/false it's additive. The whole batch is rejected if any apiKey is unknown
or beyond the caller's authority — nothing is written. Returns
`{ role, effect, count, apiKeys, replaced }`.

`GET /permissions/catalog` returns:

```jsonc
{
  "effects": ["allow", "deny"],
  "roles": ["tenant_staff"], // roles this caller may target
  "scope": "tenant", // "platform" for super_admin, else "tenant"
  "groups": [
    {
      "module": "Products",
      "items": [
        {
          "apiKey": "products:create",
          "method": "POST",
          "path": "/products",
          "description": "Create product",
          "action": "create",
          "requiredRoles": ["tenant_admin", "tenant_staff"],
          "grantable": true,
        },
      ],
    },
  ],
}
```

Collect the selected `groups[].items[].apiKey` values into the `apiKeys` array,
use `effects` for the effect select, and `roles` for the role select, then send
them all in one `POST /permissions` call (body below). The Swagger/Scalar
reference also lists every valid key as an enum on the `SetPermissionsDto.apiKeys[]`
items.

> ⚠️ `GET /permissions` lists only **explicit override rules**, not effective
> permissions — so it is **empty by default** and that is correct. Role defaults
> (super=all, tenant\*admin=all-in-tenant, staff=deny) are computed in code, not
> stored. You POST rows here to **override** those defaults: `allow` rules to
> grant a `tenant_staff`/custom role sections/actions, or (super*admin) `deny`
> rules to restrict a `tenant_admin`. Body:
> `{ tenantId?, role, apiKeys: string[], effect: 'allow'|'deny', replace? }` —
> `apiKey` values come from `GET /permissions/catalog` (or `GET /admin/api-registry`).
> To see a user's \_effective* access, use `GET /auth/permissions` (§5.7).

### 10.15 Custom roles — `/roles`

Beyond the four built-in roles, a `tenant_admin` (or `super_admin`) can define
**custom roles** — named permission profiles. A custom role **inherits a built-in
`baseRole`** (`tenant_staff` or `tenant_admin`) for coarse route eligibility, but
starts with **no access**; you grant capabilities to it exactly like any role via
`/permissions` (§10.14). Assign a custom role to a user with `PATCH /users/:id`
`{ role: "<name>" }`.

| Method | Path         | Auth    | Purpose                                          |
| ------ | ------------ | ------- | ------------------------------------------------ |
| GET    | `/roles`     | Admin\* | List custom roles in scope                       |
| POST   | `/roles`     | Admin\* | Create a custom role                             |
| PATCH  | `/roles/:id` | Admin\* | Update (label / baseRole / description / active) |
| DELETE | `/roles/:id` | Admin\* | Delete (holders fall back to no access)          |

Create body: `{ name (slug), label, baseRole: 'tenant_staff'|'tenant_admin', description?, isActive?, tenantId? }`.
Rules enforced server-side:

- `baseRole` must be **strictly below the creator** — a `tenant_admin` can only
  create `tenant_staff`-based roles; a `super_admin` can create either, and may
  create platform-wide roles (`tenantId: null`).
- `name` is a lowercase slug, unique per tenant; it becomes the user's `role`
  value and the `permissions` rule key.
- Custom roles are **default-deny** regardless of baseRole — they only reach what
  you explicitly grant.

**Typical "create a role" flow in the UI:**

1. `POST /roles { name, label, baseRole }` to create the role.
2. Use `GET /permissions/catalog` (now lists the new role under `roles`) +
   `POST /permissions { role: name, effect: 'allow', apiKeys: [...] }` to grant it a whole
   set of sections/actions in one call (add `replace: true` to overwrite its existing set).
3. `PATCH /users/:id { role: name }` to assign it to users. They pick up the
   access on their next request / token refresh.

> A custom role appears in the §5.7 permission map for its holders just like a
> built-in role, so the menu/control gating logic is identical — no special-casing
> in the frontend.

---

## 11. Suggested panel structure

This is the **route map** for the panel. In the first pass, create these routes as
**minimal placeholders** (and **delete the starter's sample/demo routes** that
aren't in this list — don't leave them in the nav). The descriptions after each
route are the _eventual_ scope, built later per-feature — not now (see §0.1).

```
/login                      → POST /auth/admin/login (identifier + password; or send `code` for OTP login)
/accept-invite              → set-password from provision code (identifier + code + newPassword)
/                           → Dashboard (analytics)
/orders, /orders/:id        → list + detail + status transitions + refund
/products, /products/:id    → admin list (drafts incl.) + editor (localized, variants)
/categories                 → tree + editor
/inventory                  → stock + low-stock alerts + adjust
/customers (users)          → hierarchy-scoped list + edit + activate
/coupons                    → CRUD                        (if coupons enabled)
/reviews                    → moderation queue            (if reviews enabled)
/marketing/banners          → CRUD                        (if marketing enabled)
/marketing/newsletter       → subscribers + sms broadcast (if marketing enabled)
/loyalty                    → accounts + adjust           (if loyaltyPoints enabled)
/notifications              → send email/sms/push + bulk  (if notifications enabled)
/audit-logs                 → security log                (if auditLogs enabled)
/settings/permissions       → policy rules + api-registry
/admin/tenants              → tenant CRUD + plugin/flag toggles + provision  (super_admin only)
/settings/profile           → me, change/set password, enable/confirm/disable 2FA, language
```

Render nav conditionally: primarily by the **§5.7 permission map**
(`sections[key].canAccess`), and additionally by **enabled plugins** for the
active tenant (§9).

---

## 12. Gotchas & rules (read before you ship)

1. **Admin-only app:** log in via `POST /auth/admin/login` — send `password` and/or
   `code` (NOT the storefront `/auth/login`). Expect `403 auth.not_admin` for end users.
2. **Gate the UI from the §5.7 permission map** (`data.permissions` /
   `GET /auth/permissions`): hide/disable menu items by `sections[key].canAccess`
   and buttons by `sections[key].actions`. Refetch after permission changes.
3. **Never send unknown body fields** — `forbidNonWhitelisted` rejects them (400).
   Send exactly what the DTO defines.
4. **Unwrap `data`** from every response; read `meta` for pagination.
5. **Access token in memory only**; refresh via the cookie; always
   `credentials:'include'` on auth + refresh + logout.
6. **`id`, not `_id`** on the auth user view (other resources may expose `_id` —
   check the spec).
7. **Localized content** is `{ en, fa? }` — build dual-language inputs.
8. **RTL** for Farsi across the whole UI.
9. **Role-gate** nav and actions; in role selectors only offer roles strictly
   below the operator. Expect `404` for out-of-scope users and `403`
   (`users.role_escalation_forbidden`) on escalation attempts.
10. **Plugin 403 / boot 404** — features can be off per tenant or per deployment;
    degrade gracefully.
11. **Error UX:** show `message` (already localized); map `errors[].field` to form
    fields. i18n keys like `auth.invalid_credentials` may surface as the message —
    prefer the localized text the server returns.
12. **Money & dates:** amounts are numbers in the store's currency (no implicit
    minor-unit assumptions — confirm per field); date filters are ISO strings.
13. **Generate a typed client** from `{baseUrl}/api/v1/docs-json` and regenerate
    whenever the backend changes — it's the safest way to stay in sync with DTOs.
14. **Health check** for connectivity: `GET /api/v1/health/liveness` (always 200
    when up).

---

## 13. First-pass checklist — integration base ONLY (see §0.1)

This is the **only** thing to build now. It's the plumbing + a skeleton per
section, not finished features. Stop when this works; the user drives the rest.

- [ ] **Explore the existing admin-panel project first (§0)** — layout, config, API layer, auth, i18n/RTL, navbar/routing, component library, what's already built. Adopt its conventions.
- [ ] **Remove the starter's sample/demo pages** (mock dashboards, placeholder screens, demo routes + their menu items). Keep only routes that map to this backend (§10/§11).
- [ ] Generate or locate the typed API client from the OpenAPI JSON (reuse the existing one if present).
- [ ] HTTP layer: response-envelope unwrap + global error handling (`message` + `errors[]`); pagination helper.
- [ ] Auth: `POST /auth/admin/login` (password and/or OTP), refresh interceptor, logout, `GET /auth/me`; handle `403 auth.not_admin` and `401 auth.account_inactive`.
- [ ] Capture `data.permissions` on login (and `GET /auth/permissions`); build a small permission store the UI reads from.
- [ ] App shell: nav gated by the permission map (§5.7) + plugin status; tenant switcher (super_admin); language toggle + RTL.
- [ ] Register a **route + minimal placeholder page** for each relevant section (§11) that simply calls its primary endpoint and renders the raw result — no rich UI yet.
- [ ] Login screen + an accept-invite/set-password screen (so admins can actually get in).

**Later — one feature at a time, when the user asks (NOT now):** full Products
CRUD (localized fields, variants, status, inventory), Orders detail + transitions,
Users management, Coupons/Reviews/Marketing/Loyalty/etc. screens, the
permissions-management UI, and Super-admin tenants CRUD + plugin/flag toggles.
Each is its own focused pass.
