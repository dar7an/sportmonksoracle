# Deployment

Sportmonks Cricket Oracle needs two secrets:

| Name | Required | Description |
|------|----------|-------------|
| `API_KEY` | yes | Sportmonks Cricket API key |
| `PRIVATE_KEY` | yes | Mina private key used for signing |
| `DEFAULT_LEAGUE_ID` | no | Defaults to `3` (T20I) |
| `DEFAULT_FIXTURE_STATUS` | no | Defaults to `NS` |
| `FIXTURE_CACHE_SECONDS` | no | Defaults to `60` |
| `STATUS_CACHE_SECONDS` | no | Defaults to `15` |
| `RATE_LIMIT_MAX` | no | Defaults to `60` requests per instance window |
| `RATE_LIMIT_WINDOW_MS` | no | Defaults to `60000` |

Invalid integer env vars return JSON `CONFIG_ERROR` on the request path.
Missing secrets do the same. `next build` does not require secrets.

## Vercel

1. Import the GitHub repository in Vercel.
2. Add the environment variables above.
3. Deploy the default `main` branch.
4. Open `/` to inspect a signed fixture, or `/fixture` for JSON.

## Docker

The image uses Next.js `output: "standalone"`, a non-root user, and a health
check against `/health`. It is based on Debian slim rather than Alpine so o1js
WASM does not have to fight musl.

```bash
cp .env.example .env
docker compose -f docker-compose.example.yml up --build
```

Then open:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/fixture
```

The inbound limiter is per Node process. On Vercel it keys off `x-forwarded-for`.
On raw Docker, put a reverse proxy in front or treat the limit as best-effort.
