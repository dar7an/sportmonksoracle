import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, { isServer }) {
        config.experiments = { ...config.experiments, topLevelAwait: true };

        if (isServer) {
            config.output.publicPath = "/_next/";
            const wasmPath = require
                .resolve("o1js/dist/web/plonk_wasm_bg.wasm")
                .replace(/\\/g, "/");
            config.plugins.push(
                new (require("copy-webpack-plugin"))({
                    patterns: [{ from: wasmPath, to: "static/chunks/[name][ext]" }],
                })
            );
        }

        return config;
    },
};

export default nextConfig;

export async function redirects() {
    return [
        {
            source: "/",
            destination: "/fixture",
            permanent: true,
        },
    ];
}
