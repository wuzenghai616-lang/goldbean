# 🫘 GoldBean - x402 Micropaid API Marketplace

Put this in your Claude/Cursor/Cline config and start calling paid APIs from 1 cent each.
No credit card. No signup. Just USDC on Base via x402.

---

## WARNING: This Is NOT a Free API

GoldBean charges 1 cent to 10 cents per request via x402 micropayments.
Without USDC on Base, calls will fail with 402 Payment Required.

**You need:** USDC on Base (eip155:8453) + AgentCash (npx agentcash@latest onboard)

---

## One-Click Demo

```bash
npx agentcash@latest onboard
npx agentcash discover https://thermal-met-arising-spectrum.trycloudflare.com
npx agentcash fetch https://thermal-met-arising-spectrum.trycloudflare.com/paid/sol-token-risk -m POST
npx agentcash fetch https://thermal-met-arising-spectrum.trycloudflare.com/paid/btc-price -m POST
```

1 USDC = 10-100 calls. Nothing recurring.

---

## Claude Desktop / Cursor / Cline Config

```json
{"mcpServers":{"goldbean":{"url":"https://thermal-met-arising-spectrum.trycloudflare.com/mcp"}}}
```

---

## Real x402 Ecosystem Data

From x402scan: 106K tx/day, $19.2K volume, 7,841 buyers.

- SniperX: 5,249 tx/day, $105/day, 12 buyers
- OATP: 1,217 tx/day, $155/day, 108 buyers
- Laevitas: 1,080 tx/day, $108/day, 2 buyers
- BlockRun: 2,081 tx/day, $151/day, 47 buyers

GoldBean follows the niche VIP model.

---

## 39 Paid MCP Tools

**Solana DeFi (NEW)**
sol-token-risk 10c, sol-token-price 5c, sol-token-holders 5c, sol-top-tokens 8c, sol-new-pairs 8c, sol-smart-money 10c, sol-dex-volume 5c

**Blockchain**
gas-forecast 1c, market-intel 5c, defi-insights 10c, network-health 3c, tracker-report 3c, btc-price 3c, eth-gas-l1 2c
eth-address-validate 1c, ens-lookup 2c, chain-fee 2c

**Finance** stock-spy 3c, fx-rates 2c, commodities 3c, fear-greed 1c
**News** crypto-news 2c, finance-news 2c, tech-news 2c
**Utility** ip-geo 1c, user-agent 1c, uuid-gen 1c, qr-code 1c, hash-text 1c, base64-encode 1c, weather 3c, time-convert 1c, json-validate 1c, password-gen 1c, color-convert 1c, unit-convert 1c, word-count 1c
**Fun** random-quote 8c, joke 8c

---

## Quick Reference

MCP endpoint: https://thermal-met-arising-spectrum.trycloudflare.com/mcp
API base: https://thermal-met-arising-spectrum.trycloudflare.com
Payment: x402 / AgentCash on Base USDC
Seller wallet: 0xB5f5CBe48E0595C044Bc626f278F757463eAc2Ce

---

Built on Conway Cloud. Part of the x402 ecosystem.
