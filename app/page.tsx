import { headers } from "next/headers";
import { PublicKey, Signature } from "o1js";
import { getOracleEnv } from "../src/config";
import { OracleError } from "../src/errors";
import { fixtureToFields, statusToFields } from "../src/oracleUtils";
import { enforceRateLimit } from "../src/rateLimit";
import {
    fetchFixtureStatus,
    fetchFixtures,
    parseFixtureQuery,
} from "../src/sportmonks";
import { signFixtureResponse, signStatusResponse } from "../src/signing";
import { matchOutcomeLabel, matchStatusLabel } from "../src/status";
import { CopyButton } from "./components/CopyButton";
import { PayloadTable, type PayloadRow } from "./components/PayloadTable";
import { StatusLabel } from "./components/StatusLabel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ConsoleState =
    | { kind: "ready"; fixture: FixtureView; status?: StatusView }
    | { kind: "config"; message: string }
    | { kind: "empty"; message: string }
    | { kind: "error"; message: string };

type FixtureView = {
    data: {
        fixtureID: number | bigint;
        localTeamID: number | bigint;
        visitorTeamID: number | bigint;
        startingAt: number | bigint;
        localTeamName?: string;
        visitorTeamName?: string;
        timestamp: number;
    };
    signature: string;
    publicKey: string;
    verified: boolean;
};

type StatusView = {
    data: {
        fixtureID: number | bigint;
        localTeamID: number | bigint;
        visitorTeamID: number | bigint;
        startingAt: number | bigint;
        status: number | bigint;
        winnerTeamID: number | bigint;
        outcome: number | bigint;
        timestamp: number;
    };
    signature: string;
    publicKey: string;
    verified: boolean;
};

export default async function HomePage() {
    const state = await loadConsole();

    return (
        <main id="main" className="page">
            <section className="hero">
                <p className="eyebrow">Verification console</p>
                <h1>Inspect the next signed fixture</h1>
                <p className="lead">
                    This page shows the same numeric fields the oracle signs with o1js.
                    Team names are labels only. A valid signature means this oracle
                    attested these fields once — not that the match is live.
                </p>
                <div className="hero-actions">
                    {state.kind === "ready" ? (
                        <a className="button" href="#fixture-payload">
                            Inspect payload
                        </a>
                    ) : (
                        <a className="button" href="/docs">
                            Read the contract
                        </a>
                    )}
                    <a className="button-secondary" href="/fixture">
                        View fixture JSON
                    </a>
                </div>
            </section>

            {state.kind === "config" ? (
                <section className="notice" aria-live="polite">
                    <h2>Oracle is not configured</h2>
                    <p>
                        Set <code>API_KEY</code> and <code>PRIVATE_KEY</code> to fetch and
                        sign live Sportmonks data. Until then, JSON routes return a
                        configuration error and this console stays empty.
                    </p>
                    <div className="empty-actions">
                        <a className="button-secondary" href="/docs">
                            Read the contract
                        </a>
                    </div>
                </section>
            ) : null}

            {state.kind === "empty" ? (
                <section className="notice" aria-live="polite">
                    <h2>No fixture to inspect</h2>
                    <p>
                        The default T20I filter did not return a match. Query{" "}
                        <code>/fixture</code> with another <code>leagueId</code> or{" "}
                        <code>status</code>.
                    </p>
                    <div className="empty-actions">
                        <a className="button-secondary" href="/docs">
                            Read the contract
                        </a>
                    </div>
                </section>
            ) : null}

            {state.kind === "error" ? (
                <section className="notice error" role="alert">
                    <h2>Unable to load a signed fixture</h2>
                    <p>{state.message}</p>
                    <div className="empty-actions">
                        <a className="button-secondary" href="/docs">
                            Read the contract
                        </a>
                    </div>
                </section>
            ) : null}

            {state.kind === "ready" ? (
                <div className="stack">
                    <FixtureCard fixture={state.fixture} />
                    {state.status ? <StatusCard status={state.status} /> : (
                        <section className="notice">
                            <h2>Status is unavailable</h2>
                            <p>
                                The fixture signed, but the status endpoint could not be
                                attested. The fixture signature is still independently
                                verifiable.
                            </p>
                        </section>
                    )}
                </div>
            ) : null}
        </main>
    );
}

function FixtureCard({ fixture }: { fixture: FixtureView }) {
    const start = new Date(Number(fixture.data.startingAt));
    const rows: PayloadRow[] = [
        {
            field: "fixtureID",
            value: String(fixture.data.fixtureID),
            signed: true,
        },
        {
            field: "localTeamID",
            value: String(fixture.data.localTeamID),
            signed: true,
            hint: unsignedName(fixture.data.localTeamName),
        },
        {
            field: "visitorTeamID",
            value: String(fixture.data.visitorTeamID),
            signed: true,
            hint: unsignedName(fixture.data.visitorTeamName),
        },
        {
            field: "startingAt",
            value: String(fixture.data.startingAt),
            signed: true,
            hint: Number.isFinite(start.valueOf()) ? start.toISOString() : "Invalid timestamp",
        },
        {
            field: "timestamp",
            value: String(fixture.data.timestamp),
            signed: false,
            hint: `${new Date(fixture.data.timestamp).toISOString()} · unsigned observation time`,
        },
    ];

    return (
        <article className="card" id="fixture-payload">
            <div className="card-header">
                <div>
                    <h2>Fixture</h2>
                    <p className="card-copy">
                        Signed field order is fixtureID, localTeamID, visitorTeamID,
                        startingAt. Round-trip verified means this instance can verify
                        its own signature. Pin publicKey in your app.
                    </p>
                </div>
                <span className={fixture.verified ? "badge signed" : "badge"}>
                    {fixture.verified ? "Round-trip verified" : "Signature invalid"}
                </span>
            </div>
            <PayloadTable rows={rows} />
            <Secrets
                publicKey={fixture.publicKey}
                signature={fixture.signature}
                jsonHref="/fixture"
                jsonLabel="View fixture JSON"
            />
        </article>
    );
}

