import assert from "node:assert/strict";
import test from "node:test";
import { MATCH_STATUS, mapSportmonksStatus } from "../src/status";

test("maps Sportmonks match statuses to oracle status codes", () => {
    assert.equal(mapSportmonksStatus("NS"), MATCH_STATUS.NOT_STARTED);
    assert.equal(mapSportmonksStatus("1st Innings"), MATCH_STATUS.IN_PROGRESS);
    assert.equal(mapSportmonksStatus("Innings Break"), MATCH_STATUS.IN_PROGRESS);
    assert.equal(mapSportmonksStatus("2nd Innings"), MATCH_STATUS.IN_PROGRESS);
    assert.equal(mapSportmonksStatus("Int."), MATCH_STATUS.IN_PROGRESS);
    assert.equal(mapSportmonksStatus("Finished"), MATCH_STATUS.FINISHED);
    assert.equal(mapSportmonksStatus("Aban."), MATCH_STATUS.CANCELLED);
});
