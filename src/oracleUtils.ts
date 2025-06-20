import Client from "mina-signer";

const client = new Client({ network: "testnet" });

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

export function signFixture(privateKey: string, fixture: Fixture) {
    return client.signFields(fixtureToFields(fixture), privateKey);
}

export function signStatus(privateKey: string, status: Status) {
    return client.signFields(statusToFields(status), privateKey);
} 