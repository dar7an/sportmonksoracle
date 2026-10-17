export function sriLankaBangladeshFixture(overrides: Record<string, unknown> = {}) {
    return {
        id: 66230,
        localteam_id: 39,
        visitorteam_id: 37,
        starting_at: "2025-07-10T09:30:00.000000Z",
        localteam: { data: { id: 39, name: "Sri Lanka", code: "SL" } },
        visitorteam: { data: { id: 37, name: "Bangladesh", code: "BGD" } },
        ...overrides,
    };
}

export function emptyPage(page = 1, lastPage = 1) {
    return {
        data: [],
        meta: { current_page: page, last_page: lastPage },
    };
}

type FetchHandler = (url: URL, init?: RequestInit) => Response | Promise<Response>;

export type MockCalls = Array<{ url: URL; init?: RequestInit }> & { fetch: typeof fetch };

const originalFetch = globalThis.fetch;

export function installFetchMock(handler: FetchHandler): MockCalls {
    const calls = [] as unknown as MockCalls;

    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(input.toString());
        calls.push({ url, init });
        return handler(url, init);
    }) as typeof fetch;

    calls.fetch = fetchImpl;
    globalThis.fetch = fetchImpl;
    return calls;
}

export function restoreFetch() {
    globalThis.fetch = originalFetch;
}
