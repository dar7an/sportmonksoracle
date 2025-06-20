import { Field, PrivateKey, Signature as O1Signature } from "o1js";

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

export function fixtureToFields(fixture: Fixture): bigint[] {
    return [
        BigInt(fixture.fixtureID),
        BigInt(fixture.localTeamID),
        BigInt(fixture.visitorTeamID),
        BigInt(fixture.startingAt),
    ];
}

export function statusToFields(status: Status): bigint[] {
    return [
        ...fixtureToFields(status),
        BigInt(status.status),
        BigInt(status.winnerTeamID),
    ];
}

/* -------------------------------------------------------------------------- */
/*                              Signer helpers                                */
/* -------------------------------------------------------------------------- */

export function signFixture(privateKey: PrivateKey, fixture: Fixture) {
    const fields = fixtureToFields(fixture).map((n) => Field(n));
    return O1Signature.create(privateKey, fields);
}

export function signStatus(privateKey: PrivateKey, status: Status) {
    const fields = statusToFields(status).map((n) => Field(n));
    return O1Signature.create(privateKey, fields);
} 