# 🫘 GoldBean — x402 Micropaid API Marketplace

**10 AI tools, 1 command, pay-per-call with USDC on Base.**

GoldBean is an x402-powered MCP server for AI Agents. No API keys, no registration, no subscription — just install and pay a few cents per call.

---

## 🚀 30-Second Demo

```bash
npx goldbean-mcp
# Then ask your AI agent: "What's the BTC price?"
# It'll prompt you to pay ~$0.01 USDC → you get real data.
```

**No wallet?** You get **50 free calls/day** — no setup needed.

---

## 📦 Install

```bash
npx goldbean-mcp
```

Or add to Claude Desktop / Cursor / Continue:

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

---

## 🧰 10 Core Tools

| Tool | Price | What it does |
|------|------:|-------------|
| `crypto-price` | $0.01 | BTC/ETH/SOL real-time price |
| `weather` | $0.01 | Current weather in any city |
| `qrcode-gen` | $0.01 | Generate QR code from any text |
| `gas` | $0.01 | Base chain gas price |
| `llm-chat` | $0.04 | AI chat (GPT-style) |
| `web-search` | $0.03 | Web search + AI summary |
| `image-gen` | $0.05 | AI image generation |
| `llm-summary` | $0.02 | Text summarization |
| `llm-code` | $0.04 | Code generation, review, debug |
| `sentiment` | $0.02 | Text sentiment analysis |

## ⚡ How Pay-Per-Call Works

```
Agent needs data → GoldBean requests payment → Wallet signs USDC tx → Data arrives
```

Powered by [x402](https://x402.org) — the open protocol for AI Agent payments.

---

## 🔗 Links

- **API Docs**: https://goldbean-api.xyz
- **x402 Bazaar**: https://goldbean-api.xyz/.well-known/x402-bazaar
- **x402 Discovery**: https://goldbean-api.xyz/.well-known/x402.json
- **OpenAPI**: https://goldbean-api.xyz/openapi.json
- **Smithery**: https://smithery.ai/servers/wuzenghai616/goldbean
- **npm**: `goldbean-mcp` / `goldbean-utils`
- **Dev.to**: [Getting Started Guide](https://dev.to/_f57c0789acf9224f4d004/goldbean-utils-10-standalone-mcp-tools-you-can-use-right-now-3keo)

---

**GoldBean (GB) — Wishing You Good Fortune & Prosperity 🫘**
