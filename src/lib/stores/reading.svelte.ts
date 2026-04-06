import { browser } from "$app/environment";

export type FocusStyle = "dim" | "highlight" | "hide" | "off";

const PREFS_KEY = "reading-prefs";

function loadPrefs(): Record<string, unknown> {
    if (!browser) return {};
    try {
        return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    } catch {
        return {};
    }
}

function createReadingPrefs() {
    const saved = loadPrefs();
    let focusStyle = $state<FocusStyle>((saved.focusStyle as FocusStyle) || "dim");
    let columns = $state<number>((saved.columns as number) || 1);
    let columnWidth = $state<number>((saved.columnWidth as number) || 680);

    function save() {
        if (!browser) return;
        localStorage.setItem(
            PREFS_KEY,
            JSON.stringify({ focusStyle, columns, columnWidth }),
        );
    }

    return {
        get focusStyle() { return focusStyle; },
        set focusStyle(v: FocusStyle) { focusStyle = v; save(); },
        get columns() { return columns; },
        set columns(v: number) { columns = v; save(); },
        get columnWidth() { return columnWidth; },
        set columnWidth(v: number) { columnWidth = v; save(); },
        save,
        reset() {
            focusStyle = "dim";
            columns = 1;
            columnWidth = 680;
            if (browser) localStorage.removeItem(PREFS_KEY);
        },
    };
}

export const readingPrefs = createReadingPrefs();
