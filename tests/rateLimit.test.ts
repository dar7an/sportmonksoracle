import assert from "node:assert/strict";
import test from "node:test";
import { enforceRateLimit, resetRateLimitForTests } from "../src/rateLimit";
import { OracleError } from "../src/errors";

test("inbound rate limit returns RATE_LIMITED after the window fills", () => {
    const previousDisabled = process.env.RATE_LIMIT_DISABLED;
    const previousMax = process.env.RATE_LIMIT_MAX;
    const previousWindow = process.env.RATE_LIMIT_WINDOW_MS;

    resetRateLimitForTests();
    process.env.RATE_LIMIT_MAX = "2";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    delete process.env.RATE_LIMIT_DISABLED;

    try {
        const request = new Request("http://localhost/fixture", {
            headers: { "x-forwarded-for": "203.0.113.8" },
        });

        enforceRateLimit(request);
        enforceRateLimit(request);
        assert.throws(
            () => enforceRateLimit(request),
            (error: unknown) =>
                error instanceof OracleError && error.code === "RATE_LIMITED" && error.status === 429
        );
    } finally {
        if (previousDisabled === undefined) {
            delete process.env.RATE_LIMIT_DISABLED;
        } else {
            process.env.RATE_LIMIT_DISABLED = previousDisabled;
        }
        if (previousMax === undefined) {
            delete process.env.RATE_LIMIT_MAX;
        } else {
            process.env.RATE_LIMIT_MAX = previousMax;
        }
        if (previousWindow === undefined) {
            delete process.env.RATE_LIMIT_WINDOW_MS;
        } else {
            process.env.RATE_LIMIT_WINDOW_MS = previousWindow;
        }
        resetRateLimitForTests();
    }
});
