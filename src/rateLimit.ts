import { getRateLimitMax, getRateLimitWindowMs } from "./config";
import { OracleError } from "./errors";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function resetRateLimitForTests(): void {
    buckets.clear();
}

export function enforceRateLimit(request: Request): void {
    if (process.env.RATE_LIMIT_DISABLED === "1") {
        return;
    }

    const max = getRateLimitMax();
    const windowMs = getRateLimitWindowMs();
    const key = clientIp(request);
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return;
    }

    if (existing.count >= max) {
        const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
        throw new OracleError(
            429,
            "RATE_LIMITED",
            "Too many requests to this oracle instance",
            { "Retry-After": String(retryAfterSeconds) }
        );
    }

    existing.count += 1;
}

function clientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        const first = forwarded.split(",")[0]?.trim();
        if (first) {
            return first;
        }
    }

    return request.headers.get("x-real-ip")?.trim() || "local";
}
