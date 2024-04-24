import config from "/Users/darshan/Documents/GitHub/oracle/config";
import fetch from "node-fetch";
import dayjs from "dayjs";

import Client from "mina-signer";
const client = new Client({ network: "testnet" });

const PRIVATE_KEY = config.PRIVATE_KEY;
const API_KEY = config.API_KEY;
const URL = `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[league_id]=1&filter[season_id]=1484&filter[status]=NS&fields[fixtures]=id,localteam_id,visitorteam_id,starting_at&api_token=${API_KEY}`;

interface NextFixture {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
}

export async function fetchNextFixtureData() {
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
        const firstFixture: NextFixture = data.data[0];
        return firstFixture;
    } catch (error) {
        console.log("Error fetching data: ", error);
        return null;
    }
}

function signFixtureData(firstFixture: NextFixture) {
    const signature = client.signMessage(
        JSON.stringify(firstFixture),
        PRIVATE_KEY
    );

    return {
        data: {
            fixtureID: firstFixture.id,
            localTeamID: firstFixture.localteam_id,
            visitorTeamID: firstFixture.visitorteam_id,
            startingAt: firstFixture.starting_at,
            timestamp: dayjs(new Date()),
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
