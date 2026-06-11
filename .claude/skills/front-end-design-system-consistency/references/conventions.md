# Structural / convention drift

Lower visual impact than token or duplication issues, but inconsistent structure raises maintenance cost and makes the codebase feel incoherent to work in. Measure against the house conventions recorded in discovery.

## What to look for

**Import inconsistency.** The same primitive imported different ways across files: `@/components/ui/button` vs `../../components/ui/button` vs a barrel `@/components/ui`. Pick the project's canonical style (from discovery) and flag deviations. Barrel imports can also hurt tree-shaking — note where deep imports are the convention.

**Class-composition inconsistency.** Mixed approaches to building className: `cn()` in some files, raw template strings in others, `clsx`/`classnames` directly elsewhere. The canonical approach is whatever the primitives use (usually `cn()` from `@/lib/utils`); flag the outliers.

**Variant-API bypass.** Components that should use `cva` (like the primitives do) but instead branch styling with inline ternaries/`if`s. Consistency with the system's variant pattern matters for maintainability.

**Client/server boundary inconsistency.** Similar components where some are needlessly `"use client"` and others aren't — inconsistent boundaries for the same kind of thing. (Overlaps with the perf concern, but here it's about *consistency* of the pattern.)

**Naming & location drift.** PascalCase vs kebab-case files where the project standardized one; components living outside the conventional directory; inconsistent export style (named vs default) for similar components; inconsistent prop naming for the same concept (`isOpen` vs `open` vs `visible` across modal-like components).

**Inconsistent prop patterns.** The same concept typed/named differently across components (`onClose` vs `onDismiss`, `className` forwarded in some primitives but not others). Forwarding `className` and `ref` consistently is part of a coherent component API.

## How to report

These are about coherence, so report them as patterns with counts, not individual nitpicks: "3 import styles for `ui/` components across the app — standardize on `@/components/ui/*` (the convention in the primitives); 14 files deviate." Rank below token/duplication/RTL findings unless a specific drift is actively causing bugs. Most are safe, mechanical normalizations — but confirm scope before mass-applying, since import/codemod changes touch many files.
