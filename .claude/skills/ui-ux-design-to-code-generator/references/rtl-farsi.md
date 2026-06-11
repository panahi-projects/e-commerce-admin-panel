# RTL / Farsi-aware generation

This project requires Farsi (RTL) support. Build it in from the start with **logical CSS properties** so a single component works in both directions — retrofitting `ml→mr` later across a codebase is painful and error-prone.

## Logical property cheatsheet (Tailwind)

| Don't use (physical) | Use (logical)        | Effect                          |
|----------------------|----------------------|---------------------------------|
| `ml-*` / `mr-*`      | `ms-*` / `me-*`      | margin start / end              |
| `pl-*` / `pr-*`      | `ps-*` / `pe-*`      | padding start / end             |
| `left-*` / `right-*` | `start-*` / `end-*`  | inset start / end (positioning) |
| `text-left` / `-right`| `text-start` / `-end`| text alignment                  |
| `border-l` / `border-r` | `border-s` / `border-e` | border start / end       |
| `rounded-l-*` / `-r-*` | `rounded-s-*` / `-e-*` | asymmetric corners           |
| `float-left` / `-right` | `float-start` / `-end` | floats                       |

`flex` / `gap` / `grid` are already direction-agnostic and flip automatically — no change needed. Centering (`mx-auto`, `justify-center`) is fine as-is.

## Directional content that must NOT flip

Pin these LTR even inside an RTL layout, or they'll render backwards/confusingly:
- Numbers, prices, percentages → `dir="ltr"` (and `tabular-nums` for alignment)
- Crypto wallet addresses, hashes, transaction IDs
- Code snippets, URLs, emails
- Phone numbers
- Latin brand names / logos when mixed into Farsi text

```tsx
<span dir="ltr" className="tabular-nums">{formatToman(amount)}</span>
<code dir="ltr">0x3f...a91</code>
```

For Persian numerals vs Latin, follow whatever the project already does (a formatter util or `toLocaleString('fa-IR')`); don't introduce a new convention.

## Directional icons

Chevrons, arrows, "back/next" carets point the wrong way when the layout mirrors. Either swap the icon under RTL or flip it:

```tsx
{/* flips automatically with direction */}
<ChevronLeft className="rtl:-scale-x-100" />
```
Don't flip icons that are *not* directional (a checkmark, a trash can, a user avatar).

## Setting direction

Match the project's existing approach (an `i18n`/`next-intl` provider, a `dir` attribute on `<html>`, or a context). If the component needs to declare direction itself, set `dir="rtl"` on its root, but prefer inheriting from the app's existing direction provider rather than hardcoding on every component. If the project supports both locales, ensure the component is correct under both rather than assuming RTL everywhere.

## Fonts

Use the project's registered Farsi font family (often Vazirmatn, IRANSans, or similar) via the Tailwind `fontFamily` token — don't fall back to a Latin-only `font-sans` for Farsi text, which produces poor glyph rendering.
