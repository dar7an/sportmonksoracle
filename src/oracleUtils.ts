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
        BigInt(status.fixtureID),
        BigInt(status.localTeamID),
        BigInt(status.visitorTeamID),
        BigInt(status.startingAt),
        BigInt(status.status),
        BigInt(status.winnerTeamID),
    ];
}

/* -------------------------------------------------------------------------- */
/*                              Signer helpers                                */
/* -------------------------------------------------------------------------- */

export function signFixture(privateKeyBase58: string, fixture: Fixture) {
    const fields = fixtureToFields(fixture);
    return client.signFields(fields, privateKeyBase58);
}

export function signStatus(privateKeyBase58: string, status: Status) {
    const fields = statusToFields(status);
    return client.signFields(fields, privateKeyBase58);
} 