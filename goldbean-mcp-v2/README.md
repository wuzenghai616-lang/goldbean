# GoldBean MCP Server v2 — Stateless & Edge-Ready

The first **stateless MCP server** for Chinese AI APIs. 48 tools across OCR, NLP, Vision, Speech, Translation, Face, Body, LLM (ERNIE/DeepSeek), and more — with zero handshake, zero session management, and zero SDK dependency.

**MCP Protocol**: `2026-07-28` (v2)  
**Transport**: HTTP POST `/mcp` (stateless)  
**Deployment**: npx, Cloudflare Workers, Bun, Deno, Node.js 18+

## Quick Start

```bash
# STDIO mode (for Claude Desktop / Cline / Roo Code)
npx goldbean-mcp

# HTTP mode (for serverless / edge deployment)
npx goldbean-mcp --http --port=9878

# With custom endpoint
GOLDBEAN_API_URL=https://your-goldbean-instance.com npx goldbean-mcp
```

## What Makes It Different

| Feature | v1 (legacy) | v2 (this) |
|---------|-------------|-----------|
| Handshake | Required `initialize` | **None** — every request is self-contained |
| Session | Server-side state | **Stateless** — no session ID, no cleanup |
| SDK Dependency | `@modelcontextprotocol/sdk` | **Zero** — native `fetch` only |
| Deploy Target | Node.js daemon | **Cloudflare Workers / Deno / Bun** |
| Protocol | `2024-11-05` | **`2026-07-28`** |

## 48 Baidu AI Tools

| Category | Tools | Pricing |
|----------|-------|---------|
| **OCR** | 12 types (ID card, business license, handwriting, QR code, table, etc.) | $0.001/call |
| **NLP** | Sentiment, NER, text similarity, keywords, topic, correction, summary, couplet | $0.001/call |
| **Vision** | Super-resolution, dehaze, panorama stitching, colorization | $0.001/call |
| **Speech** | ASR (voice-to-text), TTS (text-to-voice), voice conversion, voice cloning | $0.001/call |
| **Translation** | General, professional, document (DOCX/PDF/TXT) | $0.001-$0.003/call |
| **Face** | Detection, verification, search | $0.001/call |
| **Body** | Pose analysis, segmentation | $0.001/call |
| **LLM** | ERNIE-Bot-4, ERNIE-Speed, Yi-34B, DeepSeek-V3 chat | $0.001-0.002/1K tokens |
| **Search** | Web search, knowledge graph | $0.001/call |

## Pricing & Limits

- **Free tier**: 50 calls/day (no wallet required)
- **Pay-per-call**: From $0.001 via x402 USDC micropayments
- **Subscriptions**: Starter $5, Monthly $9.90, Quarterly $25, Yearly $89
- **Payment methods**: x402 USDC (Base), PayPal, Alipay

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GOLDBEAN_API_URL` | `https://goldbean-api.xyz` | GoldBean API base URL |
| `GOLDBEAN_FREE_LIMIT` | `50` | Daily free call limit |

## Deploy to Cloudflare Workers

See [goldbean-workers-template](https://github.com/wuzenghai616-lang/goldbean-workers-template) for one-click deployment.

```bash
# Using Wrangler
npx wrangler deploy src/index.js
```

## Protocol Details

Every request is a standalone JSON-RPC 2.0 POST:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

Response headers include `MCP-Protocol-Version: 2026-07-28`.

No `initialize`, no `Mcp-Session-Id`, no state — just like calling any REST API.

## TypeScript Types

The package ships first-class TypeScript definitions in `types.d.ts` (also published on npm).

```ts
import type {
  ToolParamsByName,
  ToolParams,
  TypedCallToolParams,
  JsonRpcRequest,
  JsonRpcResponse,
  ToolsCallResult,
} from "goldbean-mcp";

// Type-safe tools/call request — arguments are validated against the tool's schema
const req: JsonRpcRequest<TypedCallToolParams<"baidu_ocr">> = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: { name: "baidu_ocr", arguments: { image: "base64..." } },
};

// Typed response
const res: JsonRpcResponse<ToolsCallResult> = {
  jsonrpc: "2.0",
  id: 1,
  result: { content: [{ type: "text", text: "ok" }] },
};
```

- `ToolParamsByName` maps every tool name to its argument interface (51 tools, v9.8.0).
- `ToolParams<T>` is a generic lookup: `ToolParams<"baidu_llm_chat">`.
- All `inputSchema`, JSON-RPC, and `tools/list` / `tools/call` shapes are typed.

### Running the type + coverage tests

```bash
npm install        # devDependency: typescript
npm run check      # node --test (schema coverage) + tsc (compile-time shape checks)
```

## License

MIT
