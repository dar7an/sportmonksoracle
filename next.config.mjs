import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, { isServer }) {
        config.experiments = { ...config.experiments, topLevelAwait: true };

        if (isServer) {
            // Get the root directory of the o1js package
            const o1jsPackageDir = path.dirname(
                require.resolve("o1js/package.json")
            );
            // Construct the path to the wasm file
            const wasmPath = path.join(
                o1jsPackageDir,
                "dist/web/plonk_wasm_bg.wasm"
            );

            // Add a rule to copy the wasm file to the build output
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
