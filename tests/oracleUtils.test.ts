import assert from "node:assert/strict";
import test from "node:test";
import { fixtureToFields, statusToFields } from "../src/oracleUtils";

test("fixtureToFields preserves the public 4-field signing order", () => {
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

test("statusToFields preserves the public 7-field signing order", () => {
    const fields = statusToFields({
        fixtureID: 66230,
        localTeamID: 39,
        visitorTeamID: 37,
        startingAt: 1752154200000,
        status: 3,
        winnerTeamID: 39,
        outcome: 1,
    });

    assert.deepEqual(fields.map((field) => field.toString()), [
        "66230",
        "39",
        "37",
        "1752154200000",
        "3",
        "39",
        "1",
    ]);
});

test("statusToFields keeps outcome last even when it is 0", () => {
    const fields = statusToFields({
        fixtureID: 66230,
        localTeamID: 39,
        visitorTeamID: 37,
        startingAt: 1752154200000,
        status: 3,
        winnerTeamID: 0,
        outcome: 0,
    });

    assert.equal(fields.at(-1)?.toString(), "0");
    assert.equal(fields.length, 7);
});
