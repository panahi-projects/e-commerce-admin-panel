# Duplicate / redundant components

The highest-impact consistency problem: a component re-implements something a primitive already provides, or two components do nearly the same job under different names. Duplication is where drift compounds — each copy evolves independently until the UI is subtly inconsistent everywhere.

## What to look for

**Re-implemented primitives.** A hand-rolled button (`<button className="px-4 py-2 rounded bg-primary ...">` repeated, or a `PrimaryButton` component) when a canonical `Button` exists. Same for Card, Modal/Dialog, Input, Select, Badge, Tabs, Tooltip, Dropdown. Signs:
- A local component whose markup/props mirror a primitive in the inventory.
- Raw `<button>`/`<input>`/`<div className="card...">` patterns repeated across files instead of the primitive.
- A component importing from outside the design-system path that recreates a design-system thing.

**Near-duplicate components.** Two+ components that are ~the same with minor differences: `UserCard` vs `ProfileCard`, `Modal` vs `Dialog` vs `Popup`, `Spinner` vs `Loader`. Often the difference is one prop's worth — they should be one parametrized component, or one should be deleted in favor of the canonical one.

**Copy-pasted bodies.** The same JSX block duplicated across pages (a stats tile, a list row, an empty-state) that should be extracted into a single shared component. Search for repeated distinctive class strings or structures.

**Wrapper drift.** Multiple thin wrappers around the same primitive that each add slightly different defaults — e.g. three different "our Button but with X" wrappers. Consolidate into variants of the primitive.

## How to detect

- Inventory-driven: for each canonical primitive, search the codebase for hand-rolled equivalents (raw elements with the primitive's signature classes, or local components with matching names/shapes).
- Similarity: look for components with overlapping prop sets and near-identical render output. Distinctive repeated class strings are a good grep seed.
- Naming clusters: group components by what they *are* (button-like, card-like, modal-like) and check each cluster for redundancy.

## How to report

Name the duplicate, name the canonical primitive it should collapse into, and show the prop/behavior gap that needs bridging (e.g. "`ProfileCard` adds an avatar slot — fold into `Card` via a `header` prop or compose `Card` + `Avatar`"). This is high-impact, so it ranks near the top even with few instances — but flag the regression risk: consolidating shared components touches many call sites and needs visual review/testing. Recommend doing it behind a quick visual check, not a blind find-replace.
