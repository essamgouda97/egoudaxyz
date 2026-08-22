<script lang="ts">
    import { browser } from "$app/environment";
    import { Button } from "$lib/components/ui/button";
    import {
        Check,
        HardDrive,
        Plus,
        Save,
        Search,
        Trash2,
        X,
    } from "@lucide/svelte";

    type MediaType = "movie" | "series";
    type RequestStatus = "ready" | "monitoring" | "queued";
    type MediaRequest = {
        id: number;
        title: string;
        type: MediaType;
        quality: string;
        status: RequestStatus;
        added: string;
    };
    type RequestDraft = {
        title: string;
        type: MediaType;
        quality: string;
    };
    type MediaSettings = {
        autoApprove: boolean;
        subtitles: boolean;
        quality: string;
        cleanupDays: string;
    };

    const STORAGE_KEY = "egouda-tools-media-v1";

    let { language = "en" }: { language?: "en" | "ar" } = $props();
    let activeTab = $state<"requests" | "automation">("requests");
    let composerOpen = $state(false);
    let search = $state("");
    let statusFilter = $state<"all" | RequestStatus>("all");
    let nextId = 1;
    let storageReady = $state(false);
    let saved = $state(false);
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let requests = $state<MediaRequest[]>([]);
    let draft = $state<RequestDraft>(newDraft());
    let settings = $state<MediaSettings>({
        autoApprove: true,
        subtitles: true,
        quality: "1080p",
        cleanupDays: "30",
    });

    const copyByLanguage = {
        en: {
            title: "Media",
            requests: "Requests",
            automation: "Automation",
            add: "Add request",
            cancel: "Cancel",
            newRequest: "New request",
            search: "Search requests",
            allStatuses: "All statuses",
            name: "Title",
            type: "Type",
            quality: "Quality",
            status: "Status",
            added: "Added",
            movie: "Movie",
            series: "Series",
            submit: "Add to queue",
            remove: "Remove",
            empty: "No matching requests",
            statuses: {
                ready: "Ready",
                monitoring: "Monitoring",
                queued: "Queued",
            },
            settingsTitle: "Request defaults",
            settingsDescription: "Applied to new requests.",
            autoApprove: "Auto-approve requests",
            autoApproveHelp: "Send approved titles straight to the queue.",
            subtitles: "English subtitles",
            subtitlesHelp: "Prefer releases with matching subtitles.",
            preferredQuality: "Preferred quality",
            cleanup: "Delete watched files after",
            never: "Never",
            days: "days",
            save: "Save changes",
            saved: "Saved",
        },
        ar: {
            title: "الميديا",
            requests: "الطلبات",
            automation: "الإعدادات",
            add: "ضيف طلب",
            cancel: "إلغاء",
            newRequest: "طلب جديد",
            search: "بحث في الطلبات",
            allStatuses: "كل الحالات",
            name: "الاسم",
            type: "النوع",
            quality: "الجودة",
            status: "الحالة",
            added: "تاريخ الإضافة",
            movie: "فيلم",
            series: "مسلسل",
            submit: "ضيف للطابور",
            remove: "امسح",
            empty: "مفيش طلبات",
            statuses: {
                ready: "جاهز",
                monitoring: "قيد المتابعة",
                queued: "في الطابور",
            },
            settingsTitle: "إعدادات الطلبات",
            settingsDescription: "بتنطبق على الطلبات الجديدة.",
            autoApprove: "موافقة تلقائية",
            autoApproveHelp: "إضافة الطلبات للطابور على طول.",
            subtitles: "ترجمة إنجليزي",
            subtitlesHelp: "تفضيل النسخ اللي فيها ترجمة.",
            preferredQuality: "الجودة المفضلة",
            cleanup: "حذف بعد المشاهدة:",
            never: "أبدًا",
            days: "يوم",
            save: "احفظ",
            saved: "اتحفظ",
        },
    } as const;

    const statuses = ["ready", "monitoring", "queued"] as const;
    const copy = $derived(copyByLanguage[language]);
    const filteredRequests = $derived.by(() => {
        const needle = search.trim().toLocaleLowerCase();

        return requests.filter(
            (request) =>
                (statusFilter === "all" || request.status === statusFilter) &&
                (!needle ||
                    request.title.toLocaleLowerCase().includes(needle)),
        );
    });

    $effect(() => {
        if (!browser || storageReady) return;

        try {
            const savedState = JSON.parse(
                localStorage.getItem(STORAGE_KEY) ?? "{}",
            );
            if (Array.isArray(savedState.requests)) {
                requests = savedState.requests.filter(isMediaRequest);
                nextId =
                    requests.reduce(
                        (highest, request) => Math.max(highest, request.id),
                        0,
                    ) + 1;
            }
            if (isMediaSettings(savedState.settings)) {
                settings = savedState.settings;
            }
        } catch {
            requests = [];
        }

        storageReady = true;
    });

    $effect(() => {
        const snapshot = JSON.stringify({ requests, settings });
        if (!browser || !storageReady) return;
        localStorage.setItem(STORAGE_KEY, snapshot);
    });

    function isMediaRequest(value: unknown): value is MediaRequest {
        if (!value || typeof value !== "object") return false;
        const request = value as Partial<MediaRequest>;

        return (
            typeof request.id === "number" &&
            typeof request.title === "string" &&
            (request.type === "movie" || request.type === "series") &&
            typeof request.quality === "string" &&
            statuses.includes(request.status as RequestStatus) &&
            typeof request.added === "string"
        );
    }

    function isMediaSettings(value: unknown): value is MediaSettings {
        if (!value || typeof value !== "object") return false;
        const candidate = value as Partial<MediaSettings>;

        return (
            typeof candidate.autoApprove === "boolean" &&
            typeof candidate.subtitles === "boolean" &&
            typeof candidate.quality === "string" &&
            typeof candidate.cleanupDays === "string"
        );
    }

    function currentDate() {
        return new Date().toISOString().slice(0, 10);
    }

    function formatDate(value: string) {
        return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-CA", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
        }).format(new Date(value + "T12:00:00Z"));
    }

    function newDraft(): RequestDraft {
        return { title: "", type: "movie", quality: "1080p" };
    }

    function addRequest(event: SubmitEvent) {
        event.preventDefault();
        const title = draft.title.trim();
        if (!title) return;

        requests = [
            {
                id: nextId++,
                title,
                type: draft.type,
                quality: draft.quality,
                status: "queued",
                added: currentDate(),
            },
            ...requests,
        ];
        draft = newDraft();
        composerOpen = false;
    }

    function removeRequest(id: number) {
        requests = requests.filter((request) => request.id !== id);
    }

    function updateStatus(id: number, status: RequestStatus) {
        requests = requests.map((request) =>
            request.id === id ? { ...request, status } : request,
        );
    }

    function saveSettings(event: SubmitEvent) {
        event.preventDefault();
        saved = true;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => (saved = false), 1800);
    }
