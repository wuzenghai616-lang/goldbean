/**
 * GoldBean MCP v2 — Cloudflare Workers Edge Proxy
 *
 * Stateless, zero dependencies, <50 lines.
 * Simply forwards MCP v2 JSON-RPC requests to GoldBean API.
 */

const API_BASE = typeof GOLDBEAN_API_URL !== "undefined" ? GOLDBEAN_API_URL : "https://goldbean-api.xyz";
const PROTOCOL_VERSION = "2026-07-28";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, MCP-Protocol-Version",
};

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  if (request.method !== "POST" || new URL(request.url).pathname !== "/mcp") {
    return new Response(JSON.stringify({ error: "Use POST /mcp" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
    });
  }

  // Forward to GoldBean API (stateless — no session management needed)
  const apiResp = await fetch(`${API_BASE}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "MCP-Protocol-Version": PROTOCOL_VERSION
    },
    body: await request.text()
  });

  const body = await apiResp.text();
  return new Response(body, {
    status: apiResp.status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
      "MCP-Protocol-Version": PROTOCOL_VERSION
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  }
};
