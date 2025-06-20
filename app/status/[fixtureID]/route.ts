import fetch from "node-fetch";
import dayjs from "dayjs";
import { Status, signStatus } from "../../../src/oracleUtils";
import { PrivateKey } from "o1js";

// Ensure required environment variables are present
const { PRIVATE_KEY, API_KEY } = process.env;

if (!PRIVATE_KEY || !API_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

// Interface for fixture status data from Sportmonks API
interface SportmonksFixtureStatus {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
    status: string;
    winner_team_id: number | null;
}

// Function to fetch fixture status with error handling and type conversion
async function fetchFixtureStatus(
    fixtureID: number
): Promise<Status | null> {
    try {
        const url = `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureID}?fields[fixtures]=localteam_id,visitorteam_id,starting_at,status,winner_team_id&api_token=${API_KEY}`;
        const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            console.error("Error fetching data:", response);
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        // Parse response data and check for errors
        const data = (await response.json()) as {
            data: SportmonksFixtureStatus;
        };
        if (!data.data) {
            console.error("Error fetching data: No fixtures found");
            return null;
        }

        const sportsmonksFixtureStatus: SportmonksFixtureStatus = data.data;

        // Convert status string to numerical representation
        let status: number;
        switch (sportsmonksFixtureStatus.status) {
            case "NS":
                status = 1; // Not Started
                break;
            case "1st Innings":
            case "Innings Break":
            case "2nd Innings":
            case "Int.":
                status = 2; // In Progress
                break;
            case "Finished":
                status = 3; // Finished
                break;
            default:
                status = 4; // Cancelled
                break;
        }

        // Ensure winner_team_id is not null
        let winnerTeamID = sportsmonksFixtureStatus.winner_team_id;
        if (winnerTeamID === null) {
            winnerTeamID = 0;
        }

        const fixtureStatus: Status = {
            fixtureID: sportsmonksFixtureStatus.id,
            localTeamID: sportsmonksFixtureStatus.localteam_id,
            visitorTeamID: sportsmonksFixtureStatus.visitorteam_id,
            startingAt: dayjs(sportsmonksFixtureStatus.starting_at).valueOf(),
            status,
            winnerTeamID,
        };

        return fixtureStatus;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

// Function to sign fixture data and add timestamp
function signFixtureData(fixtureStatus: Status) {
    try {
        if (!PRIVATE_KEY) {
            throw new Error(
                "Missing required environment variable: PRIVATE_KEY"
            );
        }

        const signature = signStatus(PRIVATE_KEY, fixtureStatus);
        const publicKey = PrivateKey.fromBase58(PRIVATE_KEY).toPublicKey();

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

// GET endpoint handler with error handling and response formatting
export async function GET(
    request: Request,
    { params }: { params: { fixtureID: string } }
) {
    const fixtureID = Number(params.fixtureID);
    const fixtureData = await fetchFixtureStatus(fixtureID);

    if (fixtureData) {
        return new Response(JSON.stringify(signFixtureData(fixtureData)), {
            headers: { "Content-Type": "application/json" },
        });
    } else {
        return new Response("Error fetching data", { status: 500 });
    }
}
