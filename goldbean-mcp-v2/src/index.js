#!/usr/bin/env node
/**
 * GoldBean MCP Server v2.0.0 — Stateless, Edge-Ready
 * Compatible with MCP 2026-07-28 (Protocol Version)
 *
 * Key differences from v1:
 * - No initialize/initialized handshake (stateless)
 * - No @modelcontextprotocol/sdk dependency (lighter, faster)
 * - Direct fetch to GoldBean HTTP MCP endpoint
 * - Compatible with npx, Cloudflare Workers, Bun, Deno
 *
 * Usage:
 *   npx goldbean-mcp@2.0.0
 *   GOLDBEAN_API_URL=https://goldbean-api.xyz npx goldbean-mcp
 *
 * Environment:
 *   GOLDBEAN_API_URL  — Base URL (default: https://goldbean-api.xyz)
 *   GOLDBEAN_FREE_LIMIT — Daily free calls (default: 50)
 */

const API_BASE = process.env.GOLDBEAN_API_URL || "https://goldbean-api.xyz";
const MCP_ENDPOINT = `${API_BASE}/mcp`;
const FREE_DAILY_LIMIT = parseInt(process.env.GOLDBEAN_FREE_LIMIT || "50", "10");
const VERSION = "2.0.0";
const PROTOCOL_VERSION = "2026-07-28";

// ============================================================
// Tool Definitions — 48 Baidu AI MCP Tools (v10.0.0 schema)
// ============================================================

