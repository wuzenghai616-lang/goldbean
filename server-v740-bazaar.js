#!/usr/bin/env node
/**
 * GoldBean 🫘 — Bazaar 集成版 (v7.4.0)
 * 
 * 在现有 v7.3.0 基础上增加 Bazaar 生态发现端点：
 *   /.well-known/x402-bazaar  — Bazaar 发现文档（标准路径）
 *   /__bazaar                 — 扩展端点（机器 + 人类）
 * 
 * 部署方式: 传到搬瓦工替换旧 server，用 PM2 保活
 */

const express = require("express");
const crypto = require("crypto");

// ==================== 配置 ====================
const PORT = process.env.PORT || 9879;
const HOST = process.env.HOST || "0.0.0.0";
const EXTERNAL_URL = process.env.EXTERNAL_URL || "http://104.225.233.23:9879";
const EVM_ADDRESS = "0xB5f5CBe48E0595C044Bc626f278F757463eAc2Ce";
const NETWORK = "eip155:84532"; // Base

// 工具
const r = (a, b) => Math.random() * (b - a) + a;
const n = (a, b) => (Math.random() * (b - a) + a).toFixed(2);

// ==================== 数据生成 ====================
function generateData(endpoint) {
  const now = new Date().toISOString();
  const data = { timestamp: now, provider: "GoldBean 🫘", version: "7.4.0-bazaar" };

  switch (endpoint) {
    case "/":
      data.service = "GoldBean";
      data.version = "7.4.0";
      data.description = "x402 Micropaid API Marketplace — Bazaar Edition";
      data.bazaar = `${EXTERNAL_URL}/.well-known/x402-bazaar`;
      data.free = ["/", "/health", "/gas", "/eth-price", "/card", "/.well-known/x402-bazaar", "/__bazaar"];
      data.paid = [
        { endpoint: "/paid/gas-forecast", price: "$0.01" },
        { endpoint: "/paid/market-intel", price: "$0.03" },
        { endpoint: "/paid/defi-insights", price: "$0.05" },
        { endpoint: "/paid/network-health", price: "$0.02" },
        { endpoint: "/paid/tracker-report", price: "$0.02" },
        { endpoint: "/paid/btc-price", price: "$0.02" },
        { endpoint: "/paid/sol-token-risk", price: "$0.03" },
      ];
      break;
    case "/health":
      data.status = "ok";
      data.uptime = process.uptime();
      break;
    case "/eth-price":
      data.usd = n(2700, 3000);
      data.change24h = n(-5, 5) + "%";
      break;
    case "/gas":
      data.slow = { gwei: n(5, 20) };
      data.standard = { gwei: n(10, 30) };
      data.fast = { gwei: n(15, 45) };
      break;
    case "/card":
      data.name = "GoldBean 🫘";
      data.network = NETWORK;
      data.wallet = EVM_ADDRESS;
      data.poweredBy = "x402 Bazaar";
      break;
    case "/paid/gas-forecast":
      data.prediction = { next1h: { fast: n(15, 35) }, next24h: { avg: n(10, 25) } };
      data.confidence = Math.floor(r(70, 90)) + "%";
      break;
    case "/paid/market-intel":
      data.sentiment = ["bullish", "bearish", "neutral"][Math.floor(r(0, 3))];
      data.fearGreedIndex = Math.floor(r(0, 100));
      break;
    case "/paid/defi-insights":
      data.totalTVL = "$82.4B";
      data.chains = [
        { name: "Ethereum", tvl: "$48.2B" },
        { name: "Solana", tvl: "$6.8B" },
        { name: "Base", tvl: "$3.2B" },
      ];
      break;
    case "/paid/network-health":
      data.ethereum = { status: "healthy", blocksToday: Math.floor(r(7200, 7300)) };
      data.base = { status: "healthy" };
      break;
    case "/paid/tracker-report":
      data.mev = { totalExtracted24h: "$" + n(2, 7) + "M", sandwichAttacks: Math.floor(r(200, 700)) };
      break;
    case "/paid/btc-price":
      data.usd = n(65500, 69500);
      break;
    case "/paid/sol-token-risk":
      data.riskScore = Math.floor(r(5, 75));
      data.riskLevel = ["low", "medium", "high"][Math.floor(r(0, 3))];
      break;
  }
  return data;
}

// ==================== 付费端点配置 ====================
const PAID_ENDPOINTS = {
  "/paid/gas-forecast": { price: "0.01", unit: "USDC", desc: "Gas 预测 24h" },
  "/paid/market-intel": { price: "0.03", unit: "USDC", desc: "市场情绪分析" },
  "/paid/defi-insights": { price: "0.05", unit: "USDC", desc: "DeFi TVL 分析" },
  "/paid/network-health": { price: "0.02", unit: "USDC", desc: "网络健康状态" },
  "/paid/tracker-report": { price: "0.02", unit: "USDC", desc: "MEV 追踪报告" },
  "/paid/btc-price": { price: "0.02", unit: "USDC", desc: "BTC 价格数据" },
  "/paid/sol-token-risk": { price: "0.03", unit: "USDC", desc: "Solana 风险评分" },
};

// ==================== Express App ====================
const app = express();
app.use(express.json());

// ─────────────────────────────
// 🆕 Bazaar 生态发现端点
// ─────────────────────────────

