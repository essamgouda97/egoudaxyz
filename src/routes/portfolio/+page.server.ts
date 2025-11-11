import type { PageServerLoad } from "./$types";

const MIN_A = 10;
const MIN_B = 10;

function normalizeAndClamp(a: number, b: number): { a: number; b: number } {
  // Avoid divide-by-zero and normalize to 100
  let sum = a + b;
  if (!isFinite(sum) || sum <= 0) {
    a = 50;
    b = 50;
    sum = 100;
  }
  a = (a / sum) * 100;
  b = 100 - a;

  // Clamp to minimums
  a = Math.max(MIN_A, Math.min(100 - MIN_B, a));
  b = 100 - a;

  // Round to two decimals for stable inline styles
  return {
    a: Math.round(a * 100) / 100,
    b: Math.round(b * 100) / 100
  };
}

export const load: PageServerLoad = async ({ cookies }) => {
  let defaultA = 75;
  let defaultB = 25;

  const raw = cookies.get("portfolio-resize");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<{ a: number; b: number }>;
      const a = typeof parsed.a === "number" ? parsed.a : undefined;
      const b = typeof parsed.b === "number" ? parsed.b : undefined;

      if (typeof a === "number" && typeof b === "number") {
        const normalized = normalizeAndClamp(a, b);
        defaultA = normalized.a;
        defaultB = normalized.b;
      }
    } catch {
      // Ignore malformed cookie and fall back to defaults
    }
  }

  return {
    defaultA,
    defaultB
  };
};
