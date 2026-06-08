type RateLimitOptions = {
    key: string;
    max: number;
    windowMs: number;
};

type RateLimitBucket = {
    count: number;
    resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();
let lastPruneAt = 0;

export function checkRateLimit({ key, max, windowMs }: RateLimitOptions) {
    const now = Date.now();
    pruneExpiredBuckets(now);

    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, {
            count: 1,
            resetAt: now + windowMs,
        });
        return {
            limited: false,
            retryAfter: 0,
        };
    }

    bucket.count += 1;

    if (bucket.count <= max) {
        return {
            limited: false,
            retryAfter: 0,
        };
    }

    return {
        limited: true,
        retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
}

export function clientRateLimitKey(request: Request, getClientAddress: () => string) {
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();

    if (cloudflareIp) return cloudflareIp;
    if (forwardedFor) return forwardedFor;

    try {
        return getClientAddress();
    } catch {
        return "unknown";
    }
}

export function readRateLimitNumber(value: string | undefined, fallback: number) {
    if (!value) return fallback;

    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function pruneExpiredBuckets(now: number) {
    if (now - lastPruneAt < 60_000) return;

    lastPruneAt = now;
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}
