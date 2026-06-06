const sections = [
    {
        title: "Endpoints",
        body: "`/fixture` returns signed fixture data. `/status/[fixtureID]` returns signed match status data.",
    },
    {
        title: "Signing Contract",
        body: "Fixture signatures cover fixtureID, localTeamID, visitorTeamID, and startingAt. Status signatures add status and winnerTeamID. Consumers should pin the oracle public key.",
    },
    {
        title: "Cache Behavior",
        body: "Fixture responses cache for 60 seconds by default. Status responses cache for 15 seconds by default.",
    },
    {
        title: "Deploy",
        body: "Set API_KEY and PRIVATE_KEY, then deploy to Vercel or run the Docker image.",
    },
];

const links = [
    { href: "/fixture", label: "Try /fixture" },
    { href: "/openapi.yaml", label: "OpenAPI spec" },
    { href: "https://github.com/dar7an/sportmonksoracle#readme", label: "README" },
    { href: "https://github.com/dar7an/sportmonksoracle/tree/main/examples", label: "Examples" },
    { href: "https://github.com/dar7an/sportmonksoracle/blob/main/docs/deployment.md", label: "Deployment" },
    { href: "https://github.com/dar7an/sportmonksoracle/blob/main/SECURITY.md", label: "Security" },
];

export default function DocsPage() {
    return (
        <main style={styles.main}>
            <section style={styles.hero}>
                <p style={styles.eyebrow}>Sportmonks Cricket Oracle</p>
                <h1 style={styles.title}>Signed cricket data for verifiable apps</h1>
                <p style={styles.lead}>
                    A standalone API that fetches Sportmonks cricket data, normalizes it,
                    and signs the stable numeric fields with o1js.
                </p>
                <div style={styles.links}>
                    {links.map((link) => (
                        <a key={link.href} href={link.href} style={styles.link}>
                            {link.label}
                        </a>
                    ))}
                </div>
            </section>

            <section style={styles.grid}>
                {sections.map((section) => (
                    <article key={section.title} style={styles.card}>
                        <h2 style={styles.cardTitle}>{section.title}</h2>
                        <p style={styles.cardBody}>{section.body}</p>
                    </article>
                ))}
            </section>

            <section style={styles.panel}>
                <h2 style={styles.cardTitle}>Quick request</h2>
                <pre style={styles.code}>{`curl https://sportmonksoracle.vercel.app/fixture?leagueId=3&status=NS&limit=1`}</pre>
            </section>
        </main>
    );
}

const styles: Record<string, CSSProperties> = {
    main: {
        maxWidth: "960px",
        margin: "0 auto",
        padding: "48px 20px",
        fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: "#172026",
    },
    hero: {
        paddingBottom: "32px",
        borderBottom: "1px solid #d8dee4",
    },
    eyebrow: {
        margin: 0,
        fontSize: "14px",
        fontWeight: 700,
        color: "#2563eb",
    },
    title: {
        margin: "10px 0",
        fontSize: "42px",
        lineHeight: 1.1,
        letterSpacing: 0,
    },
    lead: {
        maxWidth: "720px",
        fontSize: "18px",
        lineHeight: 1.6,
    },
    links: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginTop: "24px",
    },
    link: {
        color: "#0f172a",
        border: "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "8px 12px",
        textDecoration: "none",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        marginTop: "28px",
    },
    card: {
        border: "1px solid #d8dee4",
        borderRadius: "8px",
        padding: "18px",
    },
    cardTitle: {
        margin: "0 0 8px",
        fontSize: "20px",
    },
    cardBody: {
        margin: 0,
        lineHeight: 1.55,
    },
    panel: {
        marginTop: "28px",
        border: "1px solid #d8dee4",
        borderRadius: "8px",
        padding: "18px",
    },
    code: {
        overflowX: "auto",
        background: "#f6f8fa",
        borderRadius: "8px",
        padding: "14px",
    },
};
import type { CSSProperties } from "react";
