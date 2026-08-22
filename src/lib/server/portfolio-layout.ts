import type { Cookies } from "@sveltejs/kit";

const MIN_A = 10;
const MIN_B = 10;

type PortfolioLayout = {
    defaultA: number;
    defaultB: number;
};

function normalizeAndClamp(a: number, b: number) {
    let sum = a + b;
    if (!Number.isFinite(sum) || sum <= 0) {
        a = 50;
        b = 50;
        sum = 100;
    }

    a = (a / sum) * 100;
    a = Math.max(MIN_A, Math.min(100 - MIN_B, a));

    return {
        a: Math.round(a * 100) / 100,
        b: Math.round((100 - a) * 100) / 100,
    };
}

export function readPortfolioLayout(
    cookies: Pick<Cookies, "get">,
): PortfolioLayout {
    let defaultA = 75;
    let defaultB = 25;
    const raw = cookies.get("portfolio-resize");

    if (raw) {
        try {
            const parsed = JSON.parse(raw) as Partial<{ a: number; b: number }>;
            if (typeof parsed.a === "number" && typeof parsed.b === "number") {
                const normalized = normalizeAndClamp(parsed.a, parsed.b);
                defaultA = normalized.a;
                defaultB = normalized.b;
            }
        } catch {
            // Ignore malformed cookies and use the default pane sizes.
        }
    }

    return { defaultA, defaultB };
}
