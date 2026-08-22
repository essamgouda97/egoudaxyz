<script lang="ts">
    import { browser } from "$app/environment";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import {
        CalendarPlus,
        Check,
        Copy,
        FileText,
        ScanText,
    } from "@lucide/svelte";

    type ParsedDocument = {
        dateIso: string;
        changeLabel: string;
        actionLabel: string;
    };

    const STORAGE_KEY = "egouda-tools-documents-v1";

    let { language = "en" }: { language?: "en" | "ar" } = $props();

    const copyByLanguage = {
        en: {
            title: "Documents",
            source: "Document",
            fileName: "untitled.txt",
            placeholder: "Paste a letter, bill, or notice…",
            extract: "Extract",
            fields: "Extracted fields",
            fieldCount: "3 fields",
            renewal: "Renewal date",
            change: "Monthly change",
            action: "Next step",
            reminder: "Add to calendar",
            downloaded: "Downloaded",
            copyJson: "Copy JSON",
            copied: "Copied",
            empty: "No fields yet",
            compareRemind: "Compare plans before renewal",
            reminderTitle: "Review internet renewal",
        },
        ar: {
            title: "المستندات",
            source: "المستند",
            fileName: "مستند.txt",
            placeholder: "انسخ خطاب أو فاتورة أو إشعار…",
            extract: "استخراج",
            fields: "البيانات المستخرجة",
            fieldCount: "3 حقول",
            renewal: "تاريخ التجديد",
            change: "الزيادة الشهرية",
            action: "الخطوة الجاية",
            reminder: "تذكير بالتقويم",
            downloaded: "اتنزل",
            copyJson: "نسخ JSON",
            copied: "اتنسخ",
            empty: "لسه مفيش بيانات",
            compareRemind: "شوف البدائل قبل التجديد",
            reminderTitle: "راجع تجديد باقة النت",
        },
    } as const;

    const copy = $derived(copyByLanguage[language]);
    let documentText = $state("");
    let parsed = $state<ParsedDocument | null>(null);
    let storageReady = $state(false);
    let downloaded = $state(false);
    let copied = $state(false);
    let feedbackTimer: number | undefined;

    $effect(() => {
        if (!browser || storageReady) return;

        try {
            const saved = JSON.parse(
                localStorage.getItem(STORAGE_KEY) ?? "{}",
            );
            if (typeof saved.documentText === "string") {
                documentText = saved.documentText;
            }
            if (isParsedDocument(saved.parsed)) {
                parsed = saved.parsed;
            }
        } catch {
            documentText = "";
            parsed = null;
        }

        storageReady = true;
    });

    $effect(() => {
        const snapshot = JSON.stringify({ documentText, parsed });
        if (!browser || !storageReady) return;
        localStorage.setItem(STORAGE_KEY, snapshot);
    });

    function isParsedDocument(value: unknown): value is ParsedDocument {
        if (!value || typeof value !== "object") return false;
        const candidate = value as Partial<ParsedDocument>;

        return (
            typeof candidate.dateIso === "string" &&
            typeof candidate.changeLabel === "string" &&
            typeof candidate.actionLabel === "string"
        );
    }

    function scanDocument() {
        parsed = parseDocument(documentText, language);
        downloaded = false;
        copied = false;
    }

    function editDocument(event: Event) {
        documentText = (event.currentTarget as HTMLTextAreaElement).value;
        parsed = null;
        downloaded = false;
        copied = false;
    }

    function updateField(field: keyof ParsedDocument, value: string) {
        if (!parsed) return;
        parsed = { ...parsed, [field]: value };
        downloaded = false;
        copied = false;
    }

    function parseDocument(
        text: string,
        activeLanguage: "en" | "ar",
    ): ParsedDocument {
        const normalized = normalizeDigits(text);
        const dateIso = extractDate(normalized) ?? "";
        const amount = extractAmount(normalized);
        const activeCopy = copyByLanguage[activeLanguage];

        return {
            dateIso,
            changeLabel:
                amount === null
                    ? ""
                    : activeLanguage === "ar"
                      ? "+" + amount.toLocaleString("en-CA") + "$ شهرياً"
                      : "+$" + amount.toLocaleString("en-CA") + " / month",
            actionLabel:
                dateIso || amount !== null ? activeCopy.compareRemind : "",
        };
    }

    function normalizeDigits(value: string) {
        const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
        const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

        return value
            .replace(/[٠-٩]/g, (digit) =>
                String(arabicDigits.indexOf(digit)),
            )
            .replace(/[۰-۹]/g, (digit) =>
                String(persianDigits.indexOf(digit)),
            );
    }

    function extractDate(value: string) {
        const isoMatch = value.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
        if (isoMatch) {
            return toIsoDate(+isoMatch[1], +isoMatch[2], +isoMatch[3]);
        }

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
            new RegExp(
                "(" +
                    monthNames +
                    ")\\s+(\\d{1,2})(?:,)?\\s+(20\\d{2})",
                "i",
            ),
        );
        if (monthFirst) {
            return toIsoDate(
                +monthFirst[3],
                months[monthFirst[1].toLocaleLowerCase()],
                +monthFirst[2],
            );
        }

        const dayFirst = value.match(
            new RegExp(
                "(\\d{1,2})\\s+(" + monthNames + ")\\s+(20\\d{2})",
                "i",
            ),
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

        const candidate = new Date(Date.UTC(year, month - 1, day));
        if (
            candidate.getUTCFullYear() !== year ||
            candidate.getUTCMonth() !== month - 1 ||
            candidate.getUTCDate() !== day
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

    function extractedJson() {
        if (!parsed) return "";

        return JSON.stringify(
            {
                renewalDate: parsed.dateIso || null,
                monthlyChange: parsed.changeLabel || null,
                nextStep: parsed.actionLabel || null,
            },
            null,
            2,
        );
    }

    async function copyExtractedJson() {
        const value = extractedJson();
        if (!value) return;

        try {
            await navigator.clipboard.writeText(value);
        } catch {
            const input = document.createElement("textarea");
            input.value = value;
            input.style.position = "fixed";
            input.style.opacity = "0";
            document.body.append(input);
            input.select();
            document.execCommand("copy");
            input.remove();
        }

        copied = true;
        window.clearTimeout(feedbackTimer);
        feedbackTimer = window.setTimeout(() => (copied = false), 1600);
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
            new Blob([calendar], {
                type: "text/calendar;charset=utf-8",
            }),
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
    class="app-frame"
    data-app="document-reader"
    lang={language}
    dir={language === "ar" ? "rtl" : "ltr"}
    aria-label={copy.title}
>
    <header class="app-header">
        <div class="app-identity">
            <span class="app-icon"><FileText size={18} /></span>
            <h3>{copy.title}</h3>
        </div>

        <div class="header-actions">
            <Button
                data-testid="copy-json"
                class="secondary-action"
                variant="outline"
                size="sm"
                disabled={!parsed}
                title={copy.copyJson}
                onclick={copyExtractedJson}
            >
                {#if copied}<Check size={16} />{:else}<Copy size={16} />{/if}
                <span>{copied ? copy.copied : copy.copyJson}</span>
            </Button>
            <Button
                data-testid="reminder-download"
                class="secondary-action"
                variant="outline"
                size="sm"
                disabled={!parsed?.dateIso}
                title={copy.reminder}
                onclick={downloadReminder}
            >
                {#if downloaded}
                    <Check size={16} />
                {:else}
                    <CalendarPlus size={16} />
                {/if}
                <span>{downloaded ? copy.downloaded : copy.reminder}</span>
            </Button>
            <Button
                data-testid="paper-scan"
                class="primary-action"
                size="sm"
                disabled={!documentText.trim()}
                title={copy.extract}
                onclick={scanDocument}
            >
                <ScanText size={16} />
                <span>{copy.extract}</span>
            </Button>
        </div>
    </header>

    <div class="workspace">
        <section class="document-pane" aria-labelledby="document-heading">
            <div class="pane-header">
                <div>
                    <h4 id="document-heading">{copy.source}</h4>
                    <span>{copy.fileName}</span>
                </div>
                <span class="character-count">{documentText.length}</span>
            </div>
            <textarea
                data-testid="paper-text"
                value={documentText}
                spellcheck="false"
                aria-label={copy.source}
                placeholder={copy.placeholder}
                oninput={editDocument}
            ></textarea>
        </section>

        <section class="fields-pane" aria-labelledby="fields-heading">
            <div class="pane-header">
                <h4 id="fields-heading">{copy.fields}</h4>
                {#if parsed}
                    <Badge variant="secondary">{copy.fieldCount}</Badge>
                {/if}
            </div>

            {#if parsed}
                <div class="field-list" aria-live="polite">
                    <label class="field-row">
                        <span>{copy.renewal}</span>
                        <input
                            data-testid="extraction-date"
                            type="date"
                            value={parsed.dateIso}
                            oninput={(event) =>
                                updateField(
                                    "dateIso",
                                    (event.currentTarget as HTMLInputElement).value,
                                )}
                        />
                    </label>
                    <label class="field-row">
                        <span>{copy.change}</span>
                        <input
                            data-testid="extraction-change"
                            type="text"
                            value={parsed.changeLabel}
                            oninput={(event) =>
                                updateField(
                                    "changeLabel",
                                    (event.currentTarget as HTMLInputElement).value,
                                )}
                        />
                    </label>
                    <label class="field-row action-field">
                        <span>{copy.action}</span>
                        <textarea
                            rows="3"
                            value={parsed.actionLabel}
                            oninput={(event) =>
                                updateField(
                                    "actionLabel",
                                    (event.currentTarget as HTMLTextAreaElement).value,
                                )}
                        ></textarea>
                    </label>
                </div>
            {:else}
                <div class="empty-state" aria-live="polite">
                    <ScanText size={24} />
                    <p>{copy.empty}</p>
                </div>
            {/if}
        </section>
    </div>
</section>

<style>
    .app-frame {
        min-height: 460px;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--card);
        color: var(--foreground);
        box-shadow: 0 1px 3px color-mix(in oklab, var(--foreground) 10%, transparent);
        font-family: ui-sans-serif, system-ui, sans-serif;
    }

    .app-frame[dir="rtl"] {
        font-family: "Cairo", ui-sans-serif, system-ui, sans-serif;
    }

    .app-header,
    .app-identity,
    .header-actions,
    .pane-header,
    .pane-header > div {
        display: flex;
        align-items: center;
    }

    .app-header {
        min-height: 64px;
        justify-content: space-between;
        gap: 0.75rem;
        border-bottom: 1px solid var(--border);
        padding: 0.75rem 1rem;
    }

    .app-identity {
        min-width: 0;
        gap: 0.625rem;
    }

    .app-icon {
        display: grid;
        width: 34px;
        height: 34px;
        flex: 0 0 auto;
        place-items: center;
        border: 1px solid var(--border);
        border-radius: 7px;
        background: var(--muted);
    }

    h3,
    h4,
    p {
        margin: 0;
    }

    h3 {
        overflow: hidden;
        font-size: 0.925rem;
        font-weight: 650;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .header-actions {
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .app-frame :global(.primary-action),
    .app-frame :global(.secondary-action) {
        min-height: 36px;
        gap: 0.4rem;
        white-space: nowrap;
    }

    .workspace {
        display: grid;
        min-height: 395px;
        grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.95fr);
    }

    .document-pane,
    .fields-pane {
        display: flex;
        min-width: 0;
        flex-direction: column;
    }

    .document-pane {
        border-inline-end: 1px solid var(--border);
    }

    .pane-header {
        min-height: 58px;
        justify-content: space-between;
        gap: 0.75rem;
        border-bottom: 1px solid var(--border);
        padding: 0.75rem 1rem;
    }

    .pane-header > div {
        min-width: 0;
        align-items: flex-start;
        flex-direction: column;
        gap: 0.15rem;
    }

    h4 {
        font-size: 0.78rem;
        font-weight: 650;
    }

    .pane-header span,
    .character-count {
        overflow: hidden;
        color: var(--muted-foreground);
        font-size: 0.7rem;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .character-count {
        font-variant-numeric: tabular-nums;
    }

    textarea,
    input {
        box-sizing: border-box;
        border: 1px solid var(--input, var(--border));
        border-radius: 6px;
        background: var(--background);
        color: var(--foreground);
        font: inherit;
    }

    textarea:focus-visible,
    input:focus-visible {
        border-color: var(--ring);
        outline: 2px solid color-mix(in oklab, var(--ring) 26%, transparent);
        outline-offset: 1px;
    }

    .document-pane > textarea {
        width: calc(100% - 2rem);
        min-height: 292px;
        flex: 1;
        resize: none;
        border: 0;
        border-radius: 0;
        margin: 1rem;
        background: transparent;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.78rem;
        line-height: 1.75;
    }

    .app-frame[dir="rtl"] .document-pane > textarea {
        font-family: "Cairo", ui-sans-serif, system-ui, sans-serif;
        line-height: 1.9;
    }

    .document-pane > textarea:focus-visible {
        border-radius: 6px;
        outline: 2px solid var(--ring);
        outline-offset: 4px;
    }

    .field-list {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }

    .field-row {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .field-row > span {
        color: var(--muted-foreground);
        font-size: 0.7rem;
        font-weight: 600;
    }

    .field-row input,
    .field-row textarea {
        width: 100%;
        min-height: 40px;
        padding: 0.55rem 0.7rem;
        font-size: 0.78rem;
    }

    .field-row textarea {
        min-height: 76px;
        resize: vertical;
        line-height: 1.5;
    }

    .empty-state {
        display: grid;
        min-height: 285px;
        flex: 1;
        place-content: center;
        justify-items: center;
        gap: 0.65rem;
        color: var(--muted-foreground);
    }

    .empty-state p {
        font-size: 0.78rem;
    }

    @media (max-width: 720px) {
        .app-header {
            align-items: flex-start;
            flex-direction: column;
        }

        .header-actions {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .app-frame :global(.primary-action),
        .app-frame :global(.secondary-action) {
            width: 100%;
            justify-content: center;
        }

        .workspace {
            grid-template-columns: minmax(0, 1fr);
        }

        .document-pane {
            border-inline-end: 0;
            border-bottom: 1px solid var(--border);
        }

        .document-pane > textarea {
            min-height: 220px;
        }

        .field-list {
            min-height: 280px;
        }
    }

    @media (max-width: 430px) {
        .header-actions span {
            display: none;
        }

        .header-actions {
            grid-template-columns: repeat(3, 40px);
            justify-content: start;
        }

        .app-frame :global(.primary-action),
        .app-frame :global(.secondary-action) {
            width: 40px;
            padding-inline: 0;
        }
    }
</style>
