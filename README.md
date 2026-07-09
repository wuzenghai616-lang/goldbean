# 🫘 GoldBean — Payment-Powered AI API Gateway

> **Access Baidu AI (OCR, Translation, TTS, ASR, LLM) from anywhere — no Chinese phone number required**

[![API Status](https://img.shields.io/website?url=https%3A%2F%2Fgoldbean-api.xyz%2Fhealth&label=API%20Status)](https://goldbean-api.xyz/health)
[![public-apis](https://img.shields.io/badge/public--apis-39.8k%20%E2%AD%90-blue?logo=github)](https://github.com/public-apis/public-apis)
[![awesome-mcp-servers](https://img.shields.io/badge/awesome--mcp--servers-%E2%9C%85-brightgreen?logo=github)](https://github.com/punkpeye/awesome-mcp-servers)
[![awesome-x402](https://img.shields.io/badge/awesome--x402-%E2%9A%A1-yellow?logo=github)](https://github.com/xpaysh/awesome-x402)
[![Glama Score](https://glama.ai/mcp/servers/wuzenghai616-lang/goldbean/badges/score.svg)](https://glama.ai/mcp/servers/wuzenghai616-lang/goldbean)
[![MCPize](https://img.shields.io/badge/MCPize-monetized-blueviolet?logo=codefactor)](https://mcpize.com/mcp/goldbean)
[![npm](https://img.shields.io/npm/v/goldbean-mcp?color=orange)](https://www.npmjs.com/package/goldbean-mcp)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**GoldBean** is a pay-per-use AI API gateway. Access **Baidu AI products** (OCR, TTS, ASR, Translation, NLP, Face Detection, Image Analysis) and **HelixFold3** protein structure prediction — all through a unified API with **x402 USDC micropayments**.
> x402 is the open standard for crypto micropayments over HTTP. Learn more at [x402.org](https://x402.org)

**No subscription. No KYC. Pay cents per call.**

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **47 API Routes (26 paid + 21 free)** | OCR, TTS, ASR, Translation, LLM Chat, Face Detection, NLP, Image, HelixFold3 |
| **x402 Micropayments** | Pay $0.01–$0.05 per call with USDC on Base network |
| **Free Tier** | 20 free API calls per registration — no wallet needed |
| **PayPal & Alipay** | Also supported for prepaid credits |
| **MCP Compatible** | Works with Cursor, Claude Desktop, Cline, Codex, Continue |
| **Baidu AI Powered** | Enterprise-grade AI from China's leading AI platform |
| **HelixFold3** | Nature-published, AlphaFold3-class protein/RNA structure prediction |

---

## 🤔 Why GoldBean?

> **Need Baidu OCR but don't have a Chinese phone number?**

GoldBean is the easiest way for overseas developers to use Baidu AI APIs **without a Chinese phone number, real-name verification, or WeChat Pay**.

- ✅ **Use Baidu API without registration** — no Chinese ID, no real-name auth
- ✅ **Baidu OCR API without Chinese phone** — just sign up with any email
- ✅ **No KYC, no subscription** — pay cents per call via USDC, PayPal, or Alipay
- ✅ **Free credits to start** — 20 free API calls, no wallet required
- ✅ **Works globally** — no mainland China restrictions for foreign users

Whether you need Baidu OCR for document scanning, Baidu Translation for multilingual text, or Baidu ASR/TTS for voice processing — GoldBean unlocks it all without the registration barriers.

---

## 🚀 Quick Start

### 1. Install the MCP Server

```bash
npx goldbean-mcp
```

### 2. Add to Your MCP Client

**Claude Desktop / Cursor / Continue:**

```json
{
  "mcpServers": {
    "goldbean": {
      "command": "npx",
      "args": ["goldbean-mcp"]
    }
  }
}
```

### 3. Use Free Credits (No Wallet)

```bash
# Register for 20 free API calls
curl -X POST https://goldbean-api.xyz/paid/user/register \
  -H "Content-Type: application/json" \
  -d '{"userId": "your-user-id"}'

# Response: {"freeCredits": 20, "apiKey": "GB_XXXXXX"}

# Call an API with free credits
curl "https://goldbean-api.xyz/paid/baidu-ocr?image=https://example.com/doc.jpg" \
  -H "x-user-id: GB_XXXXXX"
```

---

## 📡 API Endpoints

### 🆓 Free System Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health check |
| `GET /btc-price` | Bitcoin real-time price ($) |
| `GET /weather-now?city=Lanzhou` | Current weather in any city |
| `GET /gas` | Ethereum gas price (Gwei) |
| `GET /.well-known/x402-bazaar` | x402 payment discovery |
| `GET /api/routes` | Full route registry |

### 🎯 Baidu AI Endpoints (Pay-per-Call)

| Endpoint | Price | Description |
|----------|:-----:|-------------|
| `GET /paid/baidu-ocr` | $0.01 | General text OCR |
| `GET /paid/baidu-ocr-accurate` | $0.02 | High-accuracy OCR |
| `GET /paid/baidu-idcard` | $0.02 | ID card recognition |
| `GET /paid/baidu-tts?text=...` | $0.01 | Text-to-Speech (Chinese) |
| `GET /paid/baidu-translate?text=...` | $0.01 | Multi-language translation |
| `GET /paid/baidu-llm-chat?prompt=...` | $0.03 | ERNIE chat (GPT-class LLM) |
| `GET /paid/baidu-asr?audio=...` | $0.03 | Speech-to-Text |
| `GET /paid/baidu-image-recognition?image=...` | $0.02 | Object/scene recognition |
| `GET /paid/baidu-image-enhance?image=...` | $0.02 | Image enhancement |
| `GET /paid/baidu-face-detect?image=...` | $0.02 | Face detection & analysis |
| `GET /paid/baidu-body-analysis?image=...` | $0.02 | Body/gesture analysis |
| `GET /paid/baidu-nlp?text=...` | $0.02 | NLP (lexer, sentiment, etc.) |
| `GET /paid/baidu-helixfold?seq=...` | $0.05 | Protein structure prediction |

### 💳 Account & Payment

| Endpoint | Description |
|----------|-------------|
| `POST /paid/user/register` | Register for 20 free credits |
| `GET /paid/plans` | Prepaid plans & pricing |
| `POST /paid/paypal/create-order` | Create PayPal payment |
| `POST /paid/paypal/capture` | Capture PayPal payment |
| `POST /paid/alipay/create-order` | Create Alipay payment |
| `GET /paid/alipay/query` | Query Alipay order status |

---

## 💰 How x402 Payments Work

```
1. Agent calls endpoint → 402 Payment Required
2. Wallet signs USDC tx on Base → sends payment payload
3. Server verifies on-chain → serves the data
```

**No KYC.** **No subscription.** **No credit card required.**

Powered by the [x402 protocol](https://x402.org) — decentralized micropayments for AI agents.

**Accepting wallet:** `0x7484b0bca25d2ee56e9b0535572d4cf44a047d98` (Base/USDC)

---

## 🏗️ Architecture

```
┌──────────────┐    HTTPS    ┌──────────────────────┐
│  MCP Client   │ ──────────→ │  GoldBean API Server  │
│  (Claude,     │ ←────────── │  v8.0.0 on VPS       │
│   Cursor,     │    402/200  │  port 9879            │
│   Cline)      │             │                      │
└──────────────┘             ├── Baidu AI (OCR/TTS)  │
                              ├── CoinGecko (BTC)     │
┌──────────────┐             ├── Etherscan (Gas)     │
│  Web Browser  │──────────→ │── HelixFold3          │
│  (curl/REST)  │             │── PayPal/Alipay       │
└──────────────┘             └──────────────────────┘
```

---

## 🏆 Platform Presence

| Platform | Status | Link |
|----------|--------|------|
| **public-apis** (39.8k⭐) | ✅ Listed | [View](https://github.com/public-apis/public-apis) |
| **awesome-mcp-servers** (76k⭐) | ✅ Listed | [View](https://github.com/punkpeye/awesome-mcp-servers) |
| **Glama.ai** | ✅ Active | [Score →](https://glama.ai/mcp/servers/wuzenghai616-lang/goldbean) |
| **Smithery.ai** | ✅ Deployed | [View](https://smithery.ai/servers/wuzenghai616/goldbean) |
| **npm** | ✅ Published | `goldbean-mcp` |
| **Dev.to** | ✅ 6 articles | [Profile](https://dev.to/goldbean) |
| **awesome-x402** | ✅ Listed | [View](https://github.com/xpaysh/awesome-x402) |
| **MCPize** | ✅ Monetized | [View](https://mcpize.com/mcp/goldbean) |
| **MCP.Directory** | ⏳ Pending | Submitted |

---

## 📖 Documentation

- **API Reference**: https://goldbean-api.xyz/openapi.json
- **Route Registry**: https://goldbean-api.xyz/api/routes
- **x402 Bazaar**: https://goldbean-api.xyz/.well-known/x402-bazaar
- **Pricing**: https://goldbean-api.xyz/paid/plans
- **MCP Config**: https://goldbean-api.xyz/.well-known/mcp.json

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick ways to help:
- ⭐ Star this repo — it helps others discover GoldBean
- 🐛 Report bugs via GitHub Issues
- 📝 Improve documentation
- 🌐 Share on social media

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**GoldBean (GB) — Wishing You Good Fortune & Prosperity 🫘** <br>
Pay-per-use AI for everyone.
