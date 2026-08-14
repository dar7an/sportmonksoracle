process.env.RATE_LIMIT_DISABLED = "1";

import assert from "node:assert/strict";
import test from "node:test";
import { Field, PrivateKey, PublicKey, Signature } from "o1js";
import { installFetchMock, restoreFetch, sriLankaBangladeshFixture } from "./helpers";

test.afterEach(restoreFetch);

const privateKey = PrivateKey.random();
process.env.API_KEY = "test-api-key";
process.env.PRIVATE_KEY = privateKey.toBase58();

function fixtureFields(data: { fixtureID: number; localTeamID: number; visitorTeamID: number; startingAt: number }) {
    return [
        Field(data.fixtureID),
        Field(data.localTeamID),
        Field(data.visitorTeamID),
        Field(data.startingAt),
    ];
}

function statusFields(data: {
    fixtureID: number;
    localTeamID: number;
    visitorTeamID: number;
    startingAt: number;
    status: number;
    winnerTeamID: number;
    outcome: number;
}) {
    return [...fixtureFields(data), Field(data.status), Field(data.winnerTeamID), Field(data.outcome)];
}

test("GET /fixture returns a signed fixture with safe cache headers and includes", async () => {
    const calls = installFetchMock((url) => {
        if (url.pathname.endsWith("/fixtures")) {
            return Response.json({
                data: [sriLankaBangladeshFixture()],
                meta: { current_page: 1, last_page: 1 },
            });
        }
        return Response.json({ message: "not found" }, { status: 404 });
    });
    const { GET } = await import("../app/fixture/route");

    const response = await GET(new Request("http://localhost/fixture"));
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "public, max-age=60, s-maxage=60");
    assert.equal(payload.data.fixtureID, 66230);
    assert.equal(payload.data.localTeamName, "Sri Lanka");
    assert.equal(payload.publicKey, privateKey.toPublicKey().toBase58());
    assert.equal(calls[0]?.url.searchParams.get("filter[league_id]"), "3");
    assert.equal(calls[0]?.url.searchParams.get("filter[status]"), "NS");
    assert.equal(calls[0]?.url.searchParams.get("include"), "localteam,visitorteam");
    assert.equal(
        Signature.fromBase58(payload.signature)
            .verify(PublicKey.fromBase58(payload.publicKey), fixtureFields(payload.data))
            .toBoolean(),
        true
    );
});

test("GET /fixture?limit=1 keeps the single-object shape", async () => {
    installFetchMock(() =>
        Response.json({
            data: [sriLankaBangladeshFixture()],
            meta: { current_page: 1, last_page: 1 },
        })
    );
    const { GET } = await import("../app/fixture/route");
    const response = await GET(new Request("http://localhost/fixture?limit=1"));
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(payload.data), false);
    assert.equal(typeof payload.signature, "string");
    assert.equal(payload.signatures, undefined);
});

test("GET /fixture?limit=2 returns array data and signatures", async () => {
    installFetchMock(() =>
        Response.json({
            data: [
                sriLankaBangladeshFixture(),
                sriLankaBangladeshFixture({
                    id: 66231,
                    starting_at: "2025-07-11T09:30:00.000000Z",
                }),
            ],
            meta: { current_page: 1, last_page: 1 },
        })
    );
    const { GET } = await import("../app/fixture/route");
    const response = await GET(new Request("http://localhost/fixture?limit=2"));
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(payload.data), true);
    assert.equal(payload.data.length, 2);
    assert.equal(payload.signatures.length, 2);
    assert.equal(payload.signature, undefined);

    payload.data.forEach((fixture: { fixtureID: number; localTeamID: number; visitorTeamID: number; startingAt: number }, index: number) => {
        assert.equal(
            Signature.fromBase58(payload.signatures[index])
                .verify(PublicKey.fromBase58(payload.publicKey), fixtureFields(fixture))
                .toBoolean(),
            true
        );
    });
});

test("GET /fixture applies query params before signing", async () => {
    const calls = installFetchMock(() =>
        Response.json({
            data: [sriLankaBangladeshFixture()],
            meta: { current_page: 1, last_page: 1 },
        })
    );
    const { GET } = await import("../app/fixture/route");

    const response = await GET(
        new Request("http://localhost/fixture?leagueId=5&status=NS&teamId=39&limit=1")
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.localTeamID, 39);
    assert.ok(calls.some((call) => call.url.searchParams.get("filter[league_id]") === "5"));
    assert.ok(calls.some((call) => call.url.searchParams.get("filter[localteam_id]") === "39"));
    assert.ok(calls.some((call) => call.url.searchParams.get("filter[visitorteam_id]") === "39"));
});

test("GET /fixture rejects invalid query params", async () => {
    const { GET } = await import("../app/fixture/route");
    const response = await GET(new Request("http://localhost/fixture?limit=99"));
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.code, "BAD_REQUEST");
});

test("GET /fixture returns 404 when no fixtures match", async () => {
    installFetchMock(() => Response.json({ data: [], meta: { current_page: 1, last_page: 1 } }));
    const { GET } = await import("../app/fixture/route");
    const response = await GET(new Request("http://localhost/fixture"));
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.equal(payload.code, "NOT_FOUND");
});

