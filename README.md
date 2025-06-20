# zkOracle for Sportmonks Cricket API

This application is a zero knowledge oracle ([`zkOracle`](https://minaprotocol.com/blog/what-are-zkoracles)) for Sportsmonks' Cricket API version 2.0. It securely transports off-chain cricket data on-chain, enabling its use in zero-knowledge applications ([`zkApps`](https://minaprotocol.com/zkapps)) on the Mina Protocol.

**This oracle powers the [zk-cricket-trader](https://github.com/dar7an/zk-cricket-trader) zkApp** - a proof-of-concept zero-knowledge application that allows users to place anonymous trades on T20I cricket matches.

Shoutout to Sportsmonks for providing me free access to their API for the duration of this project ❤️

## Live Demo

🚀 **Oracle Endpoint**: [https://sportmonksoracle.vercel.app](https://sportmonksoracle.vercel.app)  
🏏 **zkApp Frontend**: [zk-cricket-trader](https://github.com/dar7an/zk-cricket-trader)

## How It Works

The oracle fetches live cricket data from Sportmonks API and signs it using `o1js` cryptographic primitives. The [zk-cricket-trader zkApp](https://github.com/dar7an/zk-cricket-trader) verifies these signatures on-chain to ensure data integrity before processing anonymous trades.

### Cryptographic Signing Scheme

The oracle uses a **field-based signing approach** compatible with Mina's zkApp verification:

**For fixture data** (4 fields):
```javascript
[fixtureID, localTeamID, visitorTeamID, startingAt]
```

**For match status** (6 fields):
```javascript
[fixtureID, localTeamID, visitorTeamID, startingAt, status, winnerTeamID]
```

Each signature is created using `o1js`'s `Signature.create()` method, ensuring perfect compatibility with the zkApp's on-chain verification.

## API Endpoints

### `/fixture`
Gets the next scheduled T20I fixture. This is the default homepage redirect.

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

### `/status/[fixtureID]`
Gets the current status of a specific fixture.

**Example**: [/status/66230](https://sportmonksoracle.vercel.app/status/66230)

**Response includes all fixture data plus:**
- `status`: Match status (1=Not Started, 2=In Progress, 3=Finished, 4=Cancelled)
- `winnerTeamID`: Winner team ID (0 if no winner yet)

## Data Interpretation

The oracle normalizes Sportmonks API data for easier zkApp consumption:

### Team IDs
| Team | ID   | | Team | ID   |
|------|------| |------|------|
| CSK  | 2    | | RCB  | 8    |
| DC   | 3    | | SRH  | 9    |
| PBKS | 4    | | GT   | 1976 |
| KKR  | 5    | | LSG  | 1979 |
| MI   | 6    | | TBC  | 2732 |
| RR   | 7    | |      |      |

### Status Codes
| Sportsmonks Output | Oracle Output | Description |
|-------------------|---------------|-------------|
| NS | 1 | Not Started |
| 1st Innings, 2nd Innings, Innings Break, Int. | 2 | In Progress |
| Finished | 3 | Finished |
| All other statuses | 4 | Cancelled |

### Data Transformations
- **startingAt**: Converted from ISO 8601 to UNIX timestamp (milliseconds)
- **winnerTeamID**: Returns 0 for null (when match is ongoing)
- **timestamp**: Oracle's last update time

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

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Sportmonks API │───▶│   zkOracle       │───▶│ zk-cricket-trader│
│                 │    │  (this repo)     │    │     zkApp       │
│ • Live cricket  │    │ • Fetch data     │    │ • Verify sigs   │
│   data          │    │ • Sign with o1js │    │ • Anonymous     │
│ • Match status  │    │ • Normalize      │    │   trading       │
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
   Create `.env`:
   ```bash
   API_KEY=your_sportmonks_api_key
   PRIVATE_KEY=your_mina_private_key_base58
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

### Deployment
Deploy to [Vercel](https://vercel.com) with environment variables configured.

## Technical Details

### Signing Implementation
- Uses `o1js` `Signature.create()` for cryptographic signing
- Configured as external package in Next.js to avoid WASM bundling issues
- Signs only the required numeric fields, excluding strings (team names, etc.)

### Security
- Private key stored securely in environment variables
- All remaining npm audit vulnerabilities are in development dependencies only
- Production runtime has no known security issues

## Related Projects

- **[zk-cricket-trader](https://github.com/dar7an/zk-cricket-trader)** - The zkApp that consumes this oracle
- **[Mina Protocol](https://minaprotocol.com)** - The zero-knowledge blockchain platform
- **[o1js](https://docs.minaprotocol.com/zkapps/o1js)** - TypeScript framework for zkApps

---

Built with ❤️ for the Mina ecosystem
