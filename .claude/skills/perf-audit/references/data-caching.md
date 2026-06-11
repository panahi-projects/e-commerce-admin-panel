# Data fetching, caching & runtime

Slow or poorly-structured data fetching shows up as high TTFB and slow LCP, and oversized payloads inflate both network and client-side work. Caching is the cheapest performance win when it's missing.

## What to look for

**Request waterfalls.** Sequential awaits that don't depend on each other serialize round-trips. Fetch independent data in parallel (`Promise.all`, parallel RSC fetches, React Query parallel queries) instead of one-after-another. In Next.js App Router, fetch in parallel and stream with `Suspense` so the shell paints while data loads.

**Blocking the whole page on slow data.** If one slow query holds up the entire render, isolate it behind `Suspense`/streaming so the rest of the page is interactive. Move non-critical data below the fold or load it client-side after paint.

**Over-fetching / oversized payloads.** Endpoints returning far more than the UI needs (entire records when a few fields are shown, unpaginated lists). Recommend field selection, pagination, and shrinking payloads. Large JSON also costs parse time on the client.

**Missing or wrong caching.**
- HTTP: static assets need long-lived immutable cache headers (hashed filenames + `Cache-Control: immutable`); HTML/API need sensible `s-maxage`/`stale-while-revalidate`.
- Next.js: use the appropriate caching/revalidation for the version in use (static generation / ISR / `revalidate`, route segment config, or the explicit caching APIs). Flag pages forced dynamic (`no-store`, `force-dynamic`, `cookies()/headers()` usage) that could be static or revalidated instead — dynamic rendering on every request is a common silent TTFB killer.
- Client: a data-fetching cache (React Query/SWR) with sane `staleTime` avoids refetch storms and duplicate requests.

**TTFB / server work.** High TTFB caps your best-possible LCP. Causes: slow upstream APIs, unindexed DB queries, cold serverless starts, heavy synchronous server rendering, no CDN in front. Recommend CDN/edge caching for cacheable responses and pushing slow work off the critical render path.

**Duplicate / N+1 requests.** The same data fetched multiple times across components (no dedup), or per-item requests in a loop. Dedupe (RSC request memoization, React Query) or batch.

**Third-party API latency on the critical path.** A slow external call blocking first render should be deferred, cached, or made non-blocking.

## How to attribute

Trace the critical path for the slow route: what must complete before first byte, before LCP. Name the specific fetches that are serial-but-could-be-parallel, the endpoints over-fetching, and the pages that are dynamic-but-could-be-cached. Tie each to TTFB/LCP and give the concrete change (parallelize, paginate, add revalidate, add cache header).
