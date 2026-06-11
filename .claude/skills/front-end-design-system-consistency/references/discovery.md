# Discovery: establishing the design-system canon

Before flagging anything, build the reference set of what's *allowed* and what *already exists*. A violation is only meaningful relative to this canon.

## Find the source-of-truth files

```bash
ls tailwind.config.* 2>/dev/null
cat components.json 2>/dev/null                       # shadcn aliases + style
grep -rl -- "--background\|--primary\|--radius" app/ src/ styles/ 2>/dev/null | head
ls components/ui src/components/ui packages/ui/src 2>/dev/null   # primitive inventory
```

In a monorepo, tokens and primitives often live in shared packages (`packages/ui`, `packages/config`, `packages/tailwind-config`). Search the whole repo; the shared package is the canon that apps consume — drift is when an app reinvents what the package already provides.

## Build the three reference sets

**1. Allowed tokens.** From `tailwind.config` `theme.extend`: the named colors (semantic names like `primary`, `muted`, `destructive`, `card`, `border`), the spacing scale, `borderRadius` steps, `fontFamily`, `fontSize` scale, and custom `screens`. From the theme CSS: the CSS variables and their values. Crucially, record the *actual values* (e.g. `--primary: 222 47% 11%`) so you can detect when a raw hex in the code equals a token — that's a "should be the token" finding, not a free color.

**2. Canonical primitives.** The list of existing components meant to be reused: Button, Card, Dialog/Modal, Input, Select, Badge, Tabs, Tooltip, etc. Note each one's location and its public props/variants. This is what duplication is measured against — if someone hand-rolled a "PrimaryBtn" while `Button variant="default"` exists, that's a duplicate.

**3. House conventions.** From reading 2–4 real components: import style (`@/components/ui/...` vs relative), class composition (`cn()` from `@/lib/utils`?), variant pattern (`cva`?), client/server defaults, naming, and the RTL approach (logical properties? a direction provider?). These define what "consistent structure" means.

## Note the variant APIs

For each primitive built with `cva`, record its declared variants (e.g. Button: `variant` ∈ {default, destructive, outline, ghost, link}, `size` ∈ {sm, default, lg, icon}). Inconsistent-variant findings in Step 2 are often "this could be `<Button variant="ghost">` instead of a bespoke restyle" — you need the variant list to make that call.

## Output of discovery

A compact canon: allowed token names+values, the primitive inventory with their variant APIs, and the convention summary. Every Step-2 finding must point back to a specific entry here as its canonical replacement.
