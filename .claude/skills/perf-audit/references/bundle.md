# JavaScript bundle & code-splitting

The amount and shape of JavaScript shipped to the browser is usually the highest-leverage performance factor — it drives parse/compile/execute time (hurts INP), delays hydration, and competes with the LCP element for the main thread.

## What to look for

**Total client bundle size.** Get real numbers if you can build (see `scripts/analyze_bundle.sh`). Rules of thumb: a route's first-load JS over ~200–300 KB gzipped is worth scrutiny; individual non-essential dependencies over ~50 KB gzipped deserve justification.

**Heavy / avoidable dependencies.** Common offenders and lighter paths:
- `moment` → `date-fns`, `dayjs`, or native `Intl`. (This project uses `jalali-plugin-dayjs` already — good; make sure `moment` isn't also pulled in transitively.)
- `lodash` (whole) → `lodash-es` with named imports, or per-method, or native equivalents. `import _ from 'lodash'` pulls everything.
- Full icon libraries imported as a namespace → import individual icons (`import { Menu } from 'lucide-react'`, not `import * as Icons`).
- Large date/locale, charting (`chart.js`/`recharts`/`d3`), animation, or markdown libs loaded eagerly on routes that don't need them above the fold.
- Multiple libraries doing the same job (two date libs, two state libs).

**Barrel-file bloat.** Importing from an `index.ts` that re-exports an entire UI package can defeat tree-shaking and pull the whole package. Prefer deep imports, or verify the package is properly side-effect-free (`"sideEffects": false`).

**Missing code-splitting / dynamic imports.** Heavy, below-the-fold, or interaction-gated UI (modals, rich editors, charts, maps, date pickers) should be lazy-loaded:
- Next.js: `next/dynamic`, with `{ ssr: false }` only when the component truly can't render on the server.
- React/Vite: `React.lazy` + `Suspense`, route-level splitting.
- Be careful: over-splitting tiny components adds request overhead. Split at meaningful boundaries (routes, heavy widgets), not every component.

**Duplicate dependencies / version skew.** Multiple versions of the same package in `node_modules` bloat the bundle. `npm ls <pkg>` / `npm dedupe`; check the analyzer for duplicated chunks.

**Polyfills & transpile targets.** Overly conservative `browserslist` / build target ships polyfills modern browsers don't need. Check the target matches the actual audience.

**Source maps / dev artifacts in prod.** Confirm production builds aren't shipping eval source maps or dev-only code.

## How to attribute

After producing a bundle report, name the top 5 heaviest modules by gzipped size and what pulls them in. The fix for each is usually one of: remove, replace with lighter, dynamic-import, or fix the import to tree-shake. Quantify the expected saving.
