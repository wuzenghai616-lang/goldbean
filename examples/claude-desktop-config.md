# GoldBean MCP Server - Claude Desktop Configuration

## Quick Start

Add GoldBean to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "goldbean": {
      "url": "https://goldbean-api.xyz/sse"
    }
  }
}
```

## Available Tools

After configuring, Claude Desktop will have access to 47 tools:

### Free Endpoints (21)
- `weather_query` - Weather information
- `search_web` - Web search
- `ssl_cert_check` - SSL certificate checker
- ... and 18 more

### Paid Endpoints (26)
- `baidu_ocr` - OCR text recognition ($0.01/call)
- `baidu_tts` - Text-to-speech ($0.03/call)
- `baidu_asr` - Speech recognition ($0.03/call)
- `llm_chat` - LLM conversation ($0.03/call)
- `image_gen` - AI image generation ($0.05/call)
- ... and 21 more

## Payment Setup

### Option 1: x402 (USDC on Base)
```bash
npm install @goldbean/x402-sdk
```

### Option 2: PayPal
Add your PayPal credentials in the dashboard at https://goldbean-api.xyz

### Option 3: Alipay
Scan the QR code on the dashboard to top up credits.

## Free Credits
New accounts get 20 free credits. No credit card required.
