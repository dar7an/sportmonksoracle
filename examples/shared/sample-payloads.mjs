import { PrivateKey, Signature } from "o1js";
import { fixtureFields, statusFields } from "./verify.mjs";

const privateKey = PrivateKey.random();

export const fixtureData = {
  fixtureID: 66230,
  localTeamID: 39,
  visitorTeamID: 37,
  startingAt: 1752154200000,
  localTeamName: "Sri Lanka",
  localTeamCode: "SL",
  visitorTeamName: "Bangladesh",
  visitorTeamCode: "BGD",
  timestamp: 1750437493555,
};

export const statusData = {
  ...fixtureData,
  status: 3,
  winnerTeamID: 39,
  outcome: 1,
};

export const publicKey = privateKey.toPublicKey().toBase58();

export const fixturePayload = {
  data: fixtureData,
  signature: Signature.create(privateKey, fixtureFields(fixtureData)).toBase58(),
  publicKey,
};

export const statusPayload = {
  data: statusData,
  signature: Signature.create(privateKey, statusFields(statusData)).toBase58(),
  publicKey,
};

export const fixtureListPayload = {
  data: [fixtureData],
  signatures: [fixturePayload.signature],
  publicKey,
};
