# 🫘 GoldBean - x402 Micropaid API Marketplace

> **Put this in your Claude/Cursor/Cline config and start calling paid APIs at 1¢ each.**
> No credit card. No signup. Just USDC on Base via x402.

---

## ⚠️ This Is NOT a Free API — You Must Pay Per Call

GoldBean charges **1¢ to 8¢ per request** via x402 micropayments. If you don't have USDC on Base, calls will fail with `402 Payment Required`.

**You cannot use GoldBean without:**
1. USDC on Base (eip155:8453) in your wallet
2. AgentCash installed (`npx agentcash@latest onboard`)

If a call fails, **it's because you haven't funded your wallet yet** — not a bug.

---

## 🚀 One-Click Demo (with payment)

```bash
# Step 1: Install AgentCash
npx agentcash@latest onboard

# Step 2: Send USDC on Base to your AgentCash wallet
# (1 USDC ≈ 100 calls. Send to your own wallet, not GoldBean's)

# Step 3: Discover all 32 endpoints
npx agentcash discover https://thermal-met-arising-spectrum.trycloudflare.com

# Step 4: Make your first 1¢ API call — this WILL charge you
npx agentcash fetch https://thermal-met-arising-spectrum.trycloudflare.com/paid/btc-price -m POST

# 🔴 If this fails with "Insufficient balance":
#    → You need USDC on Base. Buy from an exchange or bridge from Ethereum.

# Step 5: Once step 4 works, paste this URL into any AI agent:
#    https://thermal-met-arising-spectrum.trycloudflare.com
```

**💰 1 USDC ≈ 100 API calls. You only pay for what you use — nothing recurring.**

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

**⚠️ IMPORTANT:** Before asking Claude to call any paid GoldBean tool, **run the demo above first** to confirm your wallet has USDC. Claude will get `402 Payment Required` if your wallet is empty.

---

## 📋 Available Tools (32 MCP tools)

Once connected and funded, your AI agent can use these:

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
| Seller wallet (revenue) | `0xB5f5CBe48E0595C044Bc626f278F757463eAc2Ce` |
| OpenAPI spec | `GET /openapi.json` |
| Health check | `GET /health` |
| Free endpoints | `GET /gas`, `GET /eth-price`, `GET /health` (10/day) |

---

## 🏗️ Architecture

```
AI Agent → AgentCash → Cloudflare Tunnel → Conway Sandbox → GoldBean → Response
         ↕ USDC on Base (eip155:8453) — pay per call
         ↕ Seller Wallet: 0xB5f5CBe48E0595C044Bc626f278F757463eAc2Ce
```

---

## 📝 License

MIT

---

*Built on [Conway Cloud](https://conway.tech) · Part of the [x402 ecosystem](https://github.com/x402-foundation/x402)*
