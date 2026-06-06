# Examples

These examples show how to call the oracle and verify signatures.

## Verify Local Samples

```bash
node examples/node-verify-signature/index.mjs
node examples/mina-zkapp-verify/index.mjs
```

## Verify a Live Oracle

```bash
ORACLE_BASE_URL=https://sportmonksoracle.vercel.app \
ORACLE_PUBLIC_KEY=your_pinned_oracle_public_key \
node examples/node-verify-signature/index.mjs
```

## Fetch Fixtures With Query Params

```bash
ORACLE_BASE_URL=https://sportmonksoracle.vercel.app \
ORACLE_PUBLIC_KEY=your_pinned_oracle_public_key \
LEAGUE_ID=3 \
FIXTURE_STATUS=NS \
LIMIT=1 \
node examples/fetch-fixtures-client/index.mjs
```

Never include a Mina private key or Sportmonks API key in client examples.
