# GoldBean MCP Server — Claude Desktop / Cursor Configuration

## Quick Start

### Option 1: URL-based (recommended — always up to date)

Add GoldBean to your MCP client config:

**Claude Desktop (macOS):** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Claude Desktop (Windows):** `%APPDATA%\Claude\claude_desktop_config.json`
**Cursor:** Settings → MCP → Add new MCP Server

```json
{
  "mcpServers": {
    "goldbean": {
      "url": "https://goldbean-api.xyz/sse"
    }
  }
}
```

### Option 2: npx (local process)

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

## Available Tools (50+)

### Free Tools (no API key needed)
- `weather` — Get weather for any city
- `btc_price` — Bitcoin price in USD
- `eth_gas` — Ethereum gas price
- `service_health` — API health check

### OCR Tools (12 types)
- `baidu_ocr` — General text OCR ($0.02)
- `baidu_ocr_accurate` — High-accuracy OCR ($0.02)
- `baidu_ocr_table` — Table structure OCR ($0.02)
- `baidu_ocr_idcard` — ID card recognition ($0.02)
- `baidu_ocr_handwriting` — Handwritten text OCR ($0.02)
- `baidu_ocr_qrcode` — QR code recognition ($0.02)
- `baidu_ocr_bankcard` — Bank card OCR ($0.02)
- `baidu_ocr_business_license` — Business license OCR ($0.02)
- `baidu_deepseek_ocr` — Advanced OCR for complex layouts ($0.02)
- `baidu_paddleocr_vl` — Document parsing with layout analysis ($0.02)
- `baidu_qianfan_ocr` — General-purpose OCR, 32k context ($0.02)

### LLM Tools
- `baidu_llm_chat` — Chat with ERNIE LLM (Premium)
- `baidu_deepthink` — Deep reasoning with DeepSeek-R1 (Premium)
- `baidu_vision_chat` — Vision LLM, analyze images (Premium)

### Speech
- `baidu_tts` — Text-to-Speech ($0.02)
- `baidu_asr` — Speech-to-Text ($0.02)

### Translation
- `baidu_translate` — 200+ languages ($0.01)

### Vision & Recognition
- `baidu_image_recognition` — General image recognition ($0.02)
- `baidu_object_detect` — Object detection ($0.02)
- `baidu_landmark` — Landmark recognition ($0.02)
- `baidu_plant` — Plant species ($0.02)
- `baidu_animal` — Animal species ($0.02)
- `baidu_dish` — Dish/cuisine ($0.02)
- `baidu_logo` — Brand logo ($0.02)
- `baidu_car` — Car model ($0.02)
- `baidu_face_detect` — Face detection & analysis ($0.02)
- `baidu_face_compare` — 1:1 face comparison ($0.02)
- `baidu_gesture` — Hand gesture ($0.02)

### NLP
- `baidu_nlp` — Lexical analysis ($0.01)
- `baidu_sentiment` — Sentiment analysis ($0.01)
- `baidu_summary` — Text summarization ($0.01)
- `baidu_text_corrector` — Error correction ($0.01)
- `baidu_keyword_extraction` — Keyword extraction ($0.01)

### Embedding & Reranker
- `baidu_embedding` — Text embedding ($0.01)
- `baidu_reranker` — Document reranking ($0.01)

### Image & Video Generation
- `baidu_image_gen` — AI image generation (Premium)
- `baidu_image_edit` — AI image editing (Premium)
- `baidu_video_gen` — AI video generation (Premium)
- `baidu_video_query` — Query video task status ($0.01)

### Content Moderation
- `baidu_text_review` — Text moderation ($0.01)
- `baidu_image_review` — Image moderation ($0.01)

### Science
- `baidu_helixfold` — Protein structure prediction (Premium)

### Account
- `register` — Register for free API key
- `check_credits` — Check remaining credits

## Authentication

**Free tier:** 5 calls/day per IP — no registration needed.

**For more calls:** Use the `register` tool with your email to get 20 free credits and an API key.

**Payment:** PayPal, Alipay, or USDC on Base (x402 protocol). Visit https://goldbean-api.xyz/buy-credits.html to recharge.

## Usage Examples

In Claude Desktop or Cursor, try:

- "Use GoldBean to OCR this image: https://example.com/document.jpg"
- "Translate 'Hello World' to Chinese using GoldBean"
- "What's the weather in Tokyo? Use GoldBean."
- "Register me for GoldBean using email myname@example.com"
- "Use GoldBean to generate an image of a cat in Chinese ink painting style"
- "Analyze the sentiment of this review using GoldBean: 这产品质量很好"
