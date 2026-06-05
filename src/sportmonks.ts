import dayjs from "dayjs";
import { Fixture, Status } from "./oracleUtils";
import { OracleError } from "./errors";
import { mapSportmonksStatus } from "./status";

export const DEFAULT_LEAGUE_ID = readDefaultPositiveInt("DEFAULT_LEAGUE_ID", 3);
export const DEFAULT_FIXTURE_STATUS = process.env.DEFAULT_FIXTURE_STATUS ?? "NS";
export const DEFAULT_FIXTURE_LIMIT = 1;
export const MAX_FIXTURE_LIMIT = 10;

export interface FixtureQuery {
    leagueId: number;
    status: string;
    teamId?: number;
    limit: number;
}

export interface TeamData {
    name: string;
    code: string;
}

export interface ProcessedFixtureData extends Fixture {
    localTeamName: string;
    localTeamCode: string;
    visitorTeamName: string;
    visitorTeamCode: string;
}

interface SportmonksFixture {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
}

interface SportmonksFixtureStatus extends SportmonksFixture {
    status: string;
    winner_team_id: number | null;
}

export function parseFixtureQuery(searchParams: URLSearchParams): FixtureQuery {
    return {
        leagueId: parsePositiveInt(
            searchParams.get("leagueId"),
            "leagueId",
            DEFAULT_LEAGUE_ID
        ),
        status: parseStatus(searchParams.get("status")),
        teamId: parseOptionalPositiveInt(searchParams.get("teamId"), "teamId"),
        limit: parseLimit(searchParams.get("limit")),
    };
}

export function parseFixtureId(value: string): number {
    return parsePositiveInt(value, "fixtureID");
}

export async function fetchFixtures(
    query: FixtureQuery,
    apiKey: string
): Promise<ProcessedFixtureData[]> {
    const url = new URL("https://cricket.sportmonks.com/api/v2.0/fixtures");
    url.searchParams.set("filter[league_id]", String(query.leagueId));
    url.searchParams.set("filter[status]", query.status);
    url.searchParams.set(
        "fields[fixtures]",
        "id,localteam_id,visitorteam_id,starting_at"
    );
    url.searchParams.set("sort", "starting_at");
    url.searchParams.set("api_token", apiKey);

    const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    await assertSportmonksResponse(response, "fixture list");

    const payload = (await response.json()) as { data?: SportmonksFixture[] };
    const fixtures = (payload.data ?? [])
        .filter((fixture) => matchesTeam(fixture, query.teamId))
        .slice(0, query.limit);

    if (fixtures.length === 0) {
        throw new OracleError(404, "NOT_FOUND", "No matching fixtures found");
    }

    return Promise.all(fixtures.map((fixture) => hydrateFixture(fixture, apiKey)));
}

export async function fetchFixtureStatus(
    fixtureID: number,
    apiKey: string
): Promise<Status> {
    const url = new URL(
        `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureID}`
    );
    url.searchParams.set(
        "fields[fixtures]",
        "id,localteam_id,visitorteam_id,starting_at,status,winner_team_id"
    );
    url.searchParams.set("api_token", apiKey);

    const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    await assertSportmonksResponse(response, "fixture status");

    const payload = (await response.json()) as { data?: SportmonksFixtureStatus };
    if (!payload.data) {
        throw new OracleError(404, "NOT_FOUND", "Fixture status not found");
    }

    return {
        fixtureID: payload.data.id,
        localTeamID: payload.data.localteam_id,
        visitorTeamID: payload.data.visitorteam_id,
        startingAt: dayjs(payload.data.starting_at).valueOf(),
        status: mapSportmonksStatus(payload.data.status),
        winnerTeamID: payload.data.winner_team_id ?? 0,
    };
}

async function hydrateFixture(
    fixture: SportmonksFixture,
    apiKey: string
): Promise<ProcessedFixtureData> {
    const [localTeam, visitorTeam] = await Promise.all([
        fetchTeamData(fixture.localteam_id, apiKey),
        fetchTeamData(fixture.visitorteam_id, apiKey),
    ]);

    return {
        fixtureID: fixture.id,
        localTeamID: fixture.localteam_id,
        visitorTeamID: fixture.visitorteam_id,
        startingAt: dayjs(fixture.starting_at).valueOf(),
        localTeamName: localTeam.name,
        localTeamCode: localTeam.code,
        visitorTeamName: visitorTeam.name,
        visitorTeamCode: visitorTeam.code,
    };
}

async function fetchTeamData(teamId: number, apiKey: string): Promise<TeamData> {
    const url = new URL(`https://cricket.sportmonks.com/api/v2.0/teams/${teamId}`);
    url.searchParams.set("api_token", apiKey);

    const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    await assertSportmonksResponse(response, `team ${teamId}`);

    const payload = (await response.json()) as {
        data?: { name?: string; code?: string };
    };
    if (!payload.data?.name || !payload.data?.code) {
        throw new OracleError(502, "SPORTMONKS_ERROR", `Team ${teamId} is missing data`);
    }

    return {
        name: payload.data.name,
        code: payload.data.code,
    };
}

async function assertSportmonksResponse(
    response: Response,
    label: string
): Promise<void> {
    if (response.ok) {
        return;
    }

    if (response.status === 401 || response.status === 403) {
        throw new OracleError(
            response.status,
            "SPORTMONKS_AUTH_ERROR",
            "Sportmonks rejected the API key"
        );
    }

    throw new OracleError(
        502,
        "SPORTMONKS_ERROR",
        `Sportmonks failed while fetching ${label}`
    );
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
    const status = value?.trim() || DEFAULT_FIXTURE_STATUS;
    if (!/^[A-Za-z0-9 ._-]+$/.test(status)) {
        throw new OracleError(400, "BAD_REQUEST", "status contains invalid characters");
    }

    return status;
}

function matchesTeam(fixture: SportmonksFixture, teamId?: number): boolean {
    return (
        teamId === undefined ||
        fixture.localteam_id === teamId ||
        fixture.visitorteam_id === teamId
    );
}

function readDefaultPositiveInt(name: string, fallback: number): number {
    const rawValue = process.env[name];
    if (!rawValue) {
        return fallback;
    }

    const parsed = Number(rawValue);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new OracleError(500, "CONFIG_ERROR", `${name} must be a positive integer`);
    }

    return parsed;
}
