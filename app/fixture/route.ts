import { getFixtureCacheSeconds, getOracleEnv } from "../../src/config";
import { errorResponse, jsonResponse } from "../../src/errors";
import { enforceRateLimit } from "../../src/rateLimit";
import { signFixtureListResponse, signFixtureResponse } from "../../src/signing";
import { fetchFixtures, parseFixtureQuery } from "../../src/sportmonks";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        enforceRateLimit(request);
        const env = getOracleEnv();
        const query = parseFixtureQuery(new URL(request.url).searchParams);
        const fixtures = await fetchFixtures(query, env.apiKey);
        const payload =
            fixtures.length === 1
                ? signFixtureResponse(fixtures[0], env.privateKey)
                : signFixtureListResponse(fixtures, env.privateKey);

        return jsonResponse(payload, 200, getFixtureCacheSeconds());
    } catch (error) {
        return errorResponse(error);
    }
}