function StatusCard({ status }: { status: StatusView }) {
    const startingAt = Number(status.data.startingAt);
    const winnerTeamID = Number(status.data.winnerTeamID);
    const statusCode = Number(status.data.status);
    const outcomeCode = Number(status.data.outcome);
    const start = new Date(startingAt);
    const winnerLabel = String(winnerTeamID);
    const rows: PayloadRow[] = [
        { field: "fixtureID", value: String(status.data.fixtureID), signed: true },
        { field: "localTeamID", value: String(status.data.localTeamID), signed: true },
        { field: "visitorTeamID", value: String(status.data.visitorTeamID), signed: true },
        {
            field: "startingAt",
            value: String(status.data.startingAt),
            signed: true,
            hint: Number.isFinite(start.valueOf()) ? start.toISOString() : undefined,
        },
        {
            field: "status",
            value: String(statusCode),
            signed: true,
            hint: matchStatusLabel(statusCode),
        },
        {
            field: "winnerTeamID",
            value: winnerLabel,
            signed: true,
            hint:
                winnerTeamID === 0
                    ? "0 means no team id — not a team, and not a synonym for ongoing."
                    : "Signed Sportmonks team id, not a display name.",
        },
        {
            field: "outcome",
            value: String(outcomeCode),
            signed: true,
            hint: matchOutcomeLabel(outcomeCode),
        },
        {
            field: "timestamp",
            value: String(status.data.timestamp),
            signed: false,
            hint: "Unsigned. A valid signature is an attestation, not a live feed.",
        },
    ];

    return (
        <article className="card" id="status-payload">
            <div className="card-header">
                <div>
                    <h2>Status</h2>
                    <p className="card-copy">
                        Signed field order adds status, winnerTeamID, and outcome.
                    </p>
                </div>
                <span className={status.verified ? "badge signed" : "badge"}>
                    {status.verified ? "Round-trip verified" : "Signature invalid"}
                </span>
            </div>
            <p>
                Status <StatusLabel code={statusCode} /> · Outcome{" "}
                <StatusLabel code={outcomeCode} kind="outcome" />
            </p>
            <PayloadTable rows={rows} />
            <Secrets
                publicKey={status.publicKey}
                signature={status.signature}
                jsonHref={`/status/${status.data.fixtureID}`}
                jsonLabel="View status JSON"
            />
        </article>
    );
}

function Secrets({
    publicKey,
    signature,
    jsonHref,
    jsonLabel,
}: {
    publicKey: string;
    signature: string;
    jsonHref: string;
    jsonLabel: string;
}) {
    return (
        <>
            <dl className="kv">
                <div className="kv-row">
                    <dt>Public key</dt>
                    <dd>
                        <code className="mono">{publicKey}</code>
                        <CopyButton value={publicKey} label="public key" />
                    </dd>
                </div>
                <div className="kv-row">
                    <dt>Signature</dt>
                    <dd>
                        <code className="mono">{signature}</code>
                        <CopyButton value={signature} label="signature" />
                    </dd>
                </div>
            </dl>
            <div className="hero-actions">
                <a className="button-secondary" href={jsonHref}>
                    {jsonLabel}
                </a>
            </div>
        </>
    );
}

function unsignedName(name?: string) {
    return name ? `${name} · unsigned label` : "Unsigned team name not included";
}

async function loadConsole(): Promise<ConsoleState> {
    try {
        const env = getOracleEnv();
        const headerList = await headers();
        enforceRateLimit(new Request("http://localhost/", { headers: headerList }));
        const query = parseFixtureQuery(new URLSearchParams());
        const fixtures = await fetchFixtures(query, env.apiKey);
        const fixturePayload = signFixtureResponse(fixtures[0], env.privateKey);
        const fixture: FixtureView = {
            ...fixturePayload,
            verified: Signature.fromBase58(fixturePayload.signature)
                .verify(
                    PublicKey.fromBase58(fixturePayload.publicKey),
                    fixtureToFields(fixturePayload.data)
                )
                .toBoolean(),
        };

        try {
            const statusPayload = signStatusResponse(
                await fetchFixtureStatus(Number(fixture.data.fixtureID), env.apiKey),
                env.privateKey
            );
            return {
                kind: "ready",
                fixture,
                status: {
                    ...statusPayload,
                    verified: Signature.fromBase58(statusPayload.signature)
                        .verify(
                            PublicKey.fromBase58(statusPayload.publicKey),
                            statusToFields(statusPayload.data)
                        )
                        .toBoolean(),
                },
            };
        } catch {
            return { kind: "ready", fixture };
        }
    } catch (error) {
        if (error instanceof OracleError && error.code === "CONFIG_ERROR") {
            return { kind: "config", message: error.message };
        }
        if (error instanceof OracleError && error.code === "NOT_FOUND") {
            return {
                kind: "empty",
                message: "No matching fixtures found for the default T20I filter.",
            };
        }
        if (error instanceof OracleError) {
            return { kind: "error", message: error.message };
        }
        return { kind: "error", message: "Unexpected oracle error." };
    }
}
