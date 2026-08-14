import { OracleError } from "../errors";
import { SportmonksClient, type FetchLike } from "./client";
import { mapFixtureStatus, mapListedFixture, parseStartingAtUtc, type SportmonksFixtureDto } from "./map";
import type { FixtureQuery } from "./query";

const LIST_FIELDS = "id,localteam_id,visitorteam_id,starting_at";
const STATUS_FIELDS =
    "id,localteam_id,visitorteam_id,starting_at,status,winner_team_id,draw_noresult";
const TEAM_FIELDS = "id,name,code";
const TEAM_INCLUDES = "localteam,visitorteam";
const MAX_PAGES = 20;

export interface FetchOptions {
    fetch?: FetchLike;
}

interface FixtureListPage {
    data?: SportmonksFixtureDto[];
    meta?: {
        current_page?: number;
        last_page?: number;
        pagination?: {
            current_page?: number;
            total_pages?: number;
            last_page?: number;
            per_page?: number;
            links?: { next?: string | null };
        };
    };
    links?: { next?: string | null };
}

interface FixtureDetailPage {
    data?: SportmonksFixtureDto;
}

export async function fetchFixtures(
    query: FixtureQuery,
    apiKey: string,
    options: FetchOptions = {}
) {
    const client = new SportmonksClient({ apiKey, fetch: options.fetch });
    const dtos = query.teamId
        ? await fetchFixturesForTeam(client, query)
        : await paginateFixtures(client, query, {});

    if (dtos.length === 0) {
        throw new OracleError(404, "NOT_FOUND", "No matching fixtures found");
    }

    return dtos.slice(0, query.limit).map(mapListedFixture);
}

export async function fetchFixtureStatus(
    fixtureID: number,
    apiKey: string,
    options: FetchOptions = {}
) {
    const client = new SportmonksClient({ apiKey, fetch: options.fetch });
    const url = client.buildUrl(`/api/v2.0/fixtures/${fixtureID}`, {
        include: TEAM_INCLUDES,
        "fields[fixtures]": STATUS_FIELDS,
        "fields[teams]": TEAM_FIELDS,
    });
    const payload = await client.getJson<FixtureDetailPage>(url, "fixture status");
    if (!payload.data) {
        throw new OracleError(404, "NOT_FOUND", "Fixture status not found");
    }

    return mapFixtureStatus(payload.data);
}

async function fetchFixturesForTeam(
    client: SportmonksClient,
    query: FixtureQuery
): Promise<SportmonksFixtureDto[]> {
    const teamId = String(query.teamId);
    const [asLocal, asVisitor] = await Promise.all([
        paginateFixtures(client, query, { "filter[localteam_id]": teamId }),
        paginateFixtures(client, query, { "filter[visitorteam_id]": teamId }),
    ]);

    return mergeById(asLocal, asVisitor);
}

async function paginateFixtures(
    client: SportmonksClient,
    query: FixtureQuery,
    extraFilters: Record<string, string>
): Promise<SportmonksFixtureDto[]> {
    const collected: SportmonksFixtureDto[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
        const url = client.buildUrl("/api/v2.0/fixtures", {
            "filter[league_id]": String(query.leagueId),
            "filter[status]": query.status,
            "fields[fixtures]": LIST_FIELDS,
            "fields[teams]": TEAM_FIELDS,
            include: TEAM_INCLUDES,
            sort: "starting_at",
            page: String(page),
            ...extraFilters,
        });

        const payload = await client.getJson<FixtureListPage>(url, "fixture list");
        const rows = payload.data ?? [];
        collected.push(...rows);

        if (collected.length >= query.limit || !hasNextPage(payload, page, rows.length)) {
            break;
        }
    }

    return collected;
}

function hasNextPage(page: FixtureListPage, requestedPage: number, rowCount: number): boolean {
    if (page.links?.next || page.meta?.pagination?.links?.next) {
        return true;
    }

    const current =
        page.meta?.pagination?.current_page ?? page.meta?.current_page ?? requestedPage;
    const last =
        page.meta?.pagination?.total_pages ??
        page.meta?.pagination?.last_page ??
        page.meta?.last_page;

    if (typeof last === "number") {
        return current < last;
    }

    const perPage = page.meta?.pagination?.per_page ?? 25;
    return rowCount >= perPage;
}

function mergeById(
    left: SportmonksFixtureDto[],
    right: SportmonksFixtureDto[]
): SportmonksFixtureDto[] {
    const merged = new Map<number, SportmonksFixtureDto>();
    for (const fixture of [...left, ...right]) {
        merged.set(fixture.id, fixture);
    }

    return [...merged.values()].sort(
        (a, b) => parseStartingAtUtc(a.starting_at) - parseStartingAtUtc(b.starting_at)
    );
}
