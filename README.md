# 🫘 GoldBean — China AI Gateway for Global Developers

> **Access 67 Baidu AI endpoints (OCR, Translation, TTS, ASR, ERNIE LLM, HelixFold, Video Generation) from anywhere — no Chinese phone number, no Baidu Cloud account, no real-name verification required**

[![API Status](https://img.shields.io/website?url=https%3A%2F%2Fgoldbean-api.xyz%2Fhealth&label=API%20Status)](https://goldbean-api.xyz/health)
[![public-apis](https://img.shields.io/badge/public--apis-39.8k%20%E2%AD%90-blue?logo=github)](https://github.com/public-apis/public-apis)
[![awesome-mcp-servers](https://img.shields.io/badge/awesome--mcp--servers-%E2%9C%85-brightgreen?logo=github)](https://github.com/punkpeye/awesome-mcp-servers)
[![awesome-x402](https://img.shields.io/badge/awesome--x402-%E2%9A%A1-yellow?logo=github)](https://github.com/xpaysh/awesome-x402)
[![Glama Score](https://glama.ai/mcp/servers/wuzenghai616-lang/goldbean/badges/score.svg)](https://glama.ai/mcp/servers/wuzenghai616-lang/goldbean)
[![MCPize](https://img.shields.io/badge/MCPize-monetized-blueviolet?logo=codefactor)](https://mcpize.com/mcp/goldbean)
[![npm](https://img.shields.io/npm/v/goldbean-mcp?color=orange)](https://www.npmjs.com/package/goldbean-mcp)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**GoldBean** is the only standardized gateway for global developers to access **67 Baidu AI endpoints** via MCP protocol — OCR (19 types including Qianfan-OCR & PP-StructureV3), TTS, ASR, ERNIE LLM, translation, image recognition, face detection, gesture, object detection, landmark, image processing, content moderation, NLP (10 types), HelixFold protein structure prediction, MuseSteamer video generation — all with **pay-per-call pricing from $0.001 via x402 USDC micropayments, PayPal, or Alipay**.

Baidu AI is world-class at Chinese text, voice, and image processing. But using it directly requires a Chinese phone number, real-name verification, and a Baidu Cloud account — barriers that exclude most overseas developers. GoldBean removes all of them.

**No Chinese phone number. No Baidu account. No real-name verification. Pay per call or subscribe for bulk discounts.**

---

## ✨ Features

| Feature | Details |
|---------|---------|
| **51 MCP Tools + 67 REST Routes (57 paid + 10 free)** | OCR (19 types incl. Qianfan-OCR & PP-StructureV3), TTS, ASR, Translation, LLM Chat, Face (detect + compare + liveness), Gesture, Object Detect, Landmark, Plant/Animal/Dish/Ingredient/Currency/Car/RedWine/Logo Recognition, Image Processing (colorize, style transfer, selfie anime, dehaze), Content Moderation, NLP (10 types), HelixFold, Video Generation (MuseSteamer) |
| **x402 Micropayments** | Pay $0.001–$0.08 per call with USDC on Base network |
| **Free Tier** | 50 free calls/day per IP + 100 credits on registration — no wallet needed |
| **PayPal & Alipay** | Also supported for prepaid credits |
| **MCP Compatible** | Works with Cursor, Claude Desktop, Cline, Codex, Continue |
| **Baidu AI Powered** | Enterprise-grade AI from China's leading AI platform |
| **HelixFold3** | Nature-published, AlphaFold3-class protein/RNA structure prediction |

---

## 🤔 Why GoldBean?

> **Need Baidu OCR but can't register Baidu Cloud?**

GoldBean is the **only China AI Gateway** that lets overseas developers access Baidu AI APIs **without a Chinese phone number, real-name verification, or WeChat Pay**.

- ✅ **Zero barriers** — no Chinese ID, no phone number, no enterprise account
- ✅ **67 endpoints via MCP** — plug into Cursor, Claude, Cline, Continue directly
- ✅ **Pay per call from $0.001** — no subscription, no minimum, no KYC
- ✅ **Free to start** — 50 calls/day per IP (no signup) + 100 credits on registration
- ✅ **Works globally** — US, EU, SEA, anywhere with internet

Whether you need Chinese OCR for document scanning, translation for multilingual products, or TTS for voice apps — GoldBean is the only way to use Baidu AI without a Chinese account.

---


## 🏗️ Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           GoldBean API Platform          │
                    │            (goldbean-api.xyz)             │
                    ├─────────────┬─────────────┬────────────┤
  ┌─────────┐       │             │             │            │
  │ Cursor  │──────▶│   Node.js   │   Payment   │   Baidu    │
  │ Claude  │  MCP   │   Server    │   Layer     │   AI APIs │
  │ Cline   │       │  (Express)  │             │            │
  └─────────┘       │             │             │            │
                    │  ┌────────┐ │ ┌─────────┐ │ ┌────────┐│
  ┌─────────┐       │  │ Route  │ │ │ x402    │ │ │ OCR    ││
  │  REST   │──────▶│  │ Layer  │ │ │ USDC   │ │ │ LLM    ││
  │ Client  │ HTTP  │  │ 67 routes │ │ │ PayPal │ │ │ TTS/ASR││
  └─────────┘       │  └────────┘ │ │ Alipay  │ │ │ Vision ││
                    │       │      │ └─────────┘ │ │ NLP    ││
                    │       ▼      │      │      │ │ Video  ││
                    │  ┌────────┐ │      ▼      │ │ Protein ││
                    │  │ User  │ │ ┌─────────┐ │ └────────┘│
                    │  │ Store │ │ │Wallet   │ │     │     │
                    │  │ (JSON)│ │ │(Coinbase)│ │     ▼     │
                    │  └────────┘ │ └─────────┘ │  10 Apps │
                    │             │             │  (AK/SK)  │
                    └─────────────┴─────────────┴────────────┘
                                                          
  Payment Flow:  Client ──▶ 402 Response ──▶ Pay USDC ──▶ 200 OK
                Client ──▶ PayPal/Alipay ──▶ Credits ──▶ 200 OK
```

**Key Components:**

- **Route Layer**: 67 endpoints (57 paid + 10 free), JSON-based user store
- **Payment Layer**: x402/USDC via Coinbase Facilitator, PayPal & Alipay prepaid credits
- **Baidu AI Backend**: 10 Baidu apps with automatic token rotation (AK/SK management)
- **MCP Server**: npm package (`goldbean-mcp`) for Cursor/Claude/Cline integration

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
# Register for 100 free API calls
curl -X POST https://goldbean-api.xyz/paid/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'

# Response: {"success":true,"apiKey":"GB_XXXXXX","freeCredits":100}

# Call an API with free credits
curl "https://goldbean-api.xyz/paid/baidu-ocr?url=https://example.com/doc.jpg" \
  -H "x-user-id: GB_XXXXXX"
```

---


## 📚 Code Examples

We provide ready-to-use code examples in the [`examples/`](examples/) directory:

| Example | Language | Description |
|---------|----------|-------------|
| [`quickstart.py`](examples/quickstart.py) | Python | Full SDK with all endpoints — best starting point |
| [`quickstart.js`](examples/quickstart.js) | Node.js | Full SDK with all endpoints |
| [`mcp-integration.py`](examples/mcp-integration.py) | Python | MCP SDK integration example |
| [`claude-desktop-config.md`](examples/claude-desktop-config.md) | Config | Claude Desktop MCP configuration guide |
| [`python-integration.py`](examples/python-integration.py) | Python | Legacy MCP + x402 example |

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

### 🎯 Baidu AI Endpoints (Pay-per-Call) — 37 APIs

| Endpoint | Price | Description |
|----------|:-----:|-------------|
| `GET /paid/baidu-ocr` | $0.001 | General text OCR |
| `GET /paid/baidu-ocr-accurate` | $0.001 | High-accuracy OCR |
| `GET /paid/baidu-ocr-table` | $0.001 | Table structure OCR |
| `GET /paid/baidu-idcard` | $0.001 | ID card recognition |
| `GET /paid/baidu-tts?text=...` | $0.001 | Text-to-Speech (Chinese) |
| `GET /paid/baidu-translate?text=...` | $0.001 | Multi-language translation |
| `GET /paid/baidu-llm-chat?prompt=...` | $0.002/1K tokens | ERNIE chat (GPT-class LLM) |
| `GET /paid/baidu-asr?audio=...` | $0.001 | Speech-to-Text |
| `GET /paid/baidu-image-recognition?image=...` | $0.001 | Object/scene recognition |
| `GET /paid/baidu-image-enhance?image=...` | $0.001 | Image enhancement |
| `GET /paid/baidu-object-detect?image=...` | $0.001 | Object detection with bounding boxes |
| `GET /paid/baidu-landmark?image=...` | $0.001 | Landmark recognition |
| `GET /paid/baidu-face-detect?image=...` | $0.001 | Face detection & analysis |
| `GET /paid/baidu-face-compare?image1=...&image2=...` | $0.001 | 1:1 face comparison |
| `GET /paid/baidu-body-analysis?image=...` | $0.001 | Body/gesture analysis |
| `GET /paid/baidu-gesture?image=...` | $0.001 | Hand gesture recognition |
| `GET /paid/baidu-nlp?text=...` | $0.001 | NLP (lexer, sentiment, etc.) |
| `GET /paid/baidu-sentiment?text=...` | $0.001 | Sentiment analysis |
| `GET /paid/baidu-summary?text=...` | $0.001 | Text summarization |
| `GET /paid/baidu-word-embedding?text=...` | $0.001 | Word vector embedding |
| `GET /paid/baidu-text-correction?text=...` | $0.001 | Text error correction |
| `GET /paid/baidu-comment-tag?text=...` | $0.001 | Comment opinion tag extraction |
| `GET /paid/baidu-emotion?text=...` | $0.001 | Emotion detection in text |
| `GET /paid/baidu-keyword?text=...` | $0.001 | Article keyword extraction |
| `GET /paid/baidu-address?text=...` | $0.001 | Address parsing & structuring |
| `GET /paid/baidu-text-similarity?text1=...&text2=...` | $0.001 | Short text similarity score |
| `GET /paid/baidu-text-review?text=...` | $0.001 | Text content moderation |
| `GET /paid/baidu-image-review?image=...` | $0.001 | Image content moderation |
| `GET /paid/baidu-plant?image=...` | $0.001 | Plant species recognition |
| `GET /paid/baidu-animal?image=...` | $0.001 | Animal species recognition |
| `GET /paid/baidu-dish?image=...` | $0.001 | Dish/cuisine recognition |
| `GET /paid/baidu-ingredient?image=...` | $0.001 | Fruit/vegetable recognition |
| `GET /paid/baidu-currency?image=...` | $0.001 | Banknote/currency recognition |
| `GET /paid/baidu-car-type?image=...` | $0.001 | Car make/model recognition |
| `GET /paid/baidu-redwine?image=...` | $0.001 | Red wine label recognition |
| `GET /paid/baidu-logo?image=...` | $0.001 | Brand logo recognition |
| `GET /paid/baidu-ocr-handwrite?image=...` | $0.001 | Handwritten text OCR |
| `GET /paid/baidu-ocr-vin?image=...` | $0.001 | VIN code OCR |
| `GET /paid/baidu-image-colorize?image=...` | $0.001 | B&W photo colorization |
| `GET /paid/baidu-style-trans?image=...` | $0.001 | Artistic style transfer |
| `GET /paid/baidu-selfie-anime?image=...` | $0.001 | Portrait to anime conversion |
| `GET /paid/baidu-dehaze?image=...` | $0.001 | Image dehazing |
| `GET /paid/baidu-body-count?image=...` | $0.001 | People counting |
| `GET /paid/baidu-body-keypoints?image=...` | $0.001 | Body skeleton keypoints |
| `GET /paid/baidu-face-liveness?image=...` | $0.001 | Face liveness (anti-spoofing) |
| `GET /paid/baidu-helixfold?seq=...` | $0.03 | Protein structure prediction |
| `GET /paid/baidu-vision-chat?image=...&message=...` | $0.001 | Vision understanding (ERNIE-4.5-VL / Qwen3-VL) |
| `GET /paid/baidu-deepthink?message=...` | $0.003 | Deep reasoning (DeepSeek-R1, chain-of-thought) |
| `GET /paid/baidu-embedding?text=...` | $0.001 | Text embedding (embedding-v1, BGE, Qwen3) |
| `GET /paid/baidu-reranker?query=...&documents=...` | $0.001 | Document reranking (BCE / Qwen3 reranker) |
| `GET /paid/baidu-image-gen?prompt=...` | $0.03 | Text-to-image (Qwen-Image, CJK text rendering) |
| `GET /paid/baidu-image-edit?image=...&prompt=...` | $0.03 | Image editing (Qwen-Image-Edit, multi-image fusion) |
| `GET /paid/baidu-deepseek-ocr?image=...` | $0.001 | Advanced OCR (DeepSeek-OCR, complex layouts) |
| `GET /paid/baidu-paddleocr-vl?image=...` | $0.001 | Document parsing (PaddleOCR-VL, layout analysis) |
| `GET /paid/baidu-qianfan-ocr?image=...` | $0.001 | General-purpose OCR (Qianfan-OCR, 32k context) |
| `GET /paid/baidu-video-gen?prompt=...&image=...` | $0.08 | Video generation (MuseSteamer, text/image-to-video) |
| `GET /paid/baidu-video-query?task_id=...` | $0.001 | Query video generation task status |

### 💳 Subscription Plans

| Plan | Price | Calls | Per Call |
|------|-------|-------|----------|
| Free Tier | $0 | 50/day per IP | $0 |
| Starter | $5 one-time | 500 calls | $0.01 |
| Developer Monthly | $9.9/month | 5,000 calls | $0.002 |
| Developer Quarterly | $25/quarter | 20,000 calls | $0.0013 |
| Developer Yearly | $89/year | 100,000 calls | $0.0009 |

> Or pay per call without subscription — starting at **$0.001/call**.

### 💳 Account & Payment

| Endpoint | Description |
|----------|-------------|
| `POST /paid/user/register` | Register for 100 free credits |
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
│  (Claude,     │ ←────────── │  v9.8.0 on VPS       │
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
