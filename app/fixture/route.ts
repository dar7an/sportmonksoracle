import dayjs from "dayjs";
import { Fixture, signFixture } from "../../src/oracleUtils";
import { PrivateKey } from "o1js";
import { getOracleEnv } from "../../src/config";

const T20I_LEAGUE_ID = 3;

// Sportmonks fixture fields requested by this route.
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
    localTeamName: string;
    localTeamCode: string;
    visitorTeamName: string;
    visitorTeamCode: string;
}

async function fetchTeamData(teamId: number, apiKey: string): Promise<TeamData | null> {
    try {
        const teamUrl = `https://cricket.sportmonks.com/api/v2.0/teams/${teamId}?api_token=${apiKey}`;
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

async function fetchNextFixtureData(apiKey: string): Promise<ProcessedFixtureData | null> {
    try {
        const url = `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[league_id]=${T20I_LEAGUE_ID}&filter[status]=NS&fields[fixtures]=id,localteam_id,visitorteam_id,starting_at&sort=starting_at&api_token=${apiKey}`;
        const response = await fetch(url, {
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
            return null;
        }

        const data = (await response.json()) as { data: NextFixtureData[] };
        if (!data.data.length) {
            console.error("Error fetching data: No fixtures found");
            return null;
        }

        console.log("Fetched fixtures:", data.data.slice(0, 3));

        const firstFixture: NextFixtureData = data.data[0];
        console.log("Selected fixture:", firstFixture);

        const [localTeam, visitorTeam] = await Promise.all([
            fetchTeamData(firstFixture.localteam_id, apiKey),
            fetchTeamData(firstFixture.visitorteam_id, apiKey),
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
            localTeamName: localTeam.name,
            localTeamCode: localTeam.code,
            visitorTeamName: visitorTeam.name,
            visitorTeamCode: visitorTeam.code,
        };
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

function signFixtureData(fixture: ProcessedFixtureData, privateKeyBase58: string) {
    try {
        // Sign only the public numeric contract. Display fields remain unsigned.
        const dataToSign: Fixture = {
            fixtureID: fixture.fixtureID,
            localTeamID: fixture.localTeamID,
            visitorTeamID: fixture.visitorTeamID,
            startingAt: fixture.startingAt,
        };

        const signature = signFixture(privateKeyBase58, dataToSign);
        const publicKey = PrivateKey.fromBase58(privateKeyBase58).toPublicKey();

        return {
            data: {
                ...fixture,
                timestamp: dayjs(new Date()).valueOf(),
            },
            signature: signature.toBase58(),
            publicKey: publicKey.toBase58(),
        };
    } catch (error) {
        console.error("Error signing fixture data:", error);
        return null;
    }
}

export async function GET() {
    let env;
    try {
        env = getOracleEnv();
    } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 500 });
    }

    const fixtureData = await fetchNextFixtureData(env.apiKey);

    if (fixtureData) {
        const signedData = signFixtureData(fixtureData, env.privateKey);
        if (!signedData) {
            return Response.json({ error: "Failed to sign fixture data" }, { status: 500 });
        }
        return Response.json(signedData);
    } else {
        return Response.json({ error: "Failed to fetch or process fixture data" }, { status: 500 });
    }
}
