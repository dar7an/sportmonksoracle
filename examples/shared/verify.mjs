import { Field, PublicKey, Signature } from "o1js";

export function fixtureFields(data) {
  return [
    Field(data.fixtureID),
    Field(data.localTeamID),
    Field(data.visitorTeamID),
    Field(data.startingAt),
  ];
}

export function statusFields(data) {
  return [
    ...fixtureFields(data),
    Field(data.status),
    Field(data.winnerTeamID),
  ];
}

export function assertPinnedPublicKey(payload, expectedPublicKey) {
  if (!expectedPublicKey) {
    throw new Error("expectedPublicKey is required");
  }

  if (payload.publicKey !== expectedPublicKey) {
    throw new Error("Oracle public key does not match the pinned key");
  }
}

export function verifyFixturePayload(payload, expectedPublicKey) {
  assertPinnedPublicKey(payload, expectedPublicKey);

  return Signature.fromBase58(payload.signature)
    .verify(PublicKey.fromBase58(payload.publicKey), fixtureFields(payload.data))
    .toBoolean();
}

export function verifyStatusPayload(payload, expectedPublicKey) {
  assertPinnedPublicKey(payload, expectedPublicKey);

  return Signature.fromBase58(payload.signature)
    .verify(PublicKey.fromBase58(payload.publicKey), statusFields(payload.data))
    .toBoolean();
}

export function verifyFixtureListPayload(payload, expectedPublicKey) {
  assertPinnedPublicKey(payload, expectedPublicKey);

  if (!Array.isArray(payload.data) || payload.data.length === 0) {
    throw new Error("Fixture list payload must include at least one fixture");
  }

  if (
    !Array.isArray(payload.signatures) ||
    payload.signatures.length !== payload.data.length
  ) {
    throw new Error("Fixture list signatures must match fixture count");
  }

  return payload.data.every((fixture, index) =>
    Signature.fromBase58(payload.signatures[index])
      .verify(PublicKey.fromBase58(payload.publicKey), fixtureFields(fixture))
      .toBoolean()
  );
}
