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
| `GET /.well-known/x402-bazaar` | x402 payment discovery |
| `GET /.well-known/mcp.json` | MCP server metadata |
| `GET /api/routes` | Full route registry |

### 🎯 Baidu AI Tools (51 MCP Tools via Pay-per-Call)

#### OCR (12 tools)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_ocr` | $0.001 | General printed text OCR — 20+ languages, default choice for most OCR tasks |
| `baidu_ocr_accurate` | $0.001 | High-precision OCR for blurry/low-quality images where baidu_ocr is insufficient |
| `baidu_ocr_table` | $0.001 | Structured table extraction — preserves row/column/cell structure |
| `baidu_ocr_idcard` | $0.001 | Chinese ID card field extraction (front + back) |
| `baidu_ocr_handwriting` | $0.001 | Handwritten Chinese/English text recognition |
| `baidu_ocr_qrcode` | $0.001 | QR code and barcode detection/decoding |
| `baidu_ocr_bankcard` | $0.001 | Bank card number, type, and bank name extraction |
| `baidu_ocr_business_license` | $0.001 | Chinese business license field extraction |
| `baidu_ocr_webimage` | $0.001 | OCR for web images with complex backgrounds/watermarks |
| `baidu_deepseek_ocr` | $0.001 | VLM-powered OCR for complex layouts requiring contextual understanding |
| `baidu_paddleocr_vl` | $0.001 | PaddleOCR-VL for documents with tables, formulas, stamps |
| `baidu_qianfan_ocr` | $0.001 | Custom template-based OCR via Qianfan platform |

#### Speech (2 tools)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_tts` | $0.001 | Text-to-speech — Chinese/English, 6 voice personas, MP3/WAV output |
| `baidu_asr` | $0.001 | Speech-to-text — Chinese/English, word-level timestamps, WAV/MP3/PCM/AMR |

#### LLM (3 tools)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_llm_chat` | $0.002/1K | ERNIE LLM chat — conversational AI, Q&A, code generation (ernie-4.0-8k, ernie-3.5-8k, ernie-speed-128k) |
| `baidu_deepthink` | $0.002/1K | ERNIE deep reasoning — multi-step proofs, logical analysis with thinking budget |
| `baidu_vision_chat` | $0.002/1K | Vision-language chat — ask questions about images, scene description (ERNIE-VL) |

#### Translation (1 tool)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_translate` | $0.001 | 28+ language translation with auto-detect |

#### Vision (10 tools)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_image_recognition` | $0.001 | General image recognition — objects, scenes, concepts with Baike entries |
| `baidu_object_detect` | $0.001 | Multi-object detection with bounding boxes and per-category count |
| `baidu_landmark` | $0.001 | Landmark/building identification with GPS coordinates |
| `baidu_plant` | $0.001 | Plant species identification (20,000+ species) |
| `baidu_animal` | $0.001 | Animal species identification (10,000+ species) |
| `baidu_dish` | $0.001 | Dish/food recognition with calorie estimation |
| `baidu_logo` | $0.001 | Brand logo detection and identification |
| `baidu_car` | $0.001 | Vehicle make/model/year identification (3,000+ models) |
| `baidu_ingredient` | $0.001 | Food ingredient/raw material identification |
| `baidu_vehicle_detect` | $0.001 | Vehicle detection and counting — traffic/parking (car/truck/bus/motorcycle) |

#### Face & Body (4 tools)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_face_detect` | $0.001 | Face detection with 10+ attributes (age, gender, emotion, mask, glasses) |
| `baidu_face_compare` | $0.001 | 1:1 face comparison — identity verification with similarity score 0-100 |
| `baidu_body_analysis` | $0.001 | Body attribute analysis — gender, clothing color, orientation |
| `baidu_gesture` | $0.001 | Hand gesture recognition — 20+ gesture types with keypoints |

#### Image Processing & Generation (3 tools)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_image_enhance` | $0.001 | Image quality enhancement — denoise, dehaze, contrast, clarity |
| `baidu_image_gen` | $0.03 | Text-to-image generation — 4 styles (realistic/anime/sketch/oil_painting/3d) |
| `baidu_image_edit` | $0.03 | Image editing via text instructions — add/remove/modify with optional mask |

#### Video Generation (2 tools)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_video_gen` | $0.08 | Text-to-video generation (async, use baidu_video_query to check status) |
| `baidu_video_query` | $0.001 | Query async video generation task status and get download URL |

#### NLP (6 tools)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_nlp` | $0.001 | Chinese NLP — word segmentation, POS tagging, dependency parsing |
| `baidu_sentiment` | $0.001 | Sentiment analysis — positive/negative/neutral with confidence scores |
| `baidu_summary` | $0.001 | Text summarization — abstractive summary with configurable length |
| `baidu_text_corrector` | $0.001 | Chinese text error correction — spelling, grammar, punctuation |
| `baidu_keyword_extraction` | $0.001 | Keyword/phrase extraction with relevance ranking |
| `baidu_word_embedding` | $0.001 | Word-level vector embedding (64/128/256/512 dimensions) |

#### Embedding & Reranking (2 tools)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_embedding` | $0.002/1K | Text embedding for semantic search/RAG (embedding-v1, BGE models, up to 16 texts/batch) |
| `baidu_reranker` | $0.002/1K | Document reranking by query relevance — refine RAG retrieval (up to 100 docs) |

#### Moderation (2 tools)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_text_review` | $0.001 | Text content moderation — spam, abuse, profanity, policy violations (6 categories) |
| `baidu_image_review` | $0.001 | Image content moderation — inappropriate/violent/policy-violating material |

#### Science (1 tool)

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_helixfold` | $0.001 | Protein 3D structure prediction from amino acid sequence (AlphaFold-inspired) |

#### Account (2 tools)

| Tool | Price | Description |
|------|:-----:|-------------|
| `register` | Free | Register GoldBean account — get API key + 100 free credits |
| `check_credits` | Free | Check remaining credits, usage stats, and subscription status |
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
│   Cursor,     │    402/200  │  port 3099            │
│   Cline)      │             │                      │
└──────────────┘             ├── Baidu AI (OCR/TTS)  │
                              ├── x402 USDC           │
┌──────────────┐             ├── HelixFold3          │
│  Web Browser  │──────────→ │── PayPal/Alipay       │
│  (curl/REST)  │             │── MuseSteamer Video   │
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
