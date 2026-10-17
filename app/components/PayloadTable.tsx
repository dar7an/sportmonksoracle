import { SignedBadge } from "./SignedBadge";

export type PayloadRow = {
    field: string;
    value: string;
    signed: boolean;
    hint?: string;
};

export function PayloadTable({ rows }: { rows: PayloadRow[] }) {
    return (
        <div className="payload-table-wrap">
            <table className="payload-table">
                <thead>
                    <tr>
                        <th scope="col">Field</th>
                        <th scope="col">Value</th>
                        <th scope="col">In signature</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.field}>
                            <td>{row.field}</td>
                            <td>
                                <span className="payload-value">{row.value}</span>
                                {row.hint ? <span className="payload-hint">{row.hint}</span> : null}
                            </td>
                            <td>
                                <SignedBadge signed={row.signed} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
