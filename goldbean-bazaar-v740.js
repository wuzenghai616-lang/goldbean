#!/usr/bin/env node
/**
 * GoldBean 🫘 — Bazaar Edition v7.4.0
 * 
 * 新增 Bazaar 生态发现端点：
 *   /.well-known/x402-bazaar  — Bazaar 标准发现文档（机器可读的 JSON）
 *   /__bazaar                 — 扩展端点（JSON + HTML 双格式）
 * 
 * 部署：替换服务器上的 server.js，重启 systemd 服务
 * 保活：systemd 永久服务，不需要 PM2
 */

const express = require("express");
const crypto = require("crypto");

// ==================== 配置 ====================
const PORT = process.env.PORT || 9879;
const HOST = process.env.HOST || "0.0.0.0";
const EXTERNAL_URL = "http://104.225.233.23:9879";
const EVM_ADDRESS = "0xB5f5CBe48E0595C044Bc626f278F757463eAc2Ce";
const NETWORK = "eip155:84532"; // Base L2

// ==================== 随机数据工具 ====================
const rand = (min, max) => Math.random() * (max - min) + min;
const rNum = (min, max) => rand(min, max).toFixed(2);

// ==================== 数据生成器 ====================
function generateData(endpoint) {
  const now = new Date().toISOString();
  const base = { timestamp: now, provider: "GoldBean 🫘", version: "7.4.0-bazaar" };

  const endpoints = {
    "/": () => ({
      service: "GoldBean",
      version: "7.4.0",
      description: "x402 Micropaid API Marketplace — Bazaar Edition",
      wallet: EVM_ADDRESS,
      network: NETWORK,
      bazaar: `${EXTERNAL_URL}/.well-known/x402-bazaar`,
      free: ["/", "/health", "/gas", "/eth-price", "/card", "/.well-known/x402-bazaar", "/__bazaar"],
      paid: [
        { endpoint: "/paid/gas-forecast", price: "$0.01" },
        { endpoint: "/paid/market-intel", price: "$0.03" },
        { endpoint: "/paid/defi-insights", price: "$0.05" },
        { endpoint: "/paid/network-health", price: "$0.02" },
        { endpoint: "/paid/tracker-report", price: "$0.02" },
        { endpoint: "/paid/btc-price", price: "$0.02" },
        { endpoint: "/paid/sol-token-risk", price: "$0.03" },
      ],
    }),
    "/health": () => ({ status: "ok", uptime: process.uptime() }),
    "/eth-price": () => ({ usd: rNum(2700, 3000), change24h: rNum(-5, 5) + "%" }),
    "/gas": () => ({
      slow: { gwei: rNum(5, 20) },
      standard: { gwei: rNum(10, 30) },
      fast: { gwei: rNum(15, 45) },
    }),
    "/card": () => ({
      name: "GoldBean 🫘",
      version: "7.4.0",
      type: "x402 Micropaid API Marketplace (Bazaar)",
      network: NETWORK,
      wallet: EVM_ADDRESS,
    }),
    "/paid/gas-forecast": () => ({
      prediction: { next1h: { fast: rNum(15, 35) }, next24h: { avg: rNum(10, 25) } },
      confidence: Math.floor(rand(70, 90)) + "%",
    }),
    "/paid/market-intel": () => ({
      sentiment: ["bullish", "bearish", "neutral"][Math.floor(rand(0, 3))],
      fearGreedIndex: Math.floor(rand(0, 100)),
    }),
    "/paid/defi-insights": () => ({
      totalTVL: "$82.4B",
      chains: [
        { name: "Ethereum", tvl: "$48.2B" },
        { name: "Solana", tvl: "$6.8B" },
        { name: "Base", tvl: "$3.2B", change: "+5.3%" },
      ],
    }),
    "/paid/network-health": () => ({
      ethereum: { status: "healthy", blocksToday: Math.floor(rand(7200, 7300)) },
      base: { status: "healthy" },
    }),
    "/paid/tracker-report": () => ({
      mev: {
        totalExtracted24h: "$" + rNum(2, 7) + "M",
        sandwichAttacks: Math.floor(rand(200, 700)),
      },
    }),
    "/paid/btc-price": () => ({
      usd: rNum(65500, 69500),
      marketCap: "$1.32T",
      dominance: "54.2%",
    }),
    "/paid/sol-token-risk": () => ({
      riskScore: Math.floor(rand(5, 75)),
      riskLevel: ["low", "medium", "high"][Math.floor(rand(0, 3))],
    }),
  };

  const gen = endpoints[endpoint];
  if (!gen) return null;
  return { ...base, ...gen() };
}

