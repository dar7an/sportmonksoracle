import { getSportmonksTimeoutMs } from "../config";
import { OracleError } from "../errors";

export type FetchLike = typeof fetch;

export interface SportmonksClientOptions {
    apiKey: string;
    fetch?: FetchLike;
    timeoutMs?: number;
    maxRetries?: number;
}

const MAX_RETRY_WAIT_MS = 5_000;
const DEFAULT_MAX_RETRIES = 2;

export class SportmonksClient {
    private readonly apiKey: string;
    private readonly fetchImpl: FetchLike;
    private readonly timeoutMs: number;
    private readonly maxRetries: number;

    constructor(options: SportmonksClientOptions) {
        this.apiKey = options.apiKey;
        this.fetchImpl = options.fetch ?? globalThis.fetch;
        this.timeoutMs = options.timeoutMs ?? getSportmonksTimeoutMs();
        this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    }

    buildUrl(path: string, search: Record<string, string | undefined> = {}): URL {
        const url = new URL(path, "https://cricket.sportmonks.com");
        for (const [key, value] of Object.entries(search)) {
            if (value !== undefined && value !== "") {
                url.searchParams.set(key, value);
            }
        }
        url.searchParams.set("api_token", this.apiKey);
        return url;
    }

    async getJson<T>(url: URL, label: string): Promise<T> {
        const maxAttempts = this.maxRetries + 1;
        let lastError: unknown;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                const response = await this.fetchImpl(url, {
                    method: "GET",
                    headers: { Accept: "application/json" },
                    signal: AbortSignal.timeout(this.timeoutMs),
                });

                if (response.ok) {
                    try {
                        return (await response.json()) as T;
                    } catch {
                        throw new OracleError(
                            502,
                            "MALFORMED_UPSTREAM",
                            `Sportmonks returned non-JSON while fetching ${label}`
                        );
                    }
                }

                if (response.status === 401 || response.status === 403) {
                    throw new OracleError(
                        response.status,
                        "SPORTMONKS_AUTH_ERROR",
                        "Sportmonks rejected the API key"
                    );
                }

                if (response.status === 404) {
                    throw new OracleError(404, "NOT_FOUND", `${label} was not found`);
                }

                if (response.status === 429) {
                    if (attempt < maxAttempts) {
                        await sleep(retryAfterMs(response));
                        continue;
                    }

                    throw new OracleError(
                        429,
                        "SPORTMONKS_RATE_LIMIT",
                        `Sportmonks rate-limited the oracle while fetching ${label}`,
                        retryAfterHeader(response)
                    );
                }

                if (shouldRetryStatus(response.status) && attempt < maxAttempts) {
                    await sleep(250 * attempt);
                    continue;
                }

                throw new OracleError(
                    502,
                    "SPORTMONKS_ERROR",
                    `Sportmonks failed while fetching ${label}`
                );
            } catch (error) {
                if (error instanceof OracleError) {
                    throw error;
                }

                lastError = error;
                if (attempt < maxAttempts && isRetryableNetworkError(error)) {
                    await sleep(250 * attempt);
                    continue;
                }

                if (isTimeoutError(error)) {
                    throw new OracleError(
                        504,
                        "UPSTREAM_TIMEOUT",
                        `Sportmonks timed out while fetching ${label}`
                    );
                }

                throw new OracleError(
                    502,
                    "SPORTMONKS_ERROR",
                    `Sportmonks failed while fetching ${label}`
                );
            }
        }

        throw lastError instanceof OracleError
            ? lastError
            : new OracleError(502, "SPORTMONKS_ERROR", `Sportmonks failed while fetching ${label}`);
    }
}

function shouldRetryStatus(status: number): boolean {
    return status === 503 || status === 504;
}

function isTimeoutError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }

    return error.name === "TimeoutError" || error.name === "AbortError";
}

function isRetryableNetworkError(error: unknown): boolean {
    return isTimeoutError(error) || error instanceof TypeError;
}

function retryAfterMs(response: Response): number {
    const raw = response.headers.get("Retry-After");
    if (!raw) {
        return 250;
    }

    const seconds = Number(raw);
    if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(seconds * 1000, MAX_RETRY_WAIT_MS);
    }

    const date = Date.parse(raw);
    if (Number.isFinite(date)) {
        return Math.min(Math.max(date - Date.now(), 0), MAX_RETRY_WAIT_MS);
    }

    return 250;
}

function retryAfterHeader(response: Response): Record<string, string> | undefined {
    const raw = response.headers.get("Retry-After");
    return raw ? { "Retry-After": raw } : undefined;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
