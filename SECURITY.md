# Security Policy

## Supported Version

Security fixes target the `main` branch.

## Reporting a Vulnerability

Please report suspected security issues privately to the repository owner.
Do not open a public issue for leaked keys, signing bugs, or oracle data
integrity issues.

## Secrets

This repo needs two secrets at runtime:

- `API_KEY`: Sportmonks Cricket API key
- `PRIVATE_KEY`: Mina private key used to sign oracle payloads

Never commit real secret values. Use `.env.example` as the local template.

## Oracle Integrity

The private key signs only the numeric fields that consumer apps verify.

Treat these as security-sensitive, breaking changes:

- Signed field order (fixture: 4 fields; status: 7 fields in v1.1)
- Status codes 1–6 (unknown Sportmonks strings must not be signed)
- Outcome codes 0–3
- `startingAt` UTC millisecond conversion
- `winnerTeamID = 0` meaning “no team id”

A valid signature means this oracle attested those fields. It does not prove
the payload is live. `timestamp` is unsigned.
