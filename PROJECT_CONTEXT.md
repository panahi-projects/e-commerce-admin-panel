# Project Context — E-Commerce Admin Panel

> Auto-generated onboarding map for Claude. Human edits welcome — they're preserved on refresh.
> Basis: npm · key deps: next@16, react@19, @tanstack/react-query@5, axios@1, tailwindcss@4 · TypeScript 5.9 · generated 2026-06-11 · commit 16350b3 (branch `develop`)

## What this is
A back-office **admin panel** (SPA, Next.js App Router) for a **multi-tenant, white-label e-commerce backend** (NestJS 11 + MongoDB + Redis REST API). Operated by three roles: `super_admin` (platform owner, cross-tenant), `tenant_admin` (full admin of one tenant), and `tenant_staff` (operational subset). The UI must be **role/permission-aware**, **tenant-aware**, and **bilingual (en/fa) with RTL**. Built on the TailAdmin Next.js template, now being trimmed and wired to this specific backend.

**Project phase:** integration foundation only — plumbing (auth, API client, permission gating, tenant header, i18n, routing) is in place; each feature screen is a **minimal placeholder** to be fleshed out one at a time later. See [.claude/init-prompt-frontend-admin-panel.md](.claude/init-prompt-frontend-admin-panel.md) — the authoritative backend integration spec (the `§N` references throughout the code point to its sections).

## Stack
- **Language / framework:** TypeScript · Next.js 16 (App Router) · React 19
- **Package manager / build:** npm · Next build (Turbopack + webpack both configured for SVGR)
- **Key libraries:** `@tanstack/react-query` (server state) · `axios` (HTTP) · Tailwind CSS v4 (styling, CSS-first `@theme`) · ApexCharts + FullCalendar + jVectorMap (dashboard widgets) · react-dnd, react-dropzone, swiper, flatpickr (UI bits)
- **No dedicated form lib or test framework is installed** — forms are hand-rolled; there are no tests yet.

## Architecture & structure
- **Shape:** single Next.js app. This repo is the `admin-dashboard` under a larger `e-commerce/front-end/` tree; the backend lives elsewhere (port 3000 locally).
- **Rendering model:** almost entirely **client components** (`"use client"`). Providers and gating run in the browser; auth state is in-memory. App Router is used for routing/layouts, not RSC data-fetching.
- **Provider stack** (root [src/app/layout.tsx](src/app/layout.tsx), outer→inner): `QueryProvider` → `I18nProvider` → `AuthProvider` → `TenantProvider` → `ThemeProvider` → `SidebarProvider`. Order matters — Tenant depends on Auth, both depend on the API session.
- **Key directories:**
  - `src/app/` — App Router routes. Two route groups: `(admin)` (the gated shell + all feature pages) and `(full-width-pages)` (auth: `/login`, `/accept-invite`; error pages).
  - `src/lib/` — the **integration core**: `api/` (axios client, envelope helpers, session token store, error normalization), `auth/` (AuthProvider, refresh interceptor, service), `permissions/` (`usePermissions`, `<Can>`), `tenant/`, `i18n/`, `navigation/` (the section registry), `plugins/`.
  - `src/layout/` — app shell chrome: `AppHeader`, `AppSidebar`, `Backdrop`.
  - `src/components/` — feature & UI components. `components/ui/` holds primitives (button, modal, table, badge, alert, avatar, dropdown). `components/auth/RequireAuth` is the route guard. `components/common/` has page scaffolding (`PageHeading`, `PageBreadCrumb`, `ComponentCard`).
  - `src/context/`, `src/providers/`, `src/hooks/`, `src/icons/` (SVGs imported as React components via SVGR).
- **Path alias:** `@/*` → `src/*`.