</script>

<section
    class="app-frame"
    data-app="home-control"
    lang={language}
    dir={language === "ar" ? "rtl" : "ltr"}
    aria-label={copy.title}
>
    <header class="app-header">
        <div class="app-identity">
            <HardDrive size={18} />
            <h3>{copy.title}</h3>
        </div>
        {#if activeTab === "requests"}
            <Button
                size="sm"
                class="primary-action"
                data-testid="media-add"
                onclick={() => (composerOpen = !composerOpen)}
            >
                {#if composerOpen}<X size={15} />{:else}<Plus size={15} />{/if}
                {composerOpen ? copy.cancel : copy.add}
            </Button>
        {/if}
    </header>

    <div class="tabs" role="tablist" aria-label={copy.title}>
        <button
            type="button"
            role="tab"
            aria-selected={activeTab === "requests"}
            class:active={activeTab === "requests"}
            onclick={() => (activeTab = "requests")}
        >
            {copy.requests}
            <span>{requests.length}</span>
        </button>
        <button
            type="button"
            role="tab"
            aria-selected={activeTab === "automation"}
            class:active={activeTab === "automation"}
            onclick={() => (activeTab = "automation")}
        >
            {copy.automation}
        </button>
    </div>

    {#if activeTab === "requests"}
        {#if composerOpen}
            <form class="composer" onsubmit={addRequest}>
                <div class="composer-heading">{copy.newRequest}</div>
                <label class="title-field">
                    <span>{copy.name}</span>
                    <input
                        data-testid="media-title"
                        bind:value={draft.title}
                        required
                    />
                </label>
                <label>
                    <span>{copy.type}</span>
                    <select bind:value={draft.type}>
                        <option value="movie">{copy.movie}</option>
                        <option value="series">{copy.series}</option>
                    </select>
                </label>
                <label>
                    <span>{copy.quality}</span>
                    <select bind:value={draft.quality}>
                        <option value="4K">4K</option>
                        <option value="1080p">1080p</option>
                        <option value="720p">720p</option>
                    </select>
                </label>
                <Button
                    type="submit"
                    size="sm"
                    class="primary-action composer-submit"
                    data-testid="media-submit"
                    disabled={!draft.title.trim()}
                >
                    <Plus size={15} /> {copy.submit}
                </Button>
            </form>
        {/if}

        <div class="table-toolbar">
            <label class="search-field">
                <span class="sr-only">{copy.search}</span>
                <Search size={15} />
                <input
                    data-testid="media-search"
                    type="search"
                    bind:value={search}
                    placeholder={copy.search}
                />
            </label>
            <select
                class="filter-select"
                aria-label={copy.status}
                bind:value={statusFilter}
            >
                <option value="all">{copy.allStatuses}</option>
                {#each statuses as status}
                    <option value={status}>{copy.statuses[status]}</option>
                {/each}
            </select>
        </div>

        <div class="table-scroll">
            <table>
                <thead>
                    <tr>
                        <th>{copy.name}</th>
                        <th class="type-column">{copy.type}</th>
                        <th class="quality-column">{copy.quality}</th>
                        <th class="status-column">{copy.status}</th>
                        <th class="added-column">{copy.added}</th>
                        <th class="action-column">
                            <span class="sr-only">{copy.remove}</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredRequests as request (request.id)}
                        <tr data-testid="media-row">
                            <td class="title-cell">{request.title}</td>
                            <td class="type-column">
                                {request.type === "movie"
                                    ? copy.movie
                                    : copy.series}
                            </td>
                            <td class="quality-column" dir="ltr">{request.quality}</td>
                            <td class="status-column">
                                <select
                                    class="status-select"
                                    aria-label={copy.status + " " + request.title}
                                    value={request.status}
                                    onchange={(event) =>
                                        updateStatus(
                                            request.id,
                                            (event.currentTarget as HTMLSelectElement)
                                                .value as RequestStatus,
                                        )}
                                >
                                    {#each statuses as status}
                                        <option value={status}>
                                            {copy.statuses[status]}
                                        </option>
                                    {/each}
                                </select>
                            </td>
                            <td class="added-column">{formatDate(request.added)}</td>
                            <td class="action-column">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    title={copy.remove}
                                    aria-label={copy.remove + " " + request.title}
                                    onclick={() => removeRequest(request.id)}
                                >
                                    <Trash2 size={15} />
                                </Button>
                            </td>
                        </tr>
                    {:else}
                        <tr>
                            <td class="empty-state" colspan="6">{copy.empty}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {:else}
        <form class="settings" onsubmit={saveSettings}>
            <div class="settings-heading">
                <h4>{copy.settingsTitle}</h4>
                <p>{copy.settingsDescription}</p>
            </div>

            <label class="setting-row">
                <span>
                    <strong>{copy.autoApprove}</strong>
                    <small>{copy.autoApproveHelp}</small>
                </span>
                <input
                    data-testid="auto-approve"
                    class="switch"
                    type="checkbox"
                    bind:checked={settings.autoApprove}
                />
            </label>

            <label class="setting-row">
                <span>
                    <strong>{copy.subtitles}</strong>
                    <small>{copy.subtitlesHelp}</small>
                </span>
                <input
                    class="switch"
                    type="checkbox"
                    bind:checked={settings.subtitles}
                />
            </label>

            <label class="setting-row">
                <span><strong>{copy.preferredQuality}</strong></span>
                <select bind:value={settings.quality}>
                    <option value="4K">4K</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                </select>
            </label>

            <label class="setting-row">
                <span><strong>{copy.cleanup}</strong></span>
                <select bind:value={settings.cleanupDays}>
                    <option value="never">{copy.never}</option>
                    <option value="7">7 {copy.days}</option>
                    <option value="30">30 {copy.days}</option>
                    <option value="90">90 {copy.days}</option>
                </select>
            </label>

            <div class="settings-footer">
                <Button
                    type="submit"
                    size="sm"
                    class="primary-action"
                    data-testid="settings-save"
                >
                    {#if saved}
                        <Check size={15} /> {copy.saved}
                    {:else}
                        <Save size={15} /> {copy.save}
                    {/if}
                </Button>
            </div>
        </form>
    {/if}
</section>

<style>
    .app-frame {
        min-height: 500px;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--card);
        color: var(--card-foreground);
        font-family: ui-sans-serif, system-ui, sans-serif;
    }

    .app-frame[dir="rtl"] {
        font-family: "Cairo", ui-sans-serif, system-ui, sans-serif;
    }

    .app-header {
        display: flex;
        min-height: 54px;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        border-bottom: 1px solid var(--border);
        padding: 0.55rem 0.75rem 0.55rem 1rem;
    }

    .app-identity {
        display: flex;
        align-items: center;
        gap: 0.55rem;
    }

    .app-identity h3 {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 650;
        letter-spacing: 0;
    }

    .app-frame :global(.primary-action) {
        background: #ff6b35;
        color: #17181d;
    }

    .app-frame :global(.primary-action:hover) {
        background: #ff8257;
    }

    .tabs {
        display: flex;
        min-height: 44px;
        align-items: end;
        gap: 1.25rem;
        border-bottom: 1px solid var(--border);
        padding: 0 1rem;
    }

    .tabs button {
        display: inline-flex;
        height: 44px;
        align-items: center;
        gap: 0.45rem;
        border: 0;
        border-bottom: 2px solid transparent;
        background: transparent;
        padding: 0;
        color: var(--muted-foreground);
        font: inherit;
        font-size: 0.76rem;
        font-weight: 550;
        cursor: pointer;
    }

    .tabs button:hover {
        color: var(--foreground);
    }

    .tabs button.active {
        border-bottom-color: var(--foreground);
        color: var(--foreground);
    }

    .tabs button:focus-visible {
        outline: 2px solid var(--ring);
        outline-offset: 3px;
    }

    .tabs button span {
        display: inline-grid;
        min-width: 20px;
        height: 20px;
        place-items: center;
        border-radius: 10px;
        background: var(--muted);
        color: var(--muted-foreground);
        font-size: 0.62rem;
    }

    input,
    select {
        box-sizing: border-box;
        border: 1px solid var(--input);
        border-radius: 6px;
        background: var(--background);
        color: var(--foreground);
        font: inherit;
        font-size: 0.78rem;
        outline: none;
    }

    input:focus-visible,
    select:focus-visible {
        border-color: var(--ring);
        box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 24%, transparent);
    }

    .composer {
        display: grid;
        grid-template-columns: minmax(220px, 1.8fr) minmax(110px, 0.7fr) minmax(110px, 0.7fr) auto;
        align-items: end;
        gap: 0.6rem;
        border-bottom: 1px solid var(--border);
        background: var(--muted);
        padding: 0.8rem 1rem;
    }

    .composer-heading {
        grid-column: 1 / -1;
        font-size: 0.78rem;
        font-weight: 650;
    }

    .composer label {
        display: grid;
        min-width: 0;
        gap: 0.3rem;
    }

    .composer label > span {
        color: var(--muted-foreground);
        font-size: 0.62rem;
        font-weight: 550;
    }

    .composer input,
    .composer select {
        width: 100%;
        min-width: 0;
        height: 34px;
        padding: 0 0.55rem;
    }

    .composer :global(.composer-submit) {
        margin-bottom: 1px;
    }

    .table-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
    }

    .search-field {
        display: flex;
        width: min(320px, 58%);
        height: 34px;
        align-items: center;
        gap: 0.45rem;
        border: 1px solid var(--input);
        border-radius: 6px;
        background: var(--background);
        padding: 0 0.6rem;
        color: var(--muted-foreground);
    }

    .search-field:focus-within {
        border-color: var(--ring);
        box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 24%, transparent);
    }

    .search-field input {
        width: 100%;
        min-width: 0;
        height: 100%;
        border: 0;
        background: transparent;
        padding: 0;
        box-shadow: none;
    }

    .search-field input:focus-visible {
        box-shadow: none;
    }

    .filter-select {
        width: 150px;
        height: 34px;
        padding: 0 0.55rem;
    }

    .table-scroll {
        overflow-x: auto;
        border-top: 1px solid var(--border);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.76rem;
    }

    th,
    td {
        height: 49px;
        box-sizing: border-box;
        border-bottom: 1px solid var(--border);
        padding: 0.55rem 0.75rem;
        text-align: start;
    }

    th {
        height: 38px;
        background: color-mix(in oklab, var(--muted) 55%, transparent);
        color: var(--muted-foreground);
        font-size: 0.64rem;
        font-weight: 600;
    }

    tbody tr:hover {
        background: color-mix(in oklab, var(--muted) 52%, transparent);
    }

    tbody tr:last-child td {
        border-bottom: 0;
    }

    .title-cell {
        font-weight: 600;
    }

    .type-column {
        width: 110px;
        color: var(--muted-foreground);
    }

    .quality-column {
        width: 100px;
        color: var(--muted-foreground);
    }

    .status-column {
        width: 130px;
    }

    .status-select {
        width: 100%;
        height: 30px;
        padding: 0 0.45rem;
        font-size: 0.7rem;
    }

    .added-column {
        width: 100px;
        color: var(--muted-foreground);
        white-space: nowrap;
    }

    .action-column {
        width: 48px;
        padding-inline: 0.4rem;
        text-align: center;
    }

    .empty-state {
        height: 180px;
        color: var(--muted-foreground);
        text-align: center;
    }

    .settings {
        width: min(700px, 100%);
        padding: 1.35rem 1rem;
    }

    .settings-heading {
        padding-bottom: 1rem;
    }

    .settings-heading h4 {
        margin: 0;
        font-size: 0.88rem;
    }

    .settings-heading p {
        margin: 0.3rem 0 0;
        color: var(--muted-foreground);
        font-size: 0.72rem;
    }

    .setting-row {
        display: grid;
        min-height: 70px;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 1.5rem;
        border-top: 1px solid var(--border);
    }

    .setting-row > span {
        min-width: 0;
    }

    .setting-row strong,
    .setting-row small {
        display: block;
    }

    .setting-row strong {
        font-size: 0.78rem;
        font-weight: 600;
    }

    .setting-row small {
        margin-top: 0.22rem;
        color: var(--muted-foreground);
        font-size: 0.68rem;
    }

    .setting-row select {
        width: 150px;
        height: 34px;
        padding: 0 0.55rem;
    }

    .switch {
        position: relative;
        width: 34px;
        height: 20px;
        appearance: none;
        border: 0;
        border-radius: 10px;
        background: var(--input);
        padding: 0;
        cursor: pointer;
        transition: background 150ms ease-out;
    }

    .switch::after {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: var(--background);
        content: "";
        transition: transform 150ms ease-out;
    }

    .switch:checked {
        background: #ff6b35;
    }

    .switch:checked::after {
        transform: translateX(14px);
    }

    [dir="rtl"] .switch::after {
        right: 3px;
        left: auto;
    }

    [dir="rtl"] .switch:checked::after {
        transform: translateX(-14px);
    }

    .settings-footer {
        display: flex;
        justify-content: flex-end;
        border-top: 1px solid var(--border);
        padding-top: 1rem;
    }

    [dir="rtl"] .settings-footer {
        justify-content: flex-start;
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

    @media (max-width: 650px) {
        .composer {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .composer-heading,
        .title-field {
            grid-column: 1 / -1;
        }

        .composer :global(.composer-submit) {
            width: 100%;
        }

        .quality-column,
        .added-column {
            display: none;
        }
    }

    @media (max-width: 500px) {
        .app-header {
            padding: 0.6rem 0.75rem;
        }

        .table-toolbar {
            align-items: stretch;
            flex-direction: column;
        }

        .search-field,
        .filter-select {
            width: 100%;
        }

        .type-column {
            display: none;
        }

        .composer {
            grid-template-columns: 1fr;
        }

        .composer-heading,
        .title-field {
            grid-column: auto;
        }

        .setting-row {
            gap: 0.75rem;
        }

        .setting-row select {
            width: 120px;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .switch,
        .switch::after {
            transition: none;
        }
    }
</style>
