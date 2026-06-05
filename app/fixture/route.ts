import { getOracleEnv } from "../../src/config";
import { errorResponse, jsonResponse } from "../../src/errors";
import { signFixtureListResponse, signFixtureResponse } from "../../src/signing";
import { fetchFixtures, parseFixtureQuery } from "../../src/sportmonks";

const FIXTURE_CACHE_SECONDS = Number(process.env.FIXTURE_CACHE_SECONDS ?? 60);

export async function GET(request: Request) {
    try {
        const env = getOracleEnv();
        const query = parseFixtureQuery(new URL(request.url).searchParams);
        const fixtures = await fetchFixtures(query, env.apiKey);
        const payload =
            fixtures.length === 1
                ? signFixtureResponse(fixtures[0], env.privateKey)
                : signFixtureListResponse(fixtures, env.privateKey);

        return jsonResponse(payload, 200, FIXTURE_CACHE_SECONDS);
    } catch (error) {
        return errorResponse(error);
    }
}
