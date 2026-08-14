<script lang="ts">
    import { CalendarPlus, Check, FileText, ScanText } from "@lucide/svelte";

    type ParsedDocument = {
        dateIso: string | null;
        dateLabel: string;
        changeLabel: string;
        actionLabel: string;
    };

    let { language = "en" }: { language?: "en" | "ar" } = $props();

    const copyByLanguage = {
        en: {
            title: "Read a document",
            paste: "Paste document text",
            scan: "Read it",
            renewal: "Renewal",
            change: "Change",
            action: "Next step",
            reminder: "Download reminder",
            ready: "Reminder ready",
            unknown: "Not found",
            sampleDocument:
                "Renewal notice\nYour home internet plan renews on October 18, 2026.\n" +
                "The monthly price will increase by $75.\nCompare plans before renewal.",
            compareRemind: "Compare + remind me",
            reminderTitle: "Review internet renewal",
        },
        ar: {
            title: "اقرأ مستند",
            paste: "حط نص المستند",
            scan: "اقرأه",
            renewal: "تجديد",
            change: "تغيير",
            action: "الخطوة الجاية",
            reminder: "نزّل التذكير",
            ready: "التذكير جاهز",
            unknown: "مش موجود",
            sampleDocument:
                "إشعار تجديد\nباقة النت في البيت هتتجدد يوم 18 أكتوبر 2026.\n" +
                "السعر الشهري هيزيد 75$.\nشوف البدائل قبل التجديد.",
            compareRemind: "قارن + فكّرني",
            reminderTitle: "راجع تجديد باقة النت",
        },
    } as const;

    function readInitialLanguage() {
        return language;
    }

    const initialLanguage = readInitialLanguage();
    const copy = $derived(copyByLanguage[language]);
    let documentText = $state(copyByLanguage[initialLanguage].sampleDocument);
    let parsed = $state<ParsedDocument | null>(
        parseDocument(
            copyByLanguage[initialLanguage].sampleDocument,
            initialLanguage,
        ),
    );
    let downloaded = $state(false);
    let previousLanguage = $state(initialLanguage);

    $effect(() => {
        if (language === previousLanguage) return;

        documentText = copy.sampleDocument;
        parsed = parseDocument(documentText, language);
        downloaded = false;
        previousLanguage = language;
    });

    function scanDocument() {
        parsed = parseDocument(documentText, language);
        downloaded = false;
    }

    function editDocument(event: Event) {
        documentText = (event.currentTarget as HTMLTextAreaElement).value;
        parsed = null;
        downloaded = false;
    }

    function parseDocument(text: string, activeLanguage: "en" | "ar"): ParsedDocument {
        const normalized = normalizeDigits(text);
        const dateIso = extractDate(normalized);
        const amount = extractAmount(normalized);
        const activeCopy = copyByLanguage[activeLanguage];

        return {
            dateIso,
            dateLabel: dateIso
                ? formatDate(dateIso, activeLanguage)
                : activeCopy.unknown,
            changeLabel:
                amount === null
                    ? activeCopy.unknown
                    : activeLanguage === "ar"
                      ? "+" + amount.toLocaleString("en-CA") + "$ في الشهر"
                      : "+$" + amount.toLocaleString("en-CA") + " / month",
            actionLabel:
                dateIso || amount !== null
                    ? activeCopy.compareRemind
                    : activeCopy.unknown,
        };
    }

    function normalizeDigits(value: string) {
        const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
        const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

        return value
            .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
            .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)));
    }

    function extractDate(value: string) {
        const isoMatch = value.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
        if (isoMatch) return toIsoDate(+isoMatch[1], +isoMatch[2], +isoMatch[3]);

        const months: Record<string, number> = {
            january: 1,
            february: 2,
            march: 3,
            april: 4,
            may: 5,
            june: 6,
            july: 7,
            august: 8,
            september: 9,
            october: 10,
            november: 11,
            december: 12,
            يناير: 1,
            فبراير: 2,
            مارس: 3,
            أبريل: 4,
            ابريل: 4,
            مايو: 5,
            يونيو: 6,
            يوليو: 7,
            أغسطس: 8,
            اغسطس: 8,
            سبتمبر: 9,
            أكتوبر: 10,
            اكتوبر: 10,
            نوفمبر: 11,
            ديسمبر: 12,
        };
        const monthNames = Object.keys(months).join("|");
        const monthFirst = value.match(
            new RegExp("(" + monthNames + ")\\s+(\\d{1,2})(?:,)?\\s+(20\\d{2})", "i"),
        );
        if (monthFirst) {
            return toIsoDate(
                +monthFirst[3],
                months[monthFirst[1].toLocaleLowerCase()],
                +monthFirst[2],
            );
        }

        const dayFirst = value.match(
            new RegExp("(\\d{1,2})\\s+(" + monthNames + ")\\s+(20\\d{2})", "i"),
        );
        if (!dayFirst) return null;

        return toIsoDate(
            +dayFirst[3],
            months[dayFirst[2].toLocaleLowerCase()],
            +dayFirst[1],
        );
    }

    function toIsoDate(year: number, month: number, day: number) {
        if (
            !Number.isInteger(year) ||
            !Number.isInteger(month) ||
            !Number.isInteger(day) ||
            month < 1 ||
            month > 12 ||
            day < 1 ||
            day > 31
        ) {
            return null;
        }

        return [
            String(year),
            String(month).padStart(2, "0"),
            String(day).padStart(2, "0"),
        ].join("-");
    }

    function extractAmount(value: string) {
        const match = value.match(
            /\$\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*\$/,
        );
        const raw = match?.[1] ?? match?.[2];
        if (!raw) return null;

        const amount = Number(raw.replace(",", "."));
        return Number.isFinite(amount) ? amount : null;
    }

    function formatDate(dateIso: string, activeLanguage: "en" | "ar") {
        const [year, month, day] = dateIso.split("-").map(Number);
        return new Intl.DateTimeFormat(activeLanguage === "ar" ? "ar-EG" : "en-CA", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
        }).format(new Date(Date.UTC(year, month - 1, day)));
    }

    function downloadReminder() {
        if (!parsed?.dateIso) return;

        const compactDate = parsed.dateIso.replaceAll("-", "");
        const calendar = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//egouda.xyz//Workflow//EN",
            "BEGIN:VEVENT",
            "UID:renewal-" + compactDate + "@egouda.xyz",
            "DTSTART;VALUE=DATE:" + compactDate,
            "SUMMARY:" + copy.reminderTitle,
            "DESCRIPTION:" + parsed.changeLabel + " - " + parsed.actionLabel,
            "END:VEVENT",
            "END:VCALENDAR",
        ].join("\r\n");
        const url = URL.createObjectURL(
            new Blob([calendar], { type: "text/calendar;charset=utf-8" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.download = "renewal-reminder.ics";
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
        downloaded = true;
    }
</script>

<section
    class="paper-app"
    data-app="document-reader"
    lang={language}
    dir={language === "ar" ? "rtl" : "ltr"}
    aria-label={copy.title}
>
    <header>
        <div class="app-title">
            <FileText size={18} />
            <h3>{copy.title}</h3>
        </div>
        <button
            data-testid="paper-scan"
            class="scan-button"
            type="button"
            disabled={!documentText.trim()}
            onclick={scanDocument}
        >
            <ScanText size={17} /> {copy.scan}
        </button>
    </header>

    <div class="paper-body">
        <label class="document-input">
            <span>{copy.paste}</span>
            <textarea
                data-testid="paper-text"
                value={documentText}
                rows="8"
                spellcheck="false"
                oninput={editDocument}
            ></textarea>
            <i aria-hidden="true"></i>
        </label>

        <div class="extraction" aria-live="polite">
            <div class:ready={parsed}>
                <span>{copy.renewal}</span>
                <strong data-testid="extraction-date">
                    {parsed?.dateLabel ?? "—"}
                </strong>
            </div>
            <div class:ready={parsed}>
                <span>{copy.change}</span>
                <strong data-testid="extraction-change">
                    {parsed?.changeLabel ?? "—"}
                </strong>
            </div>
            <div class:ready={parsed}>
                <span>{copy.action}</span>
                <strong>{parsed?.actionLabel ?? "—"}</strong>
            </div>

            <button
                data-testid="reminder-download"
                class="reminder-button"
                type="button"
                disabled={!parsed?.dateIso}
                onclick={downloadReminder}
            >
                {#if downloaded}
                    <Check size={17} /> {copy.ready}
                {:else}
                    <CalendarPlus size={17} /> {copy.reminder}
                {/if}
            </button>
        </div>
    </div>
</section>

<style>
    .paper-app {
        min-height: 460px;
        overflow: hidden;
        border-radius: 8px;
        background: #fff3d2;
        color: #2f281d;
        box-shadow: 0 6px 0 color-mix(in oklab, #2f281d 20%, transparent);
    }

    header {
        display: flex;
        min-height: 64px;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        border-bottom: 1px solid #d9c590;
        padding: 0.75rem 1rem;
    }

    .app-title,
    .scan-button,
    .reminder-button {
        display: inline-flex;
        align-items: center;
    }

    .app-title {
        gap: 0.55rem;
    }

    h3 {
        margin: 0;
        font-size: 0.95rem;
    }

    button,
    textarea {
        font: inherit;
    }

    button {
        cursor: pointer;
    }

    button:focus-visible,
    textarea:focus-visible {
        outline: 3px solid #ff6b35;
        outline-offset: 2px;
    }

    .scan-button {
        min-height: 40px;
        gap: 0.45rem;
        border: 0;
        border-radius: 6px;
        background: #2f281d;
        padding: 0.55rem 0.75rem;
        color: #fffdf5;
        font-size: 0.76rem;
        font-weight: 700;
    }

    .scan-button:hover:not(:disabled) {
        background: #51452f;
    }

    button:disabled {
        cursor: not-allowed;
        opacity: 0.45;
    }

    .paper-body {
        display: grid;
        min-height: 396px;
        grid-template-columns: minmax(310px, 1.15fr) minmax(280px, 0.85fr);
    }

    .document-input {
        position: relative;
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 0.6rem;
        border-inline-end: 1px solid #d9c590;
        padding: clamp(1.2rem, 4vw, 2.25rem);
    }

    .document-input > span {
        color: #75694f;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .document-input textarea {
        position: relative;
        z-index: 1;
        width: 100%;
        min-height: 270px;
        box-sizing: border-box;
        resize: vertical;
        border: 1px solid #d6d0bf;
        border-radius: 4px;
        background:
            linear-gradient(#fffef9 31px, #e9e3d4 32px) 0 0 / 100% 32px;
        padding: 1.1rem 1.2rem;
        color: #3d3528;
        font-family: inherit;
        font-size: 0.82rem;
        line-height: 2rem;
        box-shadow: 0 8px 0 #dccb9e;
    }

    .document-input i {
        position: absolute;
        right: 1.5rem;
        bottom: 1.5rem;
        width: 46px;
        height: 46px;
        border: 8px solid #ff6b35;
        border-top-color: transparent;
        border-left-color: transparent;
        opacity: 0.25;
        transform: rotate(8deg);
    }

    [dir="rtl"] .document-input i {
        right: auto;
        left: 1.5rem;
        transform: rotate(82deg);
    }

    .extraction {
        display: flex;
        min-width: 0;
        flex-direction: column;
        justify-content: center;
        gap: 0;
        background: #2f281d;
        padding: clamp(1.2rem, 4vw, 2.25rem);
        color: #fffdf5;
    }

    .extraction > div {
        display: grid;
        min-height: 72px;
        grid-template-columns: minmax(78px, 0.65fr) minmax(0, 1.35fr);
        align-items: center;
        gap: 1rem;
        border-bottom: 1px solid #5f543e;
    }

    .extraction > div:first-child {
        border-top: 1px solid #5f543e;
    }

    .extraction span {
        color: #cbbf9e;
        font-size: 0.66rem;
        font-weight: 700;
        text-transform: uppercase;
    }

    .extraction strong {
        overflow-wrap: anywhere;
        color: #8d908f;
        font-size: 0.9rem;
        line-height: 1.25;
    }

    .extraction div.ready strong {
        color: #fffdf5;
    }

    .extraction div.ready::before {
        position: absolute;
        width: 3px;
        height: 34px;
        margin-inline-start: -1rem;
        background: #ff6b35;
        content: "";
    }

    .reminder-button {
        min-height: 46px;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1.2rem;
        border: 0;
        border-radius: 6px;
        background: #ff6b35;
        padding: 0.65rem 0.8rem;
        color: #2f281d;
        font-weight: 700;
    }

    .reminder-button:hover:not(:disabled) {
        background: #ff8257;
    }

    @media (max-width: 720px) {
        .paper-body {
            grid-template-columns: 1fr;
        }

        .document-input {
            border-inline-end: 0;
            border-bottom: 1px solid #d9c590;
        }
    }

    @media (max-width: 460px) {
        header {
            align-items: stretch;
            flex-direction: column;
        }

        .scan-button {
            justify-content: center;
        }

        .document-input,
        .extraction {
            padding: 1rem;
        }

        .document-input textarea {
            min-height: 240px;
        }

        .extraction > div {
            grid-template-columns: 74px minmax(0, 1fr);
        }
    }
</style>
