import { getOracleEnv } from "../../../src/config";
import { errorResponse, jsonResponse } from "../../../src/errors";
import { signStatusResponse } from "../../../src/signing";
import { fetchFixtureStatus, parseFixtureId } from "../../../src/sportmonks";

const STATUS_CACHE_SECONDS = Number(process.env.STATUS_CACHE_SECONDS ?? 15);

export async function GET(
    request: Request,
    { params }: { params: Promise<{ fixtureID: string }> }
) {
    try {
        const env = getOracleEnv();
        const { fixtureID } = await params;
        const fixtureStatus = await fetchFixtureStatus(
            parseFixtureId(fixtureID),
            env.apiKey
        );

        return jsonResponse(
            signStatusResponse(fixtureStatus, env.privateKey),
            200,
            STATUS_CACHE_SECONDS
        );
    } catch (error) {
        return errorResponse(error);
    }
}
