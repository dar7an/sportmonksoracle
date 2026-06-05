import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["o1js"],
    turbopack: {
        root: repoRoot,
    },
    async redirects() {
        return [
            {
                source: "/",
                destination: "/fixture",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
