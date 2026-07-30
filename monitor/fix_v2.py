import re

with open("/opt/goldbean/monitor/vps_monitor_v2.js", "r") as f:
    code = f.read()

# Replace Binance WS with Bitget polling
old_start = 'function startBinanceWS'
new_func = '''
// ============ 数据源：Bitget REST 高频轮询 (30s) ============

const BITGET_SYMBOLS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','ARBUSDT','OPUSDT','AAVEUSDT','UNIUSDT'];

function startBitgetPolling(tracker) {
  async function poll() {
    for (const sym of BITGET_SYMBOLS) {
      try {
        const data = await new Promise((resolve, reject) => {
          https.get("https://api.bitget.com/api/v2/spot/market/tickers?symbol=" + sym, {timeout:5000}, (res) => {
            let body = "";
            res.on("data", c => body += c);
            res.on("end", () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
          }).on("error", reject);
        });
        if (data && data.data && data.data[0] && data.data[0].lastPr) {
          tracker.recordPrice(sym, parseFloat(data.data[0].lastPr), "bitget");
        }
      } catch(e) {}
    }
  }
  poll();
  setInterval(poll, 30000);
  log("✅ Bitget 高频轮询启动 (30s间隔)");
}
'''

# Find the start of startBinanceWS function
idx = code.find(old_start)
if idx < 0:
    print("ERROR: startBinanceWS not found")
    exit(1)

# Find the start of coingecko fallback function
cg_idx = code.find("let coingeckoFailures = 0")
if cg_idx < 0:
    cg_idx = code.find("function startCoinGeckoFallback")
if cg_idx < 0:
    cg_idx = code.find("coingeckoFailures")
if cg_idx < 0:
    print("ERROR: coingecko fallback not found")
    exit(1)

# Replace the Binance WS function with Bitget polling
code = code[:idx] + new_func + code[cg_idx:]

# Update function calls
code = code.replace("startBinanceWS(tracker);", "startBitgetPolling(tracker);")

with open("/opt/goldbean/monitor/vps_monitor_v2.js", "w") as f:
    f.write(code)

print("OK: patched", len(code.splitlines()), "lines")
