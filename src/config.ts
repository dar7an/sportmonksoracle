import { OracleError } from "./errors";

export interface OracleEnv {
    apiKey: string;
    privateKey: string;
}

/**
 * Reads runtime secrets inside request handlers.
 *
 * Keeping this out of module scope lets Next.js build and type-check the app
 * without production secrets.
 */
export function getOracleEnv(): OracleEnv {
    const { API_KEY, PRIVATE_KEY } = process.env;
    const missing = [
        !API_KEY ? "API_KEY" : null,
        !PRIVATE_KEY ? "PRIVATE_KEY" : null,
    ].filter(Boolean);

    if (missing.length > 0) {
        throw new OracleError(
            500,
            "CONFIG_ERROR",
            `Missing required environment variables: ${missing.join(", ")}`
        );
    }

    return {
        apiKey: API_KEY as string,
        privateKey: PRIVATE_KEY as string,
    };
}
