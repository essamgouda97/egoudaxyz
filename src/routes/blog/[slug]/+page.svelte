<script lang="ts">
    import { onMount } from "svelte";
    import { fly } from "svelte/transition";
    import { browser } from "$app/environment";
    import type { PageData } from "./$types";
    import PretextArticle from "$lib/components/blog/PretextArticle.svelte";

    let { data }: { data: PageData } = $props();

    let lang = $state<"en" | "ar">("en");
    let flyX = $state(300);
    let progressWidth = $state(0);
    let columnWidth = $state(680);
    let columns = $state(1);
    let showControls = $state(false);
    let showResumeHint = $state(false);
    let screenWidth = $state(browser ? window.innerWidth : 1440);

    const READING_KEY = `reading-pos:${data.slug}`;
    const PREFS_KEY = `reading-prefs`;

    let ptPrepare: any;
    let ptLayout: any;

    // Load saved prefs
    if (browser) {
        try {
            const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
            if (prefs.columns) columns = prefs.columns;
            if (prefs.columnWidth) columnWidth = prefs.columnWidth;
        } catch { /* defaults */ }
    }

    function savePrefs() {
        localStorage.setItem(PREFS_KEY, JSON.stringify({ columns, columnWidth }));
    }

    function setColumns(n: number) {
        columns = n;
        if (ptPrepare && ptLayout) recalcWidth();
        savePrefs();
    }

    function recalcWidth() {
        if (!ptPrepare || !ptLayout) return;
        // Sample from the currently visible article
        const article = document.querySelector(".pretext-article");
        if (!article) return;
        const samples = Array.from(article.querySelectorAll<HTMLElement>("p"))
            .filter((p) => (p.textContent?.length ?? 0) > 80)
            .slice(0, 5);
        if (samples.length === 0) return;

        const style = getComputedStyle(samples[0]);
        const font = style.font;
        const lh = parseFloat(style.lineHeight) || 28;
        const targetCpl = columns === 1 ? 62 : columns === 2 ? 45 : 35;
        const gap = columns > 1 ? (columns - 1) * 40 : 0;
        const maxW = screenWidth - 80;
        const minW = Math.min(400, maxW);

        let best = 680, bestScore = Infinity;
        for (let w = minW; w <= maxW; w += 20) {
            const colW = (w - gap) / columns;
            let total = 0, count = 0;
            for (const s of samples) {
                const p = ptPrepare(s.textContent || "", font);
                const m = ptLayout(p, colW, lh);
                if (m.lineCount > 0) { total += (s.textContent?.length ?? 0) / m.lineCount; count++; }
            }
            if (count > 0) {
                const score = Math.abs(total / count - targetCpl);
                if (score < bestScore) { bestScore = score; best = w; }
            }
        }
        columnWidth = best;
        savePrefs();
    }

    function toggleLang() {
        flyX = lang === "en" ? -300 : 300;
        lang = lang === "en" ? "ar" : "en";
    }

    onMount(() => {
        // Restore reading position
        const saved = localStorage.getItem(READING_KEY);
        if (saved) {
            const ratio = parseFloat(saved);
            if (ratio > 0.05 && ratio < 0.95) {
                showResumeHint = true;
                setTimeout(() => {
                    const dh = document.documentElement.scrollHeight - window.innerHeight;
                    window.scrollTo({ top: dh * ratio, behavior: "smooth" });
                    setTimeout(() => (showResumeHint = false), 2000);
                }, 300);
            }
        }

        // Scroll handler for progress + save position
        const onScroll = () => {
            const dh = document.documentElement.scrollHeight - window.innerHeight;
            const ratio = dh > 0 ? window.scrollY / dh : 0;
            progressWidth = ratio * 100;
            localStorage.setItem(READING_KEY, String(ratio));
        };
        window.addEventListener("scroll", onScroll, { passive: true });

        const onResize = () => {
            screenWidth = window.innerWidth;
            if (ptPrepare) recalcWidth();
        };
        window.addEventListener("resize", onResize, { passive: true });

        // Load Pretext for width calc
        import("@chenglou/pretext").then(({ prepare, layout }) => {
            ptPrepare = prepare;
            ptLayout = layout;
            const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
            if (!prefs.columnWidth) recalcWidth();
        });

        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
        };
    });

    const canonicalUrl = `https://egouda.xyz/blog/${data.slug}`;
    const ogImage = "https://egouda.xyz/og-image.png";
</script>

