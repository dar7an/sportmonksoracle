import { pathToFileURL } from "node:url";
import { Field, PublicKey, Signature } from "o1js";
import {
  fixturePayload,
  statusPayload,
} from "../shared/sample-payloads.mjs";

export function verifyFixtureForMina(payload, expectedPublicKey) {
  if (payload.publicKey !== expectedPublicKey) {
    throw new Error("Oracle public key does not match the pinned key");
  }

  const fields = [
    Field(payload.data.fixtureID),
    Field(payload.data.localTeamID),
    Field(payload.data.visitorTeamID),
    Field(payload.data.startingAt),
  ];

  return Signature.fromBase58(payload.signature)
    .verify(PublicKey.fromBase58(payload.publicKey), fields)
    .toBoolean();
}

export function verifyStatusForMina(payload, expectedPublicKey) {
  if (payload.publicKey !== expectedPublicKey) {
    throw new Error("Oracle public key does not match the pinned key");
  }

  const fields = [
    Field(payload.data.fixtureID),
    Field(payload.data.localTeamID),
    Field(payload.data.visitorTeamID),
    Field(payload.data.startingAt),
    Field(payload.data.status),
    Field(payload.data.winnerTeamID),
  ];

  return Signature.fromBase58(payload.signature)
    .verify(PublicKey.fromBase58(payload.publicKey), fields)
    .toBoolean();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log({
    fixtureValid: verifyFixtureForMina(fixturePayload, fixturePayload.publicKey),
    statusValid: verifyStatusForMina(statusPayload, statusPayload.publicKey),
  });
}
