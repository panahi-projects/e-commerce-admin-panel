# Core Web Vitals & Lighthouse

This category is about *measuring* and *interpreting* — turning a metric score into a cause you can fix in one of the other categories.

## The metrics (Good / Needs-improvement / Poor, at p75 of real users)

| Metric | Measures | Good | Poor | Mostly caused by |
|--------|----------|------|------|------------------|
| **LCP** | Loading — when the largest element paints | ≤ 2.5s | > 4.0s | Slow TTFB, render-blocking CSS/fonts, unoptimized/unprioritized LCP image, too much JS before paint |
| **INP** | Responsiveness — slowest interaction→paint (replaced FID) | ≤ 200ms | > 500ms | Heavy JS execution, long tasks, over-hydration, expensive event handlers, large re-renders |
| **CLS** | Visual stability — unexpected layout shift | ≤ 0.1 | > 0.25 | Images/embeds without dimensions, font swap reflow, late-injected content (ads/banners), dynamically resized elements |

Supporting (lab) metrics that help diagnose: **FCP**, **TBT** (best lab proxy for INP), **Speed Index**, **TTFB**.

## Lab vs field — don't confuse them

- **Lab / synthetic** (Lighthouse, PageSpeed Insights "analysis", `unlighthouse`, WebPageTest): reproducible, single simulated device/network. Great for diagnosis and catching regressions in CI. Not what Google ranks on.
- **Field / RUM** (Chrome UX Report / CrUX, Search Console, `web-vitals` library): real users, the p75 Google actually uses. This is the source of truth for whether you "pass."
- A green Lighthouse score with red Search Console vitals = you're optimizing the wrong dataset (often: fast on your dev machine, slow on real mid-tier mobile). Always note this gap if you see it.

## How to measure

- **Lighthouse**: Chrome DevTools → Lighthouse, or CLI `npx lighthouse <url> --view`, or `npx unlighthouse` to crawl many routes at once. Run mobile, throttled, several times (scores vary run-to-run — report a median, not a single run).
- **PageSpeed Insights** (pagespeed.web.dev): gives both lab AND CrUX field data for a public URL — the quickest way to see the lab/field gap.
- **Real-user**: the `web-vitals` npm package reports LCP/INP/CLS from actual sessions; recommend wiring it to analytics for ongoing monitoring, since perf regresses with every release.
- If the environment here can't reach the running app, say the audit is source-based and give the user these commands to run locally.

## Diagnosis flow

1. Get the three CWV numbers (field if possible, else lab).
2. For each failing metric, use the "caused by" column to jump to the right category file:
   - LCP failing → `images.md` (LCP image), `render-blocking.md` (CSS/fonts), `data-caching.md` (TTFB), `bundle.md`.
   - INP failing → `bundle.md` + `client-components.md` (less JS, less hydration, break up long tasks).
   - CLS failing → `images.md` (dimensions) + `render-blocking.md` (font swap).
3. Confirm the cause in the source, then write the fix.

Report each metric with its current value, target, the specific cause you found, and the fix — not just the score.
