# zkOracle for Sportmonks Cricket API

This application is a zero knowledge oracle ([`zkOracle`](https://minaprotocol.com/blog/what-are-zkoracles)) for Sportsmonks' Cricket API version 2.0. It securely transports off-chain cricket data on-chain, enabling its use in zero-knowledge applications ([`zkApps`](https://minaprotocol.com/zkapps)) on the Mina Protocol.

## Example

A deployed Vercel domain can be accessed through [`sportmonksoracle.vercel.app`](https://sportmonksoracle.vercel.app)

### Endpoints

The application currently configured for IPL 2024 and offers the following endpoints:

-   [`/api/fixture`](https://sportmonksoracle.vercel.app/api/fixture): Gets the next scheduled fixture
    -   fixtureID
    -   localTeamID
    -   visitorTeamID
    -   startingAt
    -   timestamp
-   [`/api/status`](https://sportmonksoracle.vercel.app/api/status) Gets the current status of a specific fixture
    -   fixtureID
    -   status
    -   winnerTeamID
    -   timestamp

## Interpretation

The endpoints always provide the same output as Sportsmonks Cricket API version 2.0.

### fixtureID

ID of the fixture

### localTeamID, visitorTeamID, winnerTeamID

| Team | Value |
| :--- | :---: |
| CSK  |   2   |
| DC   |   3   |
| PBKS |   4   |
| KKR  |   5   |
| MI   |   6   |
| RR   |   7   |
| RCB  |   8   |
| SRH  |   9   |
| GT   | 1976  |
| LSG  | 1979  |

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
    | Anything else                                 |       -1        |

## Installation

### Install Node.js

There are multiple ways to install Node.js. The easiest way is to use a [`package manager`](https://nodejs.org/download/package-manager/) for your operating system. This application was built and tested with v22.

### Clone the Repsitory

```bash
git clone https://github.com/dar7an/oracle.git
```

```bash
cd oracle
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
API_KEY = <SPORTSMONKS API KEY>
PRIVATE_KEY = <ORACLE PRIVATE KEY>
LEAGUE_ID = 1
SEASON_ID = 1484
FIXTURE_ID = <FIXTURE_ID FOR STATUS>
```

### Run the Application

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
