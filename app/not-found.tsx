export default function NotFound() {
    return (
        <main id="main" className="page">
            <section className="hero">
                <p className="eyebrow">Not found</p>
                <h1>That page is not part of this oracle</h1>
                <p className="lead">
                    Signed JSON lives at <code>/fixture</code> and{" "}
                    <code>/status/:id</code>. The verification console is on the home
                    page.
                </p>
                <div className="hero-actions">
                    <a className="button" href="/">
                        Inspect a live fixture
                    </a>
                    <a className="button-secondary" href="/docs">
                        Read the contract
                    </a>
                </div>
            </section>
        </main>
    );
}
