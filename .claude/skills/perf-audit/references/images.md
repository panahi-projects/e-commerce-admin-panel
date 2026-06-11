# Images & media

Images are frequently the LCP element and a top cause of CLS. Optimizing them is often the single biggest visual-loading win and is usually low-effort.

## What to look for

**The LCP image isn't prioritized.** The largest above-the-fold image (hero, banner, product shot) should load eagerly with high priority, not lazy-loaded.
- `next/image`: add `priority` to the LCP image; do NOT lazy-load it. Lazy-load everything below the fold (default for `next/image`).
- Plain `<img>`: `fetchpriority="high"` on the LCP image, `loading="lazy"` on below-the-fold ones, and preload the LCP image if it's discovered late.

**Missing dimensions → CLS.** Images without width/height (or an aspect-ratio box) cause layout shift when they load. Every image needs reserved space: `width`/`height` attributes, `aspect-ratio` CSS, or `next/image`'s required dimensions / `fill` with a sized parent.

**Wrong/old formats.** Serve AVIF or WebP with fallbacks instead of JPEG/PNG where supported. `next/image` handles this automatically if configured; manual `<img>` should use `<picture>` with modern sources.

**Oversized images.** A 3000px image rendered at 400px wastes bytes and decode time. Use responsive `srcset`/`sizes` (or `next/image` `sizes`) so each device gets an appropriately scaled image. Flag any raw image whose intrinsic size dwarfs its display size.

**No lazy-loading for offscreen media.** Below-the-fold images, and especially iframes/video embeds (YouTube, maps), should be deferred. Consider facade patterns for heavy embeds (a lightweight placeholder that loads the real embed on interaction).

**Unoptimized SVGs / icon sprites.** Large inline SVGs repeated across the page, or un-minified SVGs, add up. Inline only what's needed; consider sprite sheets for repeated icons.

**`next/image` misconfiguration.** Check `next.config` image settings: allowed domains/remote patterns, formats (`['image/avif','image/webp']`), and that the loader isn't bypassed with `unoptimized`. A common mistake is `unoptimized` set globally, which silently disables all of the above.

## How to attribute

Identify the actual LCP element first (from Lighthouse, or by inspecting the above-the-fold hero). Then for each significant image: is it correctly prioritized/lazy, sized to prevent CLS, in a modern format, and not oversized? Name the file and the one-line fix. Quantify when possible ("hero is a 1.2 MB PNG; converting to AVIF + sizing ≈ 300 KB, likely cuts LCP by >1s on mobile").
