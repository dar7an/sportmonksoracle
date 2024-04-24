import config from "/Users/darshan/Documents/GitHub/oracle/config";
import { fetchNextFixtureData } from "/Users/darshan/Documents/GitHub/oracle/app/api/fixture/route";
import fetch from "node-fetch";
import dayjs from "dayjs";

import Client from "mina-signer";
const client = new Client({ network: "testnet" });

const PRIVATE_KEY = config.PRIVATE_KEY;
const API_KEY = config.API_KEY;

interface FixtureStatus {
    id: number;
    status: string;
    winner_team_id: number;
}

async function fetchFixtureStatus(fixtureID: number) {
    const URL = `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureID}?fields[fixtures]=status,winner_team_id&api_token=${API_KEY}`;
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
        const currentStatus: FixtureStatus = data.data;
        return currentStatus;
    } catch (error) {
        console.log("Error fetching data: ", error);
        return null;
    }
}

function signFixtureData(currentStatus: FixtureStatus) {
    const signature = client.signMessage(
        JSON.stringify(currentStatus),
        PRIVATE_KEY
    );

    return {
        data: {
            id: currentStatus.id,
            status: currentStatus.status,
            winnerTeamID: currentStatus.winner_team_id,
            timestamp: dayjs(new Date()),
        },
        signature: signature.signature,
        publicKey: signature.publicKey,
    };
}

export async function GET() {
    const fixtureData = await fetchNextFixtureData();

    if (fixtureData) {
        const fixtureID = fixtureData.id;
        const statusData = await fetchFixtureStatus(fixtureID);
        if (statusData) {
            return new Response(JSON.stringify(signFixtureData(statusData)), {
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
}
