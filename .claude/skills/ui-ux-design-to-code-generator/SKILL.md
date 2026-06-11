---
name: design-to-code
description: Generate React/Next.js components from a text description ("make a pricing card with a gradient header and three tiers") or a screenshot/mockup image, matching the project's OWN design system — its Tailwind config, theme tokens, and existing component library (shadcn/ui, etc.) — instead of generic defaults. Always RTL/Farsi-aware by default. Use this skill whenever the user asks to build, generate, scaffold, or recreate any UI component, page section, card, form, modal, layout, or screen from a description or an image, even if they don't say "design-to-code" — including phrases like "make a...", "build a component for...", "recreate this mockup", "turn this screenshot into code", or "I need a UI for...".
---

# Design-to-Code Generator

Generate UI components that look like they were written by someone already on this codebase — same tokens, same primitives, same RTL conventions — not generic Tailwind defaults.

This skill is a **project-specific layer on top of the built-in `frontend-design` skill**. `frontend-design` governs aesthetic taste and avoiding templated looks; consult it for net-new visual direction (a hero, a landing page, anything where you're inventing the look). This skill governs *fidelity to an existing system*: when the user wants output that blends into their current app, the system they already have wins over fresh aesthetic invention. When both apply (e.g. "design a brand-new dashboard that fits our app"), use `frontend-design` for the direction and this skill for the tokens, primitives, and RTL rules.

## Core principle: learn the system before writing a line

Never generate from generic defaults. Before producing any component, learn the project's visual language by reading its config and a sample of real components. Reusing what exists is the whole point — a duplicated button that drifts from the design system is a worse outcome than a slightly imperfect match that uses the real primitive.

## Workflow

### Step 1 — Discover the design system (always, unless already done this session)

Read these in order. Skip any that genuinely don't exist, but actually look first.

1. **Tailwind config** — `tailwind.config.{ts,js,cjs,mjs}`. Extract the `theme.extend` colors, spacing, fonts, border-radius, breakpoints, and any plugins. These are the project's tokens; use them by name (`bg-primary`, `text-muted-foreground`) rather than raw values (`bg-[#1a1a1a]`).
2. **Theme variables** — `globals.css` / `app.css` / wherever CSS custom properties live (`--background`, `--primary`, `--radius`, etc.). shadcn/ui projects define the palette here as HSL triples. Match these.
3. **Component library inventory** — list the existing primitives. For shadcn/ui that's usually `components/ui/`. For other setups, search `components/`, `src/components/`, or the path the project uses. Note what already exists (Button, Card, Dialog, Input, Badge…) so you reuse instead of rebuild.
4. **A sample of real feature components** — read 2–4 non-trivial existing components to learn conventions: how they import (`@/components/ui/...` vs relative), `cn()` / `clsx` usage, variant patterns (`cva`), file naming, whether they're Server or Client Components, and how RTL/Farsi is handled today.

If a `components.json` exists, read it — it tells you the shadcn aliases and style.

When the discovered system contradicts a "best practice" you'd otherwise apply, the discovered system wins. You're matching a house style, not imposing one.

See `references/discovery.md` for concrete commands, what to extract from each file, and how to handle monorepos.

### Step 2 — Understand the request

**For a screenshot or mockup image:** decompose before coding. Don't eyeball the whole thing into one blob. Identify, in order: overall layout/grid → major sections (header, body, footer, sidebar) → repeated units (cards, list items) → spacing rhythm → color palette (mapped to the project's tokens, not raw hex) → typography (sizes/weights mapped to the scale) → interactive states visible in the image. Write this breakdown down briefly, then map each piece to an existing primitive before generating. See `references/screenshot-analysis.md`.

**For a text description:** generate directly *unless* the request is genuinely ambiguous on an axis that changes the code. Don't interrogate the user over things you can infer or reasonably default. Only ask when the answer materially changes the output and you can't infer it from the codebase:
- dark/light mode (if the project supports both and the request implies one specific surface)
- RTL specifics only if the component has direction-sensitive logic the tokens don't cover (carousels, custom drag, icon directionality)
- responsive behavior only if the layout could plausibly collapse more than one way

Ask at most one or two such questions, batched, and only when it matters. Otherwise pick the sensible default, state the assumption in one line, and build.

### Step 3 — Generate

- **Reuse, don't duplicate.** If a Button/Card/Dialog already exists, import it. Only create a new primitive when nothing suitable exists, and when you do, follow the existing primitives' pattern (same variant approach, same file location, same `cn()` usage) so it's indistinguishable from hand-written code.
- **Tokens, not raw values.** Every color, radius, and spacing value should reference the discovered tokens. Raw arbitrary values (`text-[#333]`, `p-[13px]`) are a smell that means you didn't map to the system.
- **RTL/Farsi by default.** This is non-negotiable for this project and baked in from the start, not retrofitted. See `references/rtl-farsi.md` — the short version:
  - Use **logical properties**: `ms-*`/`me-*` (not `ml-*`/`mr-*`), `ps-*`/`pe-*` (not `pl-*`/`pr-*`), `text-start`/`text-end` (not `text-left`/`text-right`), `start-*`/`end-*` for positioning, `border-s`/`border-e`.
  - Use `rounded-s-*`/`rounded-e-*` for direction-aware corners when the design is asymmetric.
  - Flip directional icons (chevrons, arrows) under RTL with `rtl:-scale-x-100` or by swapping the icon.
  - Keep things that should NOT flip (logos, numbers, LTR data like crypto addresses, code, phone numbers) explicitly LTR with `dir="ltr"` on that element.
- **Match the component contract.** Server vs Client Component, prop typing style, and export style should match what you saw in Step 1. Add `"use client"` only when the component needs interactivity/hooks.
- **Accessibility basics:** semantic elements, `aria-*` where the existing components use them, focus-visible states consistent with the project.

### Step 4 — Self-check before returning

Run through `references/output-checklist.md`. The essentials:
- Did I import existing primitives instead of duplicating them?
- Are all colors/spacing/radii referencing tokens, no stray raw hex/px?
- Are all directional utilities logical (`ms`/`me`/`ps`/`pe`/`start`/`end`), with directional icons handled?
- Does the import style, client/server boundary, and naming match the codebase?
- Is anything that must stay LTR (numbers, addresses, code) explicitly marked?

State briefly which existing components you reused and any assumption you defaulted. Keep it short — the user wants the component, not an essay.

## When you genuinely can't find the system

If there's no Tailwind config, no theme file, and no component library (e.g. a blank project), say so in one line, then fall back to the `frontend-design` skill for aesthetic direction — but still apply the RTL/Farsi defaults from `references/rtl-farsi.md`, since that requirement holds regardless of what else exists.
