# 🫘 GoldBean - x402 Micropaid API Marketplace

> Pay per request with USDC on Base. No signup, no API key, no monthly subscription.
> Every call costs $0.02 USDC via the [x402](https://x402.org) protocol.

**GoldBean is live:** `http://104.225.233.23:9879`

---

## Quick Start

### 1. Prerequisites

- **USDC on Base** (`eip155:84532` testnet or `eip155:8453` mainnet)
- **A wallet** that can sign x402 payments (AgentCash, CDP Wallet, or any EVM wallet)

### 2. Try a Free Endpoint

```bash
curl http://104.225.233.23:9879/health
# {"status":"ok","service":"GoldBean","timestamp":"2026-05-15T12:00:00.000Z"}

curl http://104.225.233.23:9879/eth-price
# {"usd":"2255.93","change24h":"+0.31%","timestamp":"2026-05-15T12:00:00.000Z"}
```

### 3. Call a Paid Endpoint

```bash
curl http://104.225.233.23:9879/paid/btc-price
# HTTP 402 Payment Required
# x402-challenge: {...}
```

To pay the 402 and get data, you need an x402-capable client:

**Using AgentCash:**
```bash
npx agentcash@latest fetch http://104.225.233.23:9879/paid/btc-price
```

**Using x402-proxy (CLI tool):**
```bash
npx x402-proxy http://104.225.233.23:9879/paid/btc-price
```

**Using curl with manual payment (advanced):**
```bash
# Step 1: Request triggers 402
curl -s -D - http://104.225.233.23:9879/paid/btc-price

# Step 2: Parse x402-challenge header, sign with your wallet
# Step 3: Retry with x402-payment header
curl -H "x402-payment: <signed-payment>" http://104.225.233.23:9879/paid/btc-price
```

### 4. MCP Integration

Add to Claude Desktop / Cursor / Cline `mcpServers` config:

```json
{
  "mcpServers": {
    "goldbean": {
      "url": "http://104.225.233.23:9879/mcp"
    }
  }
}
```

---

## Available Endpoints

### Free (no payment needed)

| Endpoint | Description |
|----------|-------------|
| `GET /` | Service info & endpoint list |
| `GET /health` | Health check |
| `GET /eth-price` | Real-time ETH price (via CoinGecko) |
| `GET /gas` | ETH gas price estimate |
| `GET /card` | Service card / metadata |
| `GET /mcp` | MCP protocol manifest |

### Paid ($0.02 USDC per call)

| Endpoint | Description |
|----------|-------------|
| `GET /paid/btc-price` | Real-time BTC price (via CoinGecko) |
| `GET /paid/gas-forecast` | Gas price forecast |
| `GET /paid/market-intel` | Market sentiment & Fear & Greed Index |
| `GET /paid/defi-insights` | DeFi TVL & chain data |
| `GET /paid/network-health` | Blockchain network health |
| `GET /paid/tracker-report` | MEV & on-chain tracker report |
| `GET /paid/sol-token-risk` | Solana token risk assessment |

---

## How x402 Payment Works

```
Client                          GoldBean Server
  │                                   │
  ├─ GET /paid/btc-price ─────────────┤
  │◄─ 402 Payment Required ───────────┤
  │   x402-challenge: {...}           │
  │                                   │
  ├─ Sign challenge with wallet ──────┤
  │   (off-chain, no gas fee)         │
  │                                   │
  ├─ GET /paid/btc-price ─────────────┤
  │   x402-payment: <signed>          │
  │◄─ 200 OK ─────────────────────────┤
  │   {"usd":"68000.00",...}          │
  │                                   │
```

The facilitator (`x402.org`) handles settlement. Your wallet sends USDC only when challenge is accepted. No recurring charges.

---

## Data Sources

- **CoinGecko API** — Real-time cryptocurrency prices
- **Etherscan API** — Gas price oracle
- **Alternative.me** — Fear & Greed Index

---

## Seller Info

- **Seller wallet:** `0xB5f5CBe48E0595C044Bc626f278F757463eAc2Ce` (Base)
- **Network:** `eip155:84532` (Base Sepolia testnet) → migrating to `eip155:8453` (Base mainnet)
- **Facilitator:** `https://x402.org/facilitator`
- **Price:** $0.02 USDC per paid call

---

## Architecture

```
┌─────────────┐     x402 protocol      ┌──────────────┐
│   Client    │ ◄─────────────────────► │   VPS (USCA) │
│ (curl/Agent)│     HTTP + 402 flow     │  GoldBean 🫘 │
└─────────────┘                         │  :9879       │
       │                                └──────┬───────┘
       │         ┌──────────────┐              │
       └────────►│    Email     │◄─────────────┘
                 │  (Gmail)     │  Monitor alerts
                 │   Monitor    │
                 └──────────────┘
```

---

## Development

```bash
# Server
cd /opt/goldbean
npm install express axios @x402/express @x402/core @x402/evm
node server.js

# Monitor
python3 /opt/goldbean/chain_monitor.py
```

---

## Ecosystem

- [x402 Foundation](https://x402.org)
- [Awesome x402](https://github.com/Merit-Systems/awesome-x402)
- [x402 TypeScript SDK](https://github.com/x402-foundation/x402)

---

*Built on Bandwagon VPS (USCA-2). Part of the x402 ecosystem.*
