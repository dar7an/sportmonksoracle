# Deployment

Sportmonks Cricket Oracle needs two secrets:

| Name | Required | Description |
|------|----------|-------------|
| `API_KEY` | yes | Sportmonks Cricket API key |
| `PRIVATE_KEY` | yes | Mina private key used for signing |
| `DEFAULT_LEAGUE_ID` | no | Defaults to `3` |
| `DEFAULT_FIXTURE_STATUS` | no | Defaults to `NS` |
| `FIXTURE_CACHE_SECONDS` | no | Defaults to `60` |
| `STATUS_CACHE_SECONDS` | no | Defaults to `15` |

## Vercel

1. Import the GitHub repository in Vercel.
2. Add the environment variables above.
3. Deploy the default `main` branch.
4. Open `/fixture` to confirm the oracle can fetch and sign a response.

## Docker

Create a local `.env`:

```bash
cp .env.example .env
```

Build and run:

```bash
docker compose -f docker-compose.example.yml up --build
```

Then open:

```bash
curl http://localhost:3000/fixture
```

Do not bake real secrets into Docker images. Pass them as environment variables.
