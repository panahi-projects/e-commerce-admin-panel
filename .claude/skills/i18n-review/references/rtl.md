# RTL correctness (locale layer)

For an app shipping Farsi, RTL correctness is part of i18n: the layout must mirror, and direction must follow the active locale. This overlaps the design-system audit, but here the lens is "does the app render correctly in the RTL locale," not just "is the codebase consistent."

## Direction wiring

**`dir` and `lang` follow the locale.** `<html lang="fa" dir="rtl">` for Farsi, `lang="en" dir="ltr"` for English — set from the active locale, not hardcoded. Check the root layout/document. A hardcoded `dir="ltr"` (or none) means RTL never engages no matter the locale; that's a top finding.

**Per-component direction inheritance.** Components should inherit direction from the app root, not each hardcode `dir`. Hardcoded `dir="rtl"` everywhere is as wrong as hardcoded LTR — it breaks the English locale.

## Logical vs physical CSS

Physical direction utilities don't mirror under RTL and produce broken layouts in Farsi. Flag and map to logical:

| Physical | Logical |
|----------|---------|
| `ml-*`/`mr-*`, `pl-*`/`pr-*` | `ms-*`/`me-*`, `ps-*`/`pe-*` |
| `left-*`/`right-*` | `start-*`/`end-*` |
| `text-left`/`text-right` | `text-start`/`text-end` |
| `border-l`/`border-r`, `rounded-l/r` | `border-s`/`border-e`, `rounded-s/e` |
| raw CSS `margin-left`, `left:`, `text-align:left` | `margin-inline-start`, `inset-inline-start`, `text-align:start` |

(The design-system-consistency skill covers the full mechanical sweep; reuse those findings here, framed as locale correctness.)

## Mirroring & directional content

**Directional icons** (chevrons, arrows, back/next, send) must flip in RTL — `rtl:-scale-x-100` or an RTL swap. Non-directional icons (check, trash, avatar) must NOT flip. Flag directional icons lacking flip handling.

**Layout mirroring.** Sidebars, breadcrumbs, progress steppers, carousels, and any "first→last" horizontal flow should mirror in RTL. Custom-positioned/absolute layouts and transforms often don't mirror automatically — inspect these.

**LTR-pinned islands inside RTL.** Content that must stay LTR even in Farsi UI — numbers, prices, wallet addresses, hashes, code, URLs, phone numbers, Latin IDs — needs explicit `dir="ltr"` so it doesn't render reversed. Common in a crypto app: a transaction hash or address rendered in RTL flow looks corrupted. Flag unpinned instances.

## Bidi text

Mixed Farsi + Latin/numbers can render with confusing ordering without proper bidi handling. Where Persian text embeds Latin tokens or numbers inline, check that isolation (`dir="auto"`, `<bdi>`, or Unicode isolates) is used where needed.

## How to report

Lead with direction wiring (if `dir` isn't locale-driven, nothing else matters). Then logical-property violations (count/files, mechanical swaps — safe to offer to apply), unflipped directional icons, unmirrored custom layouts (need visual review), and unpinned LTR islands (especially crypto data — correctness bug). Tie each to "renders wrong in `fa`."