## Front-end specifics
- **Routing:** file-based App Router. The `(admin)` group's [layout.tsx](src/app/(admin)/layout.tsx) wraps everything in `<RequireAuth>` + sidebar/header. Feature routes mirror [§11 of the spec](.claude/init-prompt-frontend-admin-panel.md).
- **Navigation is registry-driven:** [src/lib/navigation/sections.ts](src/lib/navigation/sections.ts) `SECTIONS[]` is the **single source of truth** for the sidebar and which routes exist. Each `SectionDef` carries `permissionKey` (gate via permission map), optional `pluginKey` (hidden when plugin disabled for tenant), `superOnly`, `alwaysShow`, group, and i18n `labelKey`. **Add new screens here**, don't hand-wire nav.
- **Server state:** React Query. **Auth/session state:** in-memory only via `src/lib/api/session.ts` (access token, tenant id, lang) — never localStorage for the token.
- **Data/API layer:** shared axios instance in [src/lib/api/client.ts](src/lib/api/client.ts) with `withCredentials: true` (httpOnly refresh cookie). A request interceptor injects `Authorization: Bearer`, `X-Tenant-ID`, and `x-lang`. Use the envelope-aware helpers — `apiData<T>` (single resource), `apiList<T>` (paginated `{ items, meta }`), `apiRaw<T>` — **not** `api` directly; they unwrap the `{ success, data, meta }` envelope and normalize errors to `ApiException`.
- **Auth flow:** [src/lib/auth/AuthProvider.tsx](src/lib/auth/AuthProvider.tsx). Login via `POST /auth/admin/login` (password and/or OTP `code`) which returns `{ user, accessToken, permissions }`. Silent bootstrap on load tries `POST /auth/refresh` then hydrates `me` + permissions. A 401→refresh→retry interceptor ([refreshInterceptor.ts](src/lib/auth/refreshInterceptor.ts)) is installed here (kept out of `client.ts` to avoid a circular dep). Deactivated accounts surface an `'inactive'` notice instead of retrying.
- **Permissions:** [usePermissions.ts](src/lib/permissions/usePermissions.ts) reads the **§5.7 permission map** from auth. `canAccess(key)` gates menus; `can(key, action)` gates create/update/delete buttons; `hasApiKey(key, apiKey)` for fine-grained gating. `super_admin` passes everything. **UX only — the server re-checks every request; never treat as security.** `<Can>` ([permissions/Can.tsx](src/lib/permissions/Can.tsx)) is the declarative wrapper.
- **Multi-tenancy:** [TenantProvider.tsx](src/lib/tenant/TenantProvider.tsx). `super_admin` can switch tenants (sets `X-Tenant-ID`, persisted to `localStorage` key `admin.activeTenant`, invalidates React Query cache on change); tenant operators are pinned by their JWT.
- **i18n / RTL:** custom lightweight i18n in [src/lib/i18n/](src/lib/i18n/) — `useI18n()` gives `t(key)`, `locale`, `dir`, `setLocale`. Locales `en`/`fa`, default `en`, persisted to `admin.locale`. Setting locale also sets `<html dir>` and the `x-lang` request header. UI strings live in `translations.ts` (typed `TranslationKey`). Backend **content** fields are localized objects `{ en, fa? }` — forms must offer both languages.
- **Styling & design system:** Tailwind v4 with a CSS-first `@theme` block in [src/app/globals.css](src/app/globals.css) defining custom tokens — brand color scale (`brand-25`…`brand-950`), `text-title-*`/`text-theme-*` typography, custom breakpoints. **Use these tokens, not raw hex/px.** Dark mode via `.dark` class (`@custom-variant dark`). Font: Outfit (next/font). Use `tailwind-merge` for conditional classes. Prefer RTL-safe logical properties (`ms`/`me`) over `ml`/`mr`.