test("GET /fixture maps Sportmonks auth failure", async () => {
    installFetchMock(() => Response.json({ message: "auth failed" }, { status: 401 }));
    const { GET } = await import("../app/fixture/route");
    const response = await GET(new Request("http://localhost/fixture"));
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.code, "SPORTMONKS_AUTH_ERROR");
});

test("GET /fixture maps Sportmonks 429 distinctly", async () => {
    installFetchMock(
        () =>
            new Response(JSON.stringify({ message: "slow down" }), {
                status: 429,
                headers: { "Retry-After": "0" },
            })
    );
    const { GET } = await import("../app/fixture/route");
    const response = await GET(new Request("http://localhost/fixture"));
    const payload = await response.json();

    assert.equal(response.status, 429);
    assert.equal(payload.code, "SPORTMONKS_RATE_LIMIT");
});

test("GET /fixture returns CONFIG_ERROR JSON when secrets are missing", async () => {
    const previousKey = process.env.API_KEY;
    delete process.env.API_KEY;
    const { GET } = await import("../app/fixture/route");
    const response = await GET(new Request("http://localhost/fixture"));
    const payload = await response.json();
    process.env.API_KEY = previousKey;

    assert.equal(response.status, 500);
    assert.equal(payload.code, "CONFIG_ERROR");
});

test("GET /status/[fixtureID] signs Finished with null winner as outcome 0", async () => {
    installFetchMock(() =>
        Response.json({
            data: sriLankaBangladeshFixture({
                status: "Finished",
                winner_team_id: null,
                draw_noresult: null,
            }),
        })
    );
    const { GET } = await import("../app/status/[fixtureID]/route");
    const response = await GET(new Request("http://localhost/status/66230"), {
        params: Promise.resolve({ fixtureID: "66230" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "public, max-age=15, s-maxage=15");
    assert.equal(payload.data.status, 3);
    assert.equal(payload.data.winnerTeamID, 0);
    assert.equal(payload.data.outcome, 0);
    assert.equal(
        Signature.fromBase58(payload.signature)
            .verify(PublicKey.fromBase58(payload.publicKey), statusFields(payload.data))
            .toBoolean(),
        true
    );
});

test("GET /status/[fixtureID] signs a winner as outcome 1", async () => {
    installFetchMock(() =>
        Response.json({
            data: sriLankaBangladeshFixture({
                status: "Finished",
                winner_team_id: 39,
                draw_noresult: null,
            }),
        })
    );
    const { GET } = await import("../app/status/[fixtureID]/route");
    const response = await GET(new Request("http://localhost/status/66230"), {
        params: Promise.resolve({ fixtureID: "66230" }),
    });
    const payload = await response.json();

    assert.equal(payload.data.winnerTeamID, 39);
    assert.equal(payload.data.outcome, 1);
    assert.equal(
        Signature.fromBase58(payload.signature)
            .verify(PublicKey.fromBase58(payload.publicKey), statusFields(payload.data))
            .toBoolean(),
        true
    );
});

test("GET /status/[fixtureID] maps Aban. to 6 and no-result to outcome 3", async () => {
    installFetchMock(() =>
        Response.json({
            data: sriLankaBangladeshFixture({
                status: "Aban.",
                winner_team_id: null,
                draw_noresult: "no-result",
            }),
        })
    );
    const { GET } = await import("../app/status/[fixtureID]/route");
    const response = await GET(new Request("http://localhost/status/66230"), {
        params: Promise.resolve({ fixtureID: "66230" }),
    });
    const payload = await response.json();

    assert.equal(payload.data.status, 6);
    assert.equal(payload.data.outcome, 3);
    assert.equal(
        Signature.fromBase58(payload.signature)
            .verify(PublicKey.fromBase58(payload.publicKey), statusFields(payload.data))
            .toBoolean(),
        true
    );
});

test("GET /status/[fixtureID] refuses unknown Sportmonks statuses", async () => {
    installFetchMock(() =>
        Response.json({
            data: sriLankaBangladeshFixture({
                status: "Super Over",
                winner_team_id: null,
                draw_noresult: null,
            }),
        })
    );
    const { GET } = await import("../app/status/[fixtureID]/route");
    const response = await GET(new Request("http://localhost/status/66230"), {
        params: Promise.resolve({ fixtureID: "66230" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 502);
    assert.equal(payload.code, "UNKNOWN_STATUS");
});

test("GET /status/[fixtureID] rejects invalid fixture IDs", async () => {
    const { GET } = await import("../app/status/[fixtureID]/route");
    const response = await GET(new Request("http://localhost/status/nope"), {
        params: Promise.resolve({ fixtureID: "nope" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.code, "BAD_REQUEST");
});

test("unhandled errors are INTERNAL_ERROR, not SPORTMONKS_ERROR", async () => {
    const { errorResponse } = await import("../src/errors");
    const previous = console.error;
    console.error = () => undefined;
    const response = errorResponse(new Error("boom"));
    console.error = previous;
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.equal(payload.code, "INTERNAL_ERROR");
});
