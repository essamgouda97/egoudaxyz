<script lang="ts">
    import { ArrowDown, Sparkles } from "@lucide/svelte";

    let { language = "en" }: { language?: "en" | "ar" } = $props();
    let optimized = $state(false);

    const copyByLanguage = {
        en: {
            name: "Money autopilot",
            state: "100% synthetic",
            original: "Show original",
            run: "Find the leaks",
            outflow: "Monthly outflow",
            found: "$520 found",
            barsLabel: "Synthetic monthly spending categories",
            notes: [
                "3 subscriptions paused",
                "2 grocery duplicates merged",
                "$180 moved to home fund",
            ],
        },
        ar: {
            name: "مظبّط الفلوس",
            state: "داتا خيالية 100%",
            original: "رجّع الأصل",
            run: "لقّط التسريب",
            outflow: "مصروف الشهر",
            found: "$520 اتوفّروا",
            barsLabel: "تصنيفات مصروف شهرية خيالية",
            notes: [
                "وقف 3 اشتراكات",
                "دمج عمليتين بقالة مكررين",
                "حوّل $180 لصندوق البيت",
            ],
        },
    } as const;

    const copy = $derived(copyByLanguage[language]);

    const baseline = [
        { label: { en: "Home", ar: "البيت" }, value: 1820, color: "#ff6b35" },
        { label: { en: "Food", ar: "الأكل" }, value: 760, color: "#f4bf3a" },
        { label: { en: "Life", ar: "الحياة" }, value: 640, color: "#59a96a" },
        { label: { en: "Noise", ar: "الزحمة" }, value: 410, color: "#8f94a3" },
    ];

    const improved = [
        { label: { en: "Home", ar: "البيت" }, value: 1820, color: "#ff6b35" },
        { label: { en: "Food", ar: "الأكل" }, value: 610, color: "#f4bf3a" },
        { label: { en: "Life", ar: "الحياة" }, value: 540, color: "#59a96a" },
        { label: { en: "Noise", ar: "الزحمة" }, value: 120, color: "#8f94a3" },
    ];

    const categories = $derived(optimized ? improved : baseline);
    const monthlySpend = $derived(
        categories.reduce((total, category) => total + category.value, 0),
    );
</script>

<div
    class="finance-demo"
    data-demo="synthetic-finance"
    lang={language}
    dir={language === "ar" ? "rtl" : "ltr"}
>
    <div class="demo-bar">
        <div>
            <span class="demo-name">{copy.name}</span>
            <span class="demo-state">{copy.state}</span>
        </div>
        <button
            type="button"
            class:active={optimized}
            aria-pressed={optimized}
            onclick={() => (optimized = !optimized)}
        >
            <Sparkles size={16} />
            {optimized ? copy.original : copy.run}
        </button>
    </div>

    <div class="finance-body">
        <div class="total-block">
            <span>{copy.outflow}</span>
            <strong dir="ltr">${monthlySpend.toLocaleString("en-CA")}</strong>
            <div class="delta" class:visible={optimized}>
                <ArrowDown size={15} /> <span dir="ltr">{copy.found}</span>
            </div>
        </div>

        <div class="bars" aria-label={copy.barsLabel}>
            {#each categories as category}
                <div class="bar-row">
                    <div class="bar-label">
                        <span>{category.label[language]}</span>
                        <span dir="ltr">${category.value}</span>
                    </div>
                    <div class="bar-track">
                        <span
                            style={`--bar-width: ${(category.value / 1900) * 100}%; --bar-color: ${category.color}`}
                        ></span>
                    </div>
                </div>
            {/each}
        </div>

        <div class="agent-note" class:visible={optimized} aria-live="polite">
            {#each copy.notes as note}
                <span>{note}</span>
            {/each}
        </div>
    </div>
</div>

<style>
    .finance-demo {
        min-height: 390px;
        overflow: hidden;
        border-radius: 8px;
        background: #111217;
        color: #f7f7f3;
        box-shadow: 0 6px 0 color-mix(in oklab, #111217 30%, transparent);
    }

    .demo-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.1rem;
        border-bottom: 1px solid #34363f;
    }

    .demo-bar > div {
        display: flex;
        align-items: baseline;
        gap: 0.65rem;
        min-width: 0;
    }

    .demo-name {
        font-weight: 700;
    }

    .demo-state {
        color: #a9acb7;
        font-size: 0.72rem;
    }

    button {
        display: inline-flex;
        min-height: 42px;
        flex: none;
        align-items: center;
        gap: 0.45rem;
        border: 0;
        border-radius: 6px;
        background: #ff6b35;
        padding: 0.65rem 0.8rem;
        color: #111217;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
    }

    button:hover,
    button:focus-visible,
    button.active {
        background: #ff8257;
    }

    button:focus-visible {
        outline: 3px solid #f7f7f3;
        outline-offset: 2px;
    }

    .finance-body {
        display: grid;
        grid-template-columns: minmax(130px, 0.7fr) minmax(220px, 1.3fr);
        gap: clamp(1.5rem, 4vw, 3.5rem);
        padding: clamp(1.3rem, 4vw, 2.4rem);
    }

    .total-block {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
    }

    .total-block > span {
        color: #a9acb7;
        font-size: 0.78rem;
    }

    .total-block strong {
        margin-top: 0.3rem;
        font-size: clamp(2.2rem, 6vw, 4rem);
        line-height: 1;
        letter-spacing: 0;
    }

    .delta {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        margin-top: 1rem;
        color: #111217;
        background: #83d494;
        padding: 0.35rem 0.5rem;
        border-radius: 4px;
        font-size: 0.76rem;
        font-weight: 700;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 180ms ease-out, transform 180ms ease-out;
    }

    .delta.visible {
        opacity: 1;
        transform: translateY(0);
    }

    .bars {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .bar-label {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.38rem;
        color: #d8dae1;
        font-size: 0.78rem;
    }

    .bar-track {
        height: 9px;
        overflow: hidden;
        border-radius: 2px;
        background: #292b33;
    }

    .bar-track span {
        display: block;
        width: var(--bar-width);
        height: 100%;
        background: var(--bar-color);
        transition: width 320ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .agent-note {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1.2rem;
        min-height: 1.2rem;
        color: #c8cad2;
        font-size: 0.75rem;
        opacity: 0;
        transition: opacity 180ms ease-out;
    }

    .agent-note.visible {
        opacity: 1;
    }

    @media (max-width: 620px) {
        .demo-bar {
            align-items: flex-start;
        }

        .demo-bar > div {
            flex-direction: column;
            gap: 0.2rem;
        }

        .finance-body {
            grid-template-columns: 1fr;
        }

        .agent-note {
            grid-column: auto;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .bar-track span,
        .delta,
        .agent-note {
            transition: none;
        }
    }
</style>
