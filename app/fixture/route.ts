import fetch from "node-fetch";
import dayjs from "dayjs";

import Client from "mina-signer";
const client = new Client({ network: "testnet" });

// Ensure required environment variables are present
const { PRIVATE_KEY, API_KEY, LEAGUE_ID, SEASON_ID } = process.env;

if (!PRIVATE_KEY || !API_KEY || !LEAGUE_ID || !SEASON_ID) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

// API URL
const URL = `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[league_id]=${LEAGUE_ID}&filter[season_id]=${SEASON_ID}&filter[status]=NS&fields[fixtures]=id,localteam_id,visitorteam_id,starting_at&api_token=${API_KEY}`;

// Interfaces for data types
interface NextFixtureData {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
}

interface ProcessedFixtureData {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: number;
}

// Function to fetch fixture data with error handling and type assertion
async function fetchNextFixtureData(): Promise<ProcessedFixtureData | null> {
    try {
        const response = await fetch(URL, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            console.error(
                "Error fetching data:",
                response.status,
                response.statusText
            );
            return null; // Indicate error by returning null
        }

        const data = (await response.json()) as { data: NextFixtureData[] };
        if (!data.data.length) {
            console.error("Error fetching data: No fixtures found");
            return null;
        }

        const firstFixture = data.data[0];

        // Validate fixture data
        if (!firstFixture || typeof firstFixture.id !== 'number' ||
            typeof firstFixture.localteam_id !== 'number' ||
            typeof firstFixture.visitorteam_id !== 'number' ||
            typeof firstFixture.starting_at !== 'string'
        ) {
            console.error("Error fetching data: Invalid fixture data");
            return null;
        }

        return {
            id: firstFixture.id,
            localteam_id: firstFixture.localteam_id,
            visitorteam_id: firstFixture.visitorteam_id,
            starting_at: dayjs(firstFixture.starting_at).valueOf(),
        };
    } catch (error) {
        console.error("Error fetching data:", error);
        return null; // Indicate error by returning null
    }
}

// Function to sign fixture data
function signFixtureData(fixture: ProcessedFixtureData) {
    try {
        if (!PRIVATE_KEY) {
            throw new Error("Missing required environment variable: PRIVATE_KEY");
        }

        const signature = client.signFields(
            [
                BigInt(fixture.id),
                BigInt(fixture.localteam_id),
                BigInt(fixture.visitorteam_id),
                BigInt(fixture.starting_at),
            ],
            PRIVATE_KEY
        );

        return {
            data: {
                fixtureID: fixture.id,
                localTeamID: fixture.localteam_id,
                visitorTeamID: fixture.visitorteam_id,
                startingAt: fixture.starting_at,
                timestamp: dayjs(new Date()).valueOf(),
            },
            signature: signature.signature,
            publicKey: signature.publicKey,
        };
    } catch (error) {
        console.error("Error signing fixture data:", error);
        return null; // Indicate error by returning null
    }
}

// Main function (async to handle asynchronous operations)
export async function GET() {
    const fixtureData = await fetchNextFixtureData();

    if (fixtureData) {
        const signedData = signFixtureData(fixtureData);
        return new Response(JSON.stringify(signedData), {
            headers: { "Content-Type": "application/json" },
        });
    } else {
        // Return a more informative error response
        return new Response("Failed to fetch or process fixture data", {
            status: 500,
        });
    }
}
