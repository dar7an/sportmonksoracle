import { OracleError } from "../errors";
import { Fixture, Status } from "../oracleUtils";
import {
    deriveOutcome,
    mapSportmonksStatus,
    UnknownDrawNoResultError,
    UnknownSportmonksStatusError,
} from "../status";

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

export interface ProcessedStatusData extends Status {
    localTeamName?: string;
    localTeamCode?: string;
    visitorTeamName?: string;
    visitorTeamCode?: string;
}

export interface SportmonksTeamInclude {
    data?: { id?: number; name?: string; code?: string };
    id?: number;
    name?: string;
    code?: string;
}

export interface SportmonksFixtureDto {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
    status?: string;
    winner_team_id?: number | null;
    draw_noresult?: string | boolean | null;
    localteam?: SportmonksTeamInclude;
    visitorteam?: SportmonksTeamInclude;
}

export function parseStartingAtUtc(value: string): number {
    if (typeof value !== "string" || value.trim() === "") {
        throw new OracleError(502, "MALFORMED_UPSTREAM", "starting_at is missing");
    }

    const trimmed = value.trim();
    const withZone = /Z$/i.test(trimmed) || /[+-]\d{2}:?\d{2}$/.test(trimmed)
        ? trimmed
        : `${trimmed}Z`;
    const compact = withZone.replace(/(\.\d{3})\d+(?=Z|[+-]|$)/i, "$1");
    const ms = Date.parse(compact);
    if (!Number.isFinite(ms)) {
        throw new OracleError(
            502,
            "MALFORMED_UPSTREAM",
            `starting_at is not a valid UTC timestamp: ${value}`
        );
    }

    return ms;
}

export function mapListedFixture(dto: SportmonksFixtureDto): ProcessedFixtureData {
    const localTeam = requireTeam(dto.localteam, dto.localteam_id, "local");
    const visitorTeam = requireTeam(dto.visitorteam, dto.visitorteam_id, "visitor");

    return {
        fixtureID: requirePositiveId(dto.id, "fixture id"),
        localTeamID: requirePositiveId(dto.localteam_id, "localteam_id"),
        visitorTeamID: requirePositiveId(dto.visitorteam_id, "visitorteam_id"),
        startingAt: parseStartingAtUtc(dto.starting_at),
        localTeamName: localTeam.name,
        localTeamCode: localTeam.code,
        visitorTeamName: visitorTeam.name,
        visitorTeamCode: visitorTeam.code,
    };
}

export function mapFixtureStatus(dto: SportmonksFixtureDto): ProcessedStatusData {
    if (typeof dto.status !== "string" || dto.status.trim() === "") {
        throw new OracleError(502, "MALFORMED_UPSTREAM", "Fixture status is missing");
    }

    let statusCode: number;
    try {
        statusCode = mapSportmonksStatus(dto.status);
    } catch (error) {
        if (error instanceof UnknownSportmonksStatusError) {
            throw new OracleError(502, "UNKNOWN_STATUS", error.message);
        }
        throw error;
    }

    let outcomeFields: ReturnType<typeof deriveOutcome>;
    try {
        outcomeFields = deriveOutcome({
            winnerTeamId: dto.winner_team_id,
            drawNoResult: dto.draw_noresult,
        });
    } catch (error) {
        if (error instanceof UnknownDrawNoResultError) {
            throw new OracleError(502, "MALFORMED_UPSTREAM", error.message);
        }
        throw error;
    }

    const localTeam = optionalTeam(dto.localteam);
    const visitorTeam = optionalTeam(dto.visitorteam);

    return {
        fixtureID: requirePositiveId(dto.id, "fixture id"),
        localTeamID: requirePositiveId(dto.localteam_id, "localteam_id"),
        visitorTeamID: requirePositiveId(dto.visitorteam_id, "visitorteam_id"),
        startingAt: parseStartingAtUtc(dto.starting_at),
        status: statusCode,
        winnerTeamID: outcomeFields.winnerTeamID,
        outcome: outcomeFields.outcome,
        ...(localTeam
            ? { localTeamName: localTeam.name, localTeamCode: localTeam.code }
            : {}),
        ...(visitorTeam
            ? { visitorTeamName: visitorTeam.name, visitorTeamCode: visitorTeam.code }
            : {}),
    };
}

function requirePositiveId(value: unknown, name: string): number {
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        throw new OracleError(502, "MALFORMED_UPSTREAM", `${name} is missing or invalid`);
    }

    return value;
}

function requireTeam(
    include: SportmonksTeamInclude | undefined,
    teamId: number,
    label: string
): TeamData {
    const team = optionalTeam(include);
    if (!team) {
        throw new OracleError(
            502,
            "MALFORMED_UPSTREAM",
            `Sportmonks ${label} team ${teamId} is missing name or code`
        );
    }

    return team;
}

function optionalTeam(include: SportmonksTeamInclude | undefined): TeamData | null {
    if (!include || typeof include !== "object") {
        return null;
    }

    const node = include.data && typeof include.data === "object" ? include.data : include;
    if (!node.name || !node.code) {
        return null;
    }

    return { name: node.name, code: node.code };
}
