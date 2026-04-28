# 🫘 GoldBean - x402 Micropaid API Marketplace

**32 endpoints, 1-8¢ each. Pay with USDC on Base via x402. AI Agent ready.**

GoldBean is a 3-in-1 revenue engine running on Conway Cloud:
- **Mode 1:** Data API — 32 paid endpoints across 6 categories
- **Mode 2:** MCP Tool Provider — 32 tools for AI Agent auto-discovery
- **Mode 3:** Self-Operating Engine — auto-pricing, monitoring, revenue tracking

---

## ⚡ Quick Start

```bash
# 1. Install AgentCash (one-time)
npx agentcash@latest onboard

# 2. Top up with USDC on Base (1 USDC = ~100 calls)
#    Deposit to: 0x5FF9d210112A62b53E75AFdebb5e9EA6e7dD427B

# 3. Discover GoldBean endpoints
npx agentcash discover https://thermal-met-arising-spectrum.trycloudflare.com

# 4. Make your first paid call (1¢)
npx agentcash fetch https://thermal-met-arising-spectrum.trycloudflare.com/paid/btc-price -m POST
```

---

## 📡 Endpoints (32 total)

### ⛓️ Blockchain (1-8¢)
| Endpoint | Price | Description |
|---|---|---|
| POST /paid/gas-forecast | 1¢ | ETH gas price forecast |
| POST /paid/market-intel | 3¢ | Market intelligence |
| POST /paid/defi-insights | 8¢ | DeFi protocol insights |
| POST /paid/network-health | 3¢ | Network health status |
| POST /paid/tracker-report | 3¢ | On-chain tracker report |
| POST /paid/eth-gas-l1 | 2¢ | L1 gas prices |
| POST /paid/eth-address-validate | 1¢ | Validate ETH address |
| POST /paid/ens-lookup | 2¢ | ENS name resolution |
| POST /paid/chain-fee | 2¢ | Chain fee estimation |

### 💰 Prices (1¢)
| Endpoint | Price | Description |
|---|---|---|
| POST /paid/btc-price | 1¢ | Bitcoin price in USD |

### 📊 Finance (1-3¢)
| Endpoint | Price | Description |
|---|---|---|
| POST /paid/stock-spy | 3¢ | S&P 500 (SPY) price |
| POST /paid/fx-rates | 2¢ | Forex exchange rates |
| POST /paid/commodities | 3¢ | Commodity prices |
| POST /paid/fear-greed | 1¢ | Fear & Greed Index |

### 📰 News (2¢ each)
| Endpoint | Price | Description |
|---|---|---|
| POST /paid/crypto-news | 2¢ | Crypto news headlines |
| POST /paid/finance-news | 2¢ | Finance news headlines |
| POST /paid/tech-news | 2¢ | Tech news headlines |

### 🛠️ Utility (1¢ each)
| Endpoint | Price | Description |
|---|---|---|
| POST /paid/ip-geo | 1¢ | IP geolocation |
| POST /paid/user-agent | 1¢ | Parse user agent |
| POST /paid/uuid-gen | 1¢ | Generate UUID v4 |
| POST /paid/qr-code | 1¢ | Generate QR code |
| POST /paid/hash-text | 1¢ | Hash text (SHA-256) |
| POST /paid/base64-encode | 1¢ | Base64 encode/decode |
| POST /paid/weather | 1¢ | Weather by city |
| POST /paid/time-convert | 1¢ | Timezone conversion |
| POST /paid/json-validate | 1¢ | Validate JSON |
| POST /paid/password-gen | 1¢ | Generate password |
| POST /paid/color-convert | 1¢ | Color format conversion |
| POST /paid/unit-convert | 1¢ | Unit conversion |
| POST /paid/word-count | 1¢ | Word/char count |

### 🎉 Fun (1¢ each)
| Endpoint | Price | Description |
|---|---|---|
| POST /paid/random-quote | 1¢ | Random quote |
| POST /paid/joke | 1¢ | Random joke |

### 🆓 Free Endpoints (10/day rate limit)
| Endpoint | Description |
|---|---|
| GET /gas | Live ETH gas prices |
| GET /eth-price | ETH/USD price |
| GET /health | Server status |

---

## 🔧 MCP Tools (Mode 2)

All 32 endpoints are available as MCP-compatible tools for AI Agent auto-discovery:

```bash
GET /mcp/tools
```

Returns a full MCP manifest. Agents can auto-discover and call any endpoint.

---

## 🤖 Self-Operating Engine (Mode 3)

```bash
GET /engine/report
```

Real-time revenue tracking, auto-pricing, and status monitoring.

---

## 📖 API References

| Endpoint | Description |
|---|---|
| GET /openapi.json | OpenAPI 3.1.0 spec |
| GET /.well-known/x402 | x402 discovery manifest |
| GET /.well-known/agentcash | AgentCash discovery |
| GET /metrics | Prometheus metrics |

---

## 🏗️ Architecture

```
AI Agent → AgentCash → Cloudflare Tunnel → Conway Sandbox → GoldBean → Response
                   ↕
            USDC on Base (eip155:8453)
                   ↕
           Seller Wallet: 0xB5f5CBe48E0595C044Bc626f278F757463eAc2Ce
```

---

## 📝 License

MIT

---

*Built on [Conway Cloud](https://conway.tech) · Part of the [x402 ecosystem](https://github.com/x402-foundation/x402)*
