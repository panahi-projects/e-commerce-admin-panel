# Report format

The report's job is to drive action. Lead with what matters most, attribute every claim to evidence, and keep low-impact items from burying the high-impact ones.

## Structure

```
# Performance Audit — <app/route>

## Summary
- Audit mode: <ran build + Lighthouse | static source review>
- Current vitals (if measured): LCP <x>s · INP <x>ms · CLS <x>  (lab/field)
- Headline: 1–2 sentences on the biggest issue and the realistic upside.

## Top fixes (ranked by impact ÷ effort)
For each (3–7 items, most impactful first):

### N. <short title>  ·  [Quick win | Medium | Larger effort]
- **Problem:** what's wrong, in one line.
- **Evidence:** file/line, dependency name, measured size, or metric. Concrete.
- **Fix:** the specific change (code-level where possible).
- **Impact:** which metric it moves and a rough magnitude (estimate clearly labeled).

## Minor / later
Short bulleted list of low-impact or nice-to-have items, one line each. No detail —
just enough that they're not lost.

## How to verify
The exact commands the user should run to measure before/after
(bundle analyzer, lighthouse/unlighthouse, PSI URL) — so they can confirm gains.
```

## Rules

- **Rank, don't enumerate.** Order by impact-to-effort. If three things matter, report three — don't manufacture ten.
- **Evidence or it didn't happen.** Every top finding cites a file, a number, or a metric. "Could be faster" with no evidence doesn't belong in the top list.
- **Separate measured from suspected.** If you couldn't build/measure, say "static review — verify with the commands below." Never present an estimate as a measurement.
- **Tie to a metric.** Each fix should name the vital it improves (LCP/INP/CLS/TTFB), so the user understands *why* it's prioritized.
- **Note tradeoffs.** If a fix has a cost (added complexity, request overhead, SSR loss), say so.
- **Right-size it.** A quick "why is this page slow" deserves a tight focused answer, not a 20-section document. A full audit request deserves the complete structure. Match the depth to the ask.
