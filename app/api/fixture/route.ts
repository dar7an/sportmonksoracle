import config from "/Users/darshan/Documents/GitHub/oracle/config";
import fetch from "node-fetch";
import dayjs from "dayjs";

import Client from "mina-signer";
const client = new Client({ network: "testnet" });

const PRIVATE_KEY = config.PRIVATE_KEY;
const API_KEY = config.API_KEY;
const URL = `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[league_id]=1&filter[season_id]=1484&filter[status]=NS&fields[fixtures]=id,localteam_id,visitorteam_id,starting_at&api_token=${API_KEY}`;

interface getNextFixture {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
}

interface NextFixture {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: number;
}

async function fetchNextFixtureData() {
    try {
        const response = await fetch(URL, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            console.log("Error fetching data: ", response);
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const data = (await response.json()) as any;
        const getFirstFixture: getNextFixture = data.data[0];

        const firstFixture: NextFixture = {
            id: getFirstFixture.id,
            localteam_id: getFirstFixture.localteam_id,
            visitorteam_id: getFirstFixture.visitorteam_id,
            starting_at: dayjs(getFirstFixture.starting_at).unix(),
        };
        return firstFixture;
    } catch (error) {
        console.log("Error fetching data: ", error);
        return null;
    }
}

function signFixtureData(fixture: NextFixture) {
    const signature = client.signMessage(JSON.stringify(fixture), PRIVATE_KEY);

    return {
        data: {
            fixtureID: fixture.id,
            localTeamID: fixture.localteam_id,
            visitorTeamID: fixture.visitorteam_id,
            startingAt: fixture.starting_at,
            timestamp: dayjs(new Date()).unix(),
        },
        signature: signature.signature,
        publicKey: signature.publicKey,
    };
}

export async function GET() {
    const fixtureData = await fetchNextFixtureData();
    if (fixtureData) {
        return new Response(JSON.stringify(signFixtureData(fixtureData)), {
            headers: {
                "Content-Type": "application/json",
            },
        });
    } else {
        return new Response("Error fetching data", {
            status: 500,
        });
    }
}
