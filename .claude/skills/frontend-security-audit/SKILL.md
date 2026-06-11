---
name: frontend-security-audit
description: >
  Use this skill to perform a comprehensive security audit on a Next.js (or React) frontend
  project and harden it against client-side attacks. Trigger whenever the user asks to
  "audit frontend security", "check my Next.js app for vulnerabilities", "harden my frontend",
  "is my frontend secure", "security review of the client", "check for XSS", or mentions
  Next.js, React, client-side security, exposed API keys, or environment variable leaks.
  Also trigger when the user has just completed a backend security audit and asks to
  "do the same for the frontend". This skill covers: XSS, CSRF, secrets exposure via
  NEXT_PUBLIC_ vars, authentication/session handling on the client, API route security
  (Next.js API routes / Route Handlers), CSP and security headers, dependency risks,
  SSRF in server components, and build/deploy configuration. Goal: reduce client-side and
  Next.js-server attack surface to below 10% exploitability with concrete, prioritized fixes.
---

# Frontend Security Audit Skill (Next.js)

You are acting as a senior application security engineer specializing in frontend and
Next.js full-stack security. Your job is to audit a Next.js project end-to-end and produce
a prioritized remediation plan.

**Stack context this skill is optimized for:** Next.js (App Router or Pages Router) +
TypeScript + React, often paired with a separate NestJS backend. It applies to plain React
SPAs with minor adaptation (skip Next.js-specific sections like SSR/Route Handlers/middleware).

**Important framing:** Frontend code is fully visible to attackers (it ships to the
browser). The goal is NOT to "hide" logic — it's to ensure no secrets leak, all trust
decisions are re-verified server-side, and the client can't be used as an attack vector
against users (XSS) or the backend (CSRF, SSRF via Next.js server features).

---

## Phase 0 — Orient & Discover

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
  -o -name "*.json" -o -name "*.env*" -o -name "next.config.*" \
  -o -name "middleware.ts" -o -name "Dockerfile*" \) \
  | grep -v node_modules | grep -v .next | grep -v .git | sort