const TOOLS = [
  { name: "service_health", category: "Service", price: "Free", params: {} },
  // OCR (12)
  { name: "baidu_ocr", category: "OCR", price: "$0.001", params: { image: "Base64 or URL", language_type: "optional", detect_direction: "optional" } },
  { name: "baidu_ocr_accurate", category: "OCR", price: "$0.001", params: { image: "Base64 or URL", language_type: "optional", detect_direction: "optional" } },
  { name: "baidu_ocr_table", category: "OCR", price: "$0.001", params: { image: "Base64 or URL", cell_location: "optional" } },
  { name: "baidu_ocr_idcard", category: "OCR", price: "$0.001", params: { image: "Base64 or URL", id_card_side: "front|back" } },
  { name: "baidu_ocr_handwriting", category: "OCR", price: "$0.001", params: { image: "Base64 or URL", language_type: "optional" } },
  { name: "baidu_ocr_qrcode", category: "OCR", price: "$0.001", params: { image: "Base64 or URL" } },
  { name: "baidu_ocr_business_license", category: "OCR", price: "$0.001", params: { image: "Base64 or URL" } },
  { name: "baidu_ocr_bank_card", category: "OCR", price: "$0.001", params: { image: "Base64 or URL" } },
  { name: "baidu_ocr_driving_license", category: "OCR", price: "$0.001", params: { image: "Base64 or URL" } },
  { name: "baidu_ocr_vehicle_license", category: "OCR", price: "$0.001", params: { image: "Base64 or URL" } },
  { name: "baidu_ocr_passport", category: "OCR", price: "$0.001", params: { image: "Base64 or URL" } },
  { name: "baidu_ocr_invoice", category: "OCR", price: "$0.001", params: { image: "Base64 or URL" } },
  // NLP (8)
  { name: "baidu_sentiment", category: "NLP", price: "$0.001", params: { text: "Chinese text, max 2048 chars" } },
  { name: "baidu_ner", category: "NLP", price: "$0.001", params: { text: "Chinese text, max 4096 chars" } },
  { name: "baidu_text_similarity", category: "NLP", price: "$0.001", params: { text1: "First text", text2: "Second text" } },
  { name: "baidu_kw_extraction", category: "NLP", price: "$0.001", params: { text: "Chinese text, max 65535 chars" } },
  { name: "baidu_topic_analysis", category: "NLP", price: "$0.001", params: { text: "Chinese text, max 65535 chars" } },
  { name: "baidu_text_correction", category: "NLP", price: "$0.001", params: { text: "Chinese text, max 2000 chars" } },
  { name: "baidu_news_summary", category: "NLP", price: "$0.001", params: { text: "Chinese news text", max_summary_len: "optional" } },
  { name: "baidu_couplet", category: "NLP", price: "$0.001", params: { text: "Theme or phrase" } },
  // Vision (4)
  { name: "baidu_image_enhance", category: "Vision", price: "$0.001", params: { image: "Base64 or URL", scale: "2|4 (optional)" } },
  { name: "baidu_image_dehaze", category: "Vision", price: "$0.001", params: { image: "Base64 or URL" } },
  { name: "baidu_image_stitching", category: "Vision", price: "$0.001", params: { images: "Array of 2-4 URLs" } },
  { name: "baidu_image_colourize", category: "Vision", price: "$0.001", params: { image: "Base64 or URL" } },
  // Speech (4)
  { name: "baidu_asr", category: "Speech", price: "$0.001", params: { audio: "Base64 or URL", format: "pcm|wav|amr", rate: "16000|8000", dev_pid: "1537|Mandarin+English (default)" } },
  { name: "baidu_tts", category: "Speech", price: "$0.001", params: { text: "Max 2048 chars", voice: "0|1|3|4|5003", speed: "-5 to 5", pitch: "-5 to 5", volume: "0 to 15" } },
  { name: "baidu_voice_conversion", category: "Speech", price: "$0.001", params: { audio: "Base64 or URL", target_voice: "Preset name" } },
  { name: "baidu_voice_clone", category: "Speech", price: "$0.001", params: { audio: "5-30s sample", text: "Optional text to synthesize" } },
  // Translation (3)
  { name: "baidu_translate", category: "Translation", price: "$0.001", params: { text: "Max 6000 chars", from: "auto|zh|en|...", to: "en|zh|..." } },
  { name: "baidu_translate_pro", category: "Translation", price: "$0.001", params: { text: "Max 10000 chars", from: "auto", to: "en", domain: "general|finance|medical|legal|tech" } },
  { name: "baidu_translate_doc", category: "Translation", price: "$0.003", params: { file_url: "Public URL", from: "auto", to: "en" } },
  // Face (3)
  { name: "baidu_face_detect", category: "Face", price: "$0.001", params: { image: "Base64 or URL", face_field: "age,beauty,expression,..." } },
  { name: "baidu_face_verify", category: "Face", price: "$0.001", params: { image1: "Base64 or URL", image2: "Base64 or URL" } },
  { name: "baidu_face_search", category: "Face", price: "$0.001", params: { image: "Base64 or URL", group_id: "Face database ID" } },
  // Body (2)
  { name: "baidu_body_analysis", category: "Body", price: "$0.001", params: { image: "Base64 or URL" } },
  { name: "baidu_body_seg", category: "Body", price: "$0.001", params: { image: "Base64 or URL", return_type: "label|score|foreground" } },
  // Creation (4)
  { name: "baidu_image_gen", category: "Creation", price: "$0.002", params: { prompt: "Max 200 chars", style: "realistic|anime|...", size: "1024x1024|..." } },
  { name: "baidu_image_edit", category: "Creation", price: "$0.002", params: { image: "Base64 or URL", prompt: "Edit instruction" } },
  { name: "baidu_doc_gen", category: "Creation", price: "$0.002", params: { outline: "Document topic", format: "docx|pdf|html", pages: "Target page count" } },
  { name: "baidu_qianfan_chat", category: "LLM", price: "$0.001-0.002/1K tokens", params: { messages: "Array of {role,content}", model: "ERNIE-Bot-4|ERNIE-Speed|Yi-34B|DeepSeek-V3", temperature: "0.0-1.0", max_tokens: "default 1024", stream: "boolean" } },
  // Search (2)
  { name: "baidu_search", category: "Search", price: "$0.001", params: { query: "Search string", num: "1-50", site: "optional" } },
  { name: "baidu_knowledge", category: "Search", price: "$0.001", params: { query: "Entity name", type: "optional person|org|location|product|event" } },
  // x402 Paid (5)
  { name: "paid_baidu_search", category: "Search", price: "$0.005", params: { query: "Search string", num: "optional" } },
  { name: "paid_baidu_translate_pro", category: "Translation", price: "$0.003", params: { text: "Max 10000 chars", from: "auto", to: "en", domain: "general|finance|medical|legal|tech" } },
  { name: "paid_baidu_ocr_batch", category: "OCR", price: "$0.008", params: { images: "Array of URLs (max 10)", language_type: "optional" } },
  { name: "paid_baidu_asr_long", category: "Speech", price: "$0.005", params: { audio_url: "Public URL (max 4h)", format: "pcm|wav|mp3" } },
  { name: "paid_baidu_doc_analysis", category: "Document", price: "$0.008", params: { file_url: "Public URL", tasks: "Array: ocr,ner,summary,keywords" } },
];

