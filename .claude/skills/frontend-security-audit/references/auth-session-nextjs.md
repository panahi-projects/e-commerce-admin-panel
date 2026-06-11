# Authentication & Session Handling Reference (Next.js)

## Table of Contents
1. [Token Storage: Cookies vs localStorage](#1-token-storage-cookies-vs-localstorage)
2. [Secure Cookie Configuration](#2-secure-cookie-configuration)
3. [Middleware Route Protection](#3-middleware-route-protection)
4. [NextAuth / Auth.js Configuration](#4-nextauth--authjs-configuration)
5. [Server-Side Re-Verification](#5-server-side-re-verification)

---

## 1. Token Storage: Cookies vs localStorage

| Storage | Readable by JS (XSS risk)? | Sent automatically? | CSRF risk? |
|---|---|---|---|
| `localStorage` | ✅ Yes — full token theft via XSS | ❌ No | Low (but XSS risk is worse) |
| `sessionStorage` | ✅ Yes | ❌ No | Low |
| `httpOnly` cookie | ❌ No — JS cannot read it | ✅ Yes | Needs CSRF protection |

**Recommendation:** Use `httpOnly`, `Secure`, `SameSite=Lax` cookies for auth tokens.
A successful XSS still can't steal the token directly, and `SameSite=Lax` mitigates most CSRF.

### ❌ Insecure pattern
```typescript
// Storing JWT in localStorage after login
localStorage.setItem('accessToken', token);

// Sending it manually on every request
fetch('/api/data', {
  headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
});
```
Any XSS vulnerability anywhere in the app = instant token theft = full account takeover.

### ✅ Secure pattern
```typescript
// app/api/login/route.ts — set httpOnly cookie server-side
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { accessToken, refreshToken } = await authenticateUser(req);

  const cookieStore = cookies();
  cookieStore.set('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 15, // 15 minutes
  });
  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/refresh', // restrict scope
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return Response.json({ success: true });
}
```

---

## 2. Secure Cookie Configuration

```typescript
{
  httpOnly: true,    // ✅ JS cannot read this cookie — mitigates XSS token theft
  secure: true,      // ✅ only sent over HTTPS (set true in production)
  sameSite: 'lax',   // ✅ mitigates CSRF for top-level navigations
  path: '/',         // scope appropriately — narrower for sensitive cookies
  maxAge: 900,       // short expiry for access tokens
}
```

**`sameSite` options:**
- `'strict'` — cookie never sent cross-site (most secure, but breaks links from emails
  that should auto-login)
- `'lax'` — cookie sent on top-level navigation (good default for auth cookies)
- `'none'` — cookie sent cross-site; **requires `secure: true`** and explicit CSRF tokens

---

## 3. Middleware Route Protection

Client-side redirects (`useEffect` checking auth and redirecting) can be bypassed —
the protected page's HTML/data may already have been fetched before the redirect fires,
or an attacker can call the API directly. **Always enforce auth in middleware too.**

### ✅ Secure middleware.ts

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/account', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('accessToken')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Optionally verify token signature/expiry here (not just presence)
  // For full verification, call a lightweight check or use jose library

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*', '/admin/:path*'],
};
```

### Verifying JWT in middleware (Edge runtime compatible)

```typescript
import { jwtVerify } from 'jose';

async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}
```

> Note: `process.env.JWT_SECRET` (no `NEXT_PUBLIC_` prefix) is available in middleware
> because middleware runs on the server/edge, not in the browser.

---

## 4. NextAuth / Auth.js Configuration

```typescript
// auth.config.ts
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET, // ✅ from env, generate with `npx auth secret`
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24, // 24 hours
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = request.nextUrl.pathname.startsWith('/dashboard');
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    // ✅ Don't trust client-supplied role — derive from DB on each session callback
    async session({ session, token }) {
      session.user.role = token.role; // role set server-side in jwt callback
      return session;
    },
  },
};
```

---

## 5. Server-Side Re-Verification

Never trust client-decoded JWT claims for sensitive actions — always re-check on the server.

### ❌ Insecure
```tsx
'use client';
function AdminPanel() {
  const { user } = useAuth(); // role decoded from JWT client-side
  if (user.role !== 'admin') return <div>Access denied</div>;
  return <DangerousAdminActions />; // UI hidden, but...
}
```
The Server Action / API route behind `DangerousAdminActions` might not check role itself —
an attacker can call it directly via devtools/curl, bypassing the UI entirely.

### ✅ Secure
```typescript
// app/admin/actions.ts
'use server';
import { auth } from '@/auth';

export async function deleteUser(userId: string) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    throw new Error('Forbidden'); // ✅ re-checked server-side, every call
  }
  // proceed with deletion
}
```

The UI check is for UX (don't show buttons users can't use). The Server Action check is
the actual security boundary.