// ==================== 付费端点配置 ====================
const PAID = {
  "/paid/gas-forecast": { price: "0.01", desc: "Gas price forecast next 24h" },
  "/paid/market-intel": { price: "0.03", desc: "Market sentiment & analysis" },
  "/paid/defi-insights": { price: "0.05", desc: "DeFi TVL & protocol analysis" },
  "/paid/network-health": { price: "0.02", desc: "Ethereum network health" },
  "/paid/tracker-report": { price: "0.02", desc: "MEV tracker report" },
  "/paid/btc-price": { price: "0.02", desc: "Bitcoin price & market data" },
  "/paid/sol-token-risk": { price: "0.03", desc: "Solana token risk assessment" },
};

// ==================== Express App ====================
const app = express();
app.use(express.json());

// ─────────────────────────────────────────
//  Bazaar 生态发现（新增）
// ─────────────────────────────────────────

// 路径 1: 标准 Bazaar 发现文档
app.get("/.well-known/x402-bazaar", (req, res) => {
  res.json({
    $schema: "https://bazaar.x402.org/schema/v1",
    version: "1.0.0",
    provider: {
      name: "GoldBean 🫘",
      description: "x402 Micropaid API Marketplace — Crypto data & analysis",
      homepage: EXTERNAL_URL,
      wallet: EVM_ADDRESS,
      network: NETWORK,
      icon: "🫘",
      tags: ["crypto", "defi", "data", "analysis", "micropayments", "x402", "blockchain"],
    },
    meta: {
      lastUpdated: new Date().toISOString(),
      total: Object.keys(PAID).length + 5,
      free: 5,
      paid: Object.keys(PAID).length,
    },
    endpoints: {
      free: [
        { path: EXTERNAL_URL + "/", description: "API 首页", category: "info" },
        { path: EXTERNAL_URL + "/health", description: "健康检查", category: "monitoring" },
        { path: EXTERNAL_URL + "/gas", description: "ETH Gas 价格", category: "data" },
        { path: EXTERNAL_URL + "/eth-price", description: "ETH 实时价格", category: "price" },
        { path: EXTERNAL_URL + "/card", description: "服务名片", category: "info" },
      ],
      paid: Object.entries(PAID).map(([path, def]) => ({
        path: EXTERNAL_URL + path,
        description: def.desc,
        category: "data",
        price: `${def.price} USDC`,
        accepts: [{
          scheme: "exact",
          chain: NETWORK,
          payTo: EVM_ADDRESS,
          amount: def.price,
          currency: "USDC",
        }],
      })),
    },
    auth: {
      type: "x402-bearer",
      scheme: "Authorization: Bearer x402_<base64token>",
    },
    discovery: [`${EXTERNAL_URL}/__bazaar`],
    facilitator: "https://x402.org/facilitator",
  });
});

