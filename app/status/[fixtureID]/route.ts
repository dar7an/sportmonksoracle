import dayjs from "dayjs";
import { Status, signStatus } from "../../../src/oracleUtils";
import { PrivateKey } from "o1js";
import { getOracleEnv } from "../../../src/config";
import { mapSportmonksStatus } from "../../../src/status";

// Sportmonks fixture fields requested by this route.
interface SportmonksFixtureStatus {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
    status: string;
    winner_team_id: number | null;
}

async function fetchFixtureStatus(
    fixtureID: number,
    apiKey: string
): Promise<Status | null> {
    try {
        const url = `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureID}?fields[fixtures]=localteam_id,visitorteam_id,starting_at,status,winner_team_id&api_token=${apiKey}`;
        const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            console.error("Error fetching data:", response);
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const data = (await response.json()) as {
            data: SportmonksFixtureStatus;
        };
        if (!data.data) {
            console.error("Error fetching data: No fixtures found");
            return null;
        }

        const sportsmonksFixtureStatus: SportmonksFixtureStatus = data.data;

        let winnerTeamID = sportsmonksFixtureStatus.winner_team_id;
        if (winnerTeamID === null) {
            winnerTeamID = 0;
        }

        const fixtureStatus: Status = {
            fixtureID: sportsmonksFixtureStatus.id,
            localTeamID: sportsmonksFixtureStatus.localteam_id,
            visitorTeamID: sportsmonksFixtureStatus.visitorteam_id,
            startingAt: dayjs(sportsmonksFixtureStatus.starting_at).valueOf(),
            status: mapSportmonksStatus(sportsmonksFixtureStatus.status),
            winnerTeamID,
        };

        return fixtureStatus;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

function signFixtureData(fixtureStatus: Status, privateKeyBase58: string) {
    try {
        // Status responses sign the base fixture fields plus status and winner.
        const signature = signStatus(privateKeyBase58, fixtureStatus);
        const publicKey = PrivateKey.fromBase58(privateKeyBase58).toPublicKey();

        return {
            data: {
                ...fixtureStatus,
                timestamp: dayjs(new Date()).valueOf(),
            },
            signature: signature.toBase58(),
            publicKey: publicKey.toBase58(),
        };
    } catch (error) {
        console.error("Error signing data:", error);
        return null;
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ fixtureID: string }> }
) {
    const { fixtureID: fixtureIDParam } = await params;
    const fixtureID = Number(fixtureIDParam);
    if (!Number.isInteger(fixtureID) || fixtureID <= 0) {
        return Response.json({ error: "fixtureID must be a positive integer" }, { status: 400 });
    }

    let env;
    try {
        env = getOracleEnv();
    } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }

    const fixtureData = await fetchFixtureStatus(fixtureID, env.apiKey);

    if (fixtureData) {
        const signedData = signFixtureData(fixtureData, env.privateKey);
        if (!signedData) {
            return Response.json({ error: "Failed to sign fixture status" }, { status: 500 });
        }
        return Response.json(signedData);
    } else {
        return Response.json({ error: "Error fetching data" }, { status: 500 });
    }
}
