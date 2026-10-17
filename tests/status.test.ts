import assert from "node:assert/strict";
import test from "node:test";
import {
    DOCUMENTED_SPORTMONKS_STATUSES,
    MATCH_OUTCOME,
    MATCH_STATUS,
    SPORTMONKS_STATUS_MAP,
    deriveOutcome,
    mapSportmonksStatus,
    UnknownDrawNoResultError,
    UnknownSportmonksStatusError,
} from "../src/status";

test("maps every documented Sportmonks cricket status to the v1.1 codes", () => {
    const expected = {
        NS: 1,
        Delayed: 1,
        "1st Innings": 2,
        "2nd Innings": 2,
        "3rd Innings": 2,
        "4th Innings": 2,
        "Innings Break": 2,
        "Int.": 2,
        "Stump Day 1": 2,
        "Stump Day 2": 2,
        "Stump Day 3": 2,
        "Stump Day 4": 2,
        "Tea Break": 2,
        Lunch: 2,
        Dinner: 2,
        Finished: 3,
        "Cancl.": 4,
        Cancl: 4,
        "Postp.": 5,
        "Aban.": 6,
    } as const;

    for (const [status, code] of Object.entries(expected)) {
        assert.equal(mapSportmonksStatus(status), code, status);
        assert.equal(SPORTMONKS_STATUS_MAP[status as keyof typeof SPORTMONKS_STATUS_MAP], code);
    }

    assert.deepEqual(
        [...DOCUMENTED_SPORTMONKS_STATUSES].sort(),
        Object.keys(expected).sort()
    );
});

test("named status codes stay stable", () => {
    assert.equal(MATCH_STATUS.NOT_STARTED, 1);
    assert.equal(MATCH_STATUS.IN_PROGRESS, 2);
    assert.equal(MATCH_STATUS.FINISHED, 3);
    assert.equal(MATCH_STATUS.CANCELLED, 4);
    assert.equal(MATCH_STATUS.POSTPONED, 5);
    assert.equal(MATCH_STATUS.ABANDONED, 6);
});

test("Cancl. is cancelled and Aban. is not", () => {
    assert.equal(mapSportmonksStatus("Cancl."), MATCH_STATUS.CANCELLED);
    assert.equal(mapSportmonksStatus("Aban."), MATCH_STATUS.ABANDONED);
    assert.notEqual(mapSportmonksStatus("Aban."), MATCH_STATUS.CANCELLED);
});

test("Delayed, Postp., Tea Break, and 3rd Innings map correctly", () => {
    assert.equal(mapSportmonksStatus("Delayed"), MATCH_STATUS.NOT_STARTED);
    assert.equal(mapSportmonksStatus("Postp."), MATCH_STATUS.POSTPONED);
    assert.equal(mapSportmonksStatus("Tea Break"), MATCH_STATUS.IN_PROGRESS);
    assert.equal(mapSportmonksStatus("3rd Innings"), MATCH_STATUS.IN_PROGRESS);
});

test("unknown Sportmonks statuses throw instead of defaulting to cancelled", () => {
    for (const status of ["Super Over", "Abandoned", "Cancelled", "", "NS "]) {
        assert.throws(
            () => mapSportmonksStatus(status),
            (error: unknown) =>
                error instanceof UnknownSportmonksStatusError &&
                error.sportmonksStatus === status
        );
    }
});

test("Finished with a winner id is outcome 1", () => {
    assert.deepEqual(deriveOutcome({ winnerTeamId: 39, drawNoResult: null }), {
        winnerTeamID: 39,
        outcome: MATCH_OUTCOME.WINNER,
    });
});

test("draw_noresult maps to draw or no-result", () => {
    assert.deepEqual(deriveOutcome({ winnerTeamId: null, drawNoResult: "draw" }), {
        winnerTeamID: 0,
        outcome: MATCH_OUTCOME.DRAW,
    });
    assert.deepEqual(deriveOutcome({ winnerTeamId: null, drawNoResult: "no-result" }), {
        winnerTeamID: 0,
        outcome: MATCH_OUTCOME.NO_RESULT,
    });
    assert.deepEqual(deriveOutcome({ winnerTeamId: 0, drawNoResult: "No Result" }), {
        winnerTeamID: 0,
        outcome: MATCH_OUTCOME.NO_RESULT,
    });
});

test("null winner and null draw_noresult is outcome 0, including Finished", () => {
    assert.deepEqual(deriveOutcome({ winnerTeamId: null, drawNoResult: null }), {
        winnerTeamID: 0,
        outcome: MATCH_OUTCOME.NONE,
    });
});

test("unrecognized draw_noresult refuses to sign", () => {
    assert.throws(
        () => deriveOutcome({ winnerTeamId: null, drawNoResult: "true" }),
        UnknownDrawNoResultError
    );
    assert.throws(
        () => deriveOutcome({ winnerTeamId: 39, drawNoResult: "draw" }),
        UnknownDrawNoResultError
    );
});
