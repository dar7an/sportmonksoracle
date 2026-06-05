export type ErrorCode =
    | "BAD_REQUEST"
    | "CONFIG_ERROR"
    | "NOT_FOUND"
    | "SIGNING_ERROR"
    | "SPORTMONKS_AUTH_ERROR"
    | "SPORTMONKS_ERROR";

export class OracleError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: ErrorCode,
        message: string
    ) {
        super(message);
        this.name = "OracleError";
    }
}

export function errorResponse(error: unknown): Response {
    if (error instanceof OracleError) {
        return Response.json(
            { error: error.message, code: error.code },
            { status: error.status }
        );
    }

    console.error("Unhandled oracle error:", error);
    return Response.json(
        { error: "Unexpected oracle error", code: "SPORTMONKS_ERROR" },
        { status: 500 }
    );
}

export function jsonResponse(
    payload: unknown,
    status = 200,
    cacheSeconds?: number
): Response {
    const headers = new Headers();
    if (cacheSeconds !== undefined) {
        headers.set(
            "Cache-Control",
            `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`
        );
    }

    return Response.json(payload, { status, headers });
}
