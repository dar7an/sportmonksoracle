# Sportmonks Cricket Oracle

[![CI](https://github.com/dar7an/sportmonksoracle/actions/workflows/ci.yml/badge.svg)](https://github.com/dar7an/sportmonksoracle/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Security](https://img.shields.io/badge/npm%20audit-0%20vulnerabilities-brightgreen.svg)](./SECURITY.md)

Sportmonks Cricket Oracle is a Mina/o1js signed cricket-data API. It fetches
Sportmonks Cricket v2, normalizes stable integers, and Schnorr-signs them.
It is not a predictor, sportsbook, or odds app.

## Live Demo

**Verification console**: [https://sportmonksoracle.vercel.app](https://sportmonksoracle.vercel.app)

**Docs**: [https://sportmonksoracle.vercel.app/docs](https://sportmonksoracle.vercel.app/docs)

**OpenAPI explorer**: [https://sportmonksoracle.vercel.app/spec](https://sportmonksoracle.vercel.app/spec)

## How It Works

The oracle fetches cricket data from Sportmonks and signs it using `o1js`.
Client apps verify the signature against a pinned public key before trusting
the numeric fields.

### Cryptographic Signing Scheme

Only stable numeric fields are signed. Display fields such as team names are
unsigned labels.

**Fixture data** (4 fields):

```javascript
[fixtureID, localTeamID, visitorTeamID, startingAt]
```

**Match status** (7 fields, v1.1):

```javascript
[fixtureID, localTeamID, visitorTeamID, startingAt, status, winnerTeamID, outcome]
```

Each signature is created with `o1js` `Signature.create()`.

## Plug-and-Play Usage

1. Deploy this API with your own Sportmonks API key and Mina private key.
2. Inspect `/` or call `/fixture` and `/status/[fixtureID]`.
3. Verify `signature` with a pinned oracle public key and the documented field order.
4. Use the returned data only after verification succeeds.

Changes to signed fields, field order, status codes, or outcome codes are
breaking. This release is **v1.1**.

More runnable examples are in [examples](./examples).

## API Reference

- Verification console: `/`
- Hosted docs: `/docs`
- OpenAPI explorer: `/spec`
- OpenAPI spec: [openapi.yaml](./openapi.yaml)
- Deployment guide: [docs/deployment.md](./docs/deployment.md)

## API Endpoints

### `/fixture`

Returns the next scheduled fixture by default (T20I league `3`, status `NS`).

| Query param | Default | Description |
|-------------|---------|-------------|
| `leagueId` | `3` | Sportmonks league ID (T20I) |
| `status` | `NS` | Sportmonks fixture status filter, not oracle codes 1–6 |
| `teamId` | none | Native `filter[localteam_id]` / `filter[visitorteam_id]`, merged |
| `limit` | `1` | Number of fixtures to return, max `10` |

```bash
curl "https://sportmonksoracle.vercel.app/fixture?leagueId=3&status=NS"
curl "https://sportmonksoracle.vercel.app/fixture?leagueId=3&teamId=39&limit=2"
```

If one fixture matches, the response is an object with `signature`. If more
than one fixture matches, the response uses `data` and `signatures` arrays.
Each signature maps to the fixture at the same array index.

**Signed fields:**

| Field | Type | Description |
|-------|------|-------------|
| `fixtureID` | number | Sportmonks fixture ID |
| `localTeamID` | number | Sportmonks local team ID |
| `visitorTeamID` | number | Sportmonks visitor team ID |
| `startingAt` | number | Start time as Unix milliseconds, parsed as UTC |

**Unsigned display fields:**

| Field | Type | Description |
|-------|------|-------------|
| `localTeamName` | string | Local team display name |
| `localTeamCode` | string | Local team code |
| `visitorTeamName` | string | Visitor team display name |
| `visitorTeamCode` | string | Visitor team code |
| `timestamp` | number | Time the oracle built this response |

### `/status/[fixtureID]`

Returns signed status for one fixture.

**Signed fields:**

| Field | Type | Description |
|-------|------|-------------|
| `fixtureID` | number | Sportmonks fixture ID |
| `localTeamID` | number | Sportmonks local team ID |
| `visitorTeamID` | number | Sportmonks visitor team ID |
| `startingAt` | number | Start time as Unix milliseconds, parsed as UTC |
| `status` | number | Oracle status code 1–6 |
| `winnerTeamID` | number | Winner team ID, or `0` when no team id is present |
| `outcome` | number | 0 none/unknown, 1 winner, 2 draw, 3 no-result |

Team names may appear on this endpoint as **unsigned** labels when Sportmonks
includes them. They are not in the signature.

`winnerTeamID = 0` is Field-friendly “no team id”. It is not a synonym for
“match ongoing.”

### Error Response

```json
{
  "error": "fixtureID must be a positive integer",
  "code": "BAD_REQUEST"
}
```

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `BAD_REQUEST` | Invalid query or path |
| 401 / 403 | `SPORTMONKS_AUTH_ERROR` | Sportmonks rejected the API key |
| 404 | `NOT_FOUND` | No matching fixture |
| 429 | `RATE_LIMITED` | Inbound limiter on this instance |
| 429 | `SPORTMONKS_RATE_LIMIT` | Sportmonks 429 after bounded retry |
| 502 | `UNKNOWN_STATUS` | Sportmonks status string is not in the documented table |
| 502 | `MALFORMED_UPSTREAM` | Invalid `starting_at`, team include, or `draw_noresult` |
| 502 | `SPORTMONKS_ERROR` | Other Sportmonks failure |
| 504 | `UPSTREAM_TIMEOUT` | Sportmonks timed out |
| 500 | `CONFIG_ERROR` | Missing or invalid env |
| 500 | `SIGNING_ERROR` | o1js signing failed |
| 500 | `INTERNAL_ERROR` | Unexpected failure |

## Data Interpretation

### Status codes

Documented Sportmonks cricket statuses
([source](https://docs.sportmonks.com/v2/cricket-api/statuses-and-definitions)):

| Oracle | Meaning | Sportmonks strings |
|--------|---------|--------------------|
| 1 | Not started | `NS`, `Delayed` |
| 2 | In progress | `1st Innings`, `2nd Innings`, `3rd Innings`, `4th Innings`, `Innings Break`, `Int.`, `Stump Day 1`–`4`, `Tea Break`, `Lunch`, `Dinner` |
| 3 | Finished | `Finished` |
| 4 | Cancelled | `Cancl.` only (`Cancl` without a period is accepted as a docs-typo alias) |
| 5 | Postponed | `Postp.` |
| 6 | Abandoned | `Aban.` |

Unknown strings return HTTP 502 `UNKNOWN_STATUS`. They are **not** signed as
cancelled. `Aban.` is 6, not 4.

### Outcome codes

Derived from `winner_team_id` and `draw_noresult`:

| Oracle | Meaning |
|--------|---------|
| 0 | None / unknown |
| 1 | Winner (`winnerTeamID` is the winning team) |
| 2 | Draw |
| 3 | No result |

`outcome = 0` is not “ongoing only.” Sportmonks sometimes returns `Finished`
with a null winner and null `draw_noresult`. The oracle signs that as
`winnerTeamID = 0`, `outcome = 0` rather than inventing a result. A winner
together with a draw/no-result flag is refused as malformed upstream.

### Data transformations

- **startingAt**: ISO 8601 parsed as UTC milliseconds. Non-finite values are 502.
- **winnerTeamID**: `0` when Sportmonks has no team id.
- **timestamp**: unsigned oracle build time.

### League IDs

Default `leagueId` is **3 (T20I)**. Other Sportmonks league IDs work if your
API plan includes them.

<details>
<summary>Historical IPL franchise IDs (unsigned, not a signing contract)</summary>

These IDs were used in earlier project notes. They are **not** signed, not
validated by this oracle, and may drift. Prefer Sportmonks as the source of
team IDs.

| Team | ID |
|------|----|
| CSK | 2 |
| DC | 3 |
| PBKS | 4 |
| KKR | 5 |
| MI | 6 |
| RR | 7 |
| RCB | 8 |
| SRH | 9 |
| GT | 1976 |
| LSG | 1979 |
| TBC | 2732 |

</details>

## Public Signing Contract

The current API is **v1.1**. Fixture field order is unchanged from v1. Status
field order gained `outcome` as the seventh field and status codes 5–6.

Do not include team names, team codes, or `timestamp` in verification.

A valid signature means this oracle attested these fields. It does not mean
the payload is the latest live score. Status responses may be cached for ~15
seconds; the signature does not cover cache age.

## Cache Behavior

| Endpoint | Default cache |
|----------|---------------|
| `/fixture` | 60 seconds |
| `/status/[fixtureID]` | 15 seconds |

Override with `FIXTURE_CACHE_SECONDS` and `STATUS_CACHE_SECONDS` (integers).

## Verification Example

```javascript
import { Signature, Field, PublicKey } from 'o1js';

const response = await fetch('https://sportmonksoracle.vercel.app/fixture');
const data = await response.json();
const expectedPublicKey = 'B62...'; // Pin this from your trusted oracle deploy.

if (data.publicKey !== expectedPublicKey) {
  throw new Error('Oracle public key mismatch');
}

const signature = Signature.fromBase58(data.signature);
const publicKey = PublicKey.fromBase58(expectedPublicKey);

const fieldsToVerify = [
  Field(data.data.fixtureID),
  Field(data.data.localTeamID),
  Field(data.data.visitorTeamID),
  Field(data.data.startingAt)
];

const isValid = signature.verify(publicKey, fieldsToVerify).toBoolean();
console.log('Signature valid:', isValid);
```

On-chain verification uses the same field vectors. See
`examples/mina-zkapp-verify/OracleVerifier.ts`.

## Development

### Prerequisites

- Node.js 22+ (see `.nvmrc`)
- Sportmonks Cricket API key
- Mina private key for oracle signing

```bash
git clone https://github.com/dar7an/sportmonksoracle.git
cd sportmonksoracle
npm ci
cp .env.example .env
```

```bash
API_KEY=your_sportmonks_api_key
PRIVATE_KEY=your_mina_private_key_base58
DEFAULT_LEAGUE_ID=3
DEFAULT_FIXTURE_STATUS=NS
FIXTURE_CACHE_SECONDS=60
STATUS_CACHE_SECONDS=15
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the verification
console. JSON APIs stay at `/fixture` and `/status/:id`.

### Generate a Mina Private Key

```bash
node --input-type=module -e "import { PrivateKey } from 'o1js'; const key = PrivateKey.random(); console.log('PRIVATE_KEY=' + key.toBase58()); console.log('PUBLIC_KEY=' + key.toPublicKey().toBase58());"
```

Keep the private key secret. Share only the public key if a client wants to pin
the oracle signer.

### Quality checks

```bash
npm test
npm run typecheck
npm run build
npm audit
```

If `API_KEY` or `PRIVATE_KEY` is missing, API routes return JSON `CONFIG_ERROR`
instead of crashing the process. `next build` works without secrets.

Invalid `DEFAULT_LEAGUE_ID` or cache TTL env vars also return `CONFIG_ERROR` on
the request path.

### Deployment

| Name | Required | Description |
|------|----------|-------------|
| `API_KEY` | yes | Sportmonks Cricket API key |
| `PRIVATE_KEY` | yes | Mina private key used for signing |
| `DEFAULT_LEAGUE_ID` | no | Default league for `/fixture`, defaults to `3` |
| `DEFAULT_FIXTURE_STATUS` | no | Default Sportmonks status for `/fixture`, defaults to `NS` |
| `FIXTURE_CACHE_SECONDS` | no | Cache TTL for `/fixture`, defaults to `60` |
| `STATUS_CACHE_SECONDS` | no | Cache TTL for `/status/[fixtureID]`, defaults to `15` |
| `RATE_LIMIT_MAX` | no | Per-instance inbound limit, defaults to `60` |
| `RATE_LIMIT_WINDOW_MS` | no | Inbound window, defaults to `60000` |

See [docs/deployment.md](./docs/deployment.md).

## License

MIT. See [LICENSE](./LICENSE).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
