# Discovery: reading the project's design system

Goal: build an accurate picture of the project's tokens, primitives, and conventions so generated code is indistinguishable from existing code. Spend a little effort here; it pays for itself.

## Find the files fast

```bash
# Tailwind config (any extension)
ls tailwind.config.* 2>/dev/null
# shadcn/ui manifest — gives you aliases + style
cat components.json 2>/dev/null
# Theme variables (CSS custom properties)
grep -rl -- "--background\|--primary\|--radius" app/ src/ styles/ 2>/dev/null | head
# Where the UI primitives live
ls components/ui src/components/ui 2>/dev/null
```

In a monorepo (this project uses a Next.js + TypeScript monorepo), the config and the `ui/` package may live in a shared package (e.g. `packages/ui`, `packages/config`) rather than the app. Search the whole repo, and prefer the shared package's primitives — that's the source of truth multiple apps consume.

## What to extract from each source

**tailwind.config** — read `theme.extend`:
- `colors` → the named palette. These map to your `bg-*`/`text-*`/`border-*` classes. Note semantic names (`primary`, `secondary`, `muted`, `destructive`, `accent`) — prefer these over literal color names.
- `borderRadius` → often `lg/md/sm` derived from `--radius`. Use `rounded-lg` etc., not raw px.
- `fontFamily` → the registered families (often a Persian/Farsi font like Vazirmatn or IRANSans alongside a Latin fallback). Use the family names, and check which is the default `sans`.
- `screens` → custom breakpoints. Use the project's names; don't assume default `sm/md/lg/xl`.
- `plugins` → e.g. `tailwindcss-animate` (shadcn), RTL plugins, typography. Their presence tells you what utilities are available.

**Theme CSS (globals.css)** — shadcn defines colors as HSL channel triples consumed via `hsl(var(--primary))`. Match the existing variable names exactly. Note whether a `.dark` block exists (dark-mode support) and whether `[dir="rtl"]` or `html[dir]` rules exist (existing RTL handling you should be consistent with).

**components.json** — `aliases.components` and `aliases.ui` give the import paths (`@/components/ui`). `style` (`default` vs `new-york`) and `tailwind.cssVariables` tell you the shadcn flavor so new primitives match.

**Existing components (read 2–4 real ones)** — learn:
- import convention: `@/components/ui/button` vs relative paths
- `cn()` location (usually `@/lib/utils`) and how it's used to merge classes
- variant pattern: do they use `cva` for variants? Mirror it.
- Server vs Client: is `"use client"` present only where hooks/handlers exist?
- naming/exports: named vs default export, PascalCase files vs kebab-case
- existing RTL treatment: logical properties already in use? a direction provider? an `i18n`/`next-intl` setup?

## Output of discovery

Hold (briefly, in your reasoning) a short inventory: token names available, list of existing primitives you can reuse, import style, and the RTL approach already in place. Generation in the next step should only use things from this inventory unless something genuinely doesn't exist yet.
