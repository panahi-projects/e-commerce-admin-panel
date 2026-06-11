# Output checklist

Run through this before returning generated code. It's the difference between "looks like our codebase" and "obviously pasted from a generic generator."

## Reuse & fidelity
- [ ] Imported existing primitives (Button, Card, Dialog, Input…) instead of re-implementing them.
- [ ] Any new primitive follows the existing pattern (same `cva`/variant approach, same file location, same `cn()` usage) so it's indistinguishable from hand-written code.
- [ ] No duplicated component that drifts from an existing one.

## Tokens
- [ ] All colors reference semantic tokens (`bg-primary`, `text-muted-foreground`), no stray raw hex.
- [ ] Radii use `rounded-{sm,md,lg}` / the project's scale, not arbitrary px.
- [ ] Spacing uses the scale; no `p-[13px]`-style arbitrary values unless the design truly requires it.
- [ ] Typography uses the project's type scale and the correct font family (incl. the Farsi family for Farsi text).
- [ ] Custom breakpoint names match the project's `screens`.

## RTL / Farsi
- [ ] Directional spacing/positioning is logical: `ms`/`me`, `ps`/`pe`, `start`/`end`, `text-start`/`text-end`, `border-s`/`border-e`.
- [ ] Directional icons (chevrons/arrows) flip under RTL; non-directional icons don't.
- [ ] LTR-only content (numbers, prices, addresses, code, phone numbers) is pinned with `dir="ltr"`.
- [ ] Direction is inherited from the app's provider where possible, not hardcoded per element.

## Contract & correctness
- [ ] Server vs Client Component matches the codebase; `"use client"` only where hooks/handlers require it.
- [ ] Import paths, export style, and file naming match existing components.
- [ ] Semantic HTML + accessibility states (focus-visible, aria-*) consistent with the project.
- [ ] Repeated UI is mapped over data, not hand-copied.

## Communication
- [ ] Stated, in one or two lines, which existing components were reused and any assumption defaulted (mode, breakpoint, etc.). No long essay.
