export function SignedBadge({ signed }: { signed: boolean }) {
    return (
        <span className={signed ? "badge signed" : "badge"}>
            {signed ? "Signed" : "Unsigned"}
        </span>
    );
}
