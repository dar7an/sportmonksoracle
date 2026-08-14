# Changelog

## 1.1.0

Breaking signing-contract change.

- Status codes are now 1–6. Unknown Sportmonks strings return HTTP 502 instead of signing cancelled.
- `Aban.` is abandoned (6). `Cancl.` is the only cancelled (4) mapping. `Postp.` is postponed (5).
- Status payloads sign a seventh field, `outcome` (0 none/unknown, 1 winner, 2 draw, 3 no-result).
- `winnerTeamID = 0` is documented as “no team id”, not “match ongoing”.
- `/` is a verification console. `/fixture` remains JSON. `/spec` hosts an OpenAPI explorer.
- Sportmonks adapter paginates, uses team includes, and sends native team filters.
- Inbound per-instance rate limit and distinct Sportmonks 429 mapping.

## 1.0.0

- Made the oracle standalone and plug-and-play for any consumer app.
- Added MIT license, contribution guide, security policy, and CI.
- Added signed fixture and fixture status endpoints.
- Added tests for signing field order, status mapping, and route behavior.
- Added configurable fixture filters and safe cache headers.
- Added runnable examples, OpenAPI docs, hosted docs page, and Docker/Vercel deployment guidance.
