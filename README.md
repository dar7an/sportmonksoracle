# zkOracle for Sportmonks Cricket API

This application is a zero knowledge oracle ([`zkOracle`](https://minaprotocol.com/blog/what-are-zkoracles)) for Sportsmonks' Cricket API version 2.0. It securely transports off-chain cricket data on-chain, enabling its use in zero-knowledge applications ([`zkApps`](https://minaprotocol.com/zkapps)) on the Mina Protocol.

## Example

A deployed Vercel domain can be accessed through [`https://sportmonksoracle.vercel.app`](https://sportmonksoracle.vercel.app)

### Endpoints

The application currently configured for IPL 2024 and offers the following endpoints:

-   [`fixture`](https://sportmonksoracle.vercel.app/fixture): Gets the next scheduled fixture. This is the default homepage redirect.
    -   fixtureID
    -   localTeamID
    -   visitorTeamID
    -   startingAt
    -   timestamp
-   [`status/<fixtureID>`](https://sportmonksoracle.vercel.app/status/58328) Gets the current status of a specific fixture
    -   fixtureID
    -   status
    -   winnerTeamID
    -   timestamp

## Interpretation

The endpoints always provide the same output as Sportsmonks Cricket API version 2.0.

### fixtureID

The IPL 2024 IDs of a fixture

| fixtureID | localTeam ID | visitorTeamID |
| --------- | :----------: | :-----------: |
| 58328     |      2       |       8       |
| 58331     |      4       |       3       |
| 58334     |      5       |       9       |
| 58337     |      7       |     1979      |
| 58340     |     1976     |       6       |
| 58343     |      8       |       4       |
| 58346     |      2       |     1976      |
| 58349     |      9       |       6       |
| 58352     |      7       |       3       |
| 58355     |      8       |       5       |
| 58358     |     1979     |       4       |
| 58361     |     1976     |       9       |
| 58364     |      3       |       2       |
| 58367     |      6       |       7       |
| 58370     |      8       |     1979      |
| 58373     |      3       |       5       |
| 58376     |     1976     |       4       |
| 58379     |      9       |       2       |
| 58382     |      7       |       8       |
| 58385     |      6       |       3       |
| 58388     |     1979     |     1976      |
| 59126     |      2       |       5       |
| 59129     |      4       |       9       |
| 59132     |      7       |     1976      |
| 59135     |      6       |       8       |
| 59138     |     1979     |       3       |
| 59141     |      4       |       7       |
| 59144     |      5       |     1979      |
| 59147     |      6       |       2       |
| 59150     |      8       |       9       |
| 59153     |     1976     |       3       |
| 59156     |      5       |       7       |
| 59159     |      4       |       6       |
| 59162     |     1979     |       2       |
| 59165     |      3       |       9       |
| 59168     |      5       |       8       |
| 59171     |      4       |     1976      |
| 59174     |      7       |       6       |
| 59177     |      2       |     1979      |
| 59180     |      3       |     1976      |
| 59183     |      9       |       8       |
| 59186     |      5       |       4       |
| 59189     |      3       |       6       |
| 59192     |     1979     |       7       |
| 59195     |     1976     |       8       |
| 59198     |      2       |       9       |
| 59201     |      5       |       3       |
| 59204     |     1979     |       6       |
| 59207     |      2       |       4       |
| 59210     |      9       |       7       |
| 59213     |      6       |       5       |
| 59216     |      8       |     1976      |
| 59219     |      4       |       2       |
| 59222     |     1979     |       5       |
| 59225     |      6       |       9       |
| 59228     |      3       |       7       |
| 59231     |      9       |     1979      |
| 59234     |      4       |       8       |
| 59237     |     1976     |       2       |
| 59240     |      5       |       6       |
| 59243     |      2       |       7       |
| 59246     |      8       |       3       |
| 59249     |     1976     |       5       |
| 59252     |      3       |     1979      |
| 59255     |      7       |       4       |
| 59258     |      9       |     1976      |
| 59261     |      6       |     1979      |
| 59264     |      8       |       2       |
| 59267     |      9       |       4       |
| 59270     |      7       |       5       |
| 59273     |     2732     |     2732      |
| 59276     |     2732     |     2732      |
| 59279     |     2732     |     2732      |
| 59282     |     2732     |     2732      |

### localTeamID, visitorTeamID, winnerTeamID

| Team |  ID  |
| :--- | :--: |
| CSK  |  2   |
| DC   |  3   |
| PBKS |  4   |
| KKR  |  5   |
| MI   |  6   |
| RR   |  7   |
| RCB  |  8   |
| SRH  |  9   |
| GT   | 1976 |
| LSG  | 1979 |
| TBC  | 2732 |

### startingAt

Start time of the fixture

### Timestamp

zkOracle's last update for the information provided

### Exceptions

The goal was to make the data easier to use for the zkApp.

-   #### startingAt

    Converted from ISO 8601 to UNIX Timestamp in seconds

-   #### [`status`](https://docs.sportmonks.com/cricket/statuses-and-definitions)

    | Sportsmonks Output                            | zkOracle Output |
    | :-------------------------------------------- | :-------------: |
    | NS                                            |        0        |
    | 1st Innings, 2nd Innings, Innings Break, Int. |        1        |
    | Finished                                      |        2        |
    | All other status                              |       -1        |

## Installation

### Install Node.js

There are multiple ways to install Node.js. The easiest way is to use a [`package manager`](https://nodejs.org/download/package-manager/) for your operating system. This application was built and tested with v22.

### Clone the Repsitory

```bash
git clone https://github.com/dar7an/sportmonksoracle.git
```

```bash
cd sportmonksoracle
```

### Install or Update Dependencies

Run the following command to install or update all the requred modules listed in package.json

```bash
npm install
```

### Run a Local Server

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

### Setting Up Enviornment Variables

Create a file `.env` with the following:

```bash
API_KEY =           // SPORTSMONKS API KEY
PRIVATE_KEY =       // ORACLE PRIVATE KEY
LEAGUE_ID = 1       // IPL
SEASON_ID = 1484    // 2024
FIXTURE_ID =        // FIXTURE_ID FOR STATUS
```

### Build and Run the Application

```bash
npm run build
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Deploy on Vercel

-   Deploy the Next.js app to [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

-   Follow [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

-   Add the enviornment variables to [Vercel](https://vercel.com/docs/projects/environment-variables)
