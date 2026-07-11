# 🫘 GoldBean — Baidu AI APIs for Global Developers

> **Access Baidu AI (OCR, Translation, TTS, ASR, ERNIE LLM, HelixFold) from anywhere — no Chinese phone number, no Baidu Cloud account required**

[![API Status](https://img.shields.io/website?url=https%3A%2F%2Fgoldbean-api.xyz%2Fhealth&label=API%20Status)](https://goldbean-api.xyz/health)
[![public-apis](https://img.shields.io/badge/public--apis-39.8k%20%E2%AD%90-blue?logo=github)](https://github.com/public-apis/public-apis)
[![awesome-mcp-servers](https://img.shields.io/badge/awesome--mcp--servers-%E2%9C%85-brightgreen?logo=github)](https://github.com/punkpeye/awesome-mcp-servers)
[![awesome-x402](https://img.shields.io/badge/awesome--x402-%E2%9A%A1-yellow?logo=github)](https://github.com/xpaysh/awesome-x402)
[![Glama Score](https://glama.ai/mcp/servers/wuzenghai616-lang/goldbean/badges/score.svg)](https://glama.ai/mcp/servers/wuzenghai616-lang/goldbean)
[![MCPize](https://img.shields.io/badge/MCPize-monetized-blueviolet?logo=codefactor)](https://mcpize.com/mcp/goldbean)
[![npm](https://img.shields.io/npm/v/goldbean-mcp?color=orange)](https://www.npmjs.com/package/goldbean-mcp)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**GoldBean** is the easiest way for global developers to access **46 Baidu AI endpoints** — OCR (general, high-accuracy, table, handwriting, VIN), TTS, ASR, ERNIE LLM, translation, image recognition (plant, animal, dish, ingredient, currency, car type, red wine, logo), face detection, comparison & liveness, gesture, object detection, landmark, image processing (colorize, style transfer, selfie anime, dehaze), content moderation, NLP (sentiment, summary, word embedding, text correction, comment tag, emotion, keyword, address, text similarity), and HelixFold protein structure prediction — all through a unified API with **PayPal, Alipay, or x402 USDC micropayments**.

Baidu AI is world-class at Chinese text, voice, and image processing. But using it directly requires a Chinese phone number, real-name verification, and a Baidu Cloud account. GoldBean removes that barrier.

**No Chinese phone number. No Baidu account. No subscription. Pay per call.**

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **78 API Routes (53 paid + 25 free)** | OCR (10 types), TTS, ASR, Translation, LLM Chat, Face (detect + compare + liveness), Gesture, Object Detect, Landmark, Plant/Animal/Dish/Ingredient/Currency/Car/RedWine/Logo Recognition, Image Processing (colorize, style transfer, selfie anime, dehaze), Content Moderation, NLP (10 types), HelixFold |
| **x402 Micropayments** | Pay $0.01–$0.05 per call with USDC on Base network |
| **Free Tier** | 5 free calls/day per IP + 20 credits on registration — no wallet needed |
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
- ✅ **Free credits to start** — 5 calls/day per IP (no signup) + 20 credits on registration
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


## 📚 Code Examples

We provide ready-to-use code examples in the [`examples/`](examples/) directory:

| Example | Language | Description |
|---------|----------|-------------|
| [`claude-desktop-config.md`](examples/claude-desktop-config.md) | Config | Claude Desktop MCP configuration guide |
| [`python-integration.py`](examples/python-integration.py) | Python | MCP SDK + x402 payment integration |
| [`nodejs-x402-example.js`](examples/nodejs-x402-example.js) | Node.js | Batch calls with @goldbean/x402-sdk |

```bash
git clone https://github.com/wuzenghai616-lang/goldbean.git
cd goldbean/examples

# Python: Install deps and run
pip install mcp web3
python python-integration.py

# Node.js: Install deps and run
npm install @modelcontextprotocol/sdk @goldbean/x402-sdk
node nodejs-x402-example.js
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

### 🎯 Baidu AI Endpoints (Pay-per-Call) — 26 APIs

| Endpoint | Price | Description |
|----------|:-----:|-------------|
| `GET /paid/baidu-ocr` | $0.02 | General text OCR |
| `GET /paid/baidu-ocr-accurate` | $0.02 | High-accuracy OCR |
| `GET /paid/baidu-ocr-table` | $0.02 | Table structure OCR |
| `GET /paid/baidu-idcard` | $0.02 | ID card recognition |
| `GET /paid/baidu-tts?text=...` | $0.02 | Text-to-Speech (Chinese) |
| `GET /paid/baidu-translate?text=...` | $0.01 | Multi-language translation |
| `GET /paid/baidu-llm-chat?prompt=...` | $0.002/1K tokens | ERNIE chat (GPT-class LLM) |
| `GET /paid/baidu-asr?audio=...` | $0.02 | Speech-to-Text |
| `GET /paid/baidu-image-recognition?image=...` | $0.02 | Object/scene recognition |
| `GET /paid/baidu-image-enhance?image=...` | $0.02 | Image enhancement |
| `GET /paid/baidu-object-detect?image=...` | $0.02 | Object detection with bounding boxes |
| `GET /paid/baidu-landmark?image=...` | $0.02 | Landmark recognition |
| `GET /paid/baidu-face-detect?image=...` | $0.02 | Face detection & analysis |
| `GET /paid/baidu-face-compare?image1=...&image2=...` | $0.02 | 1:1 face comparison |
| `GET /paid/baidu-body-analysis?image=...` | $0.02 | Body/gesture analysis |
| `GET /paid/baidu-gesture?image=...` | $0.02 | Hand gesture recognition |
| `GET /paid/baidu-nlp?text=...` | $0.01 | NLP (lexer, sentiment, etc.) |
| `GET /paid/baidu-sentiment?text=...` | $0.01 | Sentiment analysis |
| `GET /paid/baidu-summary?text=...` | $0.01 | Text summarization |
| `GET /paid/baidu-word-embedding?text=...` | $0.01 | Word vector embedding |
| `GET /paid/baidu-text-correction?text=...` | $0.01 | Text error correction |
| `GET /paid/baidu-comment-tag?text=...` | $0.01 | Comment opinion tag extraction |
| `GET /paid/baidu-emotion?text=...` | $0.01 | Emotion detection in text |
| `GET /paid/baidu-keyword?text=...` | $0.01 | Article keyword extraction |
| `GET /paid/baidu-address?text=...` | $0.01 | Address parsing & structuring |
| `GET /paid/baidu-text-similarity?text1=...&text2=...` | $0.01 | Short text similarity score |
| `GET /paid/baidu-text-review?text=...` | $0.01 | Text content moderation |
| `GET /paid/baidu-image-review?image=...` | $0.01 | Image content moderation |
| `GET /paid/baidu-plant?image=...` | $0.02 | Plant species recognition |
| `GET /paid/baidu-animal?image=...` | $0.02 | Animal species recognition |
| `GET /paid/baidu-dish?image=...` | $0.02 | Dish/cuisine recognition |
| `GET /paid/baidu-ingredient?image=...` | $0.02 | Fruit/vegetable recognition |
| `GET /paid/baidu-currency?image=...` | $0.02 | Banknote/currency recognition |
| `GET /paid/baidu-car-type?image=...` | $0.02 | Car make/model recognition |
| `GET /paid/baidu-redwine?image=...` | $0.02 | Red wine label recognition |
| `GET /paid/baidu-logo?image=...` | $0.02 | Brand logo recognition |
| `GET /paid/baidu-ocr-handwrite?image=...` | $0.02 | Handwritten text OCR |
| `GET /paid/baidu-ocr-vin?image=...` | $0.02 | VIN code OCR |
| `GET /paid/baidu-image-colorize?image=...` | $0.02 | B&W photo colorization |
| `GET /paid/baidu-style-trans?image=...` | $0.02 | Artistic style transfer |
| `GET /paid/baidu-selfie-anime?image=...` | $0.02 | Portrait to anime conversion |
| `GET /paid/baidu-dehaze?image=...` | $0.02 | Image dehazing |
| `GET /paid/baidu-body-count?image=...` | $0.02 | People counting |
| `GET /paid/baidu-body-keypoints?image=...` | $0.02 | Body skeleton keypoints |
| `GET /paid/baidu-face-liveness?image=...` | $0.02 | Face liveness (anti-spoofing) |
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
Baidu AI APIs for Global Developers — Pay-per-Use.
