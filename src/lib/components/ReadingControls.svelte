<script lang="ts">
    import { mode, setMode } from "mode-watcher";
    import { replaceState } from "$app/navigation";
    import { readingPrefs, type FocusStyle } from "$lib/stores/reading.svelte";
    import {
        servicesLanguage,
    } from "$lib/stores/services-language.svelte";
    import type { ServicesLanguage } from "$lib/services-language";
    import { browser } from "$app/environment";
    import { page } from "$app/state";

    let open = $state(false);

    const focusOptions: { value: FocusStyle; label: string }[] = [
        { value: "dim", label: "Dim" },
        { value: "highlight", label: "Highlight" },
        { value: "hide", label: "Hide" },
        { value: "off", label: "Off" },
    ];

    const isBlogPost = $derived(page.url.pathname.startsWith("/blog/") && page.url.pathname !== "/blog/");
    const isServicesPage = $derived(page.url.pathname === "/" || page.url.pathname === "/services");
    const languageOptions: { value: ServicesLanguage; label: string }[] = [
        { value: "en", label: "EN" },
        { value: "ar", label: "عربي" },
    ];
    type ThemeMode = "light" | "dark";

    function currentThemeParam() {
        const queryTheme = new URL(window.location.href).searchParams.get("theme");
        if (
            queryTheme === "light" ||
            queryTheme === "dark" ||
            queryTheme === "system"
        ) {
            return queryTheme;
        }

        return mode.current === "dark" ? "dark" : "light";
    }

    function updateServiceUrl(params: { lang?: ServicesLanguage; theme?: ThemeMode }) {
        if (!browser || !isServicesPage) return;

        const url = new URL(window.location.href);
        url.searchParams.set("lang", params.lang ?? servicesLanguage.current);
        url.searchParams.set("theme", params.theme ?? currentThemeParam());
        replaceState(url, page.state);
    }

    function selectTheme(value: ThemeMode) {
        setMode(value);
        updateServiceUrl({ theme: value });
    }

    function selectLanguage(value: ServicesLanguage) {
        servicesLanguage.current = value;
        updateServiceUrl({ lang: value });
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && open) open = false;
        if (e.key === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA") return;
            const idx = focusOptions.findIndex((o) => o.value === readingPrefs.focusStyle);
            readingPrefs.focusStyle = focusOptions[(idx + 1) % focusOptions.length].value;
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if browser}
    <!-- Toggle button -->
    <button
        class="controls-toggle"
        onclick={() => (open = !open)}
        aria-label="Reading controls"
    >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="14" y2="18" />
        </svg>
    </button>

    {#if open}
        <!-- Backdrop -->
        <button
            class="controls-backdrop"
            onclick={() => (open = false)}
            aria-label="Close controls"
            tabindex="-1"
        ></button>

        <!-- Panel -->
        <div class="controls-panel">
            <div class="panel-header">
                <span class="panel-title">Style</span>
                <button
                    class="close-btn"
                    onclick={() => (open = false)}
                    aria-label="Close controls"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <!-- Theme -->
            <div class="control-group">
                <span class="control-label">Theme</span>
                <div class="control-buttons">
                    <button
                        class="toggle-btn"
                        class:active={mode.current === "light"}
                        onclick={() => selectTheme("light")}
                        aria-label="Light mode"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    </button>
                    <button
                        class="toggle-btn"
                        class:active={mode.current === "dark"}
                        onclick={() => selectTheme("dark")}
                        aria-label="Dark mode"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                    </button>
                </div>
            </div>

            {#if isServicesPage}
                <div class="control-group">
                    <span class="control-label">Language</span>
                    <div class="control-buttons">
                        {#each languageOptions as opt}
                            <button
                                class="toggle-btn"
                                class:active={servicesLanguage.current === opt.value}
                                onclick={() => selectLanguage(opt.value)}
                            >
                                {opt.label}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Focus Style -->
            {#if isBlogPost}
                <div class="control-group">
                    <span class="control-label">Focus Style <kbd>F</kbd></span>
                    <div class="control-buttons">
                        {#each focusOptions as opt}
                            <button
                                class="toggle-btn"
                                class:active={readingPrefs.focusStyle === opt.value}
                                onclick={() => (readingPrefs.focusStyle = opt.value)}
                            >
                                {opt.label}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Columns -->
                <div class="control-group">
                    <span class="control-label">Columns</span>
                    <div class="control-buttons">
                        {#each [1, 2, 3] as n}
                            <button
                                class="toggle-btn col-btn"
                                class:active={readingPrefs.columns === n}
                                onclick={() => (readingPrefs.columns = n)}
                            >
                                {#each Array(n) as _}
                                    <div class="col-bar"></div>
                                {/each}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Width -->
                <div class="control-group">
                    <span class="control-label">Width</span>
                    <input
                        type="range"
                        min="400"
                        max="1400"
                        step="20"
                        bind:value={readingPrefs.columnWidth}
                        oninput={() => readingPrefs.save()}
                        class="width-slider"
                    />
                </div>
            {/if}

            <div class="panel-footer">
                <button class="reset-btn" onclick={() => { readingPrefs.reset(); }}>Reset</button>
                <span class="hint">Esc to close</span>
            </div>
        </div>
    {/if}
{/if}

<style>
    .controls-toggle {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 51;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--card);
        color: var(--muted-foreground);
        cursor: pointer;
        opacity: 0.5;
        transition: opacity 0.2s;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .controls-toggle:hover { opacity: 1; }

    .controls-backdrop {
        position: fixed;
        inset: 0;
        z-index: 51;
        background: transparent;
        border: none;
        cursor: default;
    }

    .controls-panel {
        position: fixed;
        bottom: 70px;
        right: 24px;
        z-index: 52;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 220px;
        max-width: 320px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .panel-title {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--foreground);
    }
    .close-btn {
        background: none;
        border: none;
        color: var(--muted-foreground);
        cursor: pointer;
        padding: 2px;
        display: flex;
        align-items: center;
    }
    .close-btn:hover { color: var(--foreground); }

    .control-group { display: flex; flex-direction: column; gap: 6px; }
    .control-label {
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted-foreground);
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .control-label kbd {
        font-size: 0.55rem;
        padding: 1px 4px;
        border-radius: 3px;
        border: 1px solid var(--border);
        background: var(--muted);
        color: var(--muted-foreground);
    }
    .control-buttons { display: flex; gap: 4px; }

    .toggle-btn {
        padding: 5px 10px;
        border-radius: 6px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--muted-foreground);
        cursor: pointer;
        font-size: 0.72rem;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        gap: 3px;
    }
    .toggle-btn:hover { background: var(--accent); color: var(--foreground); }
    .toggle-btn.active {
        background: var(--foreground);
        color: var(--background);
        border-color: var(--foreground);
    }

    .col-btn { padding: 5px 8px; }
    .col-bar {
        width: 3px;
        height: 14px;
        border-radius: 1px;
        background: currentColor;
    }

    .width-slider { width: 100%; accent-color: var(--primary); cursor: pointer; }

    .panel-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .reset-btn {
        font-size: 0.65rem;
        color: var(--muted-foreground);
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 0;
    }
    .reset-btn:hover { color: var(--foreground); }
    .hint {
        font-size: 0.6rem;
        color: var(--muted-foreground);
        opacity: 0.6;
        font-style: italic;
    }
</style>
