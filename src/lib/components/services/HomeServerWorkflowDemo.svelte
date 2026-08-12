<script lang="ts">
    import { Check, Play, RotateCcw } from "@lucide/svelte";

    type RunState = "idle" | "running" | "ready";
    type StepState = "waiting" | "done" | "running" | "queued" | "ready";

    let { language = "en" }: { language?: "en" | "ar" } = $props();
    let runState = $state<RunState>("idle");

    const copyByLanguage = {
        en: {
            title: "House brain",
            state: "mock network",
            reset: "Reset",
            run: "Run movie night",
            finish: "Finish run",
            servicesLabel: "Mock home server services",
            requestTime: "Friday · 8:00 PM",
            request: "Family movie night",
            steps: ["Check local library", "Pick room + lights", "Queue on TV"],
            status: { waiting: "Waiting", done: "Done", running: "Running", queued: "Queued", ready: "Ready" },
            ready: "Living room ready",
        },
        ar: {
            title: "مخ البيت",
            state: "شبكة خيالية",
            reset: "ريست",
            run: "شغّل ليلة الفيلم",
            finish: "كمّل التشغيل",
            servicesLabel: "خدمات home server خيالية",
            requestTime: "الجمعة · 8:00 بالليل",
            request: "ليلة فيلم للعيلة",
            steps: [
                "دوّر في المكتبة",
                "اختار الأوضة والنور",
                "جهّز الفيلم على التلفزيون",
            ],
            status: {
                waiting: "مستني",
                done: "خلص",
                running: "شغّال",
                queued: "في الدور",
                ready: "جاهز",
            },
            ready: "الصالة جاهزة",
        },
    } as const;

    const copy = $derived(copyByLanguage[language]);

    const services = [
        { name: "Jellyfin", detail: { en: "Library", ar: "المكتبة" }, color: "#9b87f5" },
        { name: "Immich", detail: { en: "Photos", ar: "الصور" }, color: "#5db5ff" },
        { name: "Paperless", detail: { en: "Documents", ar: "الورق" }, color: "#59c47c" },
        { name: "Home Assistant", detail: { en: "House", ar: "البيت" }, color: "#ffb84d" },
    ];

    const steps = $derived<StepState[]>(
        runState === "idle"
            ? ["waiting", "waiting", "waiting"]
            : runState === "running"
              ? ["done", "running", "queued"]
              : ["done", "done", "ready"],
    );

    function runMovieNight() {
        if (runState === "ready") {
            runState = "idle";
            return;
        }

        runState = runState === "idle" ? "running" : "ready";
    }
</script>

<div
    class="server-demo"
    data-demo="synthetic-home-server"
    lang={language}
    dir={language === "ar" ? "rtl" : "ltr"}
