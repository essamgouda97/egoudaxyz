<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { servicesLanguage } from "$lib/stores/services-language.svelte";
    import {
        ArrowLeft,
        ArrowRight,
        ArrowUpRight,
        CalendarDays,
        FileText,
        HardDrive,
        Mail,
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

    const pageCopy = {
        en: {
            lang: "en",
            dir: "ltr",
            title: "Small software, built around your work | Essam Gouda",
            description:
                "A focused workflow built around your tools and data in one week for $250 CAD.",
            h1: "Small software for your actual work.",
            intro: "One focused workflow, built on your tools and data.",
            schedule: "Sunday to Sunday",
            timing: "Scope · build · install",
            book: "Book a Sunday",
            emailToBook: "Email to book",
            toolsHeading: "Open a tool",
            tools: {
                budget: {
                    title: "Budget",
                    description: "Transactions, monthly totals, CSV export",
                },
                media: {
                    title: "Media requests",
                    description: "A saved queue with editable automation defaults",
                },
                documents: {
                    title: "Document reader",
                    description: "Extract fields, copy JSON, add calendar reminders",
                },
            },
            open: "Open",
            callOne: "First Sunday",
            callOneDetail: "Choose the workflow",
            build: "Six build days",
            buildDetail: "I build and test it",
            callTwo: "Second Sunday",
            callTwoDetail: "Install and review · 2 hours",
            contact: "Questions",
        },
        ar: {
            lang: "ar",
            dir: "rtl",
            title: "برنامج صغير لشغلك | عصام جودة",
            description:
                "Workflow واحدة متفصلة على أدواتك وبياناتك في أسبوع بـ250 دولار كندي.",
            h1: "برنامج صغير معمول لشغلك بجد.",
            intro: "نظام شغل واحد متفصل على أدواتك وبياناتك.",
            schedule: "من الحد للحد",
            timing: "نحدد · نبني · نركب",
            book: "احجز يوم الحد",
            emailToBook: "احجز بالإيميل",
            toolsHeading: "جرب الأدوات",
            tools: {
                budget: {
                    title: "الميزانية",
                    description: "عمليات وحساب الشهر وتصدير CSV",
                },
                media: {
                    title: "طلبات الميديا",
                    description: "طابور محفوظ وإعدادات تقدر تغيرها",
                },
                documents: {
                    title: "قارئ المستندات",
                    description: "استخرج بيانات وانسخ JSON وضيف تذكير",
                },
            },
            open: "افتح",
            callOne: "أول حد",
            callOneDetail: "نحدد المطلوب",
            build: "٦ أيام شغل",
            buildDetail: "نبني ونجرب",
            callTwo: "تاني حد",
            callTwoDetail: "نركب ونراجع · ساعتين",
            contact: "عندك أسئلة؟",
        },
    } as const;

    const copy = $derived(pageCopy[language]);
    const tools = $derived([
        {
            slug: "budget",
            icon: WalletCards,
            ...copy.tools.budget,
        },
        {
            slug: "media",
            icon: HardDrive,
            ...copy.tools.media,
        },
        {
            slug: "documents",
            icon: FileText,
            ...copy.tools.documents,
        },
    ]);
</script>

<svelte:head>
    <title>{copy.title}</title>
    <meta name="description" content={copy.description} />
    <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="services-page" lang={copy.lang} dir={copy.dir}>
    <section class="intro" aria-labelledby="services-title">
        <div class="intro-copy">
            <h1 id="services-title">{copy.h1}</h1>
            <p>{copy.intro}</p>
        </div>

        <div class="offer">
            <div class="price" dir="ltr">
                <strong>{data.offer.displayPrice}</strong>
                <span>{data.offer.currency.toUpperCase()}</span>
            </div>
            <div class="schedule">
                <CalendarDays size={17} />
                <span>{copy.schedule}</span>
                <small>{copy.timing}</small>
            </div>
            {#if data.bookingConfigured && data.paidBookingUrl}
                <Button
                    href={data.paidBookingUrl}
                    target="_blank"
                    rel="noreferrer"
                    class="book-button"
                >
                    {copy.book}
                    {#if copy.dir === "rtl"}
                        <ArrowLeft size={16} />
                    {:else}
                        <ArrowRight size={16} />
                    {/if}
                </Button>
            {:else}
                <Button
                    href="mailto:egouda@bokralabs.com"
                    class="book-button"
                >
                    <Mail size={16} />
                    {copy.emailToBook}
                </Button>
            {/if}
        </div>
    </section>

    <section class="tools" aria-labelledby="tools-heading">
        <h2 id="tools-heading">{copy.toolsHeading}</h2>
        <div class="tool-list">
            {#each tools as tool}
                <a
                    class="tool-row"
                    href={`/services/apps/${tool.slug}?lang=${language}`}
                    data-tool={tool.slug}
                >
                    <span class="tool-icon"><tool.icon size={20} /></span>
                    <span class="tool-copy">
                        <strong>{tool.title}</strong>
                        <small>{tool.description}</small>
                    </span>
                    <span class="tool-open">
                        {copy.open}
                        <ArrowUpRight size={16} />
                    </span>
                </a>
            {/each}
        </div>
    </section>

    <section class="delivery" aria-label={copy.timing}>
        <div>
            <strong>{copy.callOne}</strong>
            <span>{copy.callOneDetail}</span>
        </div>
        <div>
            <strong>{copy.build}</strong>
            <span>{copy.buildDetail}</span>
        </div>
        <div>
            <strong>{copy.callTwo}</strong>
            <span>{copy.callTwoDetail}</span>
        </div>
    </section>

    <footer class="contact">
        <span>{copy.contact}</span>
        <a href="mailto:egouda@bokralabs.com">
            egouda@bokralabs.com
            <ArrowUpRight size={15} />
        </a>
    </footer>
</div>

<style>
    :global(main.container) {
        max-width: 1120px;
    }

    .services-page {
        --service-accent: #ff6b35;
        display: flex;
        flex-direction: column;
        gap: 5rem;
        padding: clamp(2rem, 6vw, 5rem) 0 2rem;
    }

    .services-page[dir="rtl"] {
        font-family: "Cairo", sans-serif;
    }

    h1,
    h2,
    p {
        margin: 0;
        letter-spacing: 0;
        text-wrap: pretty;
    }

    .intro {
        display: grid;
        grid-template-columns: minmax(0, 1.45fr) minmax(270px, 0.55fr);
        align-items: end;
        gap: clamp(3rem, 8vw, 7rem);
        border-bottom: 1px solid var(--border);
        padding-bottom: clamp(3rem, 7vw, 5rem);
    }

    .intro-copy {
        display: flex;
        max-width: 720px;
        flex-direction: column;
        gap: 1.25rem;
    }

    h1 {
        max-width: 13ch;
        font-size: clamp(2.8rem, 7vw, 5.6rem);
        font-weight: 600;
        line-height: 0.98;
    }

    .intro-copy p {
        max-width: 48ch;
        color: var(--muted-foreground);
        font-size: clamp(1rem, 2vw, 1.25rem);
        line-height: 1.55;
    }

    .offer {
        display: flex;
        align-items: stretch;
        flex-direction: column;
        gap: 1.25rem;
    }

    .price {
        display: flex;
        align-items: baseline;
        gap: 0.45rem;
    }

    .price strong {
        font-size: 2.4rem;
        font-weight: 650;
        line-height: 1;
    }

    .price span,
    .schedule small,
    .tool-copy small,
    .delivery span,
    .contact > span {
        color: var(--muted-foreground);
    }

    .price span {
        font-size: 0.7rem;
        font-weight: 650;
    }

    .schedule {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        column-gap: 0.55rem;
        row-gap: 0.15rem;
        font-size: 0.84rem;
        font-weight: 600;
    }

    .schedule :global(svg) {
        grid-row: 1 / 3;
    }

    .schedule small {
        font-size: 0.72rem;
        font-weight: 400;
    }

    .services-page :global(.book-button) {
        min-height: 44px;
        justify-content: space-between;
        background: var(--service-accent);
        color: #151515;
    }

    .services-page :global(.book-button:hover) {
        background: #ef5d2a;
    }

    .tools {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    h2 {
        font-size: clamp(1.5rem, 3vw, 2rem);
        font-weight: 600;
    }

    .tool-list {
        border-top: 1px solid var(--border);
    }

    .tool-row {
        display: grid;
        min-height: 92px;
        grid-template-columns: 44px minmax(0, 1fr) auto;
        align-items: center;
        gap: 1rem;
        border-bottom: 1px solid var(--border);
        padding: 1rem 0.75rem;
        color: inherit;
        text-decoration: none;
        transition: background-color 140ms ease-out;
    }

    .tool-row:hover,
    .tool-row:focus-visible {
        background: var(--muted);
        outline: none;
    }

    .tool-icon {
        display: grid;
        width: 44px;
        height: 44px;
        place-items: center;
        border-radius: 8px;
        background: var(--foreground);
        color: var(--background);
    }

    .tool-copy {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 0.25rem;
    }

    .tool-copy strong {
        font-size: 0.95rem;
        font-weight: 650;
    }

    .tool-copy small {
        overflow: hidden;
        font-size: 0.78rem;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .tool-open {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.78rem;
        font-weight: 650;
    }

    .delivery {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        border-block: 1px solid var(--border);
    }

    .delivery div {
        display: flex;
        min-height: 110px;
        justify-content: center;
        flex-direction: column;
        gap: 0.35rem;
        padding: 1.25rem;
    }

    .delivery div + div {
        border-inline-start: 1px solid var(--border);
    }

    .delivery strong {
        font-size: 0.82rem;
    }

    .delivery span {
        font-size: 0.76rem;
    }

    .contact {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        font-size: 0.78rem;
    }

    .contact a {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        color: inherit;
        font-weight: 600;
        text-decoration: none;
    }

    .contact a:hover {
        text-decoration: underline;
        text-underline-offset: 4px;
    }

    @media (max-width: 760px) {
        .services-page {
            gap: 3.5rem;
            padding-top: 1.5rem;
        }

        .intro {
            grid-template-columns: minmax(0, 1fr);
            gap: 2.5rem;
        }

        .offer {
            max-width: 360px;
        }

        .delivery {
            grid-template-columns: minmax(0, 1fr);
        }

        .delivery div {
            min-height: 82px;
        }

        .delivery div + div {
            border-top: 1px solid var(--border);
            border-inline-start: 0;
        }
    }

    @media (max-width: 480px) {
        h1 {
            font-size: 2.7rem;
        }

        .tool-row {
            grid-template-columns: 40px minmax(0, 1fr) auto;
            gap: 0.75rem;
            padding-inline: 0;
        }

        .tool-icon {
            width: 40px;
            height: 40px;
        }

        .tool-copy small {
            white-space: normal;
        }

        .tool-open {
            font-size: 0;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .tool-row {
            transition: none;
        }
    }
</style>
