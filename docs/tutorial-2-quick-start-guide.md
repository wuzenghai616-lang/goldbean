# GoldBean API Quick Start: From Zero to First Call in 60 Seconds

> A practical guide to making your first Baidu AI API call through GoldBean — no Chinese phone number, no Baidu account, no credit card.

## 30-Second Quick Start

```bash
# 1. Get weather (free, no auth needed)
curl "https://goldbean-api.xyz/weather-now?city=Tokyo"

# 2. Register for 20 free AI credits
curl -X POST https://goldbean-api.xyz/paid/user/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
# → {"success":true,"apiKey":"GB_A1B2C3D4","freeCredits":20}

# 3. OCR an image using your free credits
curl "https://goldbean-api.xyz/paid/baidu-ocr?url=https://example.com/document.jpg" \
  -H "x-user-id: GB_A1B2C3D4"
```

That's it. You just used Baidu AI without a Chinese phone number.

---

## Authentication

GoldBean uses simple API keys. Pass your key in any of these headers:

| Header | Example |
|--------|---------|
| `x-user-id` | `x-user-id: GB_A1B2C3D4` |
| `x-api-key` | `x-api-key: GB_A1B2C3D4` |
| `Authorization` | `Authorization: Bearer GB_A1B2C3D4` |

**No API key?** You get 5 free calls/day per IP automatically. No registration needed.

---

## Popular Endpoints

### 1. OCR — Extract Text from Images

```bash
# General OCR (Chinese + English text)
curl "https://goldbean-api.xyz/paid/baidu-ocr?url=https://example.com/doc.jpg" \
  -H "x-user-id: GB_YOUR_KEY"

# High-accuracy OCR (for blurry or complex documents)
curl "https://goldbean-api.xyz/paid/baidu-ocr-accurate?url=https://example.com/doc.jpg" \
  -H "x-user-id: GB_YOUR_KEY"

# ID Card recognition
curl "https://goldbean-api.xyz/paid/baidu-idcard?url=https://example.com/idcard.jpg&side=front" \
  -H "x-user-id: GB_YOUR_KEY"

# Table OCR (returns structured table data)
curl "https://goldbean-api.xyz/paid/baidu-ocr-table?url=https://example.com/table.jpg" \
  -H "x-user-id: GB_YOUR_KEY"
```

### 2. Translation

```bash
# English → Chinese
curl "https://goldbean-api.xyz/paid/baidu-translate?text=Hello%20World&from=en&to=zh" \
  -H "x-user-id: GB_YOUR_KEY"

# Auto-detect → Japanese
curl "https://goldbean-api.xyz/paid/baidu-translate?text=Hello&to=ja" \
  -H "x-user-id: GB_YOUR_KEY"
```

### 3. LLM Chat (ERNIE)

```bash
# Chat with ERNIE
curl "https://goldbean-api.xyz/paid/baidu-llm-chat?message=Explain%20AI%20in%203%20sentences" \
  -H "x-user-id: GB_YOUR_KEY"

# Deep reasoning (DeepSeek-R1)
curl "https://goldbean-api.xyz/paid/baidu-deepthink?message=Solve%20this%20math%20problem..." \
  -H "x-user-id: GB_YOUR_KEY"
```

### 4. Text-to-Speech

```bash
# Convert text to speech (returns audio file)
curl "https://goldbean-api.xyz/paid/baidu-tts?text=你好世界&per=0" \
  -H "x-user-id: GB_YOUR_KEY" \
  -o audio.mp3
```

### 5. Image Recognition

```bash
# Plant recognition
curl "https://goldbean-api.xyz/paid/baidu-plant?url=https://example.com/plant.jpg" \
  -H "x-user-id: GB_YOUR_KEY"

# Face detection
curl "https://goldbean-api.xyz/paid/baidu-face-detect?url=https://example.com/face.jpg" \
  -H "x-user-id: GB_YOUR_KEY"

# Food/dish recognition
curl "https://goldbean-api.xyz/paid/baidu-dish?url=https://example.com/food.jpg" \
  -H "x-user-id: GB_YOUR_KEY"
```