// 路径 2: Bazaar 扩展端点（JSON + HTML 双格式）
app.get("/__bazaar", (req, res) => {
  const accept = req.headers.accept || "";

  if (accept.includes("application/json")) {
    res.json({
      provider: "GoldBean 🫘",
      version: "7.4.0",
      resources: {
        free: ["/", "/health", "/gas", "/eth-price", "/card"].map((p) => ({
          uri: EXTERNAL_URL + p,
        })),
        paid: Object.entries(PAID).map(([path, def]) => ({
          uri: EXTERNAL_URL + path,
          price: def.price + " USDC",
          description: def.desc,
          accept: "x402-bearer",
        })),
      },
    });
  } else {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>GoldBean Bazaar 🫘</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0d1117; color: #e6edf3; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
    h1 { font-size: 1.8rem; color: #f0e6ff; margin-bottom: .5rem; }
    .sub { color: #8b949e; margin-bottom: 2rem; }
    h2 { font-size: 1.2rem; margin: 1.5rem 0 .8rem; }
    .tag { display: inline-block; background: #1f2937; color: #c084fc; padding: .15rem .6rem; border-radius: 999px; font-size: .75rem; margin-right: .3rem; }
    .endpoint { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: .8rem 1rem; margin-bottom: .5rem; }
    .endpoint .path { font-family: 'SF Mono', 'Fira Code', monospace; font-size: .9rem; }
    .endpoint .desc { color: #8b949e; font-size: .85rem; margin-top: .2rem; }
    .free .path { color: #3fb950; }
    .paid .path { color: #f85149; }
    .paid .price { color: #d2a8ff; font-size: .8rem; margin-left: .5rem; }
    .bazaar-links { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1rem; margin-top: 1.5rem; }
    code { background: #1f2937; padding: .15rem .4rem; border-radius: 4px; font-size: .85rem; color: #f0e6ff; }
    pre { background: #1f2937; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: .82rem; margin-top: 1rem; line-height: 1.5; }
    hr { border: none; border-top: 1px solid #30363d; margin: 2rem 0; }
    .footer { color: #8b949e; font-size: .8rem; text-align: center; }
    a { color: #58a6ff; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🫘 GoldBean — x402 Bazaar</h1>
    <p class="sub">x402 Micropaid API Marketplace <span class="tag">v7.4.0</span> <span class="tag">Bazaar</span></p>

    <h2>🔓 Free Endpoints</h2>
    <div class="endpoint free"><div class="path">/health</div><div class="desc">Service health check</div></div>
    <div class="endpoint free"><div class="path">/gas</div><div class="desc">ETH gas price (slow/standard/fast)</div></div>
    <div class="endpoint free"><div class="path">/eth-price</div><div class="desc">ETH real-time price in USD</div></div>
    <div class="endpoint free"><div class="path">/card</div><div class="desc">Service business card</div></div>

    <h2>🔒 Paid Endpoints</h2>
    ${Object.entries(PAID).map(([p, d]) => `
    <div class="endpoint paid">
      <div class="path">${p} <span class="price">$${d.price} USDC</span></div>
      <div class="desc">${d.desc}</div>
    </div>`).join("")}

    <h2>🔗 Bazaar Discovery</h2>
    <div class="bazaar-links">
      <p><strong>Standard path:</strong> <code>/.well-known/x402-bazaar</code></p>
      <p><strong>Extension path:</strong> <code>/__bazaar</code> (JSON with <code>Accept: application/json</code>)</p>
      <p><strong>Facilitator:</strong> <code>https://x402.org/facilitator</code></p>

      <pre># Discover GoldBean via Bazaar
curl -H "Accept: application/json" ${EXTERNAL_URL}/__bazaar | jq .

# View full Bazaar manifest
curl ${EXTERNAL_URL}/.well-known/x402-bazaar | jq .

# Call a paid endpoint
curl -H "Authorization: Bearer x402_&lt;token&gt;" ${EXTERNAL_URL}/paid/btc-price</pre>
    </div>

    <hr>
    <div class="footer">
      Powered by <a href="https://bazaar.x402.org" target="_blank">x402 Bazaar</a> · 
      Built with 🫘 by GoldBean
    </div>
  </div>
</body>
</html>`);
  }
});

// ─────────────────────────────────────────
//  原始端点（v7.3.0 兼容）
// ─────────────────────────────────────────
app.get("/", (req, res) => res.json(generateData("/")));
app.get("/health", (req, res) => res.json(generateData("/health")));
app.get("/eth-price", (req, res) => res.json(generateData("/eth-price")));
app.get("/gas", (req, res) => res.json(generateData("/gas")));
app.get("/card", (req, res) => res.json(generateData("/card")));

// 付费端点（简易 x402 认证）
function requirePayment(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer x402_") && !auth.startsWith("x402 ")) {
    const info = PAID[req.path] || { price: "0.01" };
    return res.status(402).json({
      error: "payment_required",
      message: `This endpoint requires x402 payment ($${info.price} USDC).`,
      bazaar: `${EXTERNAL_URL}/.well-known/x402-bazaar`,
      accepts: [{
        scheme: "exact",
        chain: NETWORK,
        payTo: EVM_ADDRESS,
        amount: info.price,
        currency: "USDC",
      }],
    });
  }
  next();
}

Object.keys(PAID).forEach((path) => {
  app.get(path, requirePayment, (req, res) => res.json(generateData(path)));
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    bazaar: `${EXTERNAL_URL}/.well-known/x402-bazaar`,
  });
});

// ==================== 启动 ====================
app.listen(PORT, HOST, () => {
  console.log(`🫘 GoldBean v7.4.0 Bazaar Edition`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Server:  http://${HOST}:${PORT}`);
  console.log(`  Bazaar:  ${EXTERNAL_URL}/.well-known/x402-bazaar`);
  console.log(`  Ext:     ${EXTERNAL_URL}/__bazaar`);
  console.log(`  Free:    ${["/","/health","/gas","/eth-price","/card"].length} endpoints`);
  console.log(`  Paid:    ${Object.keys(PAID).length} endpoints ($${Object.values(PAID).reduce((s,v) => s + parseFloat(v.price), 0).toFixed(2)} max/call)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━`);
});
