import assert from "node:assert/strict";
import test from "node:test";
import { Field, PrivateKey, PublicKey, Signature } from "o1js";

type FetchCall = {
    url: URL;
    init?: RequestInit;
};

const privateKey = PrivateKey.random();
process.env.API_KEY = "test-api-key";
process.env.PRIVATE_KEY = privateKey.toBase58();

test("GET /fixture returns a signed fixture with safe cache headers", async () => {
    const calls = mockSportmonksFetch();
    const { GET } = await import("../app/fixture/route");

    const response = await GET(new Request("http://localhost/fixture"));
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "public, max-age=60, s-maxage=60");
    assert.equal(payload.data.fixtureID, 66230);
    assert.equal(payload.data.localTeamName, "Sri Lanka");
    assert.equal(payload.publicKey, privateKey.toPublicKey().toBase58());
    assert.equal(calls[0].url.searchParams.get("filter[league_id]"), "3");
    assert.equal(calls[0].url.searchParams.get("filter[status]"), "NS");

    const isValid = Signature.fromBase58(payload.signature)
        .verify(PublicKey.fromBase58(payload.publicKey), [
            Field(payload.data.fixtureID),
            Field(payload.data.localTeamID),
            Field(payload.data.visitorTeamID),
            Field(payload.data.startingAt),
        ])
        .toBoolean();
    assert.equal(isValid, true);
});

test("GET /fixture applies query params before signing", async () => {
    const calls = mockSportmonksFetch();
    const { GET } = await import("../app/fixture/route");

    const response = await GET(
        new Request("http://localhost/fixture?leagueId=5&status=NS&teamId=39&limit=1")
    );
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.data.localTeamID, 39);
    assert.equal(calls[0].url.searchParams.get("filter[league_id]"), "5");
    assert.equal(calls[0].url.searchParams.get("filter[status]"), "NS");
});

test("GET /fixture rejects invalid query params", async () => {
    mockSportmonksFetch();
    const { GET } = await import("../app/fixture/route");

    const response = await GET(new Request("http://localhost/fixture?limit=99"));
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.code, "BAD_REQUEST");
});

test("GET /fixture returns 404 when no fixtures match", async () => {
    mockSportmonksFetch({ fixtures: [] });
    const { GET } = await import("../app/fixture/route");

    const response = await GET(new Request("http://localhost/fixture"));
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.equal(payload.code, "NOT_FOUND");
});

test("GET /fixture maps Sportmonks auth failure", async () => {
    mockSportmonksFetch({ fixtureStatus: 401 });
    const { GET } = await import("../app/fixture/route");

    const response = await GET(new Request("http://localhost/fixture"));
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.code, "SPORTMONKS_AUTH_ERROR");
});

test("GET /status/[fixtureID] returns signed status and maps null winner to 0", async () => {
    mockSportmonksFetch();
    const { GET } = await import("../app/status/[fixtureID]/route");

    const response = await GET(new Request("http://localhost/status/66230"), {
        params: Promise.resolve({ fixtureID: "66230" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "public, max-age=15, s-maxage=15");
    assert.equal(payload.data.status, 3);
    assert.equal(payload.data.winnerTeamID, 0);

    const isValid = Signature.fromBase58(payload.signature)
        .verify(PublicKey.fromBase58(payload.publicKey), [
            Field(payload.data.fixtureID),
            Field(payload.data.localTeamID),
            Field(payload.data.visitorTeamID),
            Field(payload.data.startingAt),
            Field(payload.data.status),
            Field(payload.data.winnerTeamID),
        ])
        .toBoolean();
    assert.equal(isValid, true);
});

test("GET /status/[fixtureID] rejects invalid fixture IDs", async () => {
    mockSportmonksFetch();
    const { GET } = await import("../app/status/[fixtureID]/route");

    const response = await GET(new Request("http://localhost/status/nope"), {
        params: Promise.resolve({ fixtureID: "nope" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.code, "BAD_REQUEST");
});

function mockSportmonksFetch(options: { fixtures?: unknown[]; fixtureStatus?: number } = {}) {
    const calls: FetchCall[] = [];
    const fixtures = options.fixtures ?? [
        {
            id: 66230,
            localteam_id: 39,
            visitorteam_id: 37,
            starting_at: "2025-07-10T09:30:00.000000Z",
        },
    ];

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        calls.push({ url, init });

        if (url.pathname.endsWith("/fixtures") && options.fixtureStatus) {
            return Response.json(
                { message: "auth failed" },
                { status: options.fixtureStatus }
            );
        }

        if (url.pathname.endsWith("/fixtures")) {
            return Response.json({ data: fixtures });
        }

        if (url.pathname.endsWith("/fixtures/66230")) {
            return Response.json({
                data: {
                    id: 66230,
                    localteam_id: 39,
                    visitorteam_id: 37,
                    starting_at: "2025-07-10T09:30:00.000000Z",
                    status: "Finished",
                    winner_team_id: null,
                },
            });
        }

        if (url.pathname.endsWith("/teams/39")) {
            return Response.json({ data: { name: "Sri Lanka", code: "SL" } });
        }

        if (url.pathname.endsWith("/teams/37")) {
            return Response.json({ data: { name: "Bangladesh", code: "BGD" } });
        }

        return Response.json({ message: "not found" }, { status: 404 });
    };

    return calls;
}
