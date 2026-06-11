# Screenshot / mockup analysis

When the input is an image, decompose it into a structured breakdown *before* writing code. Generating from a single holistic glance produces inaccurate spacing and missed structure. Work top-down.

## Decomposition order

1. **Layout & grid** — Is it a single column, a 2/3-column grid, a sidebar + main, a centered card on a backdrop? Identify the outer container width and the grid. Estimate column count and gutters.
2. **Major sections** — header / nav, hero or title block, body content, footer, any floating elements (modals, toasts). Bound each one.
3. **Repeated units** — cards, list rows, table rows, tabs. Identify the *single* unit, build it once, then map it over data. Don't hand-write N copies.
4. **Spacing rhythm** — relative gaps: tight (within a card), medium (between cards), large (between sections). Map these to the project's spacing scale rather than guessing px. Consistent rhythm reads as "designed."
5. **Color palette** — pull the distinct colors, then **map each to a project token** (`primary`, `muted`, `card`, `border`, `destructive`…). Do NOT hardcode the sampled hex; find the nearest semantic token. A gradient → check if the project has gradient tokens/utilities; otherwise compose from token colors.
6. **Typography** — for each text role (display, heading, body, caption, label) note size, weight, and case, then map to the project's type scale (`text-2xl font-semibold` etc.), not arbitrary sizes.
7. **States & affordances visible in the image** — hover, active, disabled, selected tabs, focus rings, badges. Recreate with the project's existing variant conventions.
8. **Direction** — even if the mockup is shown LTR, generate RTL-aware per the RTL reference; mirror the layout for RTL and keep LTR-only data (numbers, addresses) pinned.

## Map, then generate

After the breakdown, write a one-line mapping for each piece: "header → reuse `<Card>` + existing `<Avatar>`", "tier price → `text-3xl font-bold tabular-nums`, LTR-pinned". Only then emit code. If a piece has no matching primitive, note that you'll create it following the existing primitive pattern.

## Honesty about ambiguity

Screenshots hide things: exact spacing, hover states, responsive collapse, real copy. Make reasonable choices from the design system and state the few assumptions you made in one line — don't silently invent, and don't stall the build with a long list of questions.
