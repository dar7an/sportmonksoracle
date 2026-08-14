export const metadata = {
    title: "OpenAPI explorer · Sportmonks Cricket Oracle",
    description: "Interactive OpenAPI explorer for the signed cricket oracle.",
};

export default function SpecPage() {
    return (
        <main id="main">
            <iframe
                className="spec-frame"
                title="OpenAPI explorer"
                src="/spec/explorer"
            />
        </main>
    );
}