// ============================================================
// Logging
// ============================================================
function log(level, msg) {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}`;
  console.error(line);
}

// ============================================================
// JSON-RPC 2.0 helpers
// ============================================================
function jsonrpcResponse(id, result, error) {
  const resp = { jsonrpc: "2.0", id };
  if (error) resp.error = error;
  else resp.result = result;
  return resp;
}

function jsonrpcError(id, code, message) {
  return jsonrpcResponse(id, null, { code, message });
}

// ============================================================
// MCP Request Router (v2 — stateless, no initialize)
// ============================================================
async function handleRequest(method, params, id) {
  switch (method) {
    case "server/discover": {
      return {
        protocolVersion: PROTOCOL_VERSION,
        serverInfo: {
          name: "goldbean-mcp",
          version: VERSION,
          description: "GoldBean API Market — Chinese AI multimodal APIs via MCP v2"
        },
        capabilities: {
          tools: { listChanged: false },
          resources: { subscribe: false },
          prompts: { listChanged: false }
        },
        tools: TOOLS.map(t => ({
          name: t.name,
          description: `${t.category} tool — ${t.price}`,
          annotations: { category: t.category, pricing: t.price }
        }))
      };
    }

    case "tools/list": {
      const tools = TOOLS.map(t => ({
        name: t.name,
        description: `${t.category} — ${t.price}. Params: ${JSON.stringify(t.params)}`,
        inputSchema: {
          type: "object",
          properties: Object.fromEntries(
            Object.entries(t.params).map(([k, v]) => [k, { type: "string", description: v }])
          )
        },
        annotations: {
          readOnlyHint: true,
          category: t.category,
          pricing: t.price
        }
      }));
      return { tools, nextCursor: null };
    }

    case "tools/call": {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      if (!toolName) return jsonrpcError(id, -32602, "tool name is required");

      const tool = TOOLS.find(t => t.name === toolName);
      if (!tool) return jsonrpcError(id, -32602, `Unknown tool: ${toolName}`);

      // Forward to GoldBean HTTP MCP endpoint (stateless)
      const resp = await fetch(`${API_BASE}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "MCP-Protocol-Version": PROTOCOL_VERSION
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: id || 1,
          method: "tools/call",
          params: { name: toolName, arguments: toolArgs }
        })
      });

      if (!resp.ok) {
        const err = await resp.text();
        return {
          content: [{ type: "text", text: `Error: ${resp.status} — ${err}` }],
          isError: true
        };
      }

      const data = await resp.json();
      return data.result || data;
    }

    case "resources/list":
      return { resources: [], nextCursor: null };

    case "prompts/list":
      return { prompts: [], nextCursor: null };

    default:
      return jsonrpcError(id, -32601, `Method not found: ${method}`);
  }
}

// ============================================================
// STDIO Transport (for npx compatibility)
// ============================================================
async function startStdioTransport() {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  log("INFO", `GoldBean MCP v${VERSION} — Protocol ${PROTOCOL_VERSION} — ${TOOLS.length} tools`);
  log("INFO", `API Base: ${API_BASE}`);
  log("INFO", "Stateless mode — no initialize handshake required");
  log("INFO", "Listening on STDIO...");

  rl.on("line", async (line) => {
    let request;
    try {
      request = JSON.parse(line);
    } catch (e) {
      console.log(JSON.stringify(jsonrpcError(null, -32700, "Parse error")));
      return;
    }

    const { id, method, params } = request;
    const result = await handleRequest(method, params, id);
    console.log(JSON.stringify(jsonrpcResponse(id, result)));
  });
}

// ============================================================
// HTTP Transport (for Cloudflare Workers / Deno / Bun)
// ============================================================
async function startHttpServer(port) {
  const http = await import("http");
  const server = http.createServer(async (req, res) => {
    const start = Date.now();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, MCP-Protocol-Version");
    res.setHeader("MCP-Protocol-Version", PROTOCOL_VERSION);

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method !== "POST" || req.url !== "/mcp") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Use POST /mcp" }));
      return;
    }

    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      let request;
      try {
        request = JSON.parse(body);
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify(jsonrpcError(null, -32700, "Parse error")));
        return;
      }

      const result = await handleRequest(request.method, request.params, request.id);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(jsonrpcResponse(request.id, result)));
      log("INFO", `${request.method} | ${Date.now() - start}ms`);
    });
  });

  server.listen(port, "0.0.0.0", () => {
    log("INFO", `GoldBean MCP HTTP v${VERSION} — ${TOOLS.length} tools — Port ${port}`);
  });
}

// ============================================================
// Main Entry
// ============================================================
async function main() {
  const args = process.argv.slice(2);
  const useHttp = args.includes("--http") || args.includes("-h");
  const port = parseInt(args.find(a => a.startsWith("--port="))?.split("=")[1], 10) || 9878;

  if (useHttp) {
    await startHttpServer(port);
  } else {
    await startStdioTransport();
  }
}

main().catch(e => {
  log("FATAL", e.message);
  process.exit(1);
});
