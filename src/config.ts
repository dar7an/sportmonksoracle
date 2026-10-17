import { OracleError } from "./errors";

export interface OracleEnv {
    apiKey: string;
    privateKey: string;
}

export const FALLBACK_LEAGUE_ID = 3;
export const FALLBACK_FIXTURE_STATUS = "NS";
export const FALLBACK_FIXTURE_CACHE_SECONDS = 60;
export const FALLBACK_STATUS_CACHE_SECONDS = 15;
export const FALLBACK_RATE_LIMIT_MAX = 60;
export const FALLBACK_RATE_LIMIT_WINDOW_MS = 60_000;
export const FALLBACK_SPORTMONKS_TIMEOUT_MS = 12_000;

/**
 * Reads runtime secrets inside request handlers.
 *
 * Keeping this out of module scope lets Next.js build and type-check the app
 * without production secrets.
 */
export function getOracleEnv(): OracleEnv {
    const { API_KEY, PRIVATE_KEY } = process.env;
    const missing = [
        !API_KEY ? "API_KEY" : null,
        !PRIVATE_KEY ? "PRIVATE_KEY" : null,
    ].filter(Boolean);

    if (missing.length > 0) {
        throw new OracleError(
            500,
            "CONFIG_ERROR",
            `Missing required environment variables: ${missing.join(", ")}`
        );
    }

    return {
        apiKey: API_KEY as string,
        privateKey: PRIVATE_KEY as string,
    };
}

export function getDefaultLeagueId(): number {
    return readIntegerEnv("DEFAULT_LEAGUE_ID", FALLBACK_LEAGUE_ID, { min: 1 });
}

export function getDefaultFixtureStatus(): string {
    return process.env.DEFAULT_FIXTURE_STATUS?.trim() || FALLBACK_FIXTURE_STATUS;
}

export function getFixtureCacheSeconds(): number {
    return readIntegerEnv("FIXTURE_CACHE_SECONDS", FALLBACK_FIXTURE_CACHE_SECONDS, {
        min: 0,
    });
}

export function getStatusCacheSeconds(): number {
    return readIntegerEnv("STATUS_CACHE_SECONDS", FALLBACK_STATUS_CACHE_SECONDS, {
        min: 0,
    });
}

export function getRateLimitMax(): number {
    return readIntegerEnv("RATE_LIMIT_MAX", FALLBACK_RATE_LIMIT_MAX, { min: 1 });
}

export function getRateLimitWindowMs(): number {
    return readIntegerEnv("RATE_LIMIT_WINDOW_MS", FALLBACK_RATE_LIMIT_WINDOW_MS, {
        min: 1,
    });
}

export function getSportmonksTimeoutMs(): number {
    return readIntegerEnv("SPORTMONKS_TIMEOUT_MS", FALLBACK_SPORTMONKS_TIMEOUT_MS, {
        min: 1,
    });
}

function readIntegerEnv(
    name: string,
    fallback: number,
    options: { min: number }
): number {
    const rawValue = process.env[name];
    if (!rawValue) {
        return fallback;
    }

    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed < options.min) {
        throw new OracleError(
            500,
            "CONFIG_ERROR",
            `${name} must be an integer >= ${options.min}`
        );
    }

    return parsed;
}