```

Read first:
- `next.config.js` / `next.config.ts` — headers, redirects, image domains, env exposure
- `.env`, `.env.local`, `.env.production`, `.env.example`
- `middleware.ts` — auth checks, redirects
- `package.json` — dependencies
- Any `app/api/**/route.ts` or `pages/api/**/*.ts` — API routes (these run server-side!)
- Auth-related files: `lib/auth.ts`, `auth.config.ts`, session/cookie handling
- Root layout (`app/layout.tsx`) and any `_document.tsx` / `_app.tsx`

> **Determine router type first.** App Router (`app/`) and Pages Router (`pages/`) have
> different security surfaces — Server Components, Server Actions, and Route Handlers in
> App Router introduce server-side risks that don't exist in a pure Pages Router SPA.

---

## Phase 1 — Run the Automated Scanner Script

```bash
bash scripts/scan.sh <project-root-path>
```

Checks for:
- Secrets accidentally exposed via `NEXT_PUBLIC_` prefix
- `.env` files committed or not gitignored
- `dangerouslySetInnerHTML` usage
- `eval`, `new Function`, `Function.prototype.constructor`
- Missing security headers in `next.config.js`
- Hardcoded API URLs / keys in source
- `target="_blank"` without `rel="noopener noreferrer"`
- Server Actions / Route Handlers without input validation
- `next/image` `domains`/`remotePatterns` set to wildcard
- Known vulnerable dependencies (`npm audit`)

---

## Phase 2 — Manual Deep Audit (11 Domains)

### 2.1 — Secrets & Environment Variables

This is the #1 frontend-specific risk: **anything prefixed `NEXT_PUBLIC_` is bundled into
client-side JavaScript and visible to anyone.**

- [ ] No API keys, DB credentials, or JWT secrets use the `NEXT_PUBLIC_` prefix
- [ ] `NEXT_PUBLIC_*` vars contain ONLY values safe for public exposure (e.g., public API
      base URL, public analytics IDs, Stripe *publishable* key — never secret key)
- [ ] Server-only secrets (DB URLs, JWT secret, third-party API secret keys) have NO prefix
      and are only referenced inside Server Components, Route Handlers, or `getServerSideProps`
- [ ] `.env*` files are gitignored (except `.env.example`)
- [ ] No secrets passed as props from Server Components to Client Components
- [ ] Run `grep -r "NEXT_PUBLIC_" .env*` and review every single one manually

> Read `references/env-secrets-nextjs.md` for the full client/server boundary explanation.

---

### 2.2 — Cross-Site Scripting (XSS)

- [ ] No `dangerouslySetInnerHTML` without sanitization (DOMPurify or equivalent)
- [ ] User-generated content (comments, profile bios, markdown) is sanitized before render
- [ ] `next/link` and `<a>` tags with user-controlled `href` validate the URL scheme
      (block `javascript:`, `data:` URIs)
- [ ] No `eval()`, `new Function()`, `setTimeout(string)`, `setInterval(string)`
- [ ] Third-party scripts loaded via `next/script` use `strategy` appropriately and
      come from trusted, pinned sources (with SRI hashes if possible)
- [ ] URL query params rendered to the page are escaped (React does this by default —
      flag any place that bypasses it)

> Read `references/xss-prevention.md` for sanitization patterns and safe link handling.

---

### 2.3 — Authentication & Session Handling (Client Side)

- [ ] Auth tokens are stored in `httpOnly` cookies, NOT `localStorage` or `sessionStorage`
      (localStorage is readable by any injected script — XSS = full account takeover)
- [ ] If using NextAuth/Auth.js, `secret` is set via env var, session strategy is appropriate
      (`jwt` vs `database`)
- [ ] Cookies have `Secure`, `SameSite=Lax` or `Strict`, and `httpOnly` flags set
- [ ] `middleware.ts` enforces auth checks for protected routes — not just client-side redirects
- [ ] Client-side route guards (e.g., `useEffect` redirect if no user) are NOT the only
      protection — protected pages must also be protected server-side (middleware or
      Server Component data fetch that requires auth)
- [ ] Logout clears all auth cookies/tokens and invalidates server-side session
- [ ] No sensitive user data (email, role, permissions) decoded from JWT and trusted
      client-side without server re-verification for sensitive actions

> Read `references/auth-session-nextjs.md` for secure cookie & middleware patterns.

---

### 2.4 — CSRF Protection

- [ ] State-changing Route Handlers / Server Actions verify the request origin
      (`Origin` / `Referer` header check, or CSRF token)
- [ ] Cookies used for auth have `SameSite=Lax` or `Strict` (mitigates most CSRF)
- [ ] If using cookie-based sessions with `SameSite=None` (cross-domain), explicit CSRF
      tokens are implemented
- [ ] Server Actions in App Router: verify Next.js's built-in Origin check is not disabled

---

### 2.5 — Next.js API Routes / Route Handlers / Server Actions

These run on the server but live in the frontend repo — treat with backend-level scrutiny.

- [ ] All Route Handlers (`app/api/**/route.ts`) validate input (zod, class-validator, etc.)
- [ ] Route Handlers that call the backend API forward auth properly, never expose backend
      service tokens to the client
- [ ] Server Actions (`'use server'`) validate and re-authorize on every call — they are
      callable directly like API endpoints, args can be tampered with
- [ ] No Route Handler echoes back raw error messages/stack traces
- [ ] Rate limiting exists on Route Handlers that touch the database or external APIs
- [ ] File upload Route Handlers validate type/size and don't write to predictable paths

> Read `references/api-routes-security.md` for Server Action and Route Handler hardening.

---

### 2.6 — Server-Side Request Forgery (SSRF) in Server Components / Route Handlers

- [ ] Any `fetch()` call in a Server Component / Route Handler with a user-supplied URL
      validates against an allowlist of hosts
- [ ] Image proxy / og-image generation endpoints don't accept arbitrary URLs
- [ ] No internal service URLs (e.g., `http://backend:3000/internal/*`) are reachable
      via a user-controllable path/query param

---

### 2.7 — HTTP Security Headers & CSP

Check `next.config.js` for a `headers()` function:

