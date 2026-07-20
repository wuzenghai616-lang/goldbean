# 🫘 GoldBean — 53 Chinese AI Tools via x402 Micropayments

> **53 Baidu AI endpoints (19 OCR types, ERNIE LLM, TTS, ASR, vision, NLP, translation, search) — pay per call from $0.01 in USDC on Base. No API keys, no signup, no subscription.**

[![API Status](https://img.shields.io/website?url=https%3A%2F%2Fgoldbean-api.xyz%2Fhealth&label=API%20Status)](https://goldbean-api.xyz/health)
[![x402 Native](https://img.shields.io/badge/x402-Native%20on%20Base-blue)](https://x402.org)
[![npm](https://img.shields.io/npm/v/goldbean-mcp?color=orange)](https://www.npmjs.com/package/goldbean-mcp)
[![npm downloads](https://img.shields.io/npm/dm/goldbean-mcp)](https://www.npmjs.com/package/goldbean-mcp)
[![Glama Score](https://glama.ai/mcp/servers/wuzenghai616-lang/goldbean/badges/score.svg)](https://glama.ai/mcp/servers/wuzenghai616-lang/goldbean)
[![GitHub stars](https://img.shields.io/github/stars/wuzenghai616-lang/goldbean)](https://github.com/wuzenghai616-lang/goldbean/stargazers)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Free Tier](https://img.shields.io/badge/free%20tier-50%20calls%2Fday-brightgreen)](https://goldbean-api.xyz)
[![RapidAPI](https://img.shields.io/badge/RapidAPI-Live-green)](https://rapidapi.com/wuzenghai616lang/api/goldbean-chinese-ai)

**GoldBean** is the only Chinese AI multimodal API cluster in the x402 ecosystem. 53 production-ready endpoints powered by Baidu AI — OCR (19 types), image recognition (10 types), ERNIE LLM, TTS, ASR, NLP, translation, face detection, image/video generation, and search. All accessible via MCP protocol with pay-per-call pricing.

**No API keys. No signup. No subscription. Pay per call in USDC on Base, or use PayPal/Alipay for prepaid credits. 50 free calls/day per IP.**

---

## ✨ Key Features

| Feature | Details |
|---------|---------|
| **53 AI Endpoints** | 19 OCR types, 10 image recognition, ERNIE LLM, TTS, ASR, NLP (6 types), translation (28+ languages), face/gesture/body detection, image/video generation, web search |
| **x402 Native** | Pay $0.01–$0.08 per call with USDC on Base mainnet — 2-second settlement, no KYC |
| **No API Keys** | x402 payment replaces API keys. Free tier needs nothing — just call the endpoint |
| **Free Tier** | 50 free API calls/day per IP + 100 credits on registration — no wallet needed |
| **MCP Compatible** | Works with Cursor, Claude Desktop, Cline, Codex, Continue |
| **PayPal & Alipay** | Also supported for prepaid credits |
| **Baidu AI Powered** | Enterprise-grade AI from China's leading AI platform |

---

## 🚀 Quick Start

### Option 1: MCP Server (Cursor / Claude / Cline)

```bash
npx goldbean-mcp
```

Add to your MCP client config:

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

### Option 2: REST API (curl / any HTTP client)

```bash
# Free call — no payment, no API key
curl "https://goldbean-api.xyz/health"

# Paid call — x402 payment (USDC on Base)
curl -X POST "https://goldbean-api.xyz/paid/baidu-ocr" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/document.jpg"}'
# → 402 Payment Required → Pay USDC → 200 OK with OCR result

# Register for 100 free credits
curl -X POST "https://goldbean-api.xyz/paid/user/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

---

## 📡 API Endpoints

### 🆓 Free Endpoints (No Payment)

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health check |
| `GET /.well-known/x402.json` | x402 payment discovery |
| `GET /.well-known/mcp.json` | MCP server metadata |
| `GET /openapi.json` | OpenAPI specification |
| `GET /api/routes` | Full route registry |
| `GET /api/pricing/plans` | Pricing plans |

### 💳 Paid Endpoints (x402 / Credits)

#### OCR — 19 types ($0.005/call)

| Tool | Description |
|------|-------------|
| `baidu_ocr` | General printed text OCR — 20+ languages |
| `baidu_ocr_accurate` | High-precision OCR for blurry/low-quality images |
| `baidu_ocr_table` | Structured table extraction |
| `baidu_ocr_idcard` | Chinese ID card extraction (front + back) |
| `baidu_ocr_handwriting` | Handwritten Chinese/English text |
| `baidu_ocr_qrcode` | QR code and barcode decoding |
| `baidu_ocr_bankcard` | Bank card number and bank name |
| `baidu_ocr_business_license` | Chinese business license fields |
| `baidu_ocr_webimage` | OCR for web images with complex backgrounds |
| `baidu_deepseek_ocr` | VLM-powered OCR for complex layouts |
| `baidu_paddleocr_vl` | PaddleOCR-VL for tables, formulas, stamps |
| `baidu_qianfan_ocr` | Custom template-based OCR |
| `baidu_ocr_numbers` | Number/digit recognition |
| `baidu_ocr_seal` | Seal/stamp OCR |
| `baidu_ocr_train_ticket` | Train ticket extraction |
| `baidu_ocr_receipt` | Receipt/invoice OCR |
| `baidu_ocr_invoice` | VAT invoice extraction |
| `baidu_ocr_passport` | Passport field extraction |
| `baidu_ocr_license_plate` | License plate recognition |

#### LLM — 3 tools ($0.005/call)

| Tool | Description |
|------|-------------|
| `baidu_llm_chat` | ERNIE LLM chat — ernie-4.0-8k, ernie-3.5-8k, ernie-speed-128k |
| `baidu_deepthink` | ERNIE deep reasoning — multi-step proofs, logical analysis |
| `baidu_vision_chat` | Vision-language chat — ask questions about images (ERNIE-VL) |

#### Speech — 2 tools ($0.005/call)

| Tool | Description |
|------|-------------|
| `baidu_tts` | Text-to-speech — Chinese/English, 6 voice personas, MP3/WAV |
| `baidu_asr` | Speech-to-text — Chinese/English, word-level timestamps |

#### Translation — 2 tools ($0.003/call)

| Tool | Description |
|------|-------------|
| `baidu_translate` | 28+ language translation with auto-detect |
| `baidu_translate_pro` | Enhanced translation with x402 metadata response |

#### Vision — 10 tools ($0.005/call)

| Tool | Description |
|------|-------------|
| `baidu_image_recognition` | General image recognition with Baike entries |
| `baidu_object_detect` | Multi-object detection with bounding boxes |
| `baidu_landmark` | Landmark/building identification with GPS |
| `baidu_plant` | Plant species identification (20,000+ species) |
| `baidu_animal` | Animal species identification (10,000+ species) |
| `baidu_dish` | Dish/food recognition with calorie estimation |
| `baidu_logo` | Brand logo detection and identification |
| `baidu_car` | Vehicle make/model/year (3,000+ models) |
| `baidu_ingredient` | Food ingredient identification |
| `baidu_vehicle_detect` | Vehicle detection and counting — traffic/parking |

#### Face & Body — 4 tools ($0.005/call)

| Tool | Description |
|------|-------------|
| `baidu_face_detect` | Face detection with 10+ attributes (age, gender, emotion) |
| `baidu_face_compare` | 1:1 face comparison — identity verification |
| `baidu_body_analysis` | Body attribute analysis — gender, clothing, orientation |
| `baidu_gesture` | Hand gesture recognition — 20+ gesture types |

#### NLP — 6 tools ($0.003/call)

| Tool | Description |
|------|-------------|
| `baidu_nlp` | Chinese NLP — word segmentation, POS tagging, dependency parsing |
| `baidu_sentiment` | Sentiment analysis — positive/negative/neutral |
| `baidu_summary` | Text summarization — abstractive with configurable length |
| `baidu_text_corrector` | Chinese text error correction |
| `baidu_keyword_extraction` | Keyword/phrase extraction with relevance ranking |
| `baidu_word_embedding` | Word-level vector embedding (64-512 dimensions) |

#### Image & Video Generation — 4 tools

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_image_gen` | $0.03 | Text-to-image — realistic/anime/sketch/oil_painting/3d |
| `baidu_image_edit` | $0.03 | Image editing via text instructions |
| `baidu_video_gen` | $0.08 | Text-to-video generation (MuseSteamer) |
| `baidu_video_query` | $0.005 | Query async video generation task status |

#### Search — 1 tool ($0.005/call)

| Tool | Description |
|------|-------------|
| `baidu_search` | Web search with instant answers and related topics |

#### Embedding & Science — 3 tools

| Tool | Price | Description |
|------|:-----:|-------------|
| `baidu_embedding` | $0.005 | Text embedding for semantic search/RAG |
| `baidu_reranker` | $0.005 | Document reranking by query relevance |
| `baidu_helixfold` | $0.005 | Protein 3D structure prediction (AlphaFold-inspired) |

---

## 💰 Pricing

| Plan | Price | Calls | Type |
|------|-------|-------|------|
| Free Tier | $0 | 50/day per IP | No wallet needed |
| Starter | $5 one-time | 100 calls | Pay-per-call credit |
| Monthly | $29.9/month | Unlimited | Subscription |
| Quarterly | $69/quarter | Unlimited | Subscription |
| Yearly | $269/year | Unlimited | Subscription |

> Or pay per call without subscription — from **$0.01/call** (OCR/vision/speech) to **$0.08/call** (video generation) in USDC on Base.

**Payment methods:** x402 USDC (Base mainnet) | PayPal | Alipay

**Accepting wallet:** `0x7484b0bca25d2ee56e9b0535572d4cf44a047d98` (Base/USDC)

---

## 🔧 How x402 Payments Work

```
1. Agent calls endpoint → 402 Payment Required
2. Wallet signs USDC tx on Base → sends payment payload
3. Server verifies on-chain → serves the data (2-second settlement)
```

**No KYC. No subscription. No credit card. No API keys.**

Powered by the [x402 protocol](https://x402.org) — decentralized micropayments for AI agents.

---

## 📦 MCP Installation

```bash
npm install -g goldbean-mcp
```

Or use directly:

```bash
npx goldbean-mcp
```

**Compatible with:** Cursor, Claude Desktop, Cline, Codex, Continue, and any MCP-compatible client.

---

## 🏗️ Architecture

```
┌──────────────┐    HTTPS    ┌──────────────────────┐
│  MCP Client   │ ──────────→ │  GoldBean API Server  │
│  (Claude,     │ ←────────── │  v9.8.0 on VPS       │
│   Cursor,     │    402/200  │  port 9879 + 3099    │
│   Cline)      │             │                      │
└──────────────┘             ├── Baidu AI (53 tools) │
                              ├── x402 USDC (Base)    │
┌──────────────┐             ├── PayPal / Alipay     │
│  REST Client  │──────────→ │── Free tier (50/day)  │
│  (curl/HTTP)  │             └──────────────────────┘
└──────────────┘
```

---

## 🌐 Platform Presence

| Platform | Status |
|----------|--------|
| npm (`goldbean-mcp`) | Published |
| Glama.ai | Active |
| MCPize | Monetized |
| x402 Bazaar | Listed |
| ScoutGate | Registered |
| Bankr x402 Cloud | Deployed (3 endpoints) |
| awesome-x402 | Listed |

---

## 📖 Documentation

- **API Reference**: https://goldbean-api.xyz/openapi.json
- **Route Registry**: https://goldbean-api.xyz/api/routes
- **x402 Discovery**: https://goldbean-api.xyz/.well-known/x402.json
- **MCP Config**: https://goldbean-api.xyz/.well-known/mcp.json
- **Pricing**: https://goldbean-api.xyz/paid/plans
- **Live Demo**: https://goldbean-api.xyz/#demo

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- Star this repo — it helps others discover GoldBean
- Report bugs via GitHub Issues
- Improve documentation
- Share on social media

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

**GoldBean (GB) — Wishing You Good Fortune & Prosperity 🫘**

53 Chinese AI tools via x402 micropayments — No API keys, no signup, pay per call from $0.003.
