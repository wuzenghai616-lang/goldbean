# GoldBean MCP Server — Directory Submission

## Overview

GoldBean is a pay-per-call AI API gateway that bridges **Baidu AI** to global developers. It provides 60+ endpoints covering OCR, TTS, ASR, Translation, LLM Chat, Vision, NLP, Image Generation, and Video Generation — accessible via MCP, REST, or OpenAI-compatible API.

**No Chinese phone number, no Baidu Cloud account, no subscription required.**

## Installation

### Option 1: URL-based (recommended — always up to date)

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
| Tool | Description |
|------|-------------|
| `btc_price` | Get current Bitcoin price in USD |
| `eth_gas` | Get current Ethereum gas price |
| `weather` | Get weather for any city |
| `service_health` | Check API service health |

### OCR Tools
| Tool | Price | Description |
|------|-------|-------------|
| `baidu_ocr` | $0.02 | General text OCR |
| `baidu_ocr_accurate` | $0.02 | High-accuracy OCR |
| `baidu_ocr_table` | $0.02 | Table structure OCR |
| `baidu_ocr_idcard` | $0.02 | ID card recognition |
| `baidu_ocr_handwriting` | $0.02 | Handwritten text OCR |
| `baidu_ocr_qrcode` | $0.02 | QR code recognition |
| `baidu_ocr_bankcard` | $0.02 | Bank card recognition |
| `baidu_ocr_business_license` | $0.02 | Business license OCR |
| `baidu_ocr_webimage` | $0.02 | Web image OCR |
| `baidu_deepseek_ocr` | $0.02 | Advanced OCR (complex layouts) |
| `baidu_paddleocr_vl` | $0.02 | Document parsing with layout analysis |
| `baidu_qianfan_ocr` | $0.02 | General-purpose OCR (32k context) |

### Speech Tools
| Tool | Price | Description |
|------|-------|-------------|
| `baidu_tts` | $0.02 | Text-to-Speech (Chinese) |
| `baidu_asr` | $0.02 | Speech-to-Text |

### LLM Tools
| Tool | Price | Description |
|------|-------|-------------|
| `baidu_llm_chat` | Premium | Chat with ERNIE LLM |
| `baidu_deepthink` | Premium | Deep reasoning (DeepSeek-R1) |
| `baidu_vision_chat` | Premium | Vision LLM (ERNIE-4.5-VL) |

### Vision & Recognition Tools
| Tool | Price | Description |
|------|-------|-------------|
| `baidu_image_recognition` | $0.02 | General image recognition |
| `baidu_object_detect` | $0.02 | Object detection |
| `baidu_landmark` | $0.02 | Landmark recognition |
| `baidu_plant` | $0.02 | Plant species recognition |
| `baidu_animal` | $0.02 | Animal species recognition |
| `baidu_dish` | $0.02 | Dish/cuisine recognition |
| `baidu_logo` | $0.02 | Brand logo recognition |
| `baidu_car` | $0.02 | Car model recognition |
| `baidu_face_detect` | $0.02 | Face detection & analysis |
| `baidu_face_compare` | $0.02 | 1:1 face comparison |
| `baidu_body_analysis` | $0.02 | Body analysis |
| `baidu_gesture` | $0.02 | Hand gesture recognition |

### NLP Tools
| Tool | Price | Description |
|------|-------|-------------|
| `baidu_nlp` | $0.01 | NLP lexical analysis |
| `baidu_sentiment` | $0.01 | Sentiment analysis |
| `baidu_summary` | $0.01 | Text summarization |
| `baidu_translate` | $0.01 | Multi-language translation |
| `baidu_text_corrector` | $0.01 | Text error correction |
| `baidu_keyword_extraction` | $0.01 | Keyword extraction |
| `baidu_word_embedding` | $0.01 | Word vector embedding |

### Embedding & Reranker Tools
| Tool | Price | Description |
|------|-------|-------------|
| `baidu_embedding` | $0.01 | Text embedding |
| `baidu_reranker` | $0.01 | Document reranking |

### Image & Video Generation Tools
| Tool | Price | Description |
|------|-------|-------------|
| `baidu_image_gen` | Premium | AI image generation (Qwen-Image) |
| `baidu_image_edit` | Premium | AI image editing |
| `baidu_video_gen` | Premium | AI video generation (MuseSteamer) |
| `baidu_video_query` | $0.01 | Query video generation status |

### Content Moderation Tools
| Tool | Price | Description |
|------|-------|-------------|
| `baidu_text_review` | $0.01 | Text content moderation |
| `baidu_image_review` | $0.01 | Image content moderation |

### Science Tools
| Tool | Price | Description |
|------|-------|-------------|
| `baidu_helixfold` | Premium | Protein structure prediction |

## Authentication

**Free tier:** 5 calls/day per IP — no registration needed.

**For more calls:** Register at `POST /paid/user/register` with your email to get 20 free credits and an API key (`GB_XXXXXXXX`).

**Payment options:**
- PayPal (from $1)
- Alipay (支付宝)
- USDC on Base (x402 protocol)

## Links

- **Website:** https://goldbean-api.xyz
- **Documentation:** https://goldbean-api.xyz/docs
- **API Reference:** https://goldbean-api.xyz/openapi.json
- **GitHub:** https://github.com/wuzenghai616-lang/goldbean
- **npm:** https://www.npmjs.com/package/goldbean-mcp
- **Smithery:** https://smithery.ai/servers/wuzenghai616/goldbean
- **Glama:** https://glama.ai/mcp/servers/wuzenghai616-lang/goldbean

## License

MIT
