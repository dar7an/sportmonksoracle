import type { ReactNode } from "react";

export const metadata = {
    title: "Sportmonks Cricket Oracle",
    description: "Signed cricket data for verifiable applications.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body style={{ margin: 0, background: "#ffffff" }}>{children}</body>
        </html>
    );
}
