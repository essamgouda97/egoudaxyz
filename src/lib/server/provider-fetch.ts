export async function fetchWithTimeout(
    input: Parameters<typeof fetch>[0],
    init: RequestInit,
    timeoutMs: number,
) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    try {
        return await fetch(input, {
            ...init,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }
}

export function readPositiveNumber(value: string | undefined, fallback: number) {
    if (!value) return fallback;

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function providerErrorMessage(error: unknown, provider: string) {
    if (error instanceof DOMException && error.name === "AbortError") {
        return `${provider} request timed out.`;
    }

    if (error instanceof Error && error.message) {
        return `${provider} request failed: ${error.message}`;
    }

    return `${provider} request failed.`;
}
