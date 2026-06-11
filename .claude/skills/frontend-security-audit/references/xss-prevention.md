# XSS Prevention Reference (Next.js / React)

## Table of Contents
1. [Why React Helps (and Where It Doesn't)](#1-why-react-helps-and-where-it-doesnt)
2. [Sanitizing dangerouslySetInnerHTML](#2-sanitizing-dangerouslysetinnerhtml)
3. [Safe Link / URL Handling](#3-safe-link--url-handling)
4. [Markdown Rendering](#4-markdown-rendering)
5. [Third-Party Script Loading](#5-third-party-script-loading)

---

## 1. Why React Helps (and Where It Doesn't)

React escapes values rendered via `{}` automatically:

```tsx
// ✅ Safe — React escapes this automatically
<div>{userComment}</div>
// Even if userComment = "<script>alert(1)</script>", it renders as text, not HTML
```

**XSS becomes possible when you opt OUT of this protection:**
- `dangerouslySetInnerHTML`
- Setting `href`/`src` to user-controlled strings with dangerous schemes
- Rendering user input inside `<script>` tags or inline event handlers
- Using `eval`, `new Function`, or string-based `setTimeout`/`setInterval`

---

## 2. Sanitizing dangerouslySetInnerHTML

### ❌ Insecure
```tsx
function Comment({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```
If `html` comes from user input (comments, bios, rich text editors), this is **stored XSS**.

### ✅ Secure — sanitize with DOMPurify

```bash
npm install dompurify
npm install -D @types/dompurify
```

```tsx
'use client';
import DOMPurify from 'dompurify';

function Comment({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

### ✅ Secure — sanitize server-side (Server Component / Route Handler)

```typescript
import createDOMPurify from 'isomorphic-dompurify';

const clean = createDOMPurify.sanitize(rawHtml, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'a'],
  ALLOWED_ATTR: ['href'],
});
```

---

## 3. Safe Link / URL Handling

### ❌ Insecure — user-controlled href without scheme validation

```tsx
function ProfileLink({ url }: { url: string }) {
  return <a href={url}>Visit</a>;
  // url = "javascript:alert(document.cookie)" → XSS on click
}
```

### ✅ Secure — validate scheme

```typescript
const SAFE_SCHEMES = ['http:', 'https:', 'mailto:'];

function getSafeUrl(url: string): string | null {
  try {
    const parsed = new URL(url, 'https://placeholder.local');
    if (!SAFE_SCHEMES.includes(parsed.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

function ProfileLink({ url }: { url: string }) {
  const safe = getSafeUrl(url);
  if (!safe) return <span>{url} (invalid link)</span>;
  return <a href={safe} rel="noopener noreferrer">Visit</a>;
}
```

### target="_blank" — always pair with rel

```tsx
// ❌ tabnabbing risk — opened page can access window.opener
<a href={externalUrl} target="_blank">Link</a>

// ✅ Safe
<a href={externalUrl} target="_blank" rel="noopener noreferrer">Link</a>
```

---

## 4. Markdown Rendering

If rendering user-submitted Markdown (e.g., `react-markdown`):

```tsx
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

function UserContent({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
      {markdown}
    </ReactMarkdown>
  );
}
```

`rehypeSanitize` strips dangerous HTML (`<script>`, event handlers, `javascript:` URIs)
that could otherwise be embedded in raw Markdown/HTML mixed content.

---

## 5. Third-Party Script Loading

```tsx
import Script from 'next/script';

// ✅ Use next/script with appropriate strategy
<Script
  src="https://analytics.example.com/script.js"
  strategy="afterInteractive"  // doesn't block initial render
/>

// ✅ For non-critical scripts, defer further
<Script
  src="https://chat-widget.example.com/widget.js"
  strategy="lazyOnload"
/>

// ✅ Inline scripts that must run — use strategy + nonce for CSP compliance
<Script id="analytics-init" strategy="afterInteractive" nonce={cspNonce}>
  {`window.analytics.init('${publicKey}');`}
</Script>
```

**Checklist for third-party scripts:**
- Pin to a specific version/URL, not a "latest" alias that can change unexpectedly
- Use Subresource Integrity (`integrity` attribute) when the script is hosted on a CDN
  with versioned URLs
- Audit what data/cookies the script can access — it runs with full page privileges
