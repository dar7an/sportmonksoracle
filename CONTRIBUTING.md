# Contributing

Thanks for helping improve Sportmonks Oracle.

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set real values for `API_KEY` and `PRIVATE_KEY` before calling live API routes.

## Checks

Run these before opening a pull request:

```bash
npm test
npm run typecheck
npm run build
```

## Pull Request Guide

- Keep changes small and focused.
- Add or update tests when signing fields, status codes, or API payloads change.
- Do not commit real API keys, Mina private keys, `.env`, or Vercel config.
- Note any Sportmonks API behavior that is hard to test without live access.

## Signing Contract

The field order is part of the public contract with consumer apps. Treat changes to
`fixtureToFields` and `statusToFields` as breaking changes unless the consuming
app changes at the same time.
