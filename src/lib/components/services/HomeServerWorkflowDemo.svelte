<script lang="ts">
    import {
        Check,
        Download,
        Lightbulb,
        Pause,
        Play,
        Search,
        Tv,
        Volume2,
    } from "@lucide/svelte";

    type Room = "living" | "bedroom" | "office";
    type MediaId = "cairo" | "train" | "kitchen" | "river";
    type Media = {
        id: MediaId;
        year: number;
        duration: string;
        ready: boolean;
        color: string;
        accent: string;
    };

    let { language = "en" }: { language?: "en" | "ar" } = $props();
    let query = $state("");
    let selectedId = $state<MediaId>("cairo");
    let room = $state<Room>("living");
    let lights = $state(true);
    let volume = $state(42);
    let playing = $state(false);
    let catalog = $state<Media[]>([
        {
            id: "cairo",
            year: 2026,
            duration: "1h 48m",
            ready: true,
            color: "#f5bf42",
            accent: "#d94331",
        },
        {
            id: "train",
            year: 2024,
            duration: "2h 03m",
            ready: true,
            color: "#87b9d7",
            accent: "#18344c",
        },
        {
            id: "kitchen",
            year: 2025,
            duration: "8 × 24m",
            ready: false,
            color: "#e48ab1",
            accent: "#42233a",
        },
        {
            id: "river",
            year: 2023,
            duration: "1h 36m",
            ready: false,
            color: "#86bc91",
            accent: "#174b3b",
        },
    ]);

    const copyByLanguage = {
        en: {
            title: "Home control",
            search: "Search library",
            rooms: {
                living: "Living room",
                bedroom: "Bedroom",
                office: "Office",
            },
            lights: "Lights",
            volume: "Volume",
            play: "Play",
            pause: "Pause",
            playing: "Now playing",
            library: "Library",
            empty: "No results",
            get: "Add",
            ready: "Ready",
            added: "Added",
            titles: {
                cairo: "Cairo 2050",
                train: "Last Train",
                kitchen: "Space Kitchen",
                river: "River House",
            },
        },
        ar: {
            title: "تحكم البيت",
            search: "دور في المكتبة",
            rooms: {
                living: "الصالة",
                bedroom: "أوضة النوم",
                office: "المكتب",
            },
            lights: "النور",
            volume: "الصوت",
            play: "تشغيل",
            pause: "وقف",
            playing: "شغال دلوقتي",
            library: "المكتبة",
            empty: "مفيش نتائج",
            get: "نزّل",
            ready: "جاهز",
            added: "اتضاف",
            titles: {
                cairo: "القاهرة 2050",
                train: "آخر قطر",
                kitchen: "مطبخ الفضاء",
                river: "بيت النهر",
            },
        },
    } as const;

    const roomKeys = ["living", "bedroom", "office"] as const;
    const copy = $derived(copyByLanguage[language]);
    const selected = $derived(
        catalog.find((item) => item.id === selectedId) ?? catalog[0],
    );
    const filteredCatalog = $derived.by(() => {
        const needle = query.trim().toLocaleLowerCase();
        if (!needle) return catalog;

        return catalog.filter((item) =>
            copy.titles[item.id].toLocaleLowerCase().includes(needle),
        );
    });

    function selectMedia(id: MediaId) {
        selectedId = id;
        playing = false;
    }

    function runSelected() {
        if (!selected.ready) {
            catalog = catalog.map((item) =>
                item.id === selectedId ? { ...item, ready: true } : item,
            );
            return;
        }

        playing = !playing;
    }
</script>

<section
    class="home-app"
    data-app="home-control"
    lang={language}
    dir={language === "ar" ? "rtl" : "ltr"}
    aria-label={copy.title}
