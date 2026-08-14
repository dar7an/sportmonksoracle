import assert from "node:assert/strict";
import test from "node:test";
import { fetchFixtureStatus, fetchFixtures, parseStartingAtUtc } from "../src/sportmonks";
import { OracleError } from "../src/errors";
import { emptyPage, installFetchMock, restoreFetch, sriLankaBangladeshFixture } from "./helpers";

test.afterEach(restoreFetch);

test("parseStartingAtUtc treats Sportmonks ISO strings as UTC milliseconds", () => {
    assert.equal(parseStartingAtUtc("2025-07-10T09:30:00.000000Z"), 1752139800000);
    assert.equal(parseStartingAtUtc("2025-07-10T09:30:00"), 1752139800000);
});

test("parseStartingAtUtc rejects non-finite timestamps", () => {
    assert.throws(
        () => parseStartingAtUtc("not-a-date"),
        (error: unknown) => error instanceof OracleError && error.code === "MALFORMED_UPSTREAM"
    );
});

test("fetchFixtures includes localteam and visitorteam instead of N+1 team fetches", async () => {
    const calls = installFetchMock((url) => {
        if (url.pathname.endsWith("/fixtures")) {
            return Response.json({
                data: [sriLankaBangladeshFixture()],
                meta: { current_page: 1, last_page: 1 },
            });
        }
        return Response.json({ message: "unexpected" }, { status: 500 });
    });

    const fixtures = await fetchFixtures(
        { leagueId: 3, status: "NS", limit: 1 },
        "test-key",
        { fetch: calls.fetch }
    );

    assert.equal(fixtures[0]?.localTeamName, "Sri Lanka");
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url.searchParams.get("include"), "localteam,visitorteam");
    assert.ok(!calls.some((call) => call.url.pathname.includes("/teams/")));
});

test("fetchFixtures paginates until a team filtered off page 1 is found", async () => {
    const lateFixture = sriLankaBangladeshFixture({
        id: 90001,
        localteam_id: 99,
        localteam: { data: { id: 99, name: "Late Team", code: "LT" } },
    });

    const calls = installFetchMock((url) => {
        const page = url.searchParams.get("page") ?? "1";
        const localTeam = url.searchParams.get("filter[localteam_id]");
        const visitorTeam = url.searchParams.get("filter[visitorteam_id]");

        if (localTeam === "99") {
            if (page === "1") {
                return Response.json(emptyPage(1, 2));
            }
            return Response.json({
                data: [lateFixture],
                meta: { current_page: 2, last_page: 2 },
            });
        }

        if (visitorTeam === "99") {
            return Response.json(emptyPage(1, 1));
        }

        return Response.json({ message: "unfiltered list should not be used" }, { status: 500 });
    });

    const fixtures = await fetchFixtures(
        { leagueId: 3, status: "NS", teamId: 99, limit: 1 },
        "test-key",
        { fetch: calls.fetch }
    );

    assert.equal(fixtures[0]?.fixtureID, 90001);
    assert.ok(calls.some((call) => call.url.searchParams.get("filter[localteam_id]") === "99"));
    assert.ok(calls.some((call) => call.url.searchParams.get("filter[visitorteam_id]") === "99"));
    assert.ok(
        calls.some(
            (call) =>
                call.url.searchParams.get("filter[localteam_id]") === "99" &&
                call.url.searchParams.get("page") === "2"
        )
    );
});

test("fetchFixtures maps Sportmonks 429 distinctly after retries", async () => {
    let hits = 0;
    const calls = installFetchMock(() => {
        hits += 1;
        return new Response(JSON.stringify({ message: "slow down" }), {
            status: 429,
            headers: { "Retry-After": "0" },
        });
    });

    await assert.rejects(
        () => fetchFixtures({ leagueId: 3, status: "NS", limit: 1 }, "test-key", { fetch: calls.fetch }),
        (error: unknown) =>
            error instanceof OracleError && error.code === "SPORTMONKS_RATE_LIMIT" && error.status === 429
    );
    assert.equal(hits, 3);
});

test("fetchFixtures does not retry 401, 403, or 404", async () => {
    for (const status of [401, 403, 404]) {
        let hits = 0;
        const calls = installFetchMock(() => {
            hits += 1;
            return Response.json({ message: "nope" }, { status });
        });

        await assert.rejects(
            () => fetchFixtures({ leagueId: 3, status: "NS", limit: 1 }, "test-key", { fetch: calls.fetch }),
            (error: unknown) => error instanceof OracleError
        );
        assert.equal(hits, 1, `status ${status} should not retry`);
    }
});

test("fetchFixtureStatus maps draw_noresult and unknown statuses", async () => {
    const calls = installFetchMock((url) => {
        if (url.pathname.endsWith("/fixtures/1")) {
            return Response.json({
                data: sriLankaBangladeshFixture({
                    status: "Finished",
                    winner_team_id: null,
                    draw_noresult: "draw",
                }),
            });
        }
        if (url.pathname.endsWith("/fixtures/2")) {
            return Response.json({
                data: sriLankaBangladeshFixture({
                    id: 2,
                    status: "Super Over",
                    winner_team_id: null,
                    draw_noresult: null,
                }),
            });
        }
        if (url.pathname.endsWith("/fixtures/3")) {
            return Response.json({
                data: sriLankaBangladeshFixture({
                    id: 3,
                    starting_at: "not-a-date",
                    status: "Finished",
                    winner_team_id: 39,
                    draw_noresult: null,
                }),
            });
        }
        return Response.json({ message: "not found" }, { status: 404 });
    });

    const drawn = await fetchFixtureStatus(1, "test-key", { fetch: calls.fetch });
    assert.equal(drawn.outcome, 2);
    assert.equal(drawn.winnerTeamID, 0);
    assert.equal(drawn.localTeamName, "Sri Lanka");

    await assert.rejects(
        () => fetchFixtureStatus(2, "test-key", { fetch: calls.fetch }),
        (error: unknown) => error instanceof OracleError && error.code === "UNKNOWN_STATUS"
    );

    await assert.rejects(
        () => fetchFixtureStatus(3, "test-key", { fetch: calls.fetch }),
        (error: unknown) => error instanceof OracleError && error.code === "MALFORMED_UPSTREAM"
    );
});