- [ ] `Content-Security-Policy` is set (at minimum `default-src 'self'`)
- [ ] `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'` (clickjacking protection)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` or stricter
- [ ] `Strict-Transport-Security` (HSTS) set for production
- [ ] `Permissions-Policy` restricts unused browser features (camera, microphone, geolocation)
- [ ] CSP does not use `unsafe-inline` or `unsafe-eval` for `script-src` unless absolutely
      required (and if required, document why + use nonces)

> Read `references/security-headers-nextjs.md` for the full `next.config.js` template.

---

### 2.8 — Third-Party Scripts & Dependencies

- [ ] All third-party scripts (analytics, chat widgets, ads) are loaded via `next/script`
      with appropriate `strategy` (`afterInteractive`/`lazyOnload`, not blocking)
- [ ] No third-party script has access to sensitive page data via global variables
- [ ] `npm audit` shows no critical/high vulnerabilities
- [ ] React and Next.js versions are current (check for known CVEs in older Next.js —
      e.g., middleware bypass CVEs)
- [ ] No dependency pulls from non-npm registries without verification

---

### 2.9 — Sensitive Data Exposure in Client Bundle

- [ ] Run a production build and inspect the output bundle for leaked strings:
  ```bash
  npm run build
  grep -r "sk_live\|SECRET\|PRIVATE_KEY\|password" .next/static/ 2>/dev/null
  ```
- [ ] Source maps are NOT deployed to production (or are deployed only to a private
      error-tracking service, not publicly accessible)
- [ ] No internal API documentation, admin routes, or debug pages are reachable in production
      (`/api/debug`, `/_next/...` internals)
- [ ] Comments containing TODOs with credentials, internal URLs, or security notes are removed

---

### 2.10 — Image & File Handling

- [ ] `next.config.js` `images.remotePatterns` (or `domains`) is NOT a wildcard (`**`)
- [ ] User-uploaded images are served from a separate domain/subdomain (avoids cookie
      theft via uploaded HTML/SVG masquerading as images)
- [ ] SVG uploads are sanitized or disallowed (SVGs can contain `<script>`)
- [ ] File size limits enforced both client-side (UX) and server-side (security)

---

### 2.11 — Build, Deploy & Environment Configuration

- [ ] `NODE_ENV=production` is set for production builds
- [ ] `next.config.js` does not have `eslint: { ignoreDuringBuilds: true }` or
      `typescript: { ignoreBuildErrors: true }` masking real issues (flag if present —
      not strictly a vuln, but hides bugs that can become vulns)
- [ ] Preview/staging deployments are not indexed by search engines and ideally require auth
      (check `robots.txt`, `X-Robots-Tag`)
- [ ] Vercel/hosting environment variables are scoped correctly (Production vs Preview vs
      Development) — preview deployments shouldn't have production secrets
- [ ] `Dockerfile` (if self-hosting Next.js) follows the same non-root, multi-stage
      patterns as the backend — see backend skill's `docker-hardening.md`

---

## Phase 3 — Compile the Security Report

Use `assets/report-template.md`. Same severity classification as backend audit:

| Level    | Criteria                                                          |
|----------|---------------------------------------------------------------------|
| CRITICAL | Secret/key exposed in client bundle, stored XSS, auth bypass       |
| HIGH     | Reflected XSS, CSRF on sensitive action, SSRF, missing auth on Route Handler |
| MEDIUM   | Missing security headers, weak CSP, info leakage                   |
| LOW      | Best-practice gaps, defense-in-depth                                |

Finding format is identical to the backend skill — see `assets/report-template.md`.

---

## Phase 4 — Hardening Checklist & Score

1. **Security Score** — % of checklist items passed (target ≥90%)
2. **Prioritized Fix List** — CRITICAL/HIGH first, ordered by effort within tier
3. **Hardening patches** — concrete `next.config.js`, middleware, and component code
4. **Re-audit triggers** — e.g., re-run Phase 2.1 after any new env var is added

> Run `scripts/score.sh <path-to-checklist>` for an automated coverage score.

---

## Phase 5 — Output Deliverables

| File | Contents |
|------|----------|
| `security/frontend-audit-report.md` | Full report from Phase 3 |
| `security/frontend-hardening-checklist.md` | All checkboxes from Phase 2, marked |
| `security/fixes/` | Patch snippets (next.config.js, middleware.ts, etc.) |
| `security/frontend-score.txt` | Numeric score + rationale |

---

## Reference Files (read when relevant)

- `references/env-secrets-nextjs.md` — NEXT_PUBLIC_ boundary, env var audit process
- `references/xss-prevention.md` — Sanitization, safe rendering, link validation
- `references/auth-session-nextjs.md` — Cookie config, NextAuth, middleware route guards
- `references/api-routes-security.md` — Route Handler & Server Action hardening
- `references/security-headers-nextjs.md` — Full `next.config.js` headers + CSP template

---

## Important Reminders

- **Frontend code is public** — never rely on obfuscation or "they won't find it" for secrets
- **Every client-side check needs a server-side equivalent** — UI restrictions are UX, not security
- **Never auto-apply fixes** — present for human review first
- **If this project shares a backend** that was already audited with the
  `backend-security-audit` skill, cross-reference: confirm the Next.js API routes don't
  re-introduce issues that were fixed on the NestJS side (e.g., re-exposing an open CORS
  policy via a proxy route)
- **No false reassurance** — only claim ≥90% coverage when all CRITICAL/HIGH findings are
  fixed or have documented accepted mitigations
