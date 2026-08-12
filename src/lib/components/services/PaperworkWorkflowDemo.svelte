<script lang="ts">
    import { FileText, RotateCcw, WandSparkles } from "@lucide/svelte";

    let { language = "en" }: { language?: "en" | "ar" } = $props();
    let processed = $state(false);

    const copyByLanguage = {
        en: {
            title: "Paperwork autopilot",
            state: "sample document",
            reset: "Reset",
            run: "Run sample",
            fixture: "fictional fixture · 2 pages",
            renewal: "Renew by October 18",
            labels: ["DATE", "CHANGE", "ACTION"],
            values: ["Oct 18", "+$75 / month", "Compare + remind"],
            result: "Calendar hold drafted · reply waiting for approval",
        },
        ar: {
            title: "مظبّط الورق",
            state: "ملف خيالي",
            reset: "ريست",
            run: "شغّل العينة",
            fixture: "ملف خيالي · صفحتين",
            renewal: "التجديد قبل 18 أكتوبر",
            labels: ["التاريخ", "التغيير", "التصرف"],
            values: ["18 أكتوبر", "+$75 في الشهر", "قارن وفكّرني"],
            result: "جهّز حجز في الـcalendar · الرد مستني موافقة",
        },
    } as const;

    const copy = $derived(copyByLanguage[language]);
</script>

<div
    class="paper-demo"
    data-demo="synthetic-paperwork"
    lang={language}
    dir={language === "ar" ? "rtl" : "ltr"}
>
    <div class="paper-head">
        <div>
            <span class="paper-title">{copy.title}</span>
            <span class="paper-state">{copy.state}</span>
        </div>
        <button type="button" onclick={() => (processed = !processed)}>
            {#if processed}
                <RotateCcw size={16} /> {copy.reset}
            {:else}
                <WandSparkles size={16} /> {copy.run}
            {/if}
        </button>
    </div>

    <div class="paper-body">
        <div class="document">
            <div class="file-label">
                <FileText size={18} />
                <div>
                    <strong>renewal_notice.pdf</strong>
                    <span>{copy.fixture}</span>
                </div>
            </div>
            <div class="document-lines" aria-hidden="true">
                <span></span><span></span><span></span><span></span><span></span>
            </div>
            <mark class:active={processed}>{copy.renewal}</mark>
        </div>

        <div class="extraction" aria-live="polite">
            <div class:ready={processed}>
                <span>{copy.labels[0]}</span>
                <strong>{processed ? copy.values[0] : "—"}</strong>
            </div>
            <div class:ready={processed}>
                <span>{copy.labels[1]}</span>
                <strong>{processed ? copy.values[1] : "—"}</strong>
            </div>
            <div class:ready={processed}>
                <span>{copy.labels[2]}</span>
                <strong>{processed ? copy.values[2] : "—"}</strong>
            </div>
            <p class:visible={processed}>{copy.result}</p>
        </div>
    </div>
</div>

<style>
    .paper-demo {
        min-height: 390px;
        overflow: hidden;
        border-radius: 8px;
        background: #fff4d8;
        color: #2f281d;
        box-shadow: 0 6px 0 color-mix(in oklab, #2f281d 20%, transparent);
    }

    .paper-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.1rem;
        border-bottom: 1px solid #dbcba2;
    }

    .paper-head > div {
        display: flex;
        align-items: baseline;
        gap: 0.65rem;
    }

    .paper-title {
        font-weight: 700;
    }

    .paper-state {
        color: #75694f;
        font-size: 0.72rem;
    }

    button {
        display: inline-flex;
        min-height: 42px;
        align-items: center;
        gap: 0.45rem;
        border: 0;
        border-radius: 6px;
        background: #ff6b35;
        padding: 0.65rem 0.8rem;
        color: #24150f;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
    }

    button:hover,
    button:focus-visible {
        background: #ff8257;
    }

    button:focus-visible {
        outline: 3px solid #2f281d;
        outline-offset: 2px;
    }

    .paper-body {
        display: grid;
        grid-template-columns: minmax(180px, 0.85fr) minmax(220px, 1.15fr);
        gap: clamp(1.2rem, 4vw, 3rem);
        padding: clamp(1.3rem, 4vw, 2.3rem);
    }

    .document {
        position: relative;
        min-height: 230px;
        border: 1px solid #c9b77f;
        border-radius: 4px;
        background: #fffdf7;
        padding: 1rem;
        box-shadow: 4px 4px 0 #d9c893;
    }

    .file-label {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding-bottom: 0.8rem;
        border-bottom: 1px solid #e6dcc0;
    }

    .file-label strong,
    .file-label span {
        display: block;
    }

    .file-label strong {
        font-size: 0.75rem;
    }

    .file-label span {
        margin-top: 0.12rem;
        color: #75694f;
        font-size: 0.65rem;
    }

    .document-lines {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        margin-top: 1rem;
    }

    .document-lines span {
        width: 100%;
        height: 6px;
        border-radius: 1px;
        background: #e9e1ce;
    }

    .document-lines span:nth-child(2),
    .document-lines span:nth-child(5) {
        width: 72%;
    }

    mark {
        display: inline-block;
        margin-top: 1rem;
        background: transparent;
        color: #75694f;
        font-size: 0.72rem;
        transition: background 180ms ease-out, color 180ms ease-out;
    }

    mark.active {
        background: #ffe174;
        color: #2f281d;
    }

    .extraction {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.6rem;
    }

    .extraction > div {
        display: grid;
        grid-template-columns: 70px 1fr;
        align-items: center;
        gap: 0.8rem;
        min-height: 54px;
        padding: 0.65rem 0.8rem;
        border-bottom: 1px solid #cdbd91;
        transition: background 180ms ease-out;
    }

    .extraction > div.ready {
        background: #fffaf0;
    }

    .extraction span {
        color: #75694f;
        font-size: 0.62rem;
        font-weight: 700;
    }

    .extraction strong {
        font-size: 0.9rem;
    }

    .extraction p {
        min-height: 1.2rem;
        margin: 0.6rem 0 0;
        color: #5b4f37;
        font-size: 0.72rem;
        opacity: 0;
        transition: opacity 180ms ease-out;
    }

    .extraction p.visible {
        opacity: 1;
    }

    @media (max-width: 620px) {
        .paper-head {
            align-items: flex-start;
        }

        .paper-head > div {
            flex-direction: column;
            gap: 0.15rem;
        }

        .paper-body {
            grid-template-columns: 1fr;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        mark,
        .extraction > div,
        .extraction p {
            transition: none;
        }
    }
</style>