>
    <div class="server-head">
        <div>
            <span class="server-title">{copy.title}</span>
            <span class="local-only">{copy.state}</span>
        </div>
        <button type="button" onclick={runMovieNight}>
            {#if runState === "ready"}
                <RotateCcw size={16} /> {copy.reset}
            {:else}
                <Play size={16} /> {runState === "idle" ? copy.run : copy.finish}
            {/if}
        </button>
    </div>

    <div class="service-strip" aria-label={copy.servicesLabel}>
        {#each services as service}
            <div class="service">
                <span style={`--service-color: ${service.color}`}></span>
                <div>
                    <strong>{service.name}</strong>
                    <small>{service.detail[language]}</small>
                </div>
            </div>
        {/each}
    </div>

    <div class="run-panel" aria-live="polite">
        <div class="request">
            <span>{copy.requestTime}</span>
            <strong>{copy.request}</strong>
        </div>
        <div class="pipeline">
            <div class:complete={steps[0] === "done"}>
                <span>{steps[0] === "done" ? "✓" : "1"}</span>
                <p>{copy.steps[0]}</p>
                <small>{copy.status[steps[0]]}</small>
            </div>
            <div class:complete={steps[1] === "done"} class:running={steps[1] === "running"}>
                <span>{steps[1] === "done" ? "✓" : "2"}</span>
                <p>{copy.steps[1]}</p>
                <small>{copy.status[steps[1]]}</small>
            </div>
            <div class:complete={steps[2] === "ready"}>
                <span>{steps[2] === "ready" ? "✓" : "3"}</span>
                <p>{copy.steps[2]}</p>
                <small>{copy.status[steps[2]]}</small>
            </div>
        </div>
        <div class="ready-line" class:visible={runState === "ready"}>
            <Check size={16} /> {copy.ready}
        </div>
    </div>
</div>

<style>
    .server-demo {
        min-height: 390px;
        overflow: hidden;
        border-radius: 8px;
        background: #eaf6ff;
        color: #102436;
        box-shadow: 0 6px 0 color-mix(in oklab, #102436 22%, transparent);
    }

    .server-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.1rem;
        border-bottom: 1px solid #bdd8ea;
    }

    .server-head > div {
        display: flex;
        align-items: baseline;
        gap: 0.65rem;
    }

    .server-title {
        font-weight: 700;
    }

    .local-only {
        color: #4e6d82;
        font-size: 0.72rem;
    }

    button {
        display: inline-flex;
        min-height: 42px;
        align-items: center;
        gap: 0.45rem;
        border: 0;
        border-radius: 6px;
        background: #102436;
        padding: 0.65rem 0.8rem;
        color: #f8fcff;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
    }

    button:hover,
    button:focus-visible {
        background: #25465f;
    }

    button:focus-visible {
        outline: 3px solid #ff6b35;
        outline-offset: 2px;
    }

    .service-strip {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        border-bottom: 1px solid #bdd8ea;
    }

    .service {
        display: flex;
        min-width: 0;
        align-items: center;
        gap: 0.55rem;
        padding: 0.9rem 0.75rem;
        border-right: 1px solid #bdd8ea;
    }

    .service:last-child {
        border-right: 0;
    }

    .service > span {
        width: 9px;
        height: 9px;
        flex: none;
        border-radius: 50%;
        background: var(--service-color);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--service-color) 25%, transparent);
    }

    .service div {
        min-width: 0;
    }

    .service strong,
    .service small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .service strong {
        font-size: 0.74rem;
    }

    .service small {
        margin-top: 0.1rem;
        color: #527087;
        font-size: 0.65rem;
    }

    .run-panel {
        display: grid;
        grid-template-columns: minmax(130px, 0.65fr) minmax(260px, 1.35fr);
        gap: clamp(1.2rem, 4vw, 2.7rem);
        padding: clamp(1.3rem, 4vw, 2.3rem);
    }

    .request {
        align-self: center;
    }

    .request span,
    .request strong {
        display: block;
    }

    .request span {
        color: #527087;
        font-size: 0.72rem;
    }

    .request strong {
        margin-top: 0.35rem;
        font-size: clamp(1.35rem, 4vw, 2.2rem);
        line-height: 1.05;
        letter-spacing: 0;
    }

    .pipeline {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
    }

    .pipeline > div {
        display: grid;
        grid-template-columns: 28px 1fr auto;
        align-items: center;
        gap: 0.65rem;
        min-height: 48px;
        padding: 0.5rem 0.65rem;
        border: 1px solid #bdd8ea;
        border-radius: 6px;
        background: #f8fcff;
        transition: border-color 180ms ease-out, background 180ms ease-out;
    }

    .pipeline > div.complete {
        border-color: #55a975;
        background: #e7f8ed;
    }

    .pipeline > div.running {
        border-color: #ff9c63;
        background: #fff1e8;
    }

    .pipeline span {
        display: grid;
        width: 26px;
        height: 26px;
        place-items: center;
        border-radius: 50%;
        background: #dbeaf4;
        font-size: 0.7rem;
        font-weight: 700;
    }

    .pipeline p,
    .pipeline small {
        margin: 0;
    }

    .pipeline p {
        font-size: 0.76rem;
        font-weight: 700;
    }

    .pipeline small {
        color: #527087;
        font-size: 0.68rem;
    }

    .ready-line {
        grid-column: 1 / -1;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: #1e6a3d;
        font-size: 0.78rem;
        font-weight: 700;
        opacity: 0;
        transition: opacity 180ms ease-out;
    }

    .ready-line.visible {
        opacity: 1;
    }

    @media (max-width: 700px) {
        .service-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .service:nth-child(2) {
            border-right: 0;
        }

        .service:nth-child(-n + 2) {
            border-bottom: 1px solid #bdd8ea;
        }

        .run-panel {
            grid-template-columns: 1fr;
        }

        .ready-line {
            grid-column: auto;
        }
    }

    @media (max-width: 480px) {
        .server-head {
            align-items: flex-start;
        }

        .server-head > div {
            flex-direction: column;
            gap: 0.15rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .pipeline > div,
        .ready-line {
            transition: none;
        }
    }
</style>
