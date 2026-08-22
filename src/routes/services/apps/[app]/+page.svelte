<script lang="ts">
    import FinanceWorkflowDemo from "$lib/components/services/FinanceWorkflowDemo.svelte";
    import HomeServerWorkflowDemo from "$lib/components/services/HomeServerWorkflowDemo.svelte";
    import PaperworkWorkflowDemo from "$lib/components/services/PaperworkWorkflowDemo.svelte";
    import { Button } from "$lib/components/ui/button";
    import { servicesLanguage } from "$lib/stores/services-language.svelte";
    import {
        ArrowLeft,
        ArrowRight,
        Check,
        FileText,
        HardDrive,
        WalletCards,
    } from "@lucide/svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();
    let languageControlsReady = $state(false);

    $effect(() => {
        servicesLanguage.current = data.language;
        languageControlsReady = true;
    });

    const language = $derived(
        languageControlsReady ? servicesLanguage.current : data.language,
    );
    const copyByLanguage = {
        en: {
            back: "Services",
            saved: "Saved on this device",
            budget: "Budget",
            media: "Media",
            documents: "Documents",
        },
        ar: {
            back: "الخدمات",
            saved: "محفوظ على جهازك",
            budget: "الميزانية",
            media: "الميديا",
            documents: "المستندات",
        },
    } as const;
    const copy = $derived(copyByLanguage[language]);
    const apps = $derived([
        { slug: "budget", label: copy.budget, icon: WalletCards },
        { slug: "media", label: copy.media, icon: HardDrive },
        { slug: "documents", label: copy.documents, icon: FileText },
    ]);
    const title = $derived(
        apps.find((app) => app.slug === data.app)?.label ?? copy.budget,
    );
</script>

<svelte:head>
    <title>{title} | Essam Gouda</title>
    <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div
    class="tool-page"
    lang={language}
    dir={language === "ar" ? "rtl" : "ltr"}
>
    <div class="tool-navigation">
        <Button
            href={`/services?lang=${language}`}
            variant="ghost"
            size="sm"
            class="back-button"
            title={copy.back}
        >
            {#if language === "ar"}
                <ArrowRight size={16} />
            {:else}
                <ArrowLeft size={16} />
            {/if}
            <span>{copy.back}</span>
        </Button>

        <nav aria-label="Tools">
            {#each apps as app}
                <a
                    href={`/services/apps/${app.slug}?lang=${language}`}
                    class:active={data.app === app.slug}
                    aria-current={data.app === app.slug ? "page" : undefined}
                    title={app.label}
                >
                    <app.icon size={16} />
                    <span>{app.label}</span>
                </a>
            {/each}
        </nav>

        <span class="save-state">
            <Check size={14} />
            {copy.saved}
        </span>
    </div>

    <main class="tool-surface">
        {#if data.app === "budget"}
            <FinanceWorkflowDemo {language} />
        {:else if data.app === "media"}
            <HomeServerWorkflowDemo {language} />
        {:else}
            <PaperworkWorkflowDemo {language} />
        {/if}
    </main>
</div>

<style>
    :global(main.container) {
        max-width: 1280px;
    }

    .tool-page {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .tool-page[dir="rtl"] {
        font-family: "Cairo", sans-serif;
    }

    .tool-navigation {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 1rem;
        border-bottom: 1px solid var(--border);
        padding-bottom: 0.75rem;
    }

    .tool-page :global(.back-button) {
        gap: 0.4rem;
    }

    nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
    }

    nav a {
        display: inline-flex;
        min-height: 36px;
        align-items: center;
        gap: 0.4rem;
        border-radius: 6px;
        padding: 0.45rem 0.7rem;
        color: var(--muted-foreground);
        font-size: 0.75rem;
        font-weight: 550;
        text-decoration: none;
    }

    nav a:hover,
    nav a:focus-visible {
        background: var(--muted);
        color: var(--foreground);
        outline: none;
    }

    nav a.active {
        background: var(--foreground);
        color: var(--background);
    }

    .save-state {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        color: var(--muted-foreground);
        font-size: 0.7rem;
        white-space: nowrap;
    }

    .tool-surface {
        min-width: 0;
    }

    @media (max-width: 720px) {
        .tool-navigation {
            grid-template-columns: auto minmax(0, 1fr);
        }

        nav {
            justify-content: flex-end;
        }

        .save-state {
            display: none;
        }
    }

    @media (max-width: 520px) {
        .tool-navigation {
            gap: 0.35rem;
        }

        .tool-page :global(.back-button span),
        nav a span {
            display: none;
        }

        nav a {
            width: 36px;
            justify-content: center;
            padding: 0;
        }
    }
</style>
