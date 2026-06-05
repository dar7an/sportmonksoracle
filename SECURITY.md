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
Any change to signed field order, status codes, or timestamp conversion should
be reviewed as a security-sensitive change.
