# GoldBean MCP Server v2 — Cloudflare Workers Template

Deploy GoldBean's stateless MCP server to Cloudflare Workers in under 2 minutes.

## Why Cloudflare Workers?

- **Zero cold start** — 50ms response globally
- **No server management** — zero maintenance
- **x402 USDC native** — wallet-based micropayments work perfectly on edge
- **MCP v2 compatible** — stateless HTTP, no session state to persist

## Quick Deploy

### Option 1: Wrangler CLI (Recommended)

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
npx wrangler login

# Clone template
git clone https://github.com/wuzenghai616-lang/goldbean-workers-template.git
cd goldbean-workers-template

# Deploy
npx wrangler deploy
```

### Option 2: Dashboard (No CLI)

1. Go to [Cloudflare Workers Dashboard](https://dash.cloudflare.com)
2. Create a new Worker
3. Paste the contents of `src/index.js`
4. Set environment variables (see below)
5. Deploy

## Configuration

Set these in your Worker settings (Dashboard → Workers → Your Worker → Settings → Variables):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOLDBEAN_API_URL` | Yes | - | Your GoldBean API base URL (e.g., `https://goldbean-api.xyz`) |
| `GOLDBEAN_FREE_LIMIT` | No | `50` | Daily free call limit per IP |

## Architecture

```
Client (Claude/Cline) → POST /mcp → Cloudflare Worker → GoldBean API → Baidu AI
                                         ↓
                                  Stateless, no session
                                  Global edge <50ms latency
```

## Testing

```bash
# Test locally
npx wrangler dev

# Then in another terminal:
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Pricing

- **Cloudflare Workers**: Free tier = 100,000 requests/day
- **GoldBean API**: Free tier = 50 calls/day, then pay-per-call from $0.001
- **Total cost for indie project**: $0

## Files

- `src/index.js` — The MCP v2 server (stateless, zero deps)
- `wrangler.toml` — Cloudflare config
- `README.md` — This file

## Customization

Want to add your own tools? Edit `src/index.js` and add to the `TOOLS` array:

```javascript
{
  name: "my_custom_tool",
  category: "Custom",
  price: "$0.01",
  params: { input: "Description" }
}
```

## License

MIT
