<h1>🫘 GoldBean — x402 Micropaid API Marketplace</h1>

<p><strong>32 endpoints, 1–8¢ each. Pay with USDC on Base via x402. AI Agent ready.</strong></p>

<p>GoldBean is a 3-in-1 revenue engine running on Conway Cloud:</p>
<ul>
<li><strong>Mode 1:</strong> Data API — 32 paid endpoints across 6 categories</li>
<li><strong>Mode 2:</strong> MCP Tool Provider — 32 tools for AI Agent auto-discovery</li>
<li><strong>Mode 3:</strong> Self-Operating Engine — auto-pricing, monitoring, revenue tracking</li>
</ul>

<hr>

<h2>Quick Start</h2>

<pre><code># 1. Install AgentCash (one-time)
npx agentcash@latest onboard

# 2. Top up with USDC on Base
#    Wallet: 0x5FF9d210112A62b53E75AFdebb5e9EA6e7dD427B

# 3. Discover GoldBean endpoints
npx agentcash discover https://thermal-met-arising-spectrum.trycloudflare.com

# 4. Make your first paid call (1¢)
npx agentcash fetch https://thermal-met-arising-spectrum.trycloudflare.com/paid/btc-price -m POST
</code></pre>

<hr>

<h2>Endpoints</h2>

<h3>Blockchain (1–8¢)</h3>
<table>
<tr><th>Endpoint</th><th>Price</th><th>Description</th></tr>
<tr><td>POST /paid/gas-forecast</td><td>1¢</td><td>ETH gas price forecast</td></tr>
<tr><td>POST /paid/market-intel</td><td>3¢</td><td>Market intelligence data</td></tr>
<tr><td>POST /paid/defi-insights</td><td>8¢</td><td>DeFi protocol insights</td></tr>
<tr><td>POST /paid/network-health</td><td>3¢</td><td>Blockchain network health</td></tr>
<tr><td>POST /paid/tracker-report</td><td>3¢</td><td>On-chain tracker report</td></tr>
<tr><td>POST /paid/eth-gas-l1</td><td>2¢</td><td>L1 gas prices</td></tr>
<tr><td>POST /paid/eth-address-validate</td><td>1¢</td><td>Validate ETH address</td></tr>
<tr><td>POST /paid/ens-lookup</td><td>2¢</td><td>ENS name resolution</td></tr>
<tr><td>POST /paid/chain-fee</td><td>2¢</td><td>Chain fee estimation</td></tr>
</table>

<h3>Prices (1¢)</h3>
<table>
<tr><th>Endpoint</th><th>Price</th><th>Description</th></tr>
<tr><td>POST /paid/btc-price</td><td>1¢</td><td>Bitcoin price in USD</td></tr>
</table>

<h3>Finance (1–3¢)</h3>
<table>
<tr><th>Endpoint</th><th>Price</th><th>Description</th></tr>
<tr><td>POST /paid/stock-spy</td><td>3¢</td><td>S&amp;P 500 (SPY) price</td></tr>
<tr><td>POST /paid/fx-rates</td><td>2¢</td><td>Forex exchange rates</td></tr>
<tr><td>POST /paid/commodities</td><td>3¢</td><td>Commodity prices</td></tr>
<tr><td>POST /paid/fear-greed</td><td>1¢</td><td>Fear &amp; Greed Index</td></tr>
</table>

<h3>News (2¢ each)</h3>
<table>
<tr><th>Endpoint</th><th>Price</th><th>Description</th></tr>
<tr><td>POST /paid/crypto-news</td><td>2¢</td><td>Crypto news headlines</td></tr>
<tr><td>POST /paid/finance-news</td><td>2¢</td><td>Finance news headlines</td></tr>
<tr><td>POST /paid/tech-news</td><td>2¢</td><td>Tech news headlines</td></tr>
</table>

<h3>Utility (1¢ each)</h3>
<table>
<tr><th>Endpoint</th><th>Price</th><th>Description</th></tr>
<tr><td>POST /paid/ip-geo</td><td>1¢</td><td>IP geolocation</td></tr>
<tr><td>POST /paid/user-agent</td><td>1¢</td><td>Parse user agent</td></tr>
<tr><td>POST /paid/uuid-gen</td><td>1¢</td><td>Generate UUID v4</td></tr>
<tr><td>POST /paid/qr-code</td><td>1¢</td><td>Generate QR code</td></tr>
<tr><td>POST /paid/hash-text</td><td>1¢</td><td>Hash text (SHA-256)</td></tr>
<tr><td>POST /paid/base64-encode</td><td>1¢</td><td>Base64 encode/decode</td></tr>
<tr><td>POST /paid/weather</td><td>1¢</td><td>Weather by city</td></tr>
<tr><td>POST /paid/time-convert</td><td>1¢</td><td>Timezone conversion</td></tr>
<tr><td>POST /paid/json-validate</td><td>1¢</td><td>Validate JSON</td></tr>
<tr><td>POST /paid/password-gen</td><td>1¢</td><td>Generate password</td></tr>
<tr><td>POST /paid/color-convert</td><td>1¢</td><td>Color format conversion</td></tr>
<tr><td>POST /paid/unit-convert</td><td>1¢</td><td>Unit conversion</td></tr>
<tr><td>POST /paid/word-count</td><td>1¢</td><td>Word/char count</td></tr>
</table>

<h3>Fun (1¢ each)</h3>
<table>
<tr><th>Endpoint</th><th>Price</th><th>Description</th></tr>
<tr><td>POST /paid/random-quote</td><td>1¢</td><td>Random quote</td></tr>
<tr><td>POST /paid/joke</td><td>1¢</td><td>Random joke</td></tr>
</table>

<h3>Free Endpoints (10/day)</h3>
<ul>
<li>GET /gas — Live ETH gas prices</li>
<li>GET /eth-price — ETH/USD price</li>
<li>GET /health — Server status</li>
</ul>

<hr>

<h2>MCP Tools (Mode 2)</h2>

<p>All 32 endpoints are available as MCP-compatible tools:</p>
<pre><code>GET /mcp/tools</code></pre>
<p>Returns a full MCP manifest for AI Agent auto-discovery.</p>

<hr>

<h2>Self-Operating Engine (Mode 3)</h2>

<pre><code>GET /engine/report</code></pre>
<p>Real-time revenue tracking, auto-pricing, and monitor status.</p>

<hr>

<h2>API References</h2>
<ul>
<li>OpenAPI 3.1.0: <code>GET /openapi.json</code></li>
<li>x402 Discovery: <code>GET /.well-known/x402</code></li>
<li>Metrics: <code>GET /metrics</code></li>
<li>AgentCash: <code>GET /.well-known/agentcash</code></li>
</ul>

<hr>

<h2>Architecture</h2>

<pre><code>AI Agent → AgentCash → Cloudflare Tunnel → Conway Sandbox → GoldBean → Response
                   ↕
            USDC on Base (eip155:8453)
                   ↕
           Seller Wallet: 0xB5f5CBe48E0595C044Bc626f278F757463eAc2Ce
</code></pre>

<hr>

<h2>License</h2>

<p>MIT</p>

<hr>

<p><em>Built on Conway Cloud · Part of the x402 ecosystem</em></p>
