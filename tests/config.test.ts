import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { getFixtureCacheSeconds } from "../src/config";
import { OracleError } from "../src/errors";
import { parseFixtureQuery } from "../src/sportmonks";

test("query validation still rejects limit=99 and other bad params", () => {
    assert.throws(
        () => parseFixtureQuery(new URLSearchParams("limit=99")),
        (error: unknown) => error instanceof OracleError && error.code === "BAD_REQUEST"
    );
    assert.throws(
        () => parseFixtureQuery(new URLSearchParams("leagueId=0")),
        (error: unknown) => error instanceof OracleError && error.code === "BAD_REQUEST"
    );
    assert.throws(
        () => parseFixtureQuery(new URLSearchParams("teamId=-1")),
        (error: unknown) => error instanceof OracleError && error.code === "BAD_REQUEST"
    );
    assert.throws(
        () => parseFixtureQuery(new URLSearchParams("status=1st%20Innings!")),
        (error: unknown) => error instanceof OracleError && error.code === "BAD_REQUEST"
    );
});

test("invalid DEFAULT_LEAGUE_ID is a request-time CONFIG_ERROR, not an import crash", () => {
    const output = execFileSync(
        process.execPath,
        [
            "--import",
            "tsx",
            "--input-type=module",
            "-e",
            `
            process.env.DEFAULT_LEAGUE_ID = "nope";
            const mod = await import("./src/sportmonks/query.ts");
            try {
              mod.parseFixtureQuery(new URLSearchParams());
              console.log("unexpected-success");
            } catch (error) {
              console.log(error.code + ":" + error.status);
            }
            `,
        ],
        { encoding: "utf8", cwd: process.cwd() }
    );

    assert.match(output, /CONFIG_ERROR:500/);
});

test("invalid cache TTL env vars are CONFIG_ERROR", () => {
    const previous = process.env.FIXTURE_CACHE_SECONDS;
    process.env.FIXTURE_CACHE_SECONDS = "1.5";
    try {
        assert.throws(
            () => getFixtureCacheSeconds(),
            (error: unknown) => error instanceof OracleError && error.code === "CONFIG_ERROR"
        );
    } finally {
        if (previous === undefined) {
            delete process.env.FIXTURE_CACHE_SECONDS;
        } else {
            process.env.FIXTURE_CACHE_SECONDS = previous;
        }
    }
});
