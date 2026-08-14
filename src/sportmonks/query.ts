import {
    FALLBACK_LEAGUE_ID,
    getDefaultFixtureStatus,
    getDefaultLeagueId,
} from "../config";
import { OracleError } from "../errors";

export const DEFAULT_LEAGUE_ID = FALLBACK_LEAGUE_ID;
export const DEFAULT_FIXTURE_LIMIT = 1;
export const MAX_FIXTURE_LIMIT = 10;

export interface FixtureQuery {
    leagueId: number;
    status: string;
    teamId?: number;
    limit: number;
}

export function parseFixtureQuery(searchParams: URLSearchParams): FixtureQuery {
    return {
        leagueId: parsePositiveInt(
            searchParams.get("leagueId"),
            "leagueId",
            getDefaultLeagueId()
        ),
        status: parseStatus(searchParams.get("status")),
        teamId: parseOptionalPositiveInt(searchParams.get("teamId"), "teamId"),
        limit: parseLimit(searchParams.get("limit")),
    };
}

export function parseFixtureId(value: string): number {
    return parsePositiveInt(value, "fixtureID");
}

function parsePositiveInt(value: string | null, name: string, fallback?: number): number {
    if (value === null || value === "") {
        if (fallback !== undefined) {
            return fallback;
        }
        throw new OracleError(400, "BAD_REQUEST", `${name} must be a positive integer`);
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new OracleError(400, "BAD_REQUEST", `${name} must be a positive integer`);
    }

    return parsed;
}

function parseOptionalPositiveInt(value: string | null, name: string): number | undefined {
    if (value === null || value === "") {
        return undefined;
    }

    return parsePositiveInt(value, name);
}

function parseLimit(value: string | null): number {
    const limit = parsePositiveInt(value, "limit", DEFAULT_FIXTURE_LIMIT);
    if (limit > MAX_FIXTURE_LIMIT) {
        throw new OracleError(
            400,
            "BAD_REQUEST",
            `limit must be between 1 and ${MAX_FIXTURE_LIMIT}`
        );
    }

    return limit;
}

function parseStatus(value: string | null): string {
    const status = value?.trim() || getDefaultFixtureStatus();
    if (!/^[A-Za-z0-9 ._-]+$/.test(status)) {
        throw new OracleError(400, "BAD_REQUEST", "status contains invalid characters");
    }

    return status;
}
