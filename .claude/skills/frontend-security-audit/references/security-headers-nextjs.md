# Security Headers & CSP Reference (next.config.js)

## Table of Contents
1. [Full next.config.js Template](#1-full-nextconfigjs-template)
2. [Content Security Policy Explained](#2-content-security-policy-explained)
3. [CSP with Nonces (App Router)](#3-csp-with-nonces-app-router)
4. [Testing Your Headers](#4-testing-your-headers)

---

## 1. Full next.config.js Template

```javascript
/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://your-cdn.example.com",
      "font-src 'self'",
      "connect-src 'self' https://api.example.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-cdn.example.com', // ✅ explicit, not wildcard
        pathname: '/uploads/**',
      },
    ],
  },

  productionBrowserSourceMaps: false, // ✅ don't ship source maps publicly

  // Avoid masking real issues:
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
};

module.exports = nextConfig;
```

---

## 2. Content Security Policy Explained

CSP is your strongest defense against XSS — even if an attacker injects a `<script>` tag,
the browser won't execute it if it violates the policy.

| Directive | Purpose | Recommended starting value |
|---|---|---|
| `default-src` | Fallback for unlisted directives | `'self'` |
| `script-src` | Where JS can load from | `'self'` (+ specific trusted CDNs) |
| `style-src` | Where CSS can load from | `'self' 'unsafe-inline'` (Tailwind/CSS-in-JS often needs this) |
| `img-src` | Where images can load from | `'self' data: <your-cdn>` |
| `connect-src` | fetch/XHR/WebSocket targets | `'self' <your-api-url>` |
| `frame-ancestors` | Who can iframe you | `'none'` (prevents clickjacking) |
| `form-action` | Where forms can submit to | `'self'` |
| `base-uri` | Restricts `<base>` tag | `'self'` |

**`unsafe-inline` and `unsafe-eval` in `script-src` significantly weaken CSP** — they allow
inline `<script>` and `eval()`, which is exactly what XSS payloads use. Avoid if possible;
use nonces instead (see below).

---

## 3. CSP with Nonces (App Router)

For stricter CSP without `unsafe-inline` on scripts:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://your-cdn.example.com;
    frame-ancestors 'none';
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}
```

```tsx
// app/layout.tsx
import { headers } from 'next/headers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = headers().get('x-nonce');

  return (
    <html>
      <body>
        {children}
        <Script
          id="my-script"
          nonce={nonce ?? undefined}
          strategy="afterInteractive"
        >
          {`console.log('this inline script is allowed via nonce');`}
        </Script>
      </body>
    </html>
  );
}
```

---

## 4. Testing Your Headers

```bash
# Check headers on a deployed site
curl -sI https://yourapp.com | grep -iE "content-security|x-frame|strict-transport|x-content-type|referrer|permissions"

# Or use online tools (run manually, not via this skill):
# - https://securityheaders.com
# - https://csp-evaluator.withgoogle.com
```

After deploying CSP changes, **monitor the browser console for CSP violation errors** —
start in `Content-Security-Policy-Report-Only` mode if rolling out to an existing app:

```javascript
{
  key: 'Content-Security-Policy-Report-Only', // doesn't block, only reports
  value: '...',
}
```

Switch to enforcing (`Content-Security-Policy`) once you've confirmed no legitimate
resources are blocked.
