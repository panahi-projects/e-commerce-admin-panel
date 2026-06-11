# RTL / logical-property violations

This project supports Farsi (RTL), so physical direction utilities are both a consistency drift and a correctness bug — they don't mirror under RTL, producing visually broken layouts. The canonical convention is logical properties; flag every physical one.

## What to look for (physical → logical)

| Physical (flag) | Logical (canonical) |
|-----------------|---------------------|
| `ml-*` / `mr-*` | `ms-*` / `me-*` |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` |
| `left-*` / `right-*` | `start-*` / `end-*` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `border-l*` / `border-r*` | `border-s*` / `border-e*` |
| `rounded-l-*` / `rounded-r-*` | `rounded-s-*` / `rounded-e-*` |
| `float-left` / `float-right` | `float-start` / `float-end` |
| inline `style` with `left/right/margin-left/...` | logical CSS (`inset-inline-start`, `margin-inline-start`) |

Also flag in raw CSS: `margin-left`, `padding-right`, `left:`, `text-align: left`, `border-left`, etc. — replace with `*-inline-start/end` logical equivalents.

## Verify before flagging

Not every physical utility is wrong:
- **Intentionally non-mirroring content** — a thing that must stay in a fixed physical position regardless of direction (rare, but exists). Confirm intent.
- **LTR-pinned islands** — numbers, prices, wallet addresses, code, phone numbers are often wrapped `dir="ltr"`; physical properties *inside* a deliberately-LTR island may be acceptable. Check the surrounding `dir`.
- **Directional icons** — chevrons/arrows that should flip: flag if they lack `rtl:-scale-x-100` or an RTL swap; don't flag non-directional icons.

## How to report

Count and locate: "63 physical direction utilities across 21 files — 58 are mechanical `ml/mr/pl/pr` → `ms/me/ps/pe` swaps; 5 are `left/right` positioning needing `start/end`." The mechanical swaps are safe to offer to auto-apply (they're a direct mapping). Call out the few that need judgment (inside LTR islands, or positioning that interacts with other layout) separately. This category doubles as a correctness fix, so it ranks high for an RTL app even though each fix is small.