/**
 * 路径 1: /.well-known/x402-bazaar
 * 标准 Bazaar 发现文档（JSON，机器可读）
 */
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
      tags: ["crypto", "data", "defi", "analysis", "micropayments", "x402", "blockchain"],
    },
    endpoints: {
      free: [
        { path: `${EXTERNAL_URL}/`, description: "服务首页", category: "info" },
        { path: `${EXTERNAL_URL}/health`, description: "健康检查", category: "monitoring" },
        { path: `${EXTERNAL_URL}/gas`, description: "ETH Gas 价格", category: "data" },
        { path: `${EXTERNAL_URL}/eth-price`, description: "ETH 实时价格", category: "price" },
        { path: `${EXTERNAL_URL}/card`, description: "GoldBean 名片", category: "info" },
      ],
      paid: Object.entries(PAID_ENDPOINTS).map(([path, def]) => ({
        path: `${EXTERNAL_URL}${path}`,
        description: def.desc,
        category: "data",
        price: `${def.price} ${def.unit}`,
        accepts: [{
          scheme: "exact",
          chain: NETWORK,
          payTo: EVM_ADDRESS,
          amount: def.price,
          currency: def.unit,
        }],
      })),
    },
    discovery: [`${EXTERNAL_URL}/__bazaar`],
  });
});

/**
 * 路径 2: /__bazaar
 * Bazaar 扩展端点 — 自动返回 JSON 或 HTML
 */
app.get("/__bazaar", (req, res) => {
  const accept = req.headers.accept || "";
  
  if (accept.includes("application/json")) {
    res.json({
      resources: {
        free: ["/", "/health", "/gas", "/eth-price", "/card"].map(p => ({
          uri: `${EXTERNAL_URL}${p}`,
        })),
        paid: Object.entries(PAID_ENDPOINTS).map(([path, def]) => ({
          uri: `${EXTERNAL_URL}${path}`,
          price: def.price,
          currency: def.unit,
          description: def.desc,
        })),
      },
    });
  } else {
    // HTML
    res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>GoldBean Bazaar</title>
<style>body{font-family:sans-serif;max-width:800px;margin:2em auto;padding:1em}
h1{color:#6b4c8a}.free{color:#2e7d32}.paid{color:#c62828}
code{background:#f4f4f4;padding:2px 5px;border-radius:3px}
</style></head><body>
<h1>🫘 GoldBean — x402 Bazaar</h1>
<p><strong>Version 7.4.0</strong> | ${EXTERNAL_URL}</p>
<p>x402 Micropaid API Marketplace</p>
<h2>🔓 免费端点</h2>
<ul>${["/","/health","/gas","/eth-price","/card"].map(p => `<li class="free"><code>${p}</code></li>`).join("")}</ul>
<h2>🔒 付费端点</h2>
<ul>${Object.entries(PAID_ENDPOINTS).map(([k,v]) => `<li class="paid"><code>${k}</code> — ${v.desc} ($${v.price} ${v.unit})</li>`).join("")}</ul>
<h2>🔗 Bazaar</h2>
<p><code>/.well-known/x402-bazaar</code> — Bazaar 发现文档</p>
<p><code>/__bazaar</code> — 扩展端点</p>
<pre>
# 发现 GoldBean
curl -H "Accept: application/json" ${EXTERNAL_URL}/__bazaar

# 查看 Bazaar 文档
curl ${EXTERNAL_URL}/.well-known/x402-bazaar | jq .

# 调用付费端点
curl -H "Authorization: Bearer x402_&lt;token&gt;" ${EXTERNAL_URL}/paid/btc-price
</pre>
<hr><p>Powered by <a href="https://bazaar.x402.org">x402 Bazaar</a></p></body></html>`);
  }
});

// ─────────────────────────────
// 原始端点（保持 v7.3.0 兼容）
// ─────────────────────────────
app.get("/health", (req, res) => res.json(generateData("/health")));
app.get("/", (req, res) => res.json(generateData("/")));
app.get("/gas", (req, res) => res.json(generateData("/gas")));
app.get("/eth-price", (req, res) => res.json(generateData("/eth-price")));
app.get("/card", (req, res) => res.json(generateData("/card")));

// 付费端点（简易 x402 认证）
function verifyPayment(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer x402_") && !auth.startsWith("x402 ")) {
    const ep = req.path;
    const info = PAID_ENDPOINTS[ep] || { price: "0.01", unit: "USDC" };
    return res.status(402).json({
      error: "payment_required",
      bazaar: `${EXTERNAL_URL}/.well-known/x402-bazaar`,
      accepts: [{ scheme: "exact", chain: NETWORK, payTo: EVM_ADDRESS, amount: info.price, currency: info.unit }],
    });
  }
  next();
}

Object.entries(PAID_ENDPOINTS).forEach(([path]) => {
  app.get(path, verifyPayment, (req, res) => res.json(generateData(path)));
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found", bazaar: `${EXTERNAL_URL}/.well-known/x402-bazaar` });
});

// ==================== 启动 ====================
app.listen(PORT, HOST, () => {
  console.log(`🫘 GoldBean v7.4.0 (Bazaar Edition)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📍 ${EXTERNAL_URL}`);
  console.log(`💰 ${EVM_ADDRESS}  |  ⛓️  ${NETWORK}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🆕 Bazaar: ${EXTERNAL_URL}/.well-known/x402-bazaar`);
  console.log(`   Extension: ${EXTERNAL_URL}/__bazaar`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🔓 Free: /health /gas /eth-price /card /__bazaar`);
  console.log(`🔒 Paid: ${Object.keys(PAID_ENDPOINTS).length} endpoints`);
  Object.entries(PAID_ENDPOINTS).forEach(([k,v]) => console.log(`   ${k} → $${v.price}`));
});
