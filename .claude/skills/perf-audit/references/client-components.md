# Client vs Server Components / over-hydration

In Next.js App Router (and RSC generally), every Client Component and its imports ship to the browser and must hydrate. Pushing the `"use client"` boundary too high, or marking components client-side that don't need to be, inflates the bundle and hydration cost — directly hurting INP and delaying interactivity. This is one of the most common and most fixable issues in modern Next.js apps.

## What to look for

**Unnecessary `"use client"`.** A component only needs it if it uses: hooks (`useState`, `useEffect`, `useReducer`, `useContext`), event handlers (`onClick`, `onChange`…), browser-only APIs (`window`, `localStorage`), or class components / certain third-party client libs. If it does none of these, it can be a Server Component. Grep for `"use client"` and check each one against this list.

**Client boundary too high in the tree.** A common anti-pattern: a page or layout is marked `"use client"` just because one small leaf (a button, a toggle) needs interactivity — which forces the entire subtree to the client. Fix: keep the page/layout as a Server Component and push `"use client"` down to the smallest interactive leaf. Pass server-rendered content into client components via `children` / props so static parts stay on the server.

**Server-only work shipped to the client.** Heavy data transformation, large constant data, secrets-adjacent logic, or big libraries used only for rendering should run on the server. If a Client Component imports a heavy lib (markdown renderer, date/locale, formatting) purely to render static output, move that work server-side.

**Provider walls.** Context providers (theme, i18n, query client) often wrap the whole app and are client components. That's sometimes necessary, but check the provider itself is thin and isn't dragging heavy imports into the root client bundle. Co-locate providers as low as correctness allows.

**Over-hydration of static content.** Large lists/tables/marketing content rendered through client components hydrate needlessly. If it's not interactive, render it on the server.

## Pages Router / plain React equivalents

- Pages Router: minimize `getServerSideProps` where `getStaticProps`/ISR suffices; avoid shipping data-fetching libs to the client; prefer static generation for stable content.
- Plain SPA (Vite/CRA): the whole app hydrates by definition — the lever is bundle size (see `bundle.md`) and deferring non-critical components, plus considering SSR/streaming if first paint matters.

## How to attribute

List each `"use client"` file and classify: *needed* / *can be server* / *boundary should move down*. For the "move down" cases, name the specific interactive leaf that justifies a smaller client island. Estimate the hydration/bundle reduction qualitatively (e.g. "moves ~30 KB of formatting libs off the client").
