import { matchOutcomeLabel, matchStatusLabel } from "../../src/status";

export function StatusLabel({
    code,
    kind = "status",
}: {
    code: number;
    kind?: "status" | "outcome";
}) {
    const label = kind === "outcome" ? matchOutcomeLabel(code) : matchStatusLabel(code);
    return (
        <span className="status-label">
            {label}
            <span className="status-code">{code}</span>
        </span>
    );
}
