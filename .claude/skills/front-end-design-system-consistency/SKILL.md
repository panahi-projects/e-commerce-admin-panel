---
name: design-system-consistency
description: Audit a front-end codebase for design-system consistency — find UI that bypasses design tokens (raw hex/px instead of theme variables, off-scale spacing, hardcoded colors), components that duplicate an existing primitive instead of reusing it, inconsistent variants of the same thing (five slightly different buttons), and RTL violations (physical ml/mr instead of logical ms/me). Produces a prioritized report of specific files/lines that drift from the design system, with the canonical token or component to use instead. Use this skill whenever the user asks to check or enforce design-system consistency, find token violations, find duplicate/redundant components, audit for hardcoded colors or off-scale values, consolidate component variants, check Tailwind usage against their theme, or asks "are we using our design system correctly" / "why does our UI look inconsistent" — even if they don't say "design system audit."
---

# Design-System Consistency Audit

Find where the UI has drifted from the design system: hardcoded values that should be tokens, new components that duplicate existing primitives, and inconsistent one-off variants of the same element. Return a **prioritized, file-and-line-specific** report with the canonical replacement for each violation.

This is the **audit counterpart** to the `design-to-code` skill. That skill *generates* new components that match the system; this one *inspects existing code* for drift and duplication. When both are relevant (e.g. "fix this inconsistent component to match our system"), use this skill to identify the violations and `design-to-code`'s conventions to produce the corrected version.

## Operating principle: establish the canon first, then measure drift against it

You can't flag "inconsistency" without first knowing what *consistent* means for this project. So the audit is always two phases: (1) learn the design system's canonical tokens and primitives — the source of truth — then (2) scan the codebase for everything that deviates from it. A finding is only valid if you can name the canonical token or component it *should* have used. "This looks off" without a named replacement is not a finding.

Avoid two failure modes: reciting generic lint rules with no reference to the real tokens, and dumping hundreds of equal-weight nitpicks. Rank by impact (how visible/widespread the drift is) and effort (how mechanical the fix is).

## Workflow

### Step 1 — Establish the canon (the design system's source of truth)

Read the system before judging anything against it. Detailed guidance in `references/discovery.md`; in short, extract:
- **Tokens** — `tailwind.config.{ts,js}` `theme.extend` (colors, spacing, radius, fonts, breakpoints) and CSS custom properties in `globals.css`/theme files (`--primary`, `--radius`, …). These are the allowed values.
- **Primitives** — the existing component library inventory (`components/ui/` for shadcn, or wherever the project keeps them; in a monorepo often a shared `packages/ui`). This is the set of things that should be *reused*, not re-created.
- **Conventions** — how real components import, compose, and handle variants (`cva`), plus the RTL approach already in use. `components.json` reveals shadcn aliases/style.

Hold this as the reference set: the allowed tokens, the canonical primitives, and the house conventions. Everything in Step 2 is measured against it.

### Step 2 — Scan for drift across the consistency categories

Run `scripts/scan_consistency.sh` to surface candidate violations fast (it greps for the common patterns), then read the relevant reference file to interpret and verify each category. Don't trust grep blindly — confirm each hit is a real violation in context (e.g. an arbitrary value may be legitimately one-off and justified). Categories:

1. **Token violations** → `references/token-violations.md`
   Raw hex/rgb/hsl colors instead of token classes, arbitrary Tailwind values (`text-[#333]`, `p-[13px]`, `w-[412px]`) that map to an existing scale step, hardcoded font sizes/families bypassing the type scale, magic radii instead of `rounded-{sm,md,lg}`. The most common and most mechanical to fix.

2. **Duplicate / redundant components** → `references/duplication.md`
   A new Button/Card/Modal/Input hand-rolled when an equivalent primitive exists; near-identical components under different names; copy-pasted component bodies that should be one parametrized component. The highest-impact category — duplication is where drift compounds.

3. **Inconsistent variants of one thing** → `references/variants.md`
   Five buttons with slightly different padding/colors/radius; the same semantic element styled differently across pages; ad-hoc variants that should be folded into the primitive's `cva` variant set. Symptom of a missing or unused variant API.

4. **RTL / logical-property violations** → `references/rtl-violations.md`
   Physical `ml-*/mr-*/pl-*/pr-*/left-*/right-*/text-left/text-right` where the project's convention (and Farsi requirement) is logical `ms/me/ps/pe/start/end/text-start/text-end`. A consistency *and* correctness issue for this RTL app.

5. **Structural / convention drift** → `references/conventions.md`
   Inconsistent import paths (deep vs barrel vs relative), mixed `cn()`/`clsx`/template-string class composition, inconsistent client/server boundaries for similar components, naming/file-location inconsistencies. Lower visual impact but raises maintenance cost.

### Step 3 — Quantify and prioritize

Consistency findings are most persuasive with counts and spread:
- Report *how many* occurrences and *how many files* each violation spans ("47 hardcoded colors across 18 files; 31 map to `--primary`/`--muted`").
- Rank: widespread + mechanical = top quick wins; structural duplication = high impact even if fewer instances; one-off arbitrary values in a single file = minor.
- Where a single canonical replacement covers many instances, group them — don't list 47 identical findings separately.

### Step 4 — Report

Use `references/report-format.md`. Essentials:
- Lead with the highest impact-to-effort findings.
- Each finding: *What drifted → Where (files/lines, count) → Canonical token/component to use → Suggested fix (often a mechanical replacement) → Effort.*
- Offer, where it's safe and mechanical (e.g. `ml-` → `ms-`, a hex that exactly equals a token), to apply the fixes — but confirm scope first; don't mass-rewrite without the user's go-ahead.
- Keep low-impact one-offs in a short "minor" list.

## Honesty notes

- A flagged value isn't automatically wrong — some arbitrary values are legitimate (a one-off illustration, a third-party embed's required dimension). Verify intent before asserting a violation; mark uncertain ones as "review" rather than "fix."
- Distinguish what you **verified by reading the code** from pattern-match candidates you couldn't fully confirm.
- Consolidating components has real risk (visual regressions). Recommend it, note the testing needed, and don't present merges as zero-risk.
- If there's no design system to measure against (no tokens, no primitives), say so — the right first step is establishing one, not auditing against nothing.
