import config from '/Users/darshan/Documents/GitHub/oracle/config';
import { Field, PrivateKey, PublicKey, Signature } from 'o1js';
import fetch from 'node-fetch';
import dayjs from 'dayjs';

// const PRIVATE_KEY = PrivateKey.fromBase58(config.PRIVATE_KEY);
const API_KEY = config.API_KEY;
const URL = `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[league_id]=1&filter[season_id]=1484&filter[status]=NS&fields[fixtures]=id,localteam_id,visitorteam_id,starting_at&api_token=${API_KEY}`;

interface NextFixture {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
}

function getCurrentISOTime(): string {
    return dayjs().toISOString();
}

async function fetchNextFixtureData() {
    try {
        const response = await fetch(URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.log('Error fetching data: ', response);
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const data = await response.json() as any;
        const firstFixture: NextFixture = data.data[0];
        
        return {
            fixtureID: firstFixture.id,
            localTeamID: firstFixture.localteam_id,
            visitorTeamID: firstFixture.visitorteam_id,
            startingAt: firstFixture.starting_at,
            timestamp: getCurrentISOTime()
        };

    } catch (error) {
        console.log('Error fetching data: ', error);
        return null;
    }
}

// async function signFixtureData(fixtureData: any) {
//     const signature = Signature.create( PRIVATE_KEY, 
//         [
//             Field(fixtureData.id),
//             Field(fixtureData.localteam_id),
//             Field(fixtureData.visitorteam_id),
//             Field(fixtureData.starting_at),
//             Field(fixtureData.timestamp)
//         ]
//     )

//     return {
//         fixtureID: fixtureData.fixtureID,
//         localTeamID: fixtureData.localTeamID,
//         visitorTeamID: fixtureData.visitorTeamID,
//         startingAt: fixtureData.startingAt,
//         timestamp: fixtureData.timestamp,
//         publicKey: PublicKey.fromPrivateKey(PRIVATE_KEY).toBase58(),
//         signature: signature.toBase58()
//     }
// }

export async function GET(request: Request) {
    const fixtureData = await fetchNextFixtureData();
    if (fixtureData) {
        return new Response(JSON.stringify(fixtureData), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } else {
        return new Response('Error fetching data', {
            status: 500
        });
    }
}
