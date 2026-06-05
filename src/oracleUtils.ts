import { PrivateKey, Signature, Field } from 'o1js';

export interface Fixture {
    fixtureID: number | bigint;
    localTeamID: number | bigint;
    visitorTeamID: number | bigint;
    /** Unix timestamp in milliseconds. Must match the value verified by consumers. */
    startingAt: number | bigint;
}

export interface Status extends Fixture {
    /** Oracle status code. See src/status.ts for the Sportmonks mapping. */
    status: number | bigint;
    /** Uses 0 while Sportmonks has no winner_team_id. */
    winnerTeamID: number | bigint;
}

/* -------------------------------------------------------------------------- */
/*                               Field helpers                                */
/* -------------------------------------------------------------------------- */

export function fixtureToFields(fixture: Fixture): Field[] {
    // This order is the public signing contract for fixture payloads.
    return [
        Field(fixture.fixtureID),
        Field(fixture.localTeamID),
        Field(fixture.visitorTeamID),
        Field(fixture.startingAt),
    ];
}

export function statusToFields(status: Status): Field[] {
    // This order is the public signing contract for status payloads.
    return [
        Field(status.fixtureID),
        Field(status.localTeamID),
        Field(status.visitorTeamID),
        Field(status.startingAt),
        Field(status.status),
        Field(status.winnerTeamID),
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
