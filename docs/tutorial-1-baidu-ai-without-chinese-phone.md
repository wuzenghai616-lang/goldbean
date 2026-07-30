# How to Access Baidu AI APIs Without a Chinese Phone Number (Using MCP)

> **TL;DR:** Baidu AI offers world-class OCR, TTS, and LLM APIs — but they require a Chinese phone number and real-name verification. GoldBean removes that barrier. Here's how to use Baidu AI from anywhere in the world via MCP.

## The Problem

Baidu AI Platform (百度智能云) provides some of the best AI APIs for Chinese language processing:

- **ERNIE LLM** — Baidu's GPT-class language model, excellent at Chinese
- **OCR** — Best-in-class Chinese text recognition (19 specialized OCR types)
- **TTS/ASR** — Natural Chinese text-to-speech and speech-to-text
- **Image Recognition** — Plants, animals, dishes, cars, faces, landmarks

But to use them directly, you need:
1. ❌ A Chinese phone number (+86)
2. ❌ Chinese real-name verification (实名认证)
3. ❌ A Baidu Cloud account
4. ❌ WeChat Pay or Alipay for billing

If you're a developer in the US, Europe, or anywhere outside China — you're locked out.

## The Solution: GoldBean API

[GoldBean](https://goldbean-api.xyz) is a proxy/gateway that sits between you and Baidu AI. It handles all the Chinese account requirements on your behalf. You just call GoldBean's API with your own API key.

**What you need:**
- ✅ Any email address (for free registration)
- ✅ PayPal, Alipay, or USDC for payments (optional — free tier available)

**What you DON'T need:**
- ❌ Chinese phone number
- ❌ Baidu account
- ❌ Real-name verification
- ❌ WeChat Pay

## Step-by-Step: Use Baidu AI in Cursor via MCP

### Step 1: Add GoldBean to Cursor

Open Cursor → Settings → MCP → Add new MCP Server, and paste:

```json
{
  "mcpServers": {
    "goldbean": {
      "url": "https://goldbean-api.xyz/sse"
    }
  }
}
```

That's it. Cursor now has access to 50+ Baidu AI tools.

### Step 2: Register for Free Credits (Optional)

You get 5 free calls/day per IP automatically. For more, register:

```
In Cursor chat, type:
"Register me for GoldBean using email myname@example.com"
```

Or via curl:
```bash
curl -X POST https://goldbean-api.xyz/paid/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"myname@example.com"}'
```

You'll get 20 free credits and an API key like `GB_A1B2C3D4`.

### Step 3: Use Baidu AI in Cursor

Now you can ask Cursor to do things like:

- **"Use GoldBean to OCR this image: https://example.com/document.jpg"**
- **"Translate this text to Chinese using GoldBean: Hello World"**
- **"Use GoldBean to analyze the sentiment of this review: 产品的质量非常好..."**
- **"Generate an image of a cat in Chinese ink painting style using GoldBean"**

Cursor will automatically call the right GoldBean MCP tool.

## What Can You Do With GoldBean?

### OCR (12 types)
```
"Extract text from this receipt: https://example.com/receipt.jpg"
→ Uses baidu_ocr

"Parse this table image into structured data: https://example.com/table.jpg"
→ Uses baidu_ocr_table

"Read this handwritten note: https://example.com/note.jpg"
→ Uses baidu_ocr_handwriting
```

### Translation
```
"Translate 'The weather is nice today' to Chinese"
→ Uses baidu_translate
→ Returns: 今天天气不错
```

### LLM Chat (ERNIE)
```
"Ask ERNIE to explain quantum computing in Chinese"
→ Uses baidu_llm_chat
```

### Text-to-Speech
```
"Convert this Chinese text to speech: 你好世界"
→ Uses baidu_tts (returns audio file)
```

### Image Recognition
```
"What plant is in this photo: https://example.com/plant.jpg"
→ Uses baidu_plant
→ Returns: Rose (玫瑰花), confidence: 98.2%
```

### Content Moderation
```
"Check if this text is appropriate: [text]"
→ Uses baidu_text_review
```

## Pricing

| Tier | Price | What you get |
|------|-------|-------------|
| Free | $0 | 5 calls/day per IP (no registration) |
| Free Credits | $0 | 20 API calls on registration |
| Pay-per-call | $0.01-$0.05 | Per API call, no subscription |
| Monthly | $9.9/mo | Unlimited Basic+Standard + $20 Premium quota |
| Annual | $99/yr | Unlimited Basic+Standard + $200 Premium quota/mo |

**Payment methods:** PayPal, Alipay, USDC on Base (crypto)

## Why Not Just Use OpenAI/Google?

Good question. Here's when Baidu AI is better:

1. **Chinese language tasks** — ERNIE LLM and Baidu OCR are specifically optimized for Chinese. If you need to process Chinese documents, Baidu OCR is significantly more accurate than Google Vision or AWS Textract.

2. **Chinese text-to-speech** — Baidu TTS produces more natural Chinese pronunciation than OpenAI TTS.

3. **Specialized recognition** — Baidu has dedicated models for Chinese ID cards (身份证), business licenses (营业执照), bank cards, QR codes, and more.

4. **Cost** — Baidu AI is cheaper than Western alternatives, and GoldBean passes those savings to you.

## Links

- **Website:** https://goldbean-api.xyz
- **Documentation:** See API Reference page
- **GitHub:** https://github.com/wuzenghai616-lang/goldbean
- **npm:** `goldbean-mcp`
- **MCP endpoint:** https://goldbean-api.xyz/sse

---

*GoldBean 🫘 — Baidu AI APIs for Global Developers. No Chinese phone number required.*
