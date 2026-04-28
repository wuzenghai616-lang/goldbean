# 🫘 GoldBean - x402 Micropaid API Marketplace

> **Put this in your Claude/Cursor/Cline config and start calling APIs at 1¢ each.**
> No credit card. No signup. Just USDC on Base via x402.

---

## 🚀 One-Click Demo (no install required)

Run this anywhere — even in a fresh terminal:

```bash
# Step 1: Install AgentCash
npx agentcash@latest onboard

# Step 2: Top up 1 USDC (~100 calls)
# Send USDC on Base (eip155:8453) to:
# 0x5FF9d210112A62b53E75AFdebb5e9EA6e7dD427B

# Step 3: Discover all 32 endpoints
npx agentcash discover https://thermal-met-arising-spectrum.trycloudflare.com

# Step 4: Make your first 1¢ API call
npx agentcash fetch https://thermal-met-arising-spectrum.trycloudflare.com/paid/btc-price -m POST

# Step 5: Ask any AI agent to use GoldBean
# Just paste this URL: https://thermal-met-arising-spectrum.trycloudflare.com
```

**💰 1 USDC ≈ 100 API calls. Pay only for what you use.**

---

## 🤖 Claude Desktop / Cursor / Cline — One-Click Config

Paste this into your `claude_desktop_config.json` (or Cursor MCP settings):

```json
{
  "mcpServers": {
    "goldbean": {
      "url": "https://thermal-met-arising-spectrum.trycloudflare.com/mcp"
    }
  }
}
```

Then ask Claude: "Check the ETH gas price" — Claude auto-discovers and calls GoldBean.

**No config params needed.** GoldBean is auth-free on the MCP side; payments happen via x402.

---

## 📋 Available Tools (32 MCP tools)

Once connected, your AI agent can use these:

| Category | Tools | Price |
|---|---|---|
| ⛓️ Blockchain | gas-forecast, market-intel, defi-insights, network-health, tracker-report, eth-gas-l1, address-validate, ens-lookup, chain-fee | 1-8¢ |
| 💰 Prices | btc-price | 1¢ |
| 📊 Finance | stock-spy, fx-rates, commodities, fear-greed | 1-3¢ |
| 📰 News | crypto-news, finance-news, tech-news | 2¢ |
| 🛠️ Utility | ip-geo, user-agent, uuid-gen, qr-code, hash-text, base64-encode, weather, time-convert, json-validate, password-gen, color-convert, unit-convert, word-count | 1¢ |
| 🎉 Fun | random-quote, joke | 1¢ |

**Full endpoint reference:** [ENDPOINTS.md](./ENDPOINTS.md)

---

## 📡 Quick Reference

| What | URL |
|---|---|
| MCP endpoint | `https://thermal-met-arising-spectrum.trycloudflare.com/mcp` |
| API base | `https://thermal-met-arising-spectrum.trycloudflare.com` |
| Payment | x402 / AgentCash on Base USDC |
| Wallet (revenue) | `0xB5f5CBe48E0595C044Bc626f278F757463eAc2Ce` |
| OpenAPI spec | `GET /openapi.json` |
| Health check | `GET /health` |
| Free endpoints | `GET /gas`, `GET /eth-price`, `GET /health` (10/day) |

---

## 🏗️ Architecture

```
AI Agent → AgentCash → Cloudflare Tunnel → Conway Sandbox → GoldBean → Response
         ↕ USDC on Base (eip155:8453)
         ↕ Seller Wallet: 0xB5f5CBe48E0595C044Bc626f278F757463eAc2Ce
```

---

## 📝 License

MIT

---

*Built on [Conway Cloud](https://conway.tech) · Part of the [x402 ecosystem](https://github.com/x402-foundation/x402)*
