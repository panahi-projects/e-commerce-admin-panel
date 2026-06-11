# Environment Variables & Secrets in Next.js

## Table of Contents
1. [The Core Rule](#1-the-core-rule)
2. [What's Safe vs Unsafe to Expose](#2-whats-safe-vs-unsafe-to-expose)
3. [Auditing Your .env Files](#3-auditing-your-env-files)
4. [Server/Client Boundary Patterns](#4-serverclient-boundary-patterns)
5. [Vercel / Hosting Environment Scoping](#5-vercel--hosting-environment-scoping)

---

## 1. The Core Rule

> Any environment variable prefixed `NEXT_PUBLIC_` is **inlined into the JavaScript bundle
> at build time** and shipped to every visitor's browser. It is as public as if you wrote
> it directly in your HTML.

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com     # ✅ fine — just a URL
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # ✅ fine — designed to be public
NEXT_PUBLIC_JWT_SECRET=supersecret               # ❌ CRITICAL — anyone can forge tokens
NEXT_PUBLIC_DB_PASSWORD=...                      # ❌ CRITICAL — full DB compromise
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_...        # ❌ CRITICAL — full payment account compromise
```

**Variables WITHOUT the `NEXT_PUBLIC_` prefix are only available in:**
- Server Components
- Route Handlers (`app/api/**/route.ts`)
- Server Actions (`'use server'`)
- `getServerSideProps`, `getStaticProps` (Pages Router)
- `middleware.ts`

They are **never** sent to the browser — but only if you don't manually pass their values
into a Client Component as a prop or render them into the page.

---

## 2. What's Safe vs Unsafe to Expose

| Variable Type | Safe with NEXT_PUBLIC_? | Notes |
|---|---|---|
| Public API base URL | ✅ Yes | |
| Stripe **publishable** key (`pk_*`) | ✅ Yes | Designed for client use |
| Google Analytics / PostHog ID | ✅ Yes | |
| Sentry DSN (client) | ✅ Yes | Public by design |
| Stripe **secret** key (`sk_*`) | ❌ NEVER | |
| JWT signing secret | ❌ NEVER | |
| Database connection string | ❌ NEVER | |
| Internal service URLs (`http://backend:3000`) | ❌ NEVER | Reveals infra |
| Third-party API secret keys | ❌ NEVER | |
| Admin/internal feature flags | ⚠️ Avoid | Reveals unreleased features |
| OAuth client secret | ❌ NEVER | Only `client_id` can be public |

---

## 3. Auditing Your .env Files

```bash
# List every NEXT_PUBLIC_ variable across all env files
grep -h "^NEXT_PUBLIC_" .env* 2>/dev/null

# Cross-check: search source for where each is used
grep -rn "NEXT_PUBLIC_YOUR_VAR_NAME" --include="*.ts" --include="*.tsx" .

# Verify the build output doesn't contain non-public secrets
npm run build
grep -r "JWT_SECRET\|DB_PASSWORD\|sk_live" .next/static/ 2>/dev/null
# ^ this should return NOTHING
```

---

## 4. Server/Client Boundary Patterns

### ❌ Insecure — leaking a server secret to the client

```typescript
// app/page.tsx (Server Component)
export default async function Page() {
  const apiKey = process.env.INTERNAL_API_KEY; // server-only var

  return <ClientWidget apiKey={apiKey} />; // ❌ now it's in the client bundle/HTML!
}
```

### ✅ Secure — fetch happens server-side, only the result is passed

```typescript
// app/page.tsx (Server Component)
export default async function Page() {
  const data = await fetch('https://internal-api.example.com/data', {
    headers: { Authorization: `Bearer ${process.env.INTERNAL_API_KEY}` },
  }).then(r => r.json());

  return <ClientWidget data={data} />; // ✅ only the data, never the key
}
```

### ✅ Secure — Route Handler as a proxy

```typescript
// app/api/proxy/route.ts
export async function GET() {
  const res = await fetch('https://internal-api.example.com/data', {
    headers: { Authorization: `Bearer ${process.env.INTERNAL_API_KEY}` },
  });
  const data = await res.json();
  return Response.json(data); // client calls /api/proxy, never sees the key
}
```

---

## 5. Vercel / Hosting Environment Scoping

If deploying to Vercel (or similar), environment variables can be scoped per environment:

| Scope | Use for |
|---|---|
| Production | Live secrets, production DB URLs |
| Preview | Staging/test secrets — NEVER production secrets |
| Development | Local-only values |

**Common mistake:** setting a production database URL as available in "Preview" — anyone
who can open a PR (or in some setups, anyone who can see the PR's deploy preview URL) can
then potentially access production data through that preview deployment.

```bash
# Check what's exposed in a deployed build (run against your live site)
curl -s https://yourapp.com/_next/static/chunks/main-*.js | grep -o "NEXT_PUBLIC_[A-Z_]*"
```
