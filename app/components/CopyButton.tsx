"use client";

import { useId, useState } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
    const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
    const liveId = useId();

    async function onCopy() {
        try {
            await navigator.clipboard.writeText(value);
            setStatus("copied");
            window.setTimeout(() => setStatus("idle"), 1600);
        } catch {
            setStatus("failed");
            window.setTimeout(() => setStatus("idle"), 1600);
        }
    }

    const announcement =
        status === "copied" ? `${label} copied` : status === "failed" ? `Unable to copy ${label}` : "";

    return (
        <>
            <button
                type="button"
                className={status === "copied" ? "copy-button copied" : "copy-button"}
                onClick={onCopy}
                aria-label={status === "copied" ? `${label} copied` : `Copy ${label}`}
                aria-describedby={liveId}
            >
                <span className="icon icon-copy" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="5.25" y="5.25" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M10.75 5.25V3.75A1.5 1.5 0 0 0 9.25 2.25H3.75A1.5 1.5 0 0 0 2.25 3.75v5.5A1.5 1.5 0 0 0 3.75 10.75H5.25" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                </span>
                <span className="icon icon-check" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>
            <span id={liveId} className="sr-only" role="status" aria-live="polite">
                {announcement}
            </span>
        </>
    );
}
