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
        Check,
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
                "One custom AI workflow built around your work and data for $250. " +
                "Requirements on Sunday, one focused build week, then setup and review.",
            mark: "SaaSaaS!!",
            markLong: "SaaS as a Service.",
            h1: "Your weird workflow. Working in one week.",
            intro:
                "I build one specific AI workflow around your day-to-day work and your own data.",
            priceSuffix: "once · one focused sprint",
            primaryCta: "See what that means",
            secondaryCta: "Pay + book Sunday",
            proofHeading: "This kind of thing.",
            proofSub: "Every number, name, file, and event is fictional.",
            demoLabels: ["Your money", "Your house", "Your paperwork"],
            processHeading: "Two Sundays. One build week.",
            process: [
                {
                    title: "Sunday · requirements",
                    text: "We pick one painful workflow and define done.",
                },
                {
                    title: "Monday–Saturday · build",
                    text: "I wire the workflow around your tools and data.",
                },
                {
                    title: "Sunday · setup + review",
                    text: "Two hours. We install it, run it, and hand it over.",
                },
            ],
            packageHeading: "One workflow. Fixed price.",
            packageItems: [
                "Requirements call",
                "One focused build week",
                "Two-hour setup + review",
                "Your tools. Your data. Your control.",
            ],
            paymentSafe: "Cal.com confirms the slot only after Stripe payment.",
            checkout: "Pay securely + choose Sunday",
            checkoutUnavailable: "Paid booking opens soon.",
            checkoutUnavailableSub:
                "Ask a question or email me before the first slot opens.",
            questionsHeading: "One question? Ask it.",
            questionPlaceholder: "Will this work with my spreadsheets and email?",
            ask: "Ask",
            asking: "Asking",
            questionPrivacy: "Sent to DeepSeek. Do not paste private or client data.",
            emailInstead: "Email egouda@bokralabs.com",
            synthetic: "Public demos use synthetic data only.",
        },
        ar: {
            lang: "ar",
            dir: "rtl",
            title: "AI workflow في أسبوع | عصام جودة",
            description:
                "AI workflow واحدة معمولة على شغلك وداتا بتاعتك بـ250 دولار. " +
                "متطلبات يوم الأحد، أسبوع شغل، وبعدها setup ومراجعة.",
            mark: "SaaSaaS!!",
            markLong: "SaaS as a Service.",
            h1: "الـworkflow الغريبة بتاعتك. شغالة في أسبوع.",
            intro:
                "ببني AI workflow واحدة محددة حوالين شغلك اليومي " +
                "وداتا بتاعتك.",
            priceSuffix: "مرة واحدة · sprint واحدة",
            primaryCta: "شوف أمثلة",
            secondaryCta: "ادفع واحجز الأحد",
            proofHeading: "حاجات زي دي.",
            proofSub: "كل الأرقام والأسامي والملفات والأحداث خيالية.",
            demoLabels: ["فلوسك", "بيتك", "ورقك"],
            processHeading: "اتنين أحد. وأسبوع شغل.",
            process: [
                {
                    title: "الأحد · متطلبات",
                    text: "بنختار workflow واحدة موجعة ونحدد شكل النجاح.",
                },
                {
                    title: "الاثنين–السبت · بناء",
                    text: "بربط الـworkflow بأدواتك وداتا بتاعتك.",
                },
                {
                    title: "الأحد · setup ومراجعة",
                    text: "ساعتين. بنركبها، نجربها، وأسلمهالك.",
                },
            ],
            packageHeading: "workflow واحدة. سعر ثابت.",
            packageItems: [
                "مكالمة متطلبات",
                "أسبوع شغل مركز",
                "ساعتين setup ومراجعة",
                "أدواتك. داتا بتاعتك. تحكمك.",
            ],
            paymentSafe: "Cal.com بيأكد الـslot بعد الدفع على Stripe بس.",
            checkout: "ادفع بأمان واختار الأحد",
            checkoutUnavailable: "الحجز المدفوع هيفتح قريب.",
            checkoutUnavailableSub:
                "اسأل سؤال أو ابعتلي إيميل قبل أول slot.",
            questionsHeading: "سؤال واحد؟ اسأله.",
            questionPlaceholder: "ينفع مع الـspreadsheets والإيميل بتوعي؟",
            ask: "اسأل",
            asking: "بيجاوب",
            questionPrivacy: "بيتبعث لـDeepSeek. متبعتش داتا خاصة أو داتا عميل.",
            emailInstead: "ابعت لـ egouda@bokralabs.com",
            synthetic: "كل الـdemos العامة بداتا خيالية بس.",
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
                        : "Questions are offline.",
                );
            }

            questionAnswer = payload.answer;
        } catch (error) {
            questionError =
                error instanceof Error
                    ? error.message
                    : "Questions are offline.";
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
            <p class="brand-mark" dir="ltr">
                <strong>{copy.mark}</strong>
                <span>{copy.markLong}</span>
            </p>
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

        <div class="price-tool" aria-label="Service price and scope">
            <div class="price-line" dir="ltr">
                <strong>{data.offer.displayPrice}</strong>
                <span>{data.offer.currency.toUpperCase()}</span>
            </div>
            <p>{copy.priceSuffix}</p>
            <div class="mini-flow" dir="ltr" aria-hidden="true">
                <span>CALL</span><i></i><span>BUILD</span><i></i><span>CALL</span>
            </div>
            <div class="availability" dir="ltr">
                <CalendarDays size={18} />
                <span>Sundays · egouda@bokralabs.com</span>
            </div>
        </div>
    </section>

    <section class="proof" id="proof" aria-labelledby="proof-title">
        <header class="section-head">
            <h2 id="proof-title">{copy.proofHeading}</h2>
            <p>{copy.proofSub}</p>
        </header>

        <div class="demo-list">
            <article class="demo-row">
                <h3>{copy.demoLabels[0]}</h3>
                <FinanceWorkflowDemo {language} />
            </article>
            <article class="demo-row demo-row-reverse">
                <h3>{copy.demoLabels[1]}</h3>
                <HomeServerWorkflowDemo {language} />
            </article>
            <article class="demo-row">
                <h3>{copy.demoLabels[2]}</h3>
                <PaperworkWorkflowDemo {language} />
            </article>
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
            <h2 id="booking-title">{copy.packageHeading}</h2>
            <ul>
                {#each copy.packageItems as item}
                    <li><Check size={17} /> <span>{item}</span></li>
                {/each}
            </ul>
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

    <footer class="services-footer">
        <ShieldCheck size={15} />
        <span>{copy.synthetic}</span>
    </footer>
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
        --service-rule: color-mix(in oklab, currentColor 20%, transparent);
        display: flex;
        flex-direction: column;
        gap: clamp(4.5rem, 9vw, 8rem);
        padding-bottom: 2rem;
    }

    .hero {
        display: grid;
        box-sizing: border-box;
        min-height: min(570px, calc(100svh - 12rem));
        grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.65fr);
        align-items: end;
        gap: clamp(2rem, 7vw, 7rem);
        overflow: hidden;
        border-radius: 8px;
        background: var(--service-orange);
        padding: clamp(1.5rem, 4vw, 3.5rem);
        color: var(--service-ink);
    }

    .hero-copy {
        max-width: 850px;
    }

    .brand-mark {
        display: flex;
        align-items: baseline;
        gap: 0.75rem;
        margin: 0 0 clamp(1rem, 2.5vw, 2rem);
    }

    .brand-mark strong {
        font-size: clamp(1.35rem, 3vw, 2.2rem);
    }

    .brand-mark span {
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .services-page[dir="rtl"] .brand-mark {
        justify-content: flex-end;
    }

    h1,
    h2,
    h3,
    p {
        text-wrap: pretty;
    }

    h1 {
        max-width: 15ch;
        margin: 0;
        font-size: clamp(2.8rem, 6vw, 5rem);
        line-height: 0.98;
        letter-spacing: 0;
        text-wrap: balance;
    }

    .hero-intro {
        max-width: 53ch;
        margin: clamp(1.4rem, 3vw, 2.2rem) 0 0;
        font-size: clamp(1.05rem, 2vw, 1.35rem);
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
        border: 1px solid var(--service-ink);
        color: var(--service-ink);
    }

    .action-light:hover {
        background: color-mix(in srgb, var(--service-offwhite) 28%, transparent);
    }

    .price-tool {
        align-self: end;
        border: 2px solid var(--service-ink);
        border-radius: 8px;
        background: color-mix(in srgb, var(--service-offwhite) 24%, transparent);
        padding: clamp(1.2rem, 3vw, 1.8rem);
    }

    .price-line {
        display: flex;
        align-items: baseline;
        gap: 0.55rem;
    }

    .services-page[dir="rtl"] .price-line,
    .services-page[dir="rtl"] .checkout-price {
        justify-content: flex-end;
    }

    .price-line strong {
        font-size: clamp(2.6rem, 6vw, 4.7rem);
        line-height: 1;
        letter-spacing: 0;
    }

    .price-line span,
    .price-tool > p {
        font-size: 0.75rem;
        font-weight: 700;
    }

    .price-tool > p {
        margin: 0.5rem 0 1.8rem;
    }

    .mini-flow {
        display: grid;
        grid-template-columns: auto 1fr auto 1fr auto;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.62rem;
        font-weight: 700;
    }

    .mini-flow i {
        height: 2px;
        background: var(--service-ink);
    }

    .availability {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid color-mix(in srgb, var(--service-ink) 35%, transparent);
        font-size: 0.72rem;
        font-weight: 700;
    }

    .proof,
    .process,
    .questions {
        width: min(1120px, 100%);
        margin-inline: auto;
    }

    .section-head {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 2rem;
        margin-bottom: clamp(2rem, 5vw, 4rem);
    }

    .section-head h2,
    .process h2,
    .booking h2,
    .questions h2 {
        margin: 0;
        font-size: clamp(2.2rem, 5vw, 4rem);
        line-height: 1;
        letter-spacing: 0;
        text-wrap: balance;
    }

    .section-head p {
        max-width: 40ch;
        margin: 0;
        color: var(--muted-foreground);
        line-height: 1.5;
    }

    .demo-list {
        display: flex;
        flex-direction: column;
        gap: clamp(4rem, 9vw, 8rem);
    }

    .demo-row {
        display: grid;
        grid-template-columns: minmax(110px, 0.28fr) minmax(0, 1.72fr);
        align-items: start;
        gap: clamp(1.2rem, 4vw, 4rem);
    }

    .demo-row-reverse {
        grid-template-columns: minmax(0, 1.72fr) minmax(110px, 0.28fr);
    }

    .demo-row-reverse h3 {
        grid-column: 2;
        grid-row: 1;
    }

    .demo-row-reverse :global(> :not(h3)) {
        grid-column: 1;
        grid-row: 1;
    }

    .demo-row h3 {
        margin: 0;
        padding-top: 0.75rem;
        font-size: clamp(1rem, 2vw, 1.35rem);
        line-height: 1.1;
    }

    .process h2 {
        max-width: 11ch;
    }

    .process ol {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0;
        margin: clamp(2.4rem, 6vw, 5rem) 0 0;
        padding: 0;
        list-style: none;
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
    }

    .process li {
        display: grid;
        min-height: 210px;
        grid-template-columns: auto 1fr;
        align-content: space-between;
        gap: 1rem;
        padding: 1.2rem;
        border-inline-end: 1px solid var(--border);
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
        font-size: 1.1rem;
    }

    .process li p {
        max-width: 30ch;
        margin: 0.55rem 0 0;
        color: var(--muted-foreground);
        line-height: 1.5;
    }

    .booking {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(310px, 0.72fr);
        gap: clamp(2.5rem, 8vw, 8rem);
        border-radius: 8px;
        background: var(--service-ink);
        padding: clamp(1.5rem, 5vw, 4.8rem);
        color: var(--service-offwhite);
    }

    .booking-copy ul {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        margin: 2rem 0 0;
        padding: 0;
        list-style: none;
    }

    .booking-copy li {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        color: #d7d8de;
    }

    .checkout-tool {
        align-self: center;
        border: 1px solid #484b57;
        border-radius: 8px;
        padding: clamp(1.2rem, 4vw, 2rem);
        background: #1b1d24;
    }

    .checkout-price {
        display: flex;
        align-items: baseline;
        gap: 0.55rem;
        margin-bottom: 1.2rem;
    }

    .checkout-price strong {
        font-size: clamp(2.5rem, 6vw, 4rem);
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
        line-height: 1.45;
    }

    .questions {
        display: grid;
        grid-template-columns: minmax(190px, 0.65fr) minmax(280px, 1.35fr);
        gap: clamp(2rem, 6vw, 6rem);
        align-items: start;
    }

    .questions h2 {
        max-width: 9ch;
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
        min-height: 112px;
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
        padding-top: 1rem;
        border-top: 1px solid var(--border);
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

    .services-footer {
        display: flex;
        width: min(1120px, 100%);
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        margin-inline: auto;
        padding-top: 1.2rem;
        border-top: 1px solid var(--border);
        color: var(--muted-foreground);
        font-size: 0.75rem;
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

    @media (max-width: 900px) {
        .hero {
            min-height: auto;
            grid-template-columns: 1fr;
            align-items: start;
        }

        .price-tool {
            width: min(430px, 100%);
        }

        .booking {
            grid-template-columns: 1fr;
        }

        .checkout-tool {
            width: 100%;
        }
    }

    @media (max-width: 720px) {
        .section-head {
            align-items: start;
            flex-direction: column;
            gap: 1rem;
        }

        .demo-row,
        .demo-row-reverse {
            grid-template-columns: 1fr;
        }

        .demo-row-reverse h3,
        .demo-row-reverse :global(> :not(h3)) {
            grid-column: auto;
            grid-row: auto;
        }

        .process ol {
            grid-template-columns: 1fr;
        }

        .process li {
            min-height: 150px;
            border-inline-end: 0;
            border-bottom: 1px solid var(--border);
        }

        .process li:last-child {
            border-bottom: 0;
        }

        .questions {
            grid-template-columns: 1fr;
        }

        .answer {
            grid-column: auto;
            margin-top: 0;
        }

        .question-note {
            grid-column: auto;
            margin-top: -1rem;
        }
    }

    @media (max-width: 520px) {
        .services-page {
            gap: 3rem;
        }

        .hero,
        .booking {
            margin-inline: -0.5rem;
            border-radius: 8px;
        }

        .hero {
            gap: 1.25rem;
            padding: 1.25rem;
        }

        .hero-actions {
            margin-top: 1.5rem;
        }

        .price-tool {
            padding: 1rem 1.2rem;
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

        .hero-actions,
        .action {
            width: 100%;
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
