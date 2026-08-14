import { PrivateKey, Signature, Field } from "o1js";

export const SIGNING_CONTRACT_VERSION = "1.1";

export interface Fixture {
    fixtureID: number | bigint;
    localTeamID: number | bigint;
    visitorTeamID: number | bigint;
    /** Unix timestamp in milliseconds. Must match the value verified by consumers. */
    startingAt: number | bigint;
}

export interface Status extends Fixture {
    /** Oracle status code 1–6. See src/status.ts. */
    status: number | bigint;
    /**
     * Sportmonks winner team id, or 0 when no team id is present.
     * 0 is Field-friendly “no team id”, not a synonym for “match ongoing”.
     */
    winnerTeamID: number | bigint;
    /**
     * Signed outcome: 0 none/unknown, 1 winner, 2 draw, 3 no-result.
     * 0 is not “ongoing only” — Finished fixtures can also be 0 when
     * Sportmonks has not yet populated winner or draw_noresult.
     */
    outcome: number | bigint;
}

/* -------------------------------------------------------------------------- */
/*                               Field helpers                                */
/* -------------------------------------------------------------------------- */

export function fixtureToFields(fixture: Fixture): Field[] {
    // Public signing contract for fixture payloads (v1.1, unchanged from v1).
    return [
        Field(fixture.fixtureID),
        Field(fixture.localTeamID),
        Field(fixture.visitorTeamID),
        Field(fixture.startingAt),
    ];
}

export function statusToFields(status: Status): Field[] {
    // Public signing contract for status payloads (v1.1, 7 fields).
    return [
        Field(status.fixtureID),
        Field(status.localTeamID),
        Field(status.visitorTeamID),
        Field(status.startingAt),
        Field(status.status),
        Field(status.winnerTeamID),
        Field(status.outcome),
    ];
}

/* -------------------------------------------------------------------------- */
/*                              Signer helpers                                */
/* -------------------------------------------------------------------------- */

export function signFixture(privateKeyBase58: string, fixture: Fixture) {
    const privateKey = PrivateKey.fromBase58(privateKeyBase58);
    const fieldsToSign = fixtureToFields(fixture);
    return Signature.create(privateKey, fieldsToSign);
}

export function signStatus(privateKeyBase58: string, status: Status) {
    const privateKey = PrivateKey.fromBase58(privateKeyBase58);
    const fieldsToSign = statusToFields(status);
    return Signature.create(privateKey, fieldsToSign);
}
