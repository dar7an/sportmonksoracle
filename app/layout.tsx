import type { ReactNode } from "react";
import { SiteHeader } from "./components/SiteHeader";
import "./globals.css";

export const metadata = {
    title: "Sportmonks Cricket Oracle",
    description: "Mina/o1js signed cricket fixture and status data for verifiable apps.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                <a className="skip-link" href="#main">
                    Skip to content
                </a>
                <SiteHeader />
                {children}
            </body>
        </html>
    );
}
