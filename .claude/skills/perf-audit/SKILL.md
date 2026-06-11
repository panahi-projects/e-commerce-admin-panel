---
name: perf-audit
description: Audit a front-end app (Next.js / React, but applicable to any modern web app) for performance and Core Web Vitals problems — JavaScript bundle size and code-splitting, image optimization, unnecessary Client Components / over-hydration, render-blocking resources (CSS, fonts, third-party scripts), Core Web Vitals (LCP, INP, CLS) and Lighthouse scores, caching, and data-fetching waterfalls. Produces a prioritized report of concrete, file-specific fixes. Use this skill whenever the user asks why their app/site/page is slow, asks for a performance review or speed audit, mentions Lighthouse, Core Web Vitals, LCP/INP/CLS, bundle size, "too much JavaScript", slow load, "use client" overuse, hydration cost, render-blocking, or wants to make a front end faster — even if they don't say the words "performance audit."
---

# Performance & Core Web Vitals Audit

Diagnose why a front-end is slow and return a **prioritized, file-specific** set of fixes — not a generic checklist. The output should let the user act immediately: "this image, this component, this import — change it to X for ~Y improvement."

## Operating principle: measure, attribute, prioritize

Two failure modes to avoid: (1) reciting generic advice ("optimize your images!") with no reference to the actual codebase, and (2) drowning the user in 40 equal-weight findings. Instead — inspect the real project, attribute each problem to specific files/lines, and rank fixes by impact-to-effort. A few high-leverage fixes beat an exhaustive list.

Core Web Vitals targets (Google, measured at the 75th percentile of real users):
- **LCP** (loading) — Good ≤ 2.5s, Poor > 4.0s
- **INP** (responsiveness, replaced FID) — Good ≤ 200ms, Poor > 500ms
- **CLS** (visual stability) — Good ≤ 0.1, Poor > 0.25

Note the distinction between **lab data** (Lighthouse/synthetic — reproducible, good for diagnosis) and **field data** (CrUX/real users — what Google actually ranks on). A perfect Lighthouse score with red Search Console vitals means you're optimizing the wrong dataset; say so if you see it.

## Workflow

### Step 1 — Scope and orient

Establish what you're auditing and what you can actually run:
- **Framework & version** — read `package.json` (Next.js? Vite? CRA? Remix?), the bundler, React version, and whether it's App Router or Pages Router (changes the Client/Server Component advice entirely).
- **What's runnable here vs. advisory** — can you `npm install` and build (to get a real bundle report), or is this a read-only review where you reason from source? Both are valid; be honest about which mode you're in. If you can build, a real `next build` / bundle analysis beats any amount of static guessing.
- **Where it hurts** — ask the user (one short question) if they have a specific symptom (slow first load, janky interactions, layout jumping, a specific slow route) or a Lighthouse/PSI report to anchor on. If they don't, audit broadly.

### Step 2 — Run the audit across categories

Work through the categories below. For each, the detailed *how* lives in a reference file — read it when you reach that category rather than loading everything up front. Don't treat every category as equally relevant; weight toward what this specific app is likely suffering from based on Step 1.

1. **JavaScript bundle & code-splitting** → `references/bundle.md`
   Bundle size, duplicate/heavy dependencies, missing dynamic imports, barrel-file bloat, what's shipped to the client. The single biggest lever for INP and often LCP.

2. **Client vs Server Components / over-hydration** → `references/client-components.md`
   Unnecessary `"use client"`, client boundaries pushed too high up the tree, server-only logic shipped to the browser. Especially impactful in Next.js App Router.

3. **Images & media** → `references/images.md`
   Unoptimized formats, missing dimensions (CLS), no lazy-loading, the LCP image not prioritized, `next/image` misuse.

4. **Render-blocking resources** → `references/render-blocking.md`
   Blocking CSS, font loading strategy (FOIT/FOUT, missing `font-display`), synchronous third-party scripts, the critical request chain.

5. **Core Web Vitals & Lighthouse** → `references/cwv-lighthouse.md`
   How to actually run Lighthouse/measure, interpret each metric, map a poor metric back to a cause in categories 1–4, and read field vs lab data.

6. **Data fetching, caching & runtime** → `references/data-caching.md`
   Request waterfalls, missing parallelization, cache headers / Next.js caching, oversized payloads, blocking server work.

If the project has RTL/Farsi specifics (e.g. heavy Persian webfonts), call those out under fonts/render-blocking — a large unsubsetted Farsi font is a common, real LCP cost.

### Step 3 — Quantify where you can

Numbers make the report actionable and credible. Use the helper script and any build output you can produce:
- `scripts/analyze_bundle.sh` — guidance + commands to produce a real bundle breakdown (Next.js bundle analyzer, `vite-bundle-visualizer`, or raw `dist` inspection) and surface the heaviest modules.
- Report concrete figures where available: "X is 180 KB gzipped, ~40% of your client bundle" beats "your bundle is large." When you can't measure exactly, estimate and label it an estimate.

### Step 4 — Report

Use the structure in `references/report-format.md`. The essentials:
- **Top findings first**, each as: *Problem → Evidence (file/line/number) → Fix (concrete) → Expected impact → Effort.*
- Rank by impact-to-effort; mark quick wins.
- Tie findings back to the metric they move (LCP / INP / CLS / TTFB).
- Keep advisory-but-low-impact items in a short "minor / later" list so they don't dilute the priorities.
- Don't pad. If only three things matter, report three things.

## Honesty notes

- Distinguish what you **verified** (read the file, ran the build) from what you **suspect** (couldn't measure). Don't present a guess as a measurement.
- If you can't run a real build or Lighthouse in this environment, say the audit is static/source-based and recommend the user run the listed commands locally for hard numbers.
- Performance work has diminishing returns and tradeoffs (e.g. aggressive code-splitting can add request overhead). Note tradeoffs rather than presenting every optimization as free.
