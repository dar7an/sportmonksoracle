"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { href: "/", label: "Inspect" },
    { href: "/docs", label: "Docs" },
    { href: "/spec", label: "Spec" },
    { href: "https://github.com/dar7an/sportmonksoracle", label: "GitHub", external: true },
];

export function SiteHeader() {
    const pathname = usePathname();

    return (
        <header className="site-header">
            <Link className="brand" href="/">
                <span className="brand-mark" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M4 7.2l1.8 1.8L10 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
                Sportmonks Cricket Oracle
            </Link>
            <nav className="site-nav" aria-label="Primary">
                {links.map((link) =>
                    link.external ? (
                        <a key={link.href} href={link.href} rel="noreferrer" target="_blank">
                            GitHub
                            <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                    ) : (
                        <Link
                            key={link.href}
                            href={link.href}
                            aria-current={pathname === link.href ? "page" : undefined}
                        >
                            {link.label}
                        </Link>
                    )
                )}
            </nav>
        </header>
    );
}
