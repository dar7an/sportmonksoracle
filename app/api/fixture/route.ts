import fetch from 'node-fetch';

const API_KEY = 'T3XsJps9T1z4V1bA6BC5h2j9FYgbcHMmcck0oFJWewguUgELn0WE9eJaeGZj';
const URL = `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[league_id]=1&filter[season_id]=1484&filter[status]=NS&fields[fixtures]=id,localteam_id,visitorteam_id,starting_at&api_token=${API_KEY}`;

interface NextFixture {
    id: number;
    localteam_id: number;
    visitorteam_id: number;
    starting_at: string;
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
        };

    } catch (error) {
        console.log('Error fetching data: ', error);
        return null;
    }
}

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
