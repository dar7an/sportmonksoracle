import dayjs from "dayjs";
import { PrivateKey } from "o1js";
import { Fixture, signFixture, signStatus, Status } from "./oracleUtils";
import { OracleError } from "./errors";
import { ProcessedFixtureData } from "./sportmonks";

export interface SignedResponse<TData> {
    data: TData;
    signature: string;
    publicKey: string;
}

export interface MultiFixtureResponse {
    data: Array<ProcessedFixtureData & { timestamp: number }>;
    signatures: string[];
    publicKey: string;
}

export function signFixtureResponse(
    fixture: ProcessedFixtureData,
    privateKeyBase58: string
): SignedResponse<ProcessedFixtureData & { timestamp: number }> {
    try {
        const signature = signFixture(privateKeyBase58, fixtureToSigningData(fixture));
        const publicKey = PrivateKey.fromBase58(privateKeyBase58).toPublicKey();

        return {
            data: {
                ...fixture,
                timestamp: dayjs().valueOf(),
            },
            signature: signature.toBase58(),
            publicKey: publicKey.toBase58(),
        };
    } catch (error) {
        console.error("Error signing fixture data:", error);
        throw new OracleError(500, "SIGNING_ERROR", "Failed to sign fixture data");
    }
}

export function signFixtureListResponse(
    fixtures: ProcessedFixtureData[],
    privateKeyBase58: string
): MultiFixtureResponse {
    try {
        const publicKey = PrivateKey.fromBase58(privateKeyBase58).toPublicKey();
        const timestamp = dayjs().valueOf();

        return {
            data: fixtures.map((fixture) => ({ ...fixture, timestamp })),
            signatures: fixtures.map((fixture) =>
                signFixture(privateKeyBase58, fixtureToSigningData(fixture)).toBase58()
            ),
            publicKey: publicKey.toBase58(),
        };
    } catch (error) {
        console.error("Error signing fixture list:", error);
        throw new OracleError(500, "SIGNING_ERROR", "Failed to sign fixture data");
    }
}

export function signStatusResponse(
    status: Status,
    privateKeyBase58: string
): SignedResponse<Status & { timestamp: number }> {
    try {
        const signature = signStatus(privateKeyBase58, status);
        const publicKey = PrivateKey.fromBase58(privateKeyBase58).toPublicKey();

        return {
            data: {
                ...status,
                timestamp: dayjs().valueOf(),
            },
            signature: signature.toBase58(),
            publicKey: publicKey.toBase58(),
        };
    } catch (error) {
        console.error("Error signing status data:", error);
        throw new OracleError(500, "SIGNING_ERROR", "Failed to sign fixture status");
    }
}

function fixtureToSigningData(fixture: ProcessedFixtureData): Fixture {
    return {
        fixtureID: fixture.fixtureID,
        localTeamID: fixture.localTeamID,
        visitorTeamID: fixture.visitorTeamID,
        startingAt: fixture.startingAt,
    };
}
