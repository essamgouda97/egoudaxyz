<script lang="ts">
    import FinanceWorkflowDemo from "$lib/components/services/FinanceWorkflowDemo.svelte";
    import HomeServerWorkflowDemo from "$lib/components/services/HomeServerWorkflowDemo.svelte";
    import PaperworkWorkflowDemo from "$lib/components/services/PaperworkWorkflowDemo.svelte";
    import { servicesLanguage } from "$lib/stores/services-language.svelte";
    import {
        ArrowDown,
        ArrowLeft,
        ArrowRight,
        CalendarDays,
        LoaderCircle,
        Mail,
        Send,
        ShieldCheck,
    } from "@lucide/svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let question = $state("");
    let questionAnswer = $state("");
    let questionError = $state("");
    let askingQuestion = $state(false);
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
            title: "One-week AI workflow sprint | Essam Gouda",
            description:
                "One AI workflow built around your tools and work data for $250.",
            mark: "SaaSaaS!!",
            h1: "One workflow. Built in one week.",
            intro: "Built around your tools and work data.",
            priceSuffix: "once",
            primaryCta: "Try it",
            secondaryCta: "Pay + book Sunday",
            heroFlow: ["CALL", "BUILD", "CALL"],
            availability: "Sundays",
            proofHeading: "Try it.",
            processHeading: "Sunday. Six build days. Sunday.",
            process: [
                { title: "Sunday", text: "Pick the workflow" },
                { title: "Monday–Saturday", text: "I build it" },
                { title: "Sunday · 2 hours", text: "Install + handoff" },
            ],
            packageHeading: "One workflow",
            packageFlow: ["Call", "Build", "Handoff"],
            paymentSafe: "Paid via Stripe.",
            checkout: "Pay $250 + book",
            checkoutUnavailable: "Booking opens soon",
            checkoutUnavailableSub: "Send one question.",
            questionsHeading: "Not sure?",
            questionPlaceholder: "Ask one question",
            ask: "Ask",
            asking: "One second",
            questionPrivacy: "No private data.",
            emailInstead: "Email egouda@bokralabs.com",
            questionOffline: "Questions are offline.",
        },
        ar: {
            lang: "ar",
            dir: "rtl",
            title: "Workflow بالـAI في أسبوع | عصام جودة",
            description:
                "Workflow بالـAI متفصلة على أدواتك وبيانات شغلك بـ250$.",
            mark: "SaaSaaS!!",
            h1: "Workflow واحدة. بتتبني في أسبوع.",
            intro: "متفصلة على أدواتك وبيانات شغلك.",
            priceSuffix: "مرة واحدة",
            primaryCta: "جربها",
            secondaryCta: "ادفع واحجز الحد",
            heroFlow: ["مكالمة", "بناء", "مكالمة"],
            availability: "كل حد",
            proofHeading: "جربها.",
            processHeading: "الحد. ٦ أيام شغل. الحد.",
            process: [
                { title: "الحد", text: "نختار Workflow" },
                { title: "الاتنين–السبت", text: "أبنيها" },
                { title: "الحد · ساعتين", text: "نركبها ونسلمها" },
            ],
            packageHeading: "Workflow واحدة",
            packageFlow: ["مكالمة", "بناء", "تسليم"],
            paymentSafe: "الدفع بـ Stripe.",
            checkout: "ادفع 250$ واحجز",
            checkoutUnavailable: "الحجز هيفتح قريب",
            checkoutUnavailableSub: "ابعت سؤال.",
            questionsHeading: "مش متأكد؟",
            questionPlaceholder: "اسأل سؤال واحد",
            ask: "اسأل",
            asking: "ثواني",
            questionPrivacy: "من غير بيانات خاصة.",
            emailInstead: "ابعت إيميل لـ egouda@bokralabs.com",
            questionOffline: "الأسئلة واقفة دلوقتي.",
        },
    } as const;

    const copy = $derived(pageCopy[language]);

    async function askQuestion(event: SubmitEvent) {
        event.preventDefault();
        if (askingQuestion || question.trim().length < 2) return;

        askingQuestion = true;
        questionAnswer = "";
        questionError = "";

        try {
            const response = await fetch("/api/services-question", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    question: question.trim(),
                    language,
                }),
            });
            const payload = await response.json();

            if (!response.ok || typeof payload?.answer !== "string") {
                throw new Error(
                    typeof payload?.message === "string"
                        ? payload.message
                        : copy.questionOffline,
                );
            }

            questionAnswer = payload.answer;
        } catch (error) {
            questionError =
                error instanceof Error ? error.message : copy.questionOffline;
        } finally {
            askingQuestion = false;
        }
    }
</script>

<svelte:head>
    <title>{copy.title}</title>
    <meta name="description" content={copy.description} />
    <link rel="canonical" href="https://egouda.xyz/services" />
    <meta property="og:title" content={copy.title} />
    <meta property="og:description" content={copy.description} />
    <meta property="og:url" content="https://egouda.xyz/services" />
</svelte:head>

<div class="services-page" lang={copy.lang} dir={copy.dir}>
    <section class="hero" aria-labelledby="services-title">
        <div class="hero-copy">
            <p class="brand-mark" dir="ltr">{copy.mark}</p>
            <h1 id="services-title">{copy.h1}</h1>
            <p class="hero-intro">{copy.intro}</p>
            <div class="hero-actions">
                <a href="#proof" class="action action-dark">
                    {copy.primaryCta}
                    <ArrowDown size={17} />
                </a>
                <a href="#book" class="action action-light">
                    {copy.secondaryCta}
                    {#if copy.dir === "rtl"}
                        <ArrowLeft size={17} />
                    {:else}
                        <ArrowRight size={17} />
                    {/if}
                </a>
            </div>
        </div>

        <div class="price-tool" aria-label="Service price and schedule">
            <div class="price-line" dir="ltr">
                <strong>{data.offer.displayPrice}</strong>
                <span>{data.offer.currency.toUpperCase()}</span>
            </div>
            <p>{copy.priceSuffix}</p>
            <div class="mini-flow" aria-hidden="true">
                {#each copy.heroFlow as item, index}
                    <span>{item}</span>
                    {#if index < copy.heroFlow.length - 1}<i></i>{/if}
                {/each}
            </div>
            <div class="availability">
                <CalendarDays size={18} />
                <span>{copy.availability}</span>
                <b dir="ltr">egouda@bokralabs.com</b>
            </div>
        </div>
    </section>

    <section class="proof" id="proof" aria-labelledby="proof-title">
        <h2 id="proof-title">{copy.proofHeading}</h2>
        <div class="app-stack">
            <FinanceWorkflowDemo {language} />
            <HomeServerWorkflowDemo {language} />
            <PaperworkWorkflowDemo {language} />
        </div>
    </section>

    <section class="process" aria-labelledby="process-title">
        <h2 id="process-title">{copy.processHeading}</h2>
        <ol>
            {#each copy.process as step, index}
                <li>
                    <span>{index + 1}</span>
                    <div>
                        <h3>{step.title}</h3>
                        <p>{step.text}</p>
                    </div>
                </li>
            {/each}
        </ol>
    </section>

    <section class="booking" id="book" aria-labelledby="booking-title">
        <div class="booking-copy">
            <h2 id="booking-title">
                <span>{copy.packageHeading}</span>
                <b dir="ltr">{data.offer.displayPrice}.</b>
            </h2>
            <div class="package-flow">
                {#each copy.packageFlow as item, index}
                    <strong>{item}</strong>
                    {#if index < copy.packageFlow.length - 1}
                        {#if copy.dir === "rtl"}
                            <ArrowLeft size={18} />
                        {:else}
                            <ArrowRight size={18} />
                        {/if}
                    {/if}
                {/each}
            </div>
        </div>

        <div class="checkout-tool">
            <div class="checkout-price" dir="ltr">
                <strong>{data.offer.displayPrice}</strong>
                <span>{data.offer.currency.toUpperCase()}</span>
            </div>

            {#if data.bookingConfigured && data.paidBookingUrl}
                <a
                    class="checkout-button"
                    href={data.paidBookingUrl}
                    target="_blank"
                    rel="noreferrer"
                >
                    <ShieldCheck size={18} />
                    {copy.checkout}
                </a>
                <p class="payment-note">{copy.paymentSafe}</p>
            {:else}
                <button type="button" class="checkout-button" disabled>
                    <CalendarDays size={18} />
                    {copy.checkoutUnavailable}
                </button>
                <p class="payment-note">{copy.checkoutUnavailableSub}</p>
            {/if}
        </div>
    </section>

    <section class="questions" aria-labelledby="questions-title">
        <div>
            <h2 id="questions-title">{copy.questionsHeading}</h2>
            <a href="mailto:egouda@bokralabs.com">
                <Mail size={16} /> egouda@bokralabs.com
            </a>
        </div>

        <form onsubmit={askQuestion}>
            <label for="service-question" class="sr-only">{copy.questionsHeading}</label>
            <textarea
                id="service-question"
                bind:value={question}
                maxlength="600"
                rows="3"
                placeholder={copy.questionPlaceholder}
            ></textarea>
            <button type="submit" disabled={askingQuestion || question.trim().length < 2}>
                {#if askingQuestion}
                    <span class="spin"><LoaderCircle size={17} /></span> {copy.asking}
                {:else}
                    <Send size={17} /> {copy.ask}
                {/if}
            </button>
        </form>
        <p class="question-note">{copy.questionPrivacy}</p>

        {#if questionAnswer}
            <p class="answer" aria-live="polite">{questionAnswer}</p>
        {:else if questionError}
            <p class="answer error" role="alert">
                {questionError}
                <a href="mailto:egouda@bokralabs.com">{copy.emailInstead}</a>
            </p>
        {/if}
    </section>
</div>

<style>
    :global(main.container) {
        max-width: 1380px;
    }

    .services-page {
        --service-orange: #ff6b35;
        --service-orange-light: #ff8257;
        --service-ink: #111217;
        --service-offwhite: #f8f8f4;
        display: flex;
        flex-direction: column;
        gap: 6rem;
        padding-bottom: 2rem;
    }

    .services-page[dir="rtl"] {
        font-family: "Cairo", sans-serif;
    }

    .hero {
        display: grid;
        box-sizing: border-box;
        min-height: min(540px, calc(100svh - 11rem));
        grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
        align-items: end;
        gap: 5rem;
        overflow: hidden;
        border-radius: 8px;
        background: var(--service-orange);
        padding: 3.25rem;
        color: var(--service-ink);
    }

    .hero-copy {
        max-width: 850px;
    }

    .brand-mark {
        margin: 0 0 1.5rem;
        font-size: 1.65rem;
        font-weight: 700;
    }

    h1,
    h2,
    h3,
    p {
        text-wrap: pretty;
    }

    h1 {
        max-width: 14ch;
        margin: 0;
        font-size: 4.75rem;
        line-height: 0.98;
        letter-spacing: 0;
        text-wrap: balance;
    }

    .services-page[dir="rtl"] h1 {
        max-width: 15ch;
        line-height: 1.18;
    }

    .hero-intro {
        max-width: 43ch;
        margin: 1.65rem 0 0;
        font-size: 1.25rem;
        line-height: 1.5;
    }

    .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 2rem;
    }

    .action {
        display: inline-flex;
        min-height: 48px;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        border-radius: 6px;
        padding: 0.78rem 1rem;
        font-weight: 700;
        text-decoration: none;
        transition: transform 160ms ease-out, background 160ms ease-out;
    }

    .action:hover {
        transform: translateY(-2px);
    }

    .action:focus-visible {
        outline: 3px solid var(--service-ink);
        outline-offset: 3px;
    }

    .action-dark {
        background: var(--service-ink);
        color: var(--service-offwhite);
    }

    .action-light {
        border: 1px solid color-mix(in oklab, var(--service-ink) 35%, transparent);
        background: #ff986f;
        color: var(--service-ink);
    }

    .price-tool {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid color-mix(in oklab, var(--service-ink) 25%, transparent);
        border-radius: 8px;
        background: var(--service-offwhite);
        padding: 1.5rem 1.6rem;
        box-shadow: 8px 8px 0 var(--service-ink);
    }

    .price-line {
        display: flex;
        align-items: baseline;
        gap: 0.55rem;
    }

    .price-line strong {
        font-size: 3.45rem;
        line-height: 1;
        letter-spacing: 0;
    }

    .price-line span {
        font-size: 0.72rem;
        font-weight: 700;
    }

    .price-tool > p {
        margin: 0.45rem 0 1.5rem;
        font-size: 0.75rem;
        font-weight: 700;
    }

    .mini-flow {
        display: grid;
        grid-template-columns: auto 1fr auto 1fr auto;
        align-items: center;
        gap: 0.45rem;
        direction: ltr;
        color: #4e5058;
        font-size: 0.6rem;
        font-weight: 700;
    }

    .mini-flow i {
        height: 1px;
        background: #aaadb6;
    }

    .availability {
        display: grid;
        grid-template-columns: auto auto minmax(0, 1fr);
        align-items: center;
        gap: 0.5rem;
        margin-top: 1.4rem;
        border-top: 1px solid #d8d8d0;
        padding-top: 1rem;
        font-size: 0.7rem;
    }

    .availability b {
        overflow: hidden;
        text-align: end;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .proof,
    .process,
    .questions {
        width: min(1120px, 100%);
        margin-inline: auto;
    }

    h2 {
        margin: 0;
        font-size: 3.2rem;
        line-height: 1.05;
        letter-spacing: 0;
        text-wrap: balance;
    }

    .proof > h2 {
        margin-bottom: 2.25rem;
    }

    .app-stack {
        display: grid;
        gap: 2.6rem;
    }

    .process h2 {
        max-width: 13ch;
    }

    .process ol {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin: 3rem 0 0;
        padding: 0;
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        list-style: none;
    }

    .process li {
        display: grid;
        min-height: 180px;
        grid-template-columns: auto 1fr;
        align-content: space-between;
        gap: 1rem;
        border-inline-end: 1px solid var(--border);
        padding: 1.2rem;
    }

    .process li:last-child {
        border-inline-end: 0;
    }

    .process li > span {
        display: grid;
        width: 30px;
        height: 30px;
        place-items: center;
        border-radius: 50%;
        background: var(--service-orange);
        color: var(--service-ink);
        font-size: 0.78rem;
        font-weight: 700;
    }

    .process li > div {
        grid-column: 1 / -1;
        align-self: end;
    }

    .process h3 {
        margin: 0;
        font-size: 1.05rem;
    }

    .process li p {
        margin: 0.45rem 0 0;
        color: var(--muted-foreground);
        line-height: 1.45;
    }

    .booking {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(310px, 0.72fr);
        gap: 6rem;
        border-radius: 8px;
        background: var(--service-ink);
        padding: 4rem;
        color: var(--service-offwhite);
    }

    .booking-copy h2 span,
    .booking-copy h2 b {
        display: block;
    }

    .booking-copy h2 b {
        color: var(--service-orange);
        font-weight: inherit;
    }

    .package-flow {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        margin-top: 2rem;
        color: #d7d8de;
    }

    .package-flow strong {
        font-size: 0.8rem;
    }

    .package-flow :global(svg) {
        color: var(--service-orange);
    }

    .checkout-tool {
        align-self: center;
        border: 1px solid #484b57;
        border-radius: 8px;
        background: #1b1d24;
        padding: 2rem;
    }

    .checkout-price {
        display: flex;
        align-items: baseline;
        gap: 0.55rem;
        margin-bottom: 1.2rem;
    }

    .checkout-price strong {
        font-size: 3.5rem;
        line-height: 1;
        letter-spacing: 0;
    }

    .checkout-price span {
        color: #b7bac4;
        font-size: 0.72rem;
        font-weight: 700;
    }

    .checkout-button {
        display: inline-flex;
        width: 100%;
        min-height: 52px;
        box-sizing: border-box;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        border: 0;
        border-radius: 6px;
        background: var(--service-orange);
        padding: 0.8rem 1rem;
        color: var(--service-ink);
        font: inherit;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
    }

    .checkout-button:hover:not(:disabled),
    .checkout-button:focus-visible:not(:disabled) {
        background: var(--service-orange-light);
    }

    .checkout-button:focus-visible {
        outline: 3px solid var(--service-offwhite);
        outline-offset: 3px;
    }

    .checkout-button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
    }

    .payment-note {
        margin: 0.8rem 0 0;
        color: #b7bac4;
        font-size: 0.76rem;
    }

    .questions {
        display: grid;
        grid-template-columns: minmax(190px, 0.65fr) minmax(280px, 1.35fr);
        align-items: start;
        gap: 5rem;
    }

    .questions h2 {
        max-width: 8ch;
    }

    .questions > div > a {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        margin-top: 1.2rem;
        color: var(--foreground);
        font-size: 0.82rem;
    }

    .questions form {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: end;
        gap: 0.75rem;
    }

    .questions textarea {
        min-height: 100px;
        resize: vertical;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--background);
        padding: 0.9rem;
        color: var(--foreground);
        font: inherit;
        line-height: 1.45;
    }

    .questions textarea::placeholder {
        color: color-mix(in oklab, var(--foreground) 62%, transparent);
        opacity: 1;
    }

    .questions textarea:focus-visible {
        outline: 3px solid var(--service-orange);
        outline-offset: 2px;
    }

    .questions form button {
        display: inline-flex;
        min-width: 100px;
        min-height: 48px;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        border: 0;
        border-radius: 6px;
        background: var(--service-ink);
        padding: 0.75rem 1rem;
        color: var(--service-offwhite);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
    }

    :global(.dark) .questions form button {
        background: var(--service-offwhite);
        color: var(--service-ink);
    }

    .questions form button:disabled {
        cursor: not-allowed;
        opacity: 0.45;
    }

    .questions form button:focus-visible {
        outline: 3px solid var(--service-orange);
        outline-offset: 2px;
    }

    .answer {
        grid-column: 2;
        margin: -1rem 0 0;
        border-top: 1px solid var(--border);
        padding-top: 1rem;
        line-height: 1.55;
    }

    .answer.error {
        color: var(--destructive);
    }

    .answer a {
        margin-inline-start: 0.35rem;
        color: inherit;
        font-weight: 700;
    }

    .question-note {
        grid-column: 2;
        margin: -1.25rem 0 0;
        color: var(--muted-foreground);
        font-size: 0.72rem;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        clip-path: inset(50%);
    }

    .spin {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @media (max-width: 980px) {
        .hero {
            min-height: auto;
            grid-template-columns: 1fr;
            align-items: start;
            gap: 2.5rem;
            padding: 2.5rem;
        }

        h1 {
            font-size: 3.65rem;
        }

        .price-tool {
            width: min(430px, 100%);
        }

        .booking {
            grid-template-columns: 1fr;
            gap: 2.5rem;
            padding: 3rem;
        }

        .checkout-tool {
            width: 100%;
            box-sizing: border-box;
        }
    }

    @media (max-width: 720px) {
        .services-page {
            gap: 4rem;
        }

        h1 {
            font-size: 2.75rem;
        }

        h2 {
            font-size: 2.35rem;
        }

        .process ol {
            grid-template-columns: 1fr;
        }

        .process li {
            min-height: 130px;
            border-inline-end: 0;
            border-bottom: 1px solid var(--border);
        }

        .process li:last-child {
            border-bottom: 0;
        }

        .questions {
            grid-template-columns: 1fr;
            gap: 1.6rem;
        }

        .answer,
        .question-note {
            grid-column: auto;
        }

        .answer {
            margin-top: 0;
        }

        .question-note {
            margin-top: -1rem;
        }
    }

    @media (max-width: 520px) {
        .services-page {
            gap: 3.5rem;
        }

        .hero,
        .booking {
            margin-inline: -0.5rem;
            border-radius: 8px;
        }

        .hero {
            gap: 1.5rem;
            padding: 1.25rem;
        }

        .brand-mark {
            margin-bottom: 1rem;
            font-size: 1.25rem;
        }

        h1 {
            font-size: 2.35rem;
        }

        .hero-intro {
            margin-top: 1rem;
            font-size: 1rem;
        }

        .hero-actions {
            margin-top: 1.5rem;
        }

        .hero-actions,
        .action {
            width: 100%;
            box-sizing: border-box;
        }

        .price-tool {
            padding: 1rem 1.2rem;
        }

        .price-line strong {
            font-size: 2.8rem;
        }

        .price-tool > p {
            margin-bottom: 0;
        }

        .mini-flow {
            display: none;
        }

        .availability {
            margin-top: 1rem;
            padding-top: 0.75rem;
        }

        .booking {
            padding: 1.5rem 1.25rem;
        }

        .package-flow {
            gap: 0.5rem;
        }

        .package-flow strong {
            font-size: 0.72rem;
        }

        .checkout-tool {
            padding: 1.2rem;
        }

        .questions form {
            grid-template-columns: 1fr;
        }

        .questions form button {
            width: 100%;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .action {
            transition: none;
        }

        .action:hover {
            transform: none;
        }

        .spin {
            animation: none;
        }
    }
</style>
