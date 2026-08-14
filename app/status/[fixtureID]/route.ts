import { getOracleEnv, getStatusCacheSeconds } from "../../../src/config";
import { errorResponse, jsonResponse } from "../../../src/errors";
import { enforceRateLimit } from "../../../src/rateLimit";
import { signStatusResponse } from "../../../src/signing";
import { fetchFixtureStatus, parseFixtureId } from "../../../src/sportmonks";

export const runtime = "nodejs";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ fixtureID: string }> }
) {
    try {
        enforceRateLimit(request);
        const env = getOracleEnv();
        const { fixtureID } = await params;
        const fixtureStatus = await fetchFixtureStatus(
            parseFixtureId(fixtureID),
            env.apiKey
        );

        return jsonResponse(
            signStatusResponse(fixtureStatus, env.privateKey),
            200,
            getStatusCacheSeconds()
        );
    } catch (error) {
        return errorResponse(error);
    }
}