>
    <header>
        <div class="app-title">
            <Tv size={18} />
            <h3>{copy.title}</h3>
        </div>
        <label class="search-box">
            <span class="sr-only">{copy.search}</span>
            <Search size={16} />
            <input
                data-testid="media-search"
                type="search"
                bind:value={query}
                placeholder={copy.search}
            />
        </label>
    </header>

    <div class="home-body">
        <div class="library">
            <p class="eyebrow">{copy.library}</p>
            <div class="catalog" aria-live="polite">
                {#each filteredCatalog as item (item.id)}
                    <button
                        type="button"
                        class="media-card"
                        class:selected={selectedId === item.id}
                        aria-pressed={selectedId === item.id}
                        onclick={() => selectMedia(item.id)}
                    >
                        <span
                            class="poster"
                            style:--cover={item.color}
                            style:--accent={item.accent}
                            aria-hidden="true"
                        >
                            <i></i>
                            <b>{String(item.year).slice(2)}</b>
                        </span>
                        <span class="media-copy">
                            <strong>{copy.titles[item.id]}</strong>
                            <small dir="ltr">{item.year} · {item.duration}</small>
                        </span>
                        {#if item.ready}
                            <span class="ready-mark" title={copy.ready}>
                                <Check size={13} />
                            </span>
                        {/if}
                    </button>
                {:else}
                    <div class="empty">{copy.empty}</div>
                {/each}
            </div>
        </div>

        <div
            class="controller"
            style:--cover={selected.color}
            style:--accent={selected.accent}
        >
            <div class="now-playing">
                <span class="large-poster" aria-hidden="true">
                    <i></i>
                    <b>{String(selected.year).slice(2)}</b>
                </span>
                <div>
                    <small>{copy.playing}</small>
                    <strong>{copy.titles[selected.id]}</strong>
                    <span dir="ltr">{selected.duration}</span>
                </div>
                <i class:live={playing} aria-hidden="true"></i>
            </div>

            <div class="room-picker" aria-label={copy.title}>
                {#each roomKeys as roomKey}
                    <button
                        type="button"
                        class:active={room === roomKey}
                        aria-pressed={room === roomKey}
                        onclick={() => (room = roomKey)}
                    >
                        {copy.rooms[roomKey]}
                    </button>
                {/each}
            </div>

            <div class="device-row">
                <button
                    data-testid="lights-toggle"
                    type="button"
                    class="light-toggle"
                    class:active={lights}
                    aria-pressed={lights}
                    onclick={() => (lights = !lights)}
                >
                    <Lightbulb size={18} />
                    <span>{copy.lights}</span>
                    <i></i>
                </button>

                <label class="volume-control">
                    <span><Volume2 size={17} /> {copy.volume}</span>
                    <input
                        data-testid="volume-slider"
                        type="range"
                        min="0"
                        max="100"
                        bind:value={volume}
                    />
                    <b dir="ltr">{volume}%</b>
                </label>
            </div>

            <button
                data-testid="media-action"
                type="button"
                class="play-button"
                onclick={runSelected}
            >
                {#if !selected.ready}
                    <Download size={18} /> {copy.get}
                {:else if playing}
                    <Pause size={18} /> {copy.pause}
                {:else}
                    <Play size={18} fill="currentColor" /> {copy.play}
                {/if}
            </button>
        </div>
    </div>
</section>

<style>
    .home-app {
        min-height: 500px;
        overflow: hidden;
        border-radius: 8px;
        background: #e9f3f7;
        color: #102436;
        box-shadow: 0 6px 0 color-mix(in oklab, #102436 22%, transparent);
    }

    header {
        display: flex;
        min-height: 64px;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        border-bottom: 1px solid #bdd2dc;
        padding: 0.75rem 1rem;
    }

    .app-title {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: 0.55rem;
    }

    h3 {
        margin: 0;
        font-size: 0.95rem;
    }

    button,
    input {
        font: inherit;
    }

    button {
        cursor: pointer;
    }

    button:focus-visible,
    input:focus-visible {
        outline: 3px solid #ff6b35;
        outline-offset: 2px;
    }

    .search-box {
        display: flex;
        width: min(300px, 55%);
        min-height: 40px;
        align-items: center;
        gap: 0.5rem;
        border: 1px solid #abc5d1;
        border-radius: 6px;
        background: #f8fcfd;
        padding: 0 0.7rem;
        color: #4d6a77;
    }

    .search-box input {
        width: 100%;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        color: #102436;
        font-size: 0.78rem;
    }

    .search-box input::placeholder {
        color: #64808c;
        opacity: 1;
    }

    .home-body {
        display: grid;
        min-height: 436px;
        grid-template-columns: minmax(280px, 0.9fr) minmax(340px, 1.1fr);
    }

    .library {
        padding: 1rem;
        border-inline-end: 1px solid #bdd2dc;
    }

    .eyebrow {
        margin: 0 0 0.7rem;
        color: #587681;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .catalog {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
    }

    .media-card {
        position: relative;
        display: grid;
        min-width: 0;
        grid-template-columns: 48px minmax(0, 1fr);
        align-items: center;
        gap: 0.65rem;
        border: 1px solid #c4d6dd;
        border-radius: 6px;
        background: #f8fcfd;
        padding: 0.55rem;
        color: #102436;
        text-align: start;
    }

    .media-card:hover,
    .media-card.selected {
        border-color: #102436;
        box-shadow: 0 3px 0 #102436;
        transform: translateY(-1px);
    }

    .poster,
    .large-poster {
        position: relative;
        display: block;
        overflow: hidden;
        flex: none;
        border-radius: 4px;
        background: var(--cover);
    }

    .poster {
        width: 48px;
        aspect-ratio: 2 / 3;
    }

    .poster i,
    .large-poster i {
        position: absolute;
        right: -18%;
        bottom: -5%;
        width: 78%;
        aspect-ratio: 1;
        border-radius: 50%;
        background: var(--accent);
    }

    .poster b,
    .large-poster b {
        position: absolute;
        top: 8px;
        left: 8px;
        color: var(--accent);
        font-size: 0.62rem;
    }

    .media-copy {
        min-width: 0;
    }

    .media-copy strong,
    .media-copy small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .media-copy strong {
        font-size: 0.76rem;
    }

    .media-copy small {
        margin-top: 0.25rem;
        color: #607986;
        font-size: 0.62rem;
    }

    .ready-mark {
        position: absolute;
        top: 0.35rem;
        right: 0.35rem;
        display: grid;
        width: 20px;
        height: 20px;
        place-items: center;
        border-radius: 50%;
        background: #dff3e4;
        color: #26673b;
    }

    [dir="rtl"] .ready-mark {
        right: auto;
        left: 0.35rem;
    }

    .empty {
        display: grid;
        min-height: 180px;
        grid-column: 1 / -1;
        place-items: center;
        border: 1px dashed #abc5d1;
        color: #587681;
        font-size: 0.8rem;
    }

    .controller {
        display: flex;
        min-width: 0;
        flex-direction: column;
        justify-content: center;
        gap: 1rem;
        padding: clamp(1.2rem, 4vw, 2.25rem);
        background: #f8fcfd;
    }

    .now-playing {
        display: grid;
        grid-template-columns: 76px minmax(0, 1fr) 10px;
        align-items: center;
        gap: 1rem;
    }

    .large-poster {
        width: 76px;
        aspect-ratio: 2 / 3;
        box-shadow: 0 5px 0 color-mix(in oklab, var(--accent) 30%, transparent);
    }

    .large-poster b {
        font-size: 0.75rem;
    }

    .now-playing small,
    .now-playing strong,
    .now-playing span {
        display: block;
    }

    .now-playing small {
        color: #607986;
        font-size: 0.66rem;
    }

    .now-playing strong {
        margin-top: 0.2rem;
        font-size: 1.35rem;
        line-height: 1.1;
    }

    .now-playing span {
        margin-top: 0.35rem;
        color: #607986;
        font-size: 0.68rem;
    }

    .now-playing > i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #b6c6cc;
    }

    .now-playing > i.live {
        background: #ff6b35;
        box-shadow: 0 0 0 5px #ffe1d6;
    }

    .room-picker {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 2px;
        border: 1px solid #abc5d1;
        border-radius: 6px;
        background: #abc5d1;
        overflow: hidden;
    }

    .room-picker button {
        min-height: 40px;
        border: 0;
        background: #eef6f8;
        color: #4d6976;
        font-size: 0.7rem;
        font-weight: 700;
    }

    .room-picker button.active {
        background: #102436;
        color: #f8fcfd;
    }

    .device-row {
        display: grid;
        grid-template-columns: minmax(110px, 0.65fr) minmax(160px, 1.35fr);
        gap: 0.7rem;
    }

    .light-toggle,
    .volume-control {
        min-height: 58px;
        border: 1px solid #c4d6dd;
        border-radius: 6px;
        background: #eef6f8;
    }

    .light-toggle {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.45rem;
        padding: 0 0.7rem;
        color: #4d6976;
        text-align: start;
    }

    .light-toggle i {
        width: 28px;
        height: 16px;
        border-radius: 8px;
        background: #a8bdc6;
    }

    .light-toggle i::after {
        display: block;
        width: 12px;
        height: 12px;
        margin: 2px;
        border-radius: 50%;
        background: #f8fcfd;
        content: "";
        transition: transform 120ms ease-out;
    }

    .light-toggle.active {
        color: #7b5300;
    }

    .light-toggle.active i {
        background: #f0b630;
    }

    .light-toggle.active i::after {
        transform: translateX(12px);
    }

    [dir="rtl"] .light-toggle.active i::after {
        transform: translateX(-12px);
    }

    .volume-control {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.65rem;
        padding: 0 0.75rem;
        color: #4d6976;
        font-size: 0.68rem;
    }

    .volume-control > span {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
    }

    .volume-control input {
        min-width: 55px;
        accent-color: #ff6b35;
    }

    .volume-control b {
        color: #102436;
        font-size: 0.68rem;
    }

    .play-button {
        display: inline-flex;
        min-height: 48px;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: 0;
        border-radius: 6px;
        background: #ff6b35;
        color: #102436;
        font-weight: 700;
    }

    .play-button:hover {
        background: #ff8257;
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

    @media (max-width: 760px) {
        .home-body {
            grid-template-columns: 1fr;
        }

        .library {
            border-inline-end: 0;
            border-bottom: 1px solid #bdd2dc;
        }
    }

    @media (max-width: 480px) {
        header {
            align-items: stretch;
            flex-direction: column;
        }

        .search-box {
            width: 100%;
        }

        .catalog {
            grid-template-columns: 1fr;
        }

        .controller {
            padding: 1rem;
        }

        .device-row {
            grid-template-columns: 1fr;
        }

        .now-playing {
            grid-template-columns: 64px minmax(0, 1fr) 8px;
        }

        .large-poster {
            width: 64px;
        }

        .room-picker button {
            padding-inline: 0.3rem;
            font-size: 0.64rem;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .light-toggle i::after {
            transition: none;
        }
    }
</style>
