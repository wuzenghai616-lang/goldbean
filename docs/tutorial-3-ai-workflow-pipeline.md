# Build an AI Workflow with GoldBean + Cursor: OCR → Translate → Summarize

> A real-world tutorial showing how to chain multiple Baidu AI calls through GoldBean MCP to build a document processing pipeline.

## The Scenario

You have a scanned document in Chinese. You want to:
1. **OCR** — Extract the Chinese text from the image
2. **Translate** — Translate it to English
3. **Summarize** — Generate a summary

With GoldBean + Cursor, you can do all three in a single conversation.

## Prerequisites

1. **Cursor** installed (or Claude Desktop / Cline / any MCP-compatible AI editor)
2. **GoldBean MCP** configured

### Setup (one-time, 30 seconds)

In Cursor: Settings → MCP → Add new MCP Server:

```json
{
  "mcpServers": {
    "goldbean": {
      "url": "https://goldbean-api.xyz/sse"
    }
  }
}
```

## The Workflow

### Step 1: OCR the Document

In Cursor chat:

> "Use GoldBean to OCR this image: https://example.com/chinese-document.jpg"

Cursor calls the `baidu_ocr` tool and extracts the Chinese text:

```json
{
  "words_result": [
    {"words": "百度智能云是中国领先的云计算服务平台"},
    {"words": "提供人工智能、大数据、云计算等服务"},
    {"words": "致力于让智能技术惠及每个人"}
  ]
}
```

### Step 2: Translate to English

> "Now translate the extracted text to English using GoldBean"

Cursor calls `baidu_translate`:

```json
{
  "trans_result": [
    {"src": "百度智能云是中国领先的云计算服务平台", "dst": "Baidu Smart Cloud is China's leading cloud computing service platform"},
    {"src": "提供人工智能、大数据、云计算等服务", "dst": "Provides artificial intelligence, big data, cloud computing and other services"},
    {"src": "致力于让智能技术惠及每个人", "dst": "Committed to making intelligent technology benefit everyone"}
  ]
}
```

### Step 3: Summarize

> "Summarize the translated text using GoldBean's LLM"

Cursor calls `baidu_llm_chat`:

> "Baidu Smart Cloud is China's leading cloud platform offering AI, big data, and cloud computing services, with a mission to make intelligent technology accessible to everyone."

## Automating the Pipeline

You can also chain these calls programmatically:

### Python

```python
import requests

API = "https://goldbean-api.xyz"
KEY = "GB_YOUR_KEY"
headers = {"x-user-id": KEY}

# Step 1: OCR
ocr = requests.get(f"{API}/paid/baidu-ocr", 
    params={"url": "https://example.com/chinese-doc.jpg"},
    headers=headers).json()
chinese_text = " ".join([w["words"] for w in ocr.get("words_result", [])])
print(f"OCR: {chinese_text}")

# Step 2: Translate
trans = requests.get(f"{API}/paid/baidu-translate",
    params={"text": chinese_text, "from": "zh", "to": "en"},
    headers=headers).json()
english_text = " ".join([t["dst"] for t in trans.get("trans_result", [])])
print(f"Translation: {english_text}")

# Step 3: Summarize
summary = requests.get(f"{API}/paid/baidu-summary",
    params={"text": english_text},
    headers=headers).json()
print(f"Summary: {summary}")
```

### JavaScript

```javascript
const API = 'https://goldbean-api.xyz';
const KEY = 'GB_YOUR_KEY';
const headers = { 'x-user-id': KEY };

// Step 1: OCR
const ocr = await fetch(`${API}/paid/baidu-ocr?url=${encodeURIComponent('https://example.com/doc.jpg')}`, { headers }).then(r => r.json());
const chinese = ocr.words_result?.map(w => w.words).join('') || '';

// Step 2: Translate
const trans = await fetch(`${API}/paid/baidu-translate?text=${encodeURIComponent(chinese)}&from=zh&to=en`, { headers }).then(r => r.json());
const english = trans.trans_result?.map(t => t.dst).join(' ') || '';

// Step 3: Summarize
const summary = await fetch(`${API}/paid/baidu-summary?text=${encodeURIComponent(english)}`, { headers }).then(r => r.json());
console.log('Summary:', summary);
```

## Other Workflow Ideas

### Receipt Scanning Pipeline
```
1. baidu_ocr_table → Extract receipt data (items, prices)
2. baidu_translate → Translate if receipt is in Chinese
3. baidu_llm_chat → Categorize expenses
```

### Content Moderation Pipeline
```
1. baidu_text_review → Check text for inappropriate content
2. baidu_image_review → Check associated images
3. baidu_llm_chat → Generate a moderation report
```

### Multi-Language Document Processing
```
1. baidu_ocr → Extract text from document image
2. baidu_translate → Translate to target language
3. baidu_embedding → Generate embeddings for search
4. baidu_reranker → Rerank search results by relevance
```

### Image Analysis Pipeline
```
1. baidu_vision_chat → Describe what's in the image
2. baidu_object_detect → Get bounding boxes for objects
3. baidu_image_gen → Generate a variation or edit
```

## Cost Estimation

For the OCR → Translate → Summarize pipeline:

| Step | Endpoint | Cost |
|------|----------|------|
| OCR | baidu-ocr | $0.02 |
| Translate | baidu-translate | $0.01 |
| Summarize | baidu-summary | $0.01 |
| **Total** | | **$0.04** |

That's 4 cents to process a document end-to-end. With the free tier (5 calls/day) or 20 free credits, you can run this pipeline **5 times for free**.

## Tips

1. **Use URL parameters instead of base64** when possible — it's faster and avoids payload limits
2. **Check your credits** with `check_credits` tool before starting a pipeline
3. **Handle 402 errors** gracefully — redirect users to the recharge page
4. **Batch when possible** — some endpoints (like embedding) support multiple inputs separated by `||`

---

*GoldBean 🫘 — Chain AI calls like building blocks.*
