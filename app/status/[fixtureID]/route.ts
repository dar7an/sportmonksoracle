import fetch from "node-fetch";
import dayjs from "dayjs";
import Client from "mina-signer";

const client = new Client({ network: "testnet" });

// Ensure required environment variables are present
const { PRIVATE_KEY, API_KEY } = process.env;

if (!PRIVATE_KEY || !API_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

// Interface for fixture status data from Sportmonks API
interface SportmonksFixtureStatus {
    id: number;
    status: string;
    winner_team_id: number;
}

// Interface for processed fixture status data
interface FixtureStatus {
    fixtureID: number;
    status: number;
    winnerTeamID: number;
}

// Function to fetch fixture status with error handling and type conversion
async function fetchFixtureStatus(
    fixtureID: number
): Promise<FixtureStatus | null> {
    try {
        const url = `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureID}?fields[fixtures]=status,winner_team_id&api_token=${API_KEY}`;
        const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            console.error("Error fetching data:", response);
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const data = (await response.json()) as any;
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
        if (sportsmonksFixtureStatus.winner_team_id === null) {
            sportsmonksFixtureStatus.winner_team_id = 0;
        }

        const fixtureStatus: FixtureStatus = {
            fixtureID: sportsmonksFixtureStatus.id,
            status,
            winnerTeamID: sportsmonksFixtureStatus.winner_team_id,
        };

        return fixtureStatus;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

// Function to sign fixture data and add timestamp
function signFixtureData(fixtureStatus: FixtureStatus) {
    if (!PRIVATE_KEY) {
        throw new Error("Missing required environment variable: PRIVATE_KEY");
    }

    const signature = client.signFields(
        [
            BigInt(fixtureStatus.fixtureID),
            BigInt(fixtureStatus.status),
            BigInt(fixtureStatus.winnerTeamID),
        ],
        PRIVATE_KEY
    );

    return {
        data: {
            ...fixtureStatus, // Include all properties from fixtureStatus
            timestamp: dayjs(new Date()).valueOf(),
        },
        signature: signature.signature,
        publicKey: signature.publicKey,
    };
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
