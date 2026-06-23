# CoffeeShop MCP Server

Read-only MCP server that exposes the CoffeeShop backend contract directly from Bruno files.

Primary contract documentation path:

- `/Users/jorge/Projects/CoffeeShop/CoffeeShopBackend/bruno`

## Why this server exists

Client agents for iOS, Android, and Web should not depend on direct repository access. This server centralizes contract discovery behind MCP tools.

The intended consumer is an agent that needs enough API knowledge to update app code safely:

- list endpoints
- inspect request and response models
- understand auth and runtime behavior
- detect changes between contract versions
- decide what client code must be updated

Primary source order:

1. Bruno collection and request files
2. Bruno environments
3. No other source is consulted. Bruno is the only source of truth.

## Tools

- `coffeeshop_list_endpoints`
- `coffeeshop_get_endpoint_contract`
- `coffeeshop_get_endpoint_interaction`
- `coffeeshop_search_contract`
- `coffeeshop_list_models`
- `coffeeshop_get_model`
- `coffeeshop_list_environments`
- `coffeeshop_get_environment`
- `coffeeshop_get_auth_profile`
- `coffeeshop_analyze_contract_drift`
- `coffeeshop_list_contract_versions`
- `coffeeshop_diff_contract_versions`
- `coffeeshop_get_current_contract_snapshot`

## Configuration

Environment variables:

- `BRUNO_ROOT`
  Default: `<repo>/bruno`
- `REPO_ROOT`
  Default: repository root inferred from the server location
- `SNAPSHOT_ROOT`
  Default: `<repo>/mcp/coffeeshop-bruno-contract-server/snapshots`

## Local usage

```bash
npm install
npm run build
npm start
```

For development:

```bash
npm run dev
```

Create a versioned contract snapshot:

```bash
npm run export:snapshot -- 2026-06-22
```

## Cloudflare deployment model

Cloudflare runs the remote MCP endpoint, but the published contract still comes only from Bruno.

Publication flow:

1. `bruno/` is parsed in CI
2. CI exports JSON snapshots from Bruno only
3. CI generates `src/generated/contractData.ts`
4. Cloudflare Worker serves `/mcp` from that generated Bruno-derived snapshot using the official Cloudflare `createMcpHandler()` API

Worker endpoints:

- `POST /mcp`
- `GET /health`
- `GET /contract/latest`

Remote client transport:

- The deployed Cloudflare endpoint is `https://.../mcp`
- Transport is MCP Streamable HTTP
- Do not configure clients against `wss://.../mcp`

Example Codex or Claude Desktop proxy config:

```toml
[mcp_servers.coffeeshop-mcp]
command = "npx"
args = ["-y", "mcp-remote", "https://coffeeshop-mcp.jorgemrht.workers.dev/mcp"]
```

Quick remote verification:

```bash
curl -i https://coffeeshop-mcp.jorgemrht.workers.dev/health
curl -i -X POST https://coffeeshop-mcp.jorgemrht.workers.dev/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"1.0"}}}'
```

Local Cloudflare development:

```bash
npm install
npm run generate:cloudflare-data
npm run dev:cloudflare
```

Cloudflare deploy:

```bash
npm install
npm run deploy:cloudflare
```

## Intended deployment model

Recommended architecture:

1. Keep Bruno as the source of truth in the backend repo.
2. Publish versioned snapshots generated only from Bruno.
3. Reuse the same tool definitions and handlers for both local `stdio` and remote Cloudflare access.
4. Deploy the Cloudflare Worker that serves the published snapshot over `/mcp`.
5. Point agent clients to the MCP server rather than the repository.

## GitHub publication

The repository uses `.github/workflows/deploy-development.yml` as the single publication flow for the development environment.

That workflow:

1. builds and tests the backend
2. runs the Bruno contract tests
3. deploys the backend to Heroku development
4. builds the MCP server
5. exports a fresh contract snapshot
6. generates the Cloudflare data module from the published snapshots
7. persists snapshots and generated data in the repository
8. deploys the Worker to Cloudflare

## GitHub secrets required for Cloudflare

Set these repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

The workflow also requires the Bruno test secrets it already uses:

- `API_BASE_URL`
- `API_EMAIL`
- `API_PASSWORD`
- `API_DEVICE_ID`

Recommended Cloudflare token permissions:

- `Account` -> `Workers Scripts:Edit`
- `Account` -> `Account Settings:Read`
- `Account` -> `Workers Routes:Edit` only if you later attach a custom domain or route

## Current scope

- `stdio` transport is implemented for local development and inspection.
- `streamable HTTP` is exposed remotely on `/mcp` through the Cloudflare Worker using Cloudflare's official stateless MCP handler.
- Contract versioning is implemented through JSON snapshots.
- All contract data is derived only from Bruno.

## Remaining evolution

- Expand Bruno if you want richer response model documentation.
