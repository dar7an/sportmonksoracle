import fetch from "node-fetch";
import dayjs from "dayjs";
import { Fixture, signFixture } from "../../src/oracleUtils";

import Client from "mina-signer";
const client = new Client({ network: "testnet" });

// Ensure required environment variables are present
const { PRIVATE_KEY, API_KEY } = process.env;

if (!PRIVATE_KEY || !API_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1);
}

const T20I_LEAGUE_ID = 3;

// API URL - Add sorting by starting_at to get the earliest upcoming fixture
const URL = `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[league_id]=${T20I_LEAGUE_ID}&filter[status]=NS&fields[fixtures]=id,localteam_id,visitorteam_id,starting_at&sort=starting_at&api_token=${API_KEY}`;

// Interfaces for data types
interface NextFixtureData {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
}

interface TeamData {
    name: string;
    code: string;
}

interface ProcessedFixtureData extends Fixture {
    localteam_name: string;
    localteam_code: string;
    visitorteam_name: string;
    visitorteam_code: string;
}

// Function to fetch team data
async function fetchTeamData(teamId: number): Promise<TeamData | null> {
    try {
        const teamUrl = `https://cricket.sportmonks.com/api/v2.0/teams/${teamId}?api_token=${API_KEY}`;
        const response = await fetch(teamUrl, {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            console.error(
                `Error fetching team data for ID ${teamId}:`,
                response.status,
                response.statusText
            );
            return null;
        }

        const teamData = (await response.json()) as {
            data: { name: string; code: string };
        };
        return {
            name: teamData.data.name,
            code: teamData.data.code,
        };
    } catch (error) {
        console.error(`Error fetching team data for ID ${teamId}:`, error);
        return null;
    }
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

        // Parse response data and check for errors
        const data = (await response.json()) as { data: NextFixtureData[] };
        if (!data.data.length) {
            console.error("Error fetching data: No fixtures found");
            return null;
        }

        console.log("Fetched fixtures:", data.data.slice(0, 3)); // Log first 3 fixtures for debugging

        const firstFixture: NextFixtureData = data.data[0];
        console.log("Selected fixture:", firstFixture);

        const [localTeam, visitorTeam] = await Promise.all([
            fetchTeamData(firstFixture.localteam_id),
            fetchTeamData(firstFixture.visitorteam_id),
        ]);

        if (!localTeam || !visitorTeam) {
            console.error("Failed to fetch one or both teams.");
            return null;
        }

        return {
            fixtureID: firstFixture.id,
            localTeamID: firstFixture.localteam_id,
            visitorTeamID: firstFixture.visitorteam_id,
            startingAt: dayjs(firstFixture.starting_at).valueOf(),
            localteam_name: localTeam.name,
            localteam_code: localTeam.code,
            visitorteam_name: visitorTeam.name,
            visitorteam_code: visitorTeam.code,
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
            throw new Error(
                "Missing required environment variable: PRIVATE_KEY"
            );
        }

        const signature = signFixture(PRIVATE_KEY, fixture);

        return {
            data: {
                ...fixture,
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