<svelte:head>
    <title>{data.title} | Essam Gouda</title>
    {#if data.description}
        <meta name="description" content={data.description} />
    {/if}
    <link rel="canonical" href={canonicalUrl} />
    <meta property="og:type" content="article" />
    <meta property="og:title" content={data.title} />
    {#if data.description}
        <meta property="og:description" content={data.description} />
    {/if}
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={ogImage} />
    {#if data.date}
        <meta property="article:published_time" content={data.date} />
    {/if}
    {#if data.tags && data.tags.length > 0}
        {#each data.tags as tag}
            <meta property="article:tag" content={tag} />
        {/each}
    {/if}
    <meta name="twitter:title" content={data.title} />
    {#if data.description}
        <meta name="twitter:description" content={data.description} />
    {/if}
    <meta name="twitter:image" content={ogImage} />
</svelte:head>

<!-- Progress bar — page-level, never flickers -->
{#if browser}
    <div
        class="fixed top-0 left-0 h-[2px] bg-primary z-50"
        style="width: {progressWidth}%; transition: width 80ms linear;"
    ></div>
{/if}

<!-- Side pointer — page-level -->
{#if browser}
    <div
        class="reading-pointer"
        style="{lang === 'ar' ? 'right' : 'left'}: max(calc(50% - {columnWidth / 2 + 30}px), 8px);"
    >
        <svg width="10" height="12" viewBox="0 0 10 12" fill="var(--primary)" opacity="0.7">
            {#if lang === "ar"}
                <path d="M0 6l10-6v12L0 6z" />
            {:else}
                <path d="M10 6L0 0v12l10-6z" />
            {/if}
        </svg>
    </div>
{/if}

<!-- Controls — page-level -->
{#if browser}
    <button
        class="controls-toggle"
        onclick={() => (showControls = !showControls)}
        aria-label="Reading controls"
    >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="14" y2="18" />
        </svg>
    </button>

    {#if showControls}
        <div class="controls-panel">
            <div class="control-group">
                <span class="control-label">Columns</span>
                <div class="control-buttons">
                    {#each [1, 2, 3] as n}
                        <button
                            class="col-btn"
                            class:active={columns === n}
                            onclick={() => setColumns(n)}
                        >
                            {#each Array(n) as _}
                                <div class="col-bar"></div>
                            {/each}
                        </button>
                    {/each}
                </div>
            </div>
            <div class="control-group">
                <span class="control-label">Width</span>
                <input type="range" min="400" max={screenWidth - 40} step="20" bind:value={columnWidth} oninput={() => savePrefs()} class="width-slider" />
            </div>
            <button class="reset-btn" onclick={() => { columns = 1; localStorage.removeItem(PREFS_KEY); recalcWidth(); showControls = false; }}>Reset</button>
        </div>
    {/if}
{/if}

<!-- Resume hint -->
{#if showResumeHint}
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-card border border-border text-sm text-muted-foreground shadow-lg">
        Resuming where you left off...
    </div>
{/if}

<div style="margin: 0 auto; padding: 0 1rem; overflow-x: hidden;">
    <!-- Post header -->
    <header class="pt-8 pb-6" style="max-width: {columnWidth}px; margin: 0 auto;">
        <h1
            class="text-3xl md:text-4xl font-bold tracking-tight leading-tight"
            dir={lang === "ar" && data.titleAr ? "rtl" : undefined}
            lang={lang === "ar" && data.titleAr ? "ar" : undefined}
        >
            {lang === "ar" && data.titleAr ? data.titleAr : data.title}
        </h1>
        <div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {#if data.date}
                <time datetime={data.date}>{data.date}</time>
            {/if}
            {#if data.readingTime}
                <span>·</span>
                <span>{data.readingTime} min read</span>
            {/if}
            {#if data.hasArabic}
                <span>·</span>
                <button
                    class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border border-border hover:bg-accent transition-colors"
                    onclick={toggleLang}
                >
                    <span class={lang === "en" ? "font-semibold text-foreground" : ""}>EN</span>
                    <span>/</span>
                    <span class={lang === "ar" ? "font-semibold text-foreground" : ""}>AR</span>
                </button>
            {/if}
        </div>
        {#if data.tags && data.tags.length > 0}
            <div class="mt-3 flex flex-wrap gap-2">
                {#each data.tags as tag}
                    <span class="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                {/each}
            </div>
        {/if}
    </header>

    <!-- Post content -->
    <div style="max-width: {columnWidth}px; margin: 0 auto; {columns > 1 ? `column-count: ${columns}; column-gap: 40px; column-rule: 1px solid var(--border);` : ''}">
        {#key lang}
            <div
                in:fly={{ x: -flyX, duration: 350 }}
                out:fly|global={{ x: flyX, duration: 250 }}
            >
                {#if lang === "ar" && data.contentAr}
                    <PretextArticle content={data.contentAr} dir="rtl" lang="ar" />
                {:else}
                    <PretextArticle content={data.content} />
                {/if}
            </div>
        {/key}
    </div>
</div>

<style>
    .reading-pointer {
        position: fixed;
        top: 40vh;
        z-index: 40;
        pointer-events: none;
    }

    .controls-toggle {
        position: fixed;
        top: 12px;
        right: 16px;
        z-index: 51;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        border: 1px solid var(--border);
        background: var(--card);
        color: var(--muted-foreground);
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.2s;
    }
    .controls-toggle:hover { opacity: 1; }

    .controls-panel {
        position: fixed;
        top: 48px;
        right: 16px;
        z-index: 52;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 160px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .control-group { display: flex; flex-direction: column; gap: 4px; }
    .control-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted-foreground); }
    .control-buttons { display: flex; gap: 6px; }

    .col-btn {
        display: flex; gap: 2px; padding: 4px 8px; border-radius: 4px;
        border: 1px solid var(--border); background: transparent; cursor: pointer; transition: background 0.15s;
    }
    .col-btn:hover { background: var(--accent); }
    .col-btn.active { background: var(--primary); border-color: var(--primary); }
    .col-btn.active .col-bar { background: var(--primary-foreground); }
    .col-bar { width: 3px; height: 14px; border-radius: 1px; background: var(--muted-foreground); }

    .width-slider { width: 100%; accent-color: var(--primary); cursor: pointer; }

    .reset-btn { font-size: 0.7rem; color: var(--muted-foreground); background: none; border: none; cursor: pointer; text-align: center; padding: 2px; }
    .reset-btn:hover { color: var(--foreground); }

    @media (max-width: 820px) {
        .reading-pointer { display: none; }
    }
</style>
