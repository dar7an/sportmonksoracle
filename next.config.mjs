import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["o1js"],
    output: "standalone",
    outputFileTracingIncludes: {
        "/openapi.yaml": ["./openapi.yaml"],
        "/spec/explorer": ["./openapi.yaml"],
    },
    turbopack: {
        root: repoRoot,
    },
};

export default nextConfig;
