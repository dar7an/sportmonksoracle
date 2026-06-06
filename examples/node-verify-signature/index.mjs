import { pathToFileURL } from "node:url";
import {
  fixturePayload,
  statusPayload,
} from "../shared/sample-payloads.mjs";
import {
  verifyFixturePayload,
  verifyStatusPayload,
} from "../shared/verify.mjs";

export async function fetchAndVerifyFixture(oracleBaseUrl, expectedPublicKey) {
  const response = await fetch(`${oracleBaseUrl}/fixture`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error ?? "Oracle request failed");
  }

  return {
    payload,
    valid: verifyFixturePayload(payload, expectedPublicKey),
  };
}

export function verifyLocalSamples() {
  return {
    fixtureValid: verifyFixturePayload(fixturePayload, fixturePayload.publicKey),
    statusValid: verifyStatusPayload(statusPayload, statusPayload.publicKey),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const oracleBaseUrl = process.env.ORACLE_BASE_URL;

  if (!oracleBaseUrl) {
    console.log(verifyLocalSamples());
  } else {
    if (!process.env.ORACLE_PUBLIC_KEY) {
      throw new Error("ORACLE_PUBLIC_KEY is required for live verification");
    }

    console.log(await fetchAndVerifyFixture(oracleBaseUrl, process.env.ORACLE_PUBLIC_KEY));
  }
}