### 6. OpenAI-Compatible Endpoints

GoldBean also works as an OpenAI-compatible API:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://goldbean-api.xyz/v1",
    default_headers={"x-user-id": "GB_YOUR_KEY"}
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)
```

---

## Code Examples

### Python

```python
import requests

API_BASE = "https://goldbean-api.xyz"
API_KEY = "GB_YOUR_KEY"  # Optional for free endpoints

# Register
r = requests.post(f"{API_BASE}/paid/user/register", 
    json={"email": "you@example.com"})
api_key = r.json()["apiKey"]
print(f"Your API key: {api_key}")

# OCR
r = requests.get(f"{API_BASE}/paid/baidu-ocr",
    params={"url": "https://example.com/document.jpg"},
    headers={"x-user-id": api_key})
print(r.json())

# Translate
r = requests.get(f"{API_BASE}/paid/baidu-translate",
    params={"text": "Hello World", "from": "en", "to": "zh"},
    headers={"x-user-id": api_key})
print(r.json())

# Check credits
r = requests.get(f"{API_BASE}/paid/user/credits",
    headers={"x-user-id": api_key})
print(r.json())
```

### JavaScript / Node.js

```javascript
const API_BASE = 'https://goldbean-api.xyz';
const API_KEY = 'GB_YOUR_KEY';

// OCR
const res = await fetch(`${API_BASE}/paid/baidu-ocr?url=${encodeURIComponent('https://example.com/doc.jpg')}`, {
  headers: { 'x-user-id': API_KEY }
});
const data = await res.json();
console.log(data);

// Translate
const res2 = await fetch(`${API_BASE}/paid/baidu-translate?text=${encodeURIComponent('Hello')}&to=zh`, {
  headers: { 'x-user-id': API_KEY }
});
console.log(await res2.json());
```

### cURL (One-Liners)

```bash
# Weather
curl "https://goldbean-api.xyz/weather-now?city=London"

# BTC price
curl "https://goldbean-api.xyz/btc-price"

# Register
curl -X POST "https://goldbean-api.xyz/paid/user/register" -H "Content-Type: application/json" -d '{"email":"you@example.com"}'

# OCR
curl "https://goldbean-api.xyz/paid/baidu-ocr?url=https://example.com/doc.jpg" -H "x-user-id: GB_YOUR_KEY"

# Translate
curl "https://goldbean-api.xyz/paid/baidu-translate?text=Hello&to=zh" -H "x-user-id: GB_YOUR_KEY"
```

---

## Pricing

| Tier | Cost | Includes |
|------|------|----------|
| Free (no registration) | $0 | 5 calls/day per IP |
| Free (with registration) | $0 | 20 API credits |
| Pay-per-call | $0.01-$0.05/call | No subscription, pay as you go |
| Monthly membership | $9.9/mo | Unlimited Basic+Standard calls + $20 Premium quota |
| Annual membership | $99/yr | Unlimited Basic+Standard calls + $200 Premium quota/mo |

**Premium endpoints** (LLM Chat, Image Gen, Video Gen, DeepThink, HelixFold) have a monthly usage cap for members.

**Payment methods:** PayPal, Alipay (支付宝), USDC on Base (crypto)

---

## Error Handling

When you run out of credits, you'll get a `402` response with helpful info:

```json
{
  "error": "Insufficient credits",
  "type": "credits_exhausted",
  "recharge_url": "https://goldbean-api.xyz/buy-credits.html?key=GB_YOUR_KEY",
  "message": "Your credits are exhausted. Recharge at https://goldbean-api.xyz/buy-credits.html"
}
```

Just visit the `recharge_url` to top up via PayPal, Alipay, or USDC.

---

## Need Help?

- **API Status:** https://goldbean-api.xyz/health
- **Full Route List:** https://goldbean-api.xyz/api/routes
- **Pricing Plans:** https://goldbean-api.xyz/api/pricing/plans
- **OpenAPI Schema:** https://goldbean-api.xyz/openapi.json
- **GitHub:** https://github.com/wuzenghai616-lang/goldbean

---

*GoldBean 🫘 — Pay-per-use AI for everyone.*
