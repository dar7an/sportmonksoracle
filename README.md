# Sportmonks Cricket Oracle

[![CI](https://github.com/dar7an/sportmonksoracle/actions/workflows/ci.yml/badge.svg)](https://github.com/dar7an/sportmonksoracle/actions/workflows/ci.yml)

Sportmonks Cricket Oracle is a standalone, plug-and-play API for signed cricket
data. It fetches fixture data from the Sportmonks Cricket API, normalizes it,
and signs the numeric payload with `o1js`.

Use it with any app that needs verifiable cricket data. It works well for Mina
zkApps, backend services, bots, dashboards, games, and data tools.

## Live Demo

**Oracle Endpoint**: [https://sportmonksoracle.vercel.app](https://sportmonksoracle.vercel.app)

## How It Works

The oracle fetches cricket data from Sportmonks and signs it using `o1js`
cryptographic primitives. Client apps can verify the signature before trusting
or storing the response.

### Cryptographic Signing Scheme

The oracle uses a field-based signing approach. Only stable numeric fields are
signed, so consumers can ignore display fields such as team names and codes.

**For fixture data** (4 fields):
```javascript
[fixtureID, localTeamID, visitorTeamID, startingAt]
```

**For match status** (6 fields):
```javascript
[fixtureID, localTeamID, visitorTeamID, startingAt, status, winnerTeamID]
```

Each signature is created with `o1js` `Signature.create()`.

## Plug-and-Play Usage

1. Deploy this API with your own Sportmonks API key and Mina private key.
2. Call `/fixture` or `/status/[fixtureID]` from your app.
3. Verify `signature` with `publicKey` and the documented field order.
4. Use the returned data only after verification succeeds.

The API response shape is stable by design. Changes to signed fields, field
order, or status codes should be treated as breaking changes.

### Quick Client Example

```javascript
const oracleBaseUrl = 'https://your-oracle.example.com';

const fixtureResponse = await fetch(`${oracleBaseUrl}/fixture`);
const fixturePayload = await fixtureResponse.json();

if (!fixtureResponse.ok) {
  throw new Error(fixturePayload.error ?? 'Oracle request failed');
}

console.log(fixturePayload.data.fixtureID);
console.log(fixturePayload.signature);
```

## API Endpoints

### `/fixture`
Gets the next scheduled fixture. This is the default homepage redirect.

By default, it returns the next not-started T20I fixture. You can change that
with query params.

| Query param | Default | Description |
|-------------|---------|-------------|
| `leagueId` | `3` | Sportmonks league ID |
| `status` | `NS` | Sportmonks fixture status filter |
| `teamId` | none | Optional team filter applied after fetching fixtures |
| `limit` | `1` | Number of fixtures to return, max `10` |

**Response format:**
```json
{
  "data": {
    "fixtureID": 66230,
    "localTeamID": 39,
    "visitorTeamID": 37,
    "startingAt": 1752154200000,
    "localTeamName": "Sri Lanka",
    "localTeamCode": "SL",
    "visitorTeamName": "Bangladesh", 
    "visitorTeamCode": "BGD",
    "timestamp": 1750437493555
  },
  "signature": "7mXXHVevhu1rN22QNvmEmNULzfPjdk815wPd6564b1qwWnjKMtC3qNTxyEjXUDCmubxadin4eZmRYztoVXhnvz9FyXESfsyS",
  "publicKey": "B62qp7eyQ9RKwdYBLWNzxmfKntP6dPDrTSQ1ukyYsV4FoTkJH6sfuPU"
}
```

If `limit` is greater than `1`, the response uses `data` and `signatures`
arrays. Each signature maps to the fixture at the same array index.

```json
{
  "data": [{ "fixtureID": 66230 }],
  "signatures": ["7mXX..."],
  "publicKey": "B62q..."
}
```

**Signed fields:**

| Field | Type | Description |
|-------|------|-------------|
| `fixtureID` | number | Sportmonks fixture ID |
| `localTeamID` | number | Sportmonks local team ID |
| `visitorTeamID` | number | Sportmonks visitor team ID |
| `startingAt` | number | Fixture start time as Unix milliseconds |

**Unsigned display fields:**

| Field | Type | Description |
|-------|------|-------------|
| `localTeamName` | string | Local team display name |
| `localTeamCode` | string | Local team code |
| `visitorTeamName` | string | Visitor team display name |
| `visitorTeamCode` | string | Visitor team code |
| `timestamp` | number | Time the oracle built this response |

### `/status/[fixtureID]`
Gets the current status of a specific fixture.

**Example**: [/status/66230](https://sportmonksoracle.vercel.app/status/66230)

**Response includes all fixture data plus:**
- `status`: Match status (1=Not Started, 2=In Progress, 3=Finished, 4=Cancelled)
- `winnerTeamID`: Winner team ID (0 if no winner yet)

**Signed fields:**

| Field | Type | Description |
|-------|------|-------------|
| `fixtureID` | number | Sportmonks fixture ID |
| `localTeamID` | number | Sportmonks local team ID |
| `visitorTeamID` | number | Sportmonks visitor team ID |
| `startingAt` | number | Fixture start time as Unix milliseconds |
| `status` | number | Normalized oracle status code |
| `winnerTeamID` | number | Sportmonks winner team ID, or 0 when unknown |

### Error Response

Errors use JSON:

```json
{
  "error": "fixtureID must be a positive integer",
  "code": "BAD_REQUEST"
}
```

Common status codes:

| Code | Meaning |
|------|---------|
| 400 | The request is invalid, such as a bad fixture ID |
| 401 | Sportmonks rejected the API key |
| 403 | Sportmonks blocked the API key or plan |
| 404 | No matching fixture or status was found |
| 502 | Sportmonks failed or returned malformed data |
| 500 | The oracle is missing config or signing failed |

## Data Interpretation

The oracle normalizes Sportmonks API data for easier consumption:

### Team IDs
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

### Status Codes
| Sportmonks Output | Oracle Output | Description |
|-------------------|---------------|-------------|
| NS | 1 | Not Started |
| 1st Innings, 2nd Innings, Innings Break, Int. | 2 | In Progress |
| Finished | 3 | Finished |
| All other statuses | 4 | Cancelled |

### Data Transformations
- **startingAt**: Converted from ISO 8601 to UNIX timestamp (milliseconds)
- **winnerTeamID**: Returns 0 for null (when match is ongoing)
- **timestamp**: Oracle's last update time

## Public Signing Contract

The current API is treated as `v1`. Signed field order is stable for all `1.x`
releases.

The signed payload is intentionally smaller than the full JSON response. This
keeps the contract stable and easy to verify.

Do not include team names, team codes, or `timestamp` in verification. They are
included for display and debugging, but they are not signed.

If you change any signed field, add a test and document the change as breaking.

## Cache Behavior

The API sets short public cache headers:

| Endpoint | Default cache |
|----------|---------------|
| `/fixture` | 60 seconds |
| `/status/[fixtureID]` | 15 seconds |

You can change these with `FIXTURE_CACHE_SECONDS` and `STATUS_CACHE_SECONDS`.
Signatures cover the signed data fields, not the cache age.

## Verification Example

You can verify signatures off-chain using `o1js`:

```javascript
import { Signature, Field, PublicKey } from 'o1js';

const response = await fetch('https://sportmonksoracle.vercel.app/fixture');
const data = await response.json();

const signature = Signature.fromBase58(data.signature);
const publicKey = PublicKey.fromBase58(data.publicKey);

const fieldsToVerify = [
  Field(data.data.fixtureID),
  Field(data.data.localTeamID),
  Field(data.data.visitorTeamID),
  Field(data.data.startingAt)
];

const isValid = signature.verify(publicKey, fieldsToVerify).toBoolean();
console.log('Signature valid:', isValid); // Should be true
```

The same signed fields can also be verified inside Mina zkApps.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Sportmonks API │───▶│ Cricket Oracle   │───▶│ Consumer App    │
│                 │    │  (this repo)     │    │                 │
│ • Fixture data  │    │ • Fetch data     │    │ • Verify sigs   │
│ • Match status  │    │ • Normalize      │    │ • Use payload   │
│                 │    │ • Sign with o1js │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Development

### Prerequisites
- Node.js 22+
- Sportmonks Cricket API key
- Mina private key for oracle signing

### Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/dar7an/sportmonksoracle.git
   cd sportmonksoracle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment variables**
   Create `.env` from the example file:
   ```bash
   cp .env.example .env
   ```

   Then set:
   ```bash
   API_KEY=your_sportmonks_api_key
   PRIVATE_KEY=your_mina_private_key_base58
   DEFAULT_LEAGUE_ID=3
   DEFAULT_FIXTURE_STATUS=NS
   FIXTURE_CACHE_SECONDS=60
   STATUS_CACHE_SECONDS=15
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

5. **Build for production**
   ```bash
   npm run build
   ```

### Generate a Mina Private Key

This project expects `PRIVATE_KEY` to be a Mina private key in base58 format.
One simple way to create a key is with `o1js`:

```bash
node --input-type=module -e "import { PrivateKey } from 'o1js'; const key = PrivateKey.random(); console.log('PRIVATE_KEY=' + key.toBase58()); console.log('PUBLIC_KEY=' + key.toPublicKey().toBase58());"
```

Keep the private key secret. Share only the public key if a client wants to pin
the oracle signer.

### Quality checks
Run these before opening a pull request:

```bash
npm test
npm run typecheck
npm run build
```

The tests protect the signed field order and Sportmonks status mapping. These
are part of the public contract with every consumer app.

CI runs the same checks on pushes and pull requests to `main`.

### Error handling
If `API_KEY` or `PRIVATE_KEY` is missing, API routes return a JSON error instead
of exiting the server process. This keeps local builds and deployment checks
stable while still failing requests that cannot be signed.

### Deployment
Deploy to [Vercel](https://vercel.com) with environment variables configured.

Deployment variables:

| Name | Required | Description |
|------|----------|-------------|
| `API_KEY` | yes | Sportmonks Cricket API key |
| `PRIVATE_KEY` | yes | Mina private key used for signing |
| `DEFAULT_LEAGUE_ID` | no | Default league for `/fixture`, defaults to `3` |
| `DEFAULT_FIXTURE_STATUS` | no | Default Sportmonks status for `/fixture`, defaults to `NS` |
| `FIXTURE_CACHE_SECONDS` | no | Cache TTL for `/fixture`, defaults to `60` |
| `STATUS_CACHE_SECONDS` | no | Cache TTL for `/status/[fixtureID]`, defaults to `15` |

### CI Notes
The workflow sets `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` so GitHub-hosted
JavaScript actions use the newer runtime before Node 20 action support is
removed.

## Technical Details

### Signing Implementation
- Uses `o1js` `Signature.create()` for cryptographic signing
- Configured as external package in Next.js to avoid WASM bundling issues
- Signs only the required numeric fields, excluding strings (team names, etc.)

### Security
- Private key stored securely in environment variables
- `.env.example` documents required config without exposing real secrets
- `npm audit` is part of CI

See [SECURITY.md](./SECURITY.md) for the vulnerability report flow.

## Related Projects

- **[Mina Protocol](https://minaprotocol.com)** - The zero-knowledge blockchain platform
- **[o1js](https://docs.minaprotocol.com/zkapps/o1js)** - TypeScript framework for zkApps

## License

MIT. See [LICENSE](./LICENSE).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

---

Built for verifiable cricket data.
