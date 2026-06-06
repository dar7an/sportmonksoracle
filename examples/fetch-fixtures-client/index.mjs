import { pathToFileURL } from "node:url";
import {
  verifyFixtureListPayload,
  verifyFixturePayload,
} from "../shared/verify.mjs";

export async function fetchFixtures(oracleBaseUrl, options = {}) {
  const url = new URL("/fixture", oracleBaseUrl);

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`${payload.code}: ${payload.error}`);
  }

  if (!options.expectedPublicKey) {
    throw new Error("expectedPublicKey is required for verification");
  }

  const valid = Array.isArray(payload.data)
    ? verifyFixtureListPayload(payload, options.expectedPublicKey)
    : verifyFixturePayload(payload, options.expectedPublicKey);

  return { payload, valid };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const oracleBaseUrl = process.env.ORACLE_BASE_URL ?? "http://localhost:3000";
  if (!process.env.ORACLE_PUBLIC_KEY) {
    throw new Error("ORACLE_PUBLIC_KEY is required for live verification");
  }

  const result = await fetchFixtures(oracleBaseUrl, {
    leagueId: process.env.LEAGUE_ID ?? 3,
    status: process.env.FIXTURE_STATUS ?? "NS",
    teamId: process.env.TEAM_ID,
    limit: process.env.LIMIT ?? 1,
    expectedPublicKey: process.env.ORACLE_PUBLIC_KEY,
  });

  console.log(JSON.stringify(result, null, 2));
}
