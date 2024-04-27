import fetch from "node-fetch";
import dayjs from "dayjs";

import Client from "mina-signer";
const client = new Client({ network: "testnet" });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const API_KEY = process.env.API_KEY;
const FIXTURE_ID = process.env.FIXTURE_ID;
const URL = `https://cricket.sportmonks.com/api/v2.0/fixtures/${FIXTURE_ID}?fields[fixtures]=status,winner_team_id&api_token=${API_KEY}`;

interface SportsMonksFixtureStatus {
    id: number;
    status: string;
    winner_team_id: number;
}

interface FixtureStatus {
    fixtureID: number;
    status: number;
    winnerTeamID: number;
}

async function fetchFixtureStatus() {
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
        const sportsmonksFixtureStatus: SportsMonksFixtureStatus = data.data;

        // https://docs.sportmonks.com/cricket/statuses-and-definitions
        let status: number;
        switch (sportsmonksFixtureStatus.status) {
            case "NS":
                status = 0;
                break;
            case "1st Innings":
            case "Innings Break":
            case "2nd Innings":
            case "Int.":
                status = 1;
                break;
            case "Finished":
                status = 2;
                break;
            default:
                status = -1;
                break;
        }

        const fixtureStatus: FixtureStatus = {
            fixtureID: sportsmonksFixtureStatus.id,
            status: status,
            winnerTeamID: sportsmonksFixtureStatus.winner_team_id,
        };

        return fixtureStatus;
    } catch (error) {
        console.log("Error fetching data: ", error);
        return null;
    }
}

function signFixtureData(fixtureStatus: FixtureStatus) {
    const signature = client.signMessage(
        JSON.stringify(fixtureStatus),
        String(PRIVATE_KEY)
    );

    return {
        data: {
            id: fixtureStatus.fixtureID,
            status: fixtureStatus.status,
            winnerTeamID: fixtureStatus.winnerTeamID,
            timestamp: dayjs(new Date()).unix(),
        },
        signature: signature.signature,
        publicKey: signature.publicKey,
    };
}

export async function GET() {
    const fixtureData = await fetchFixtureStatus();
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
