import assert from "node:assert/strict";
import test from "node:test";
import { fixtureToFields, statusToFields } from "../src/oracleUtils";

test("fixtureToFields preserves the public signing field order", () => {
    const fields = fixtureToFields({
        fixtureID: 66230,
        localTeamID: 39,
        visitorTeamID: 37,
        startingAt: 1752154200000,
    });

    assert.deepEqual(fields.map((field) => field.toString()), [
        "66230",
        "39",
        "37",
        "1752154200000",
    ]);
});

test("statusToFields preserves the public signing field order", () => {
    const fields = statusToFields({
        fixtureID: 66230,
        localTeamID: 39,
        visitorTeamID: 37,
        startingAt: 1752154200000,
        status: 3,
        winnerTeamID: 39,
    });

    assert.deepEqual(fields.map((field) => field.toString()), [
        "66230",
        "39",
        "37",
        "1752154200000",
        "3",
        "39",
    ]);
});
