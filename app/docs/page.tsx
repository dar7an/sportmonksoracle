export default function DocsPage() {
    return (
        <main id="main" className="page">
            <section className="hero">
                <p className="eyebrow">Signing contract v1.1</p>
                <h1>How this oracle attests cricket data</h1>
                <p className="lead">
                    Sportmonks Cricket v2 is normalized to integers and Schnorr-signed
                    with o1js. This is not a predictor, sportsbook, or odds app.
                </p>
                <div className="hero-actions">
                    <a className="button" href="/">
                        Inspect a live fixture
                    </a>
                    <a className="button-secondary" href="/spec">
                        Open API explorer
                    </a>
                    <a className="button-secondary" href="/fixture">
                        View fixture JSON
                    </a>
                </div>
            </section>

            <div className="docs-grid">
                <article className="card">
                    <h2>Signed field order</h2>
                    <p>
                        Fixture signatures cover four fields: <code>fixtureID</code>,{" "}
                        <code>localTeamID</code>, <code>visitorTeamID</code>,{" "}
                        <code>startingAt</code>.
                    </p>
                    <p>
                        Status signatures cover seven fields: those four, then{" "}
                        <code>status</code>, <code>winnerTeamID</code>,{" "}
                        <code>outcome</code>. Pin the oracle public key before verifying.
                    </p>
                    <p>
                        Team names, team codes, and <code>timestamp</code> are unsigned.{" "}
                        <code>winnerTeamID = 0</code> means no team id, not “match
                        ongoing.”
                    </p>
                </article>

                <article className="card">
                    <h2>Status codes</h2>
                    <p>
                        Unknown Sportmonks strings are not signed. The oracle returns HTTP
                        502 instead of guessing cancelled.
                    </p>
                    <table className="status-table">
                        <thead>
                            <tr>
                                <th scope="col">Code</th>
                                <th scope="col">Meaning</th>
                                <th scope="col">Sportmonks statuses</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>Not started</td>
                                <td>NS, Delayed</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>In progress</td>
                                <td>
                                    1st–4th Innings, Innings Break, Int., Stump Day 1–4, Tea
                                    Break, Lunch, Dinner
                                </td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>Finished</td>
                                <td>Finished</td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>Cancelled</td>
                                <td>Cancl. (Cancl without a period is accepted as a docs-typo alias)</td>
                            </tr>
                            <tr>
                                <td>5</td>
                                <td>Postponed</td>
                                <td>Postp.</td>
                            </tr>
                            <tr>
                                <td>6</td>
                                <td>Abandoned</td>
                                <td>Aban.</td>
                            </tr>
                        </tbody>
                    </table>
                </article>

                <article className="card">
                    <h2>Outcome codes</h2>
                    <p>
                        Outcome is derived from <code>winner_team_id</code> and{" "}
                        <code>draw_noresult</code>. Code 0 is none/unknown — including a
                        Finished fixture whose result fields are still empty.
                    </p>
                    <table className="status-table">
                        <thead>
                            <tr>
                                <th scope="col">Code</th>
                                <th scope="col">Meaning</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>0</td>
                                <td>None / unknown</td>
                            </tr>
                            <tr>
                                <td>1</td>
                                <td>Winner — winnerTeamID is the winning team</td>
                            </tr>
                            <tr>
                                <td>2</td>
                                <td>Draw</td>
                            </tr>
                            <tr>
                                <td>3</td>
                                <td>No result</td>
                            </tr>
                        </tbody>
                    </table>
                </article>

                <article className="card">
                    <h2>Endpoints</h2>
                    <p>
                        <code>/fixture</code> returns signed fixtures.{" "}
                        <code>/status/:id</code> returns signed status. One match keeps
                        the object shape; two or more use <code>data</code> and{" "}
                        <code>signatures</code> arrays.
                    </p>
                    <div className="chip-row">
                        <a className="chip chip-primary" href="/">
                            Inspect console
                        </a>
                        <a className="chip" href="/fixture">
                            /fixture
                        </a>
                        <a className="chip" href="/openapi.yaml">
                            openapi.yaml
                        </a>
                        <a className="chip" href="/spec">
                            /spec
                        </a>
                    </div>
                </article>

                <article className="card">
                    <h2>Cache and freshness</h2>
                    <p>
                        Fixture responses cache for about 60 seconds. Status responses
                        cache for about 15 seconds. A valid signature means this oracle
                        attested the signed fields. It does not mean the payload is the
                        latest live score. <code>timestamp</code> is unsigned wall-clock
                        time from when the payload was built.
                    </p>
                </article>

                <article className="card">
                    <h2>Deploy</h2>
                    <p>
                        Set <code>API_KEY</code> and <code>PRIVATE_KEY</code>, then deploy
                        to Vercel or run the Docker image. Default league is T20I{" "}
                        <code>3</code>.
                    </p>
                </article>
            </div>

            <section className="panel">
                <h2>Quick request</h2>
                <pre>{`curl "https://sportmonksoracle.vercel.app/fixture?leagueId=3&status=NS&limit=1"`}</pre>
            </section>
        </main>
    );
}
