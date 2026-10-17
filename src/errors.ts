export type ErrorCode =
    | "BAD_REQUEST"
    | "CONFIG_ERROR"
    | "NOT_FOUND"
    | "SIGNING_ERROR"
    | "SPORTMONKS_AUTH_ERROR"
    | "SPORTMONKS_ERROR"
    | "SPORTMONKS_RATE_LIMIT"
    | "UNKNOWN_STATUS"
    | "MALFORMED_UPSTREAM"
    | "UPSTREAM_TIMEOUT"
    | "RATE_LIMITED"
    | "INTERNAL_ERROR";

export class OracleError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: ErrorCode,
        message: string,
        public readonly responseHeaders?: Record<string, string>
    ) {
        super(message);
        this.name = "OracleError";
    }
}

export function errorResponse(error: unknown): Response {
    if (error instanceof OracleError) {
        const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
        if (error.responseHeaders) {
            for (const [key, value] of Object.entries(error.responseHeaders)) {
                headers.set(key, value);
            }
        }

        return new Response(JSON.stringify({ error: error.message, code: error.code }), {
            status: error.status,
            headers,
        });
    }

    console.error("Unhandled oracle error:", error);
    return Response.json(
        { error: "Unexpected oracle error", code: "INTERNAL_ERROR" },
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
