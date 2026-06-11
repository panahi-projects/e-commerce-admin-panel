# Token violations

Hardcoded values that bypass the design system's tokens. The most common drift and usually the most mechanical to fix — but verify each is genuinely a violation, not a justified one-off.

## What to look for

**Raw colors instead of token classes.**
- Hex/rgb/hsl literals in `className` arbitrary values: `bg-[#1a1a1a]`, `text-[#666]`, `border-[rgb(...)]`.
- Inline `style={{ color: '#...' }}`.
- For each, check whether the value equals (or is close to) a token's value recorded in discovery. If `#1a1a1a` is your `--primary`, the fix is `bg-primary` — a true violation. If it's a genuinely new color used once, that's a different conversation (maybe the palette needs a token, maybe it's justified): mark as "review."

**Off-scale spacing.** Arbitrary spacing that maps to an existing scale step: `p-[16px]` when `p-4` exists, `gap-[8px]` → `gap-2`, `mt-[13px]` (off-scale — does the design really need 13px, or is it eyeballed?). Map to the nearest scale step; flag truly off-scale values as "review — intentional or accident?"

**Magic dimensions.** `w-[412px]`, `h-[37px]` — arbitrary sizes that could be scale steps, content-driven (`w-fit`, `w-full`), or token-based. Some are legitimate (an exact image slot); verify.

**Bypassed radius.** `rounded-[10px]` instead of `rounded-lg`; raw `border-radius` in CSS instead of `var(--radius)`-derived tokens.

**Bypassed typography.** Hardcoded `text-[15px]`, `font-[500]`, or a raw `font-family` instead of the type-scale classes (`text-base`, `font-medium`) and the registered `fontFamily` tokens. For a Farsi app, also flag Farsi text falling back to a Latin-only `font-sans` instead of the Persian family token.

**Shadow / z-index / transition magic numbers.** Ad-hoc `shadow-[...]`, raw `z-[9999]`, one-off transition durations where the system defines tokens/scale. Inconsistent z-index especially causes real stacking bugs.

## How to report

Group by the canonical token they map to: "12 occurrences of `#0F172A` across 7 files → `bg-primary` / `text-primary`." Give counts and file spread. Separate the confident, mechanical replacements (exact token match) from "review" items (genuinely new or off-scale values that need a human decision about whether to add a token or keep the one-off). Mechanical exact-match replacements are safe to offer to auto-apply.