## Conventions
- **Naming & files:** PascalCase component files (`AppSidebar.tsx`), camelCase for services/hooks/utils. Feature logic grouped under `src/lib/<domain>/` with a barrel `index.ts`, a `service.ts` (endpoint calls), `types.ts`, and a `*Provider.tsx` / `use*.ts`.
- **Imports:** use the `@/` alias; domains expose barrels (`@/lib/auth`, `@/lib/api`, `@/lib/i18n`).
- **Spec cross-references:** code comments cite `§N` — these map to [.claude/init-prompt-frontend-admin-panel.md](.claude/init-prompt-frontend-admin-panel.md). Read that section before changing related behavior.
- **Tests / lint:** no test setup. Lint via `eslint .` (`eslint-config-next`, flat config in [eslint.config.mjs](eslint.config.mjs)). A few intentional `react-hooks/set-state-in-effect` disables exist for client-only hydration — preserve them.

## How to run
- Install: `npm install`  ·  Dev: `npm run dev` (→ http://localhost:3001)  ·  Build: `npm run build`  ·  Start: `npm start`  ·  Lint: `npm run lint`
- **Backend** must run separately on `http://localhost:3000` (API base `…/api/v1`). Swagger at `{base}/api/v1/docs`, OpenAPI JSON at `/docs-json`.
- Required env (names only — see [.env.example](.env.example)): `NEXT_PUBLIC_API_BASE_URL` — backend API base URL (defaults to `http://localhost:3000/api/v1`). Your panel origin (`:3001`) must be in the backend's `CORS_ORIGINS`.

## Domain vocabulary
- **Permission map / effective permissions** — `{ role, isSuperAdmin, sections: Record<key, {canAccess, actions, allowedApiKeys}> }` from `GET /auth/permissions`; drives all UI gating.
- **Section key** — stable per-area key (`products`, `orders`, `admin.tenants`, `permissions`, `auditlogs`…) used in both `SECTIONS[].permissionKey` and the permission map.
- **apiKey** — exact per-endpoint permission key (e.g. `products:create`) for fine-grained policy rules.
- **Plugin** — optional backend feature module (`coupons`, `reviews`, `marketing`, `analytics`, `loyaltyPoints`, `notifications`, `auditLogs`, …); gated per-tenant. `super_admin` bypasses the runtime layer.
- **Custom role** — tenant-defined named permission profile inheriting a built-in `baseRole`; appears in the permission map like a built-in, so gating logic needs no special-casing.
- **Envelope** — the uniform `{ success, statusCode, message, data, meta?, timestamp }` response shape; always unwrap `data`.
- **Tenant** — an isolated white-label store; identified by a lowercase slug, targeted via `X-Tenant-ID`.

## Integration points
- **Backend REST API** (NestJS, out of repo) at `…/api/v1` — single source of truth for DTO shapes (cross-check Swagger/OpenAPI). Auth is OTP-first/passwordless; access token in body, refresh token in httpOnly cookie.
- Full endpoint map by feature is in [§10 of the spec](.claude/init-prompt-frontend-admin-panel.md).

## Gotchas & house rules
- **Never send unknown body fields** — backend uses `forbidNonWhitelisted` (400 on extras). Send exactly the DTO fields. Login is `{ identifier, password? , code? }` — *not* `{ email, password }`.
- **`id`, not `_id`** on the auth user; other resources may expose `_id`.
- **Admin-only:** always use `/auth/admin/login` (not storefront `/auth/login`); expect `403 auth.not_admin` for end users.
- **Permission gating is UX, not security** — the server re-checks. Refetch `GET /auth/permissions` after permission changes.
- **Degrade gracefully** on plugin `403` (disabled for tenant) and boot `404` (not deployed).
- **List params:** `page`/`limit`/`sortBy`/`sortOrder` (no `sort=-field`); read `meta.totalPages`.
- Two ESLint disables for `set-state-in-effect` in I18n/Tenant providers are intentional client-only hydration — don't "fix" them.

## Deeper docs
- [.claude/init-prompt-frontend-admin-panel.md](.claude/init-prompt-frontend-admin-panel.md) — authoritative backend integration guide (auth, tenancy, permissions, full endpoint map §10, route map §11, gotchas §12). The `§N` code comments reference it.
