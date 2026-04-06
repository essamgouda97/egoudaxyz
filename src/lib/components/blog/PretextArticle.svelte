<script lang="ts">
    import { onMount } from "svelte";
    import { mode } from "mode-watcher";
    import { readingPrefs } from "$lib/stores/reading.svelte";

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

    // Line geometry for hide mode
    type LineGeo = { y: number; width: number; height: number };
    const blockLines = new WeakMap<HTMLElement, LineGeo[]>();

    onMount(() => {
        if (!articleEl) return;

        cleanImages(articleEl);
        initMermaid();

        const blocks = Array.from(
            articleEl.querySelectorAll<HTMLElement>(
                "p, li, h1, h2, h3, h4, h5, h6, pre, blockquote, figure, .pretext-figure, .mermaid, .katex-display, hr",
            ),
        );

        for (const block of blocks) {
            const s = getComputedStyle(block);
            block.dataset.baseFontSize = s.fontSize;
        }

        import("@chenglou/pretext").then(({ prepare, layout, prepareWithSegments, layoutWithLines }) => {
            for (const block of blocks) {
                const text = block.textContent || "";
                if (text.length < 5) continue;
                try {
                    const s = getComputedStyle(block);
                    const basePx = parseFloat(s.fontSize) || 16;
                    const focusPx = basePx * 1.06;
                    const font = s.font;
                    const lh = parseFloat(s.lineHeight) || 28;
                    const w = block.clientWidth || 600;

                    const focusFont = font.replace(`${basePx}px`, `${focusPx}px`);
                    const baseResult = layout(prepare(text, font), w, lh);
                    const focusResult = layout(prepare(text, focusFont), w, lh * 1.06);

                    block.dataset.lines = String(baseResult.lineCount);
                    block.dataset.focusLines = String(focusResult.lineCount);
                    block.dataset.focusFontSize = `${focusPx}px`;

                    // Pre-compute line geometry for hide mode
                    try {
                        const prepared = prepareWithSegments(text, font);
                        const result = layoutWithLines(prepared, w, lh);
                        const lines: LineGeo[] = result.lines.map((line: { width: number }, idx: number) => ({
                            y: idx * lh,
                            width: Math.min(line.width, w),
                            height: lh * 0.65,
                        }));
                        blockLines.set(block, lines);
                    } catch { /* hide mode just won't have accurate bars */ }
                } catch { /* skip */ }
            }
        });

        let rafId: number;
        const onScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => tick(blocks));
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        tick(blocks);
        requestAnimationFrame(() => tick(blocks));
        setTimeout(() => tick(blocks), 200);
        setTimeout(() => tick(blocks), 400);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("scroll", onScroll);
        };
    });

    // Re-run tick when focus style changes
    $effect(() => {
        readingPrefs.focusStyle;
        if (!articleEl) return;
        const blocks = Array.from(
            articleEl.querySelectorAll<HTMLElement>(
                "p, li, h1, h2, h3, h4, h5, h6, pre, blockquote, figure, .pretext-figure, .mermaid, .katex-display, hr",
            ),
        );
        tick(blocks);
    });

    function tick(blocks: HTMLElement[]) {
        const vh = window.innerHeight;
        const focusY = vh * FOCUS_LINE;
        const range = vh * 0.35;
        const style = readingPrefs.focusStyle;

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

            const basePx = parseFloat(block.dataset.baseFontSize || "0");
            const focusPx = parseFloat(block.dataset.focusFontSize || "0");
            const isText = block.tagName === "P" || block.tagName === "LI" ||
                           block.tagName === "BLOCKQUOTE";

            // Reset styles
            block.style.opacity = "";
            block.style.fontSize = "";
            block.style.fontWeight = "";
            block.style.color = "";

            // Remove existing hide bars
            const existingOverlay = block.querySelector(".hide-overlay");
            if (existingOverlay) existingOverlay.remove();

            if (style === "off") continue;

            if (style === "dim") {
                block.style.opacity = String(1 - ease * 0.6);
                if (isText && basePx > 0 && focusPx > 0) {
                    const size = focusPx - ease * (focusPx - basePx);
                    block.style.fontSize = `${size}px`;
                }
            } else if (style === "highlight") {
                block.style.opacity = String(1 - ease * 0.7);
                if (ease < 0.1 && isText) {
                    block.style.fontWeight = "600";
                }
            } else if (style === "hide") {
                if (ease > 0.15) {
                    // Hide: overlay gray bars on unfocused blocks
                    block.style.color = "transparent";
                    const lines = blockLines.get(block);
                    if (lines && lines.length > 0) {
                        if (!block.style.position || block.style.position === "static") {
                            block.style.position = "relative";
                        }
                        const overlay = document.createElement("div");
                        overlay.className = "hide-overlay";
                        overlay.style.cssText = "position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;";
                        for (const line of lines) {
                            const bar = document.createElement("div");
                            bar.style.cssText = `position:absolute;top:${line.y + line.height * 0.25}px;${dir === "rtl" ? "right" : "left"}:0;width:${line.width}px;height:${line.height}px;background:var(--muted-foreground);opacity:0.2;border-radius:3px;`;
                            overlay.appendChild(bar);
                        }
                        block.appendChild(overlay);
                    } else {
                        block.style.opacity = "0.08";
                        block.style.color = "";
                    }
                } else {
                    block.style.opacity = "1";
                }
            }
        }
    }

    function syncExcalidrawTheme() {
        if (!articleEl) return;
        const iframes = articleEl.querySelectorAll<HTMLIFrameElement>('iframe[src*="excalidraw.com"]');
        const isDark = mode.current === "dark";
        for (const iframe of iframes) {
            const url = new URL(iframe.src);
            if (isDark) {
                url.searchParams.set("darkMode", "true");
            } else {
                url.searchParams.delete("darkMode");
            }
            if (iframe.src !== url.toString()) {
                iframe.src = url.toString();
            }
        }
    }

    $effect(() => {
        mode.current;
        syncExcalidrawTheme();
    });

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
        transition: opacity 0.15s ease-out, font-size 0.2s ease-out, color 0.15s ease-out, font-weight 0.15s ease-out;
    }
</style>
