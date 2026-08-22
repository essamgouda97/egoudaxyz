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
    import { Moon, SlidersHorizontal, Sun, X } from "@lucide/svelte";

    let { inline = false }: { inline?: boolean } = $props();
    let open = $state(false);

    const focusOptions: { value: FocusStyle; label: string }[] = [
        { value: "dim", label: "Dim" },
        { value: "highlight", label: "Highlight" },
        { value: "hide", label: "Hide" },
        { value: "off", label: "Off" },
    ];

    const isBlogPost = $derived(page.url.pathname.startsWith("/blog/") && page.url.pathname !== "/blog/");
    const isServicesPage = $derived(page.url.pathname === "/services");
    const languageOptions: { value: ServicesLanguage; label: string }[] = [
        { value: "en", label: "EN" },
        { value: "ar", label: "عربي" },
    ];
    const controlsCopy = $derived(
        isServicesPage && servicesLanguage.current === "ar"
            ? {
                  title: "الشكل",
                  theme: "المظهر",
                  language: "اللغة",
                  reset: "رجّع",
                  close: "اقفل",
                  hint: "Esc للقفل",
                  light: "فاتح",
                  dark: "غامق",
              }
            : {
                  title: "Style",
                  theme: "Theme",
                  language: "Language",
                  reset: "Reset",
                  close: "Close",
                  hint: "Esc to close",
                  light: "Light mode",
                  dark: "Dark mode",
              },
    );
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
        if (inline) open = false;
    }

    function selectLanguage(value: ServicesLanguage) {
        servicesLanguage.current = value;
        updateServiceUrl({ lang: value });
        if (inline) open = false;
    }

    function resetControls() {
        readingPrefs.reset();
        if (!isServicesPage) return;

        setMode("system");
        servicesLanguage.reset();
        if (browser) {
            const url = new URL(window.location.href);
            url.searchParams.delete("lang");
            url.searchParams.delete("theme");
            replaceState(url, page.state);
        }
        if (inline) open = false;
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
        class:inline
        onclick={() => (open = !open)}
        aria-label={controlsCopy.title}
    >
        <SlidersHorizontal size={15} />
    </button>

    {#if open}
        <!-- Backdrop -->
        <button
            class="controls-backdrop"
            onclick={() => (open = false)}
            aria-label={controlsCopy.close}
            tabindex="-1"
        ></button>

        <!-- Panel -->
        <div class="controls-panel" class:inline>
            <div class="panel-header">
                <span class="panel-title">{controlsCopy.title}</span>
                <button
                    class="close-btn"
                    onclick={() => (open = false)}
                    aria-label={controlsCopy.close}
                >
                    <X size={14} />
                </button>
            </div>

            <!-- Theme -->
            <div class="control-group">
                <span class="control-label">{controlsCopy.theme}</span>
                <div class="control-buttons">
                    <button
                        class="toggle-btn"
                        class:active={mode.current === "light"}
                        onclick={() => selectTheme("light")}
                        aria-label={controlsCopy.light}
                    >
                        <Sun size={14} />
                    </button>
                    <button
                        class="toggle-btn"
                        class:active={mode.current === "dark"}
                        onclick={() => selectTheme("dark")}
                        aria-label={controlsCopy.dark}
                    >
                        <Moon size={14} />
                    </button>
                </div>
            </div>

            {#if isServicesPage}
                <div class="control-group">
                    <span class="control-label">{controlsCopy.language}</span>
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
                <button class="reset-btn" onclick={resetControls}>{controlsCopy.reset}</button>
                <span class="hint">{controlsCopy.hint}</span>
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
    .controls-toggle.inline {
        position: static;
        width: 34px;
        height: 34px;
        border-radius: 6px;
        opacity: 1;
    }

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
        border-radius: 8px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 220px;
        max-width: 320px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    }
    .controls-panel.inline {
        top: 64px;
        right: 16px;
        bottom: auto;
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
