# API Routes / Route Handlers / Server Actions Security Reference

## Table of Contents
1. [Route Handler Input Validation](#1-route-handler-input-validation)
2. [Server Actions Are Public Endpoints](#2-server-actions-are-public-endpoints)
3. [Proxying to Your Backend Safely](#3-proxying-to-your-backend-safely)
4. [Rate Limiting Route Handlers](#4-rate-limiting-route-handlers)
5. [File Upload Handling](#5-file-upload-handling)
6. [Error Responses](#6-error-responses)

---

## 1. Route Handler Input Validation

### ❌ Insecure
```typescript
// app/api/comments/route.ts
export async function POST(req: Request) {
  const body = await req.json();
  await db.comments.insert(body); // whatever shape, straight to DB
  return Response.json({ ok: true });
}
```

### ✅ Secure — validate with zod
```typescript
import { z } from 'zod';

const CommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  const body = await req.json();
  const result = CommentSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.comments.insert({
    ...result.data,
    userId: session.user.id, // ✅ from session, never from client body
  });

  return Response.json({ ok: true });
}
```

---

## 2. Server Actions Are Public Endpoints

`'use server'` functions compile to API endpoints. **Any authenticated or unauthenticated
user can call them directly** with arbitrary arguments via crafted requests, bypassing your
UI entirely.

### ❌ Insecure
```typescript
'use server';

export async function updateUserRole(userId: string, role: string) {
  await db.users.update(userId, { role }); // no auth check, no validation!
}
```
An attacker can call this with `updateUserRole('victim-id', 'admin')` directly.

### ✅ Secure
```typescript
'use server';
import { z } from 'zod';
import { auth } from '@/auth';

const UpdateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['user', 'editor']), // 'admin' deliberately excluded
});

export async function updateUserRole(input: unknown) {
  const session = await auth();

  // ✅ Re-check authorization on every call
  if (session?.user?.role !== 'admin') {
    throw new Error('Forbidden');
  }

  // ✅ Validate input shape and constraints
  const { userId, role } = UpdateRoleSchema.parse(input);

  // ✅ Prevent self-demotion of last admin, etc. — business logic checks
  await db.users.update(userId, { role });
}
```

**Checklist for every Server Action:**
- [ ] Re-fetches the session/auth state — never trusts a passed-in "current user" object
- [ ] Validates all arguments with a schema
- [ ] Re-checks authorization for the specific operation (not just "is logged in")
- [ ] Has the same rate-limiting consideration as a public API endpoint

---

## 3. Proxying to Your Backend Safely

When the Next.js app calls your NestJS backend, the Route Handler often needs a service
token or internal credential.

### ❌ Insecure — leaking the backend token
```typescript
// app/api/orders/route.ts
export async function GET(req: Request) {
  const res = await fetch('http://backend:3000/orders', {
    headers: { Authorization: `Bearer ${process.env.BACKEND_SERVICE_TOKEN}` },
  });
  const data = await res.json();
  return Response.json(data); // fine — token stays server-side
}

// ❌ But this is wrong:
export async function GET2(req: Request) {
  return Response.json({ token: process.env.BACKEND_SERVICE_TOKEN }); // NEVER do this
}
```

### ✅ Secure pattern — forward user identity, not a shared service token
```typescript
// app/api/orders/route.ts
import { cookies } from 'next/headers';

export async function GET() {
  const userToken = cookies().get('accessToken')?.value;
  if (!userToken) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${process.env.BACKEND_URL}/orders`, {
    headers: { Authorization: `Bearer ${userToken}` }, // user's own token
  });

  if (!res.ok) {
    return Response.json({ error: 'Failed to fetch orders' }, { status: res.status });
  }

  return Response.json(await res.json());
}
```

This way, the backend's existing per-user authorization (which you hardened in the
backend audit) is preserved — the Next.js layer doesn't become a privilege-escalation
shortcut.

---

## 4. Rate Limiting Route Handlers

```typescript
// lib/rate-limit.ts — simple in-memory limiter (use Redis for multi-instance deployments)
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// app/api/contact/route.ts
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(`contact:${ip}`, 5, 60_000)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ... handle request
}
```

For production/multi-instance deployments, use Redis-backed rate limiting (e.g.,
`@upstash/ratelimit`) instead of in-memory maps.

---

## 5. File Upload Handling

```typescript
// app/api/upload/route.ts
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) return Response.json({ error: 'No file' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'File too large' }, { status: 400 });
  }

  // ✅ Generate a new filename — never use the user-supplied filename for storage paths
  const ext = file.type.split('/')[1];
  const filename = `${crypto.randomUUID()}.${ext}`;

  // Upload to object storage (S3, etc.) — not local filesystem in serverless environments
  await uploadToStorage(filename, await file.arrayBuffer());

  return Response.json({ url: `${process.env.NEXT_PUBLIC_CDN_URL}/${filename}` });
}
```

---

## 6. Error Responses

### ❌ Insecure
```typescript
export async function POST(req: Request) {
  try {
    // ...
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
```

### ✅ Secure
```typescript
export async function POST(req: Request) {
  try {
    // ...
  } catch (err) {
    console.error('Order creation failed:', err); // log full detail server-side only
    return Response.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
```
