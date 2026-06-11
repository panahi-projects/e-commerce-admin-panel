# Render-blocking resources

Resources that block the browser from painting delay First Contentful Paint and LCP. The main culprits are CSS, fonts, and synchronous third-party scripts.

## CSS

- **Blocking stylesheets.** All `<link rel="stylesheet">` in `<head>` block rendering until downloaded. Keep critical CSS small; defer or split non-critical CSS. Frameworks like Next.js inline/critical-path CSS automatically — verify it's not being defeated by a giant global stylesheet imported everywhere.
- **Unused CSS.** Large utility frameworks should be purged/tree-shaken (Tailwind's content config must cover all template paths — and ONLY those, so it doesn't scan huge dirs). Check for dead CSS shipped on every route.
- **CSS-in-JS runtime cost.** Runtime CSS-in-JS libraries add JS execution and can serialize styles on the client. Note if a heavy runtime styling lib is in use where a zero-runtime option would help.

## Fonts

Fonts are a frequent, overlooked LCP/CLS cost — and especially relevant for Farsi/Persian apps, where webfonts are large.

- **`font-display`.** Without it, text can be invisible during load (FOIT). Use `font-display: swap` (or `optional`) so text renders immediately. `next/font` sets this up well; verify it's used rather than raw `@font-face` with no display strategy.
- **Self-host & preload.** Self-hosted, preloaded fonts beat third-party font CDNs on the critical path. Preload the fonts actually used above the fold; don't preload everything.
- **Subset large fonts.** A full Persian/Arabic font can be hundreds of KB. Subset to the glyphs/weights actually used. Shipping 4 weights when 2 are used is pure waste. This is often a big, easy win for Farsi apps.
- **Avoid layout shift from font swap.** Use `size-adjust` / fallback metrics (`next/font` handles this) so swapping from fallback to webfont doesn't shift layout (CLS).

## Third-party scripts

- **Synchronous/blocking third-party JS** (analytics, tag managers, chat widgets, A/B tools) is a top cause of poor INP and delayed LCP. Load them with `async`/`defer`, or in Next.js use `next/script` with the right `strategy` (`afterInteractive`, `lazyOnload`, or `worker`).
- **Tag managers** can pull in unbounded additional scripts — flag GTM/heavy marketing tags and recommend auditing what they load.
- **Facade heavy widgets** (chat, video, maps): load a lightweight placeholder, hydrate the real thing on interaction.

## Critical request chain

Look for long dependency chains where the browser can't discover a needed resource until several round-trips in (e.g. CSS → @import → font). Flatten these; preload late-discovered critical resources (`<link rel="preload">`) but sparingly — over-preloading contends for bandwidth.

## How to attribute

For each blocking resource: is it actually critical? If yes, can it be smaller/preloaded? If no, defer/async/lazy it. Name the script/stylesheet/font and the exact attribute or config change. Fonts: state current weights/size vs. what's used.
