import { PrivateKey, Signature, Field } from "o1js";

export interface Fixture {
    fixtureID: number | bigint;
    localTeamID: number | bigint;
    visitorTeamID: number | bigint;
    startingAt: number | bigint; // unix timestamp in milliseconds
}

export interface Status extends Fixture {
    status: number | bigint;
    winnerTeamID: number | bigint;
}

/* -------------------------------------------------------------------------- */
/*                               Field helpers                                */
/* -------------------------------------------------------------------------- */

export function fixtureToFields(fixture: Fixture): Field[] {
    return [
        Field(fixture.fixtureID),
        Field(fixture.localTeamID),
        Field(fixture.visitorTeamID),
        Field(fixture.startingAt),
    ];
}

export function statusToFields(status: Status): Field[] {
    return [
        ...fixtureToFields(status),
        Field(status.status),
        Field(status.winnerTeamID),
    ];
}

/* -------------------------------------------------------------------------- */
/*                              Signer helpers                                */
/* -------------------------------------------------------------------------- */

export function signFixture(privateKeyBase58: string, fixture: Fixture) {
    const privateKey = PrivateKey.fromBase58(privateKeyBase58);
    const fields = fixtureToFields(fixture);
    return Signature.create(privateKey, fields);
}

export function signStatus(privateKeyBase58: string, status: Status) {
    const privateKey = PrivateKey.fromBase58(privateKeyBase58);
    const fields = statusToFields(status);
    return Signature.create(privateKey, fields);
} 