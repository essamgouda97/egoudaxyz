<script lang="ts">
    import { onMount } from "svelte";

    let {
        content,
        dir = "ltr",
        lang = "en",
    }: {
        content: string;
        dir?: "ltr" | "rtl";
        lang?: string;
    } = $props();

    let articleEl: HTMLElement | undefined = $state();

    const FOCUS_LINE = 0.4;

    onMount(() => {
        if (!articleEl) return;

        cleanImages(articleEl);
        initMermaid();

        const blocks = Array.from(
            articleEl.querySelectorAll<HTMLElement>(
                "p, li, h1, h2, h3, h4, h5, h6, pre, blockquote, figure, .pretext-figure, .mermaid, .katex-display, hr",
            ),
        );

        // Store base font sizes and pre-measure with Pretext
        for (const block of blocks) {
            const s = getComputedStyle(block);
            block.dataset.baseFontSize = s.fontSize; // e.g. "16px"
        }

        import("@chenglou/pretext").then(({ prepare, layout }) => {
            for (const block of blocks) {
                const text = block.textContent || "";
                if (text.length < 5) continue;
                try {
                    const s = getComputedStyle(block);
                    const basePx = parseFloat(s.fontSize) || 16;
                    const focusPx = basePx * 1.06; // 6% larger when focused
                    const font = s.font;
                    const lh = parseFloat(s.lineHeight) || 28;
                    const w = block.clientWidth || 600;

                    // Measure at both sizes so we know the layout won't break
                    const focusFont = font.replace(`${basePx}px`, `${focusPx}px`);
                    const baseResult = layout(prepare(text, font), w, lh);
                    const focusResult = layout(prepare(text, focusFont), w, lh * 1.06);

                    block.dataset.lines = String(baseResult.lineCount);
                    block.dataset.focusLines = String(focusResult.lineCount);
                    block.dataset.focusFontSize = `${focusPx}px`;
                } catch { /* skip */ }
            }
        });

        let rafId: number;
        const onScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => tick(blocks));
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        // Run immediately + after fly transition settles
        tick(blocks);
        requestAnimationFrame(() => tick(blocks));
        setTimeout(() => tick(blocks), 200);
        setTimeout(() => tick(blocks), 400);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("scroll", onScroll);
        };
    });

    function tick(blocks: HTMLElement[]) {
        const vh = window.innerHeight;
        const focusY = vh * FOCUS_LINE;
        const range = vh * 0.35;

        for (const block of blocks) {
            const rect = block.getBoundingClientRect();
            let dist: number;
            if (rect.top <= focusY && rect.bottom >= focusY) {
                dist = 0;
            } else if (rect.top > focusY) {
                dist = rect.top - focusY;
            } else {
                dist = focusY - rect.bottom;
            }
            const t = Math.min(dist / range, 1);
            const ease = t * t;

            // Opacity: 1.0 → 0.4
            block.style.opacity = String(1 - ease * 0.6);

            // Font size: interpolate between focus size and base size
            // Only for text blocks (not code, images, math)
            const basePx = parseFloat(block.dataset.baseFontSize || "0");
            const focusPx = parseFloat(block.dataset.focusFontSize || "0");
            const isText = block.tagName === "P" || block.tagName === "LI" ||
                           block.tagName === "BLOCKQUOTE";

            if (isText && basePx > 0 && focusPx > 0) {
                const size = focusPx - ease * (focusPx - basePx);
                block.style.fontSize = `${size}px`;
            }
        }
    }

    async function initMermaid() {
        if (!articleEl) return;
        const divs = articleEl.querySelectorAll<HTMLElement>(".mermaid");
        if (divs.length > 0) {
            const mermaid = (await import("mermaid")).default;
            mermaid.initialize({ startOnLoad: false, theme: "dark" });
            await mermaid.run({ nodes: divs });
        }
    }

    function cleanImages(el: HTMLElement) {
        el.querySelectorAll<HTMLImageElement>("img:not(.pretext-processed)").forEach((img) => {
            img.classList.add("pretext-processed");
            const parent = img.parentElement;
            const fig = document.createElement("figure");
            fig.className = "pretext-figure";
            fig.style.cssText = "margin: 2rem 0; text-align: center;";

            if (parent?.tagName === "P") {
                parent.before(fig);
                fig.appendChild(img);
                if (!parent.textContent?.trim()) parent.remove();
            } else {
                img.before(fig);
                fig.appendChild(img);
            }

            const next = fig.nextElementSibling;
            if (next?.tagName === "P" && next.querySelector("em")) {
                const cap = document.createElement("figcaption");
                cap.innerHTML = next.innerHTML;
                cap.style.cssText = "font-size: 0.8rem; color: var(--muted-foreground); padding: 0.5rem 0; text-align: center;";
                fig.appendChild(cap);
                next.remove();
            }

            img.style.cssText = "max-width: 100%; height: auto; border-radius: 0.5rem; display: inline-block;";
        });
    }
</script>

<article
    bind:this={articleEl}
    class="prose pretext-article"
    {dir}
    {lang}
>
    {@html content}
</article>

<style>
    .pretext-article {
        margin: 0 auto;
        padding: 2rem 0 60vh 0;
        line-height: 1.85;
        overflow: visible;
    }

    .pretext-article :global(.katex-display) {
        overflow: visible;
    }

    .pretext-article :global(p),
    .pretext-article :global(li),
    .pretext-article :global(h1),
    .pretext-article :global(h2),
    .pretext-article :global(h3),
    .pretext-article :global(h4),
    .pretext-article :global(h5),
    .pretext-article :global(h6),
    .pretext-article :global(pre),
    .pretext-article :global(blockquote),
    .pretext-article :global(figure),
    .pretext-article :global(.pretext-figure),
    .pretext-article :global(.mermaid),
    .pretext-article :global(.katex-display),
    .pretext-article :global(hr) {
        transition: opacity 0.15s ease-out, font-size 0.2s ease-out;
    }
</style>
