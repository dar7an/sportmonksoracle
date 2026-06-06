import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const exampleScripts = [
    "examples/node-verify-signature/index.mjs",
    "examples/mina-zkapp-verify/index.mjs",
    "examples/fetch-fixtures-client/index.mjs",
    "examples/shared/verify.mjs",
    "examples/shared/sample-payloads.mjs",
];

test("openapi.yaml documents the public endpoints", () => {
    const openapi = readFileSync("openapi.yaml", "utf8");

    assert.match(openapi, /\/fixture:/);
    assert.match(openapi, /\/status\/\{fixtureID\}:/);
    assert.match(openapi, /SignedFixtureResponse/);
    assert.match(openapi, /SignedStatusResponse/);
});

test("example scripts parse as valid JavaScript modules", () => {
    for (const script of exampleScripts) {
        execFileSync("node", ["--check", script], { stdio: "pipe" });
    }
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
