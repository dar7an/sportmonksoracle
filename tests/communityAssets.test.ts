import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const exampleScripts = [
    "examples/node-verify-signature/index.mjs",
    "examples/mina-zkapp-verify/index.mjs",
    "examples/fetch-fixtures-client/index.mjs",
    "examples/shared/verify.mjs",
    "examples/shared/sample-payloads.mjs",
];

test("the homepage is a verification console, not a redirect to JSON", () => {
    const nextConfig = readFileSync("next.config.mjs", "utf8");
    const home = readFileSync("app/page.tsx", "utf8");

    assert.doesNotMatch(nextConfig, /destination:\s*["']\/fixture["']/);
    assert.match(home, /Verification console/);
    assert.match(home, /0 means no team id/);
});

test("openapi.yaml documents the v1.1 public contract", () => {
    const openapi = readFileSync("openapi.yaml", "utf8");

    assert.match(openapi, /version: 1\.1\.0/);
    assert.match(openapi, /\/fixture:/);
    assert.match(openapi, /\/status\/\{fixtureID\}:/);
    assert.match(openapi, /SignedFixtureResponse/);
    assert.match(openapi, /SignedStatusResponse/);
    assert.match(openapi, /outcome:/);
    assert.match(openapi, /enum: \[1, 2, 3, 4, 5, 6\]/);
    assert.match(openapi, /enum: \[0, 1, 2, 3\]/);
});

test("example scripts parse as valid JavaScript modules", () => {
    for (const script of exampleScripts) {
        execFileSync("node", ["--check", script], { stdio: "pipe" });
    }
});

test("mina example includes a real SmartContract verifier", () => {
    const source = readFileSync("examples/mina-zkapp-verify/OracleVerifier.ts", "utf8");
    assert.match(source, /class CricketOracleVerifier extends SmartContract/);
    assert.match(source, /@method/);
    assert.match(source, /winnerTeamID/);
    assert.match(source, /outcome/);
});

test("local example verification scripts validate sample payloads", () => {
    const nodeOutput = execFileSync(
        "node",
        ["examples/node-verify-signature/index.mjs"],
        { encoding: "utf8" }
    );
    const minaOutput = execFileSync(
        "node",
        ["examples/mina-zkapp-verify/index.mjs"],
        { encoding: "utf8" }
    );

    assert.match(nodeOutput, /fixtureValid: true/);
    assert.match(nodeOutput, /statusValid: true/);
    assert.match(minaOutput, /fixtureValid: true/);
    assert.match(minaOutput, /statusValid: true/);
});

test("fixture list verifier rejects unsigned empty lists", () => {
    const output = execFileSync(
        "node",
        [
            "--input-type=module",
            "-e",
            "import { verifyFixtureListPayload } from './examples/shared/verify.mjs'; try { verifyFixtureListPayload({ data: [], signatures: [], publicKey: 'B62fake' }, 'B62fake'); } catch (error) { console.log(error.message); }",
        ],
        { encoding: "utf8" }
    );

    assert.match(output, /at least one fixture/);
});
