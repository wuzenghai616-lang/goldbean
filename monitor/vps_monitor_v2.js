/**
 * 🫘 GoldBean 链上情报监控守护进程 V2
 * 
 * 运行在 VPS (104.225.233.23) 上，7×24持久运行
 * 
 * 特色：
 * - 实时价格多源订阅 (Binance WS + CoinGecko REST)
 * - AI 异常检测 (Z-Score + 滑动窗口)
 * - 多数据源热备自动切换
 * - 自动重连 + 心跳保活
 * - 暴露 REST API 供 OpenClaw 拉取
 * 
 * 安装：systemd 管理，自动重启
 * 端口：19876
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const WebSocket = require('ws');

// ============ 配置 ============

const CONFIG = {
  port: 19876,
  dataDir: '/opt/goldbean/monitor',
  logFile: '/opt/goldbean/monitor/monitor.log',
  priceFile: '/opt/goldbean/monitor/prices.json',
  alertFile: '/opt/goldbean/monitor/alerts.json',

  watchList: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ARBUSDT', 'OPUSDT', 'AAVEUSDT', 'UNIUSDT'],

  ws: {
    binance: 'wss://stream.binance.com:9443/ws',
    reconnectDelay: 3000,
    maxReconnect: 100
  },

  alert: {
    zscoreThreshold: 3.5,
    windowSize: 20,           // 滑动窗口大小
    minSamples: 20,            // 最少样本数才分析
    cooldownMs: 300000        // 同币种告警冷却 5分钟
  },

  restApi: {
    port: 19876,
    coingeckoUrl: 'https://api.coingecko.com/api/v3/simple/price'
  }
};

// ============ 日志 ============

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(CONFIG.logFile, line + '\n'); } catch(e) {}
}

// ============ 价格追踪器 ============

class PriceTracker {
  constructor() {
    this.prices = {};       // symbol -> {window: [], last: 0, mean: 0, std: 0, zscore: 0}
    this.alerts = [];
    this.cooldowns = {};    // symbol -> timestamp
    this.startTime = Date.now();
    this.loadHistory();
  }

  loadHistory() {
    try {
      this.prices = JSON.parse(fs.readFileSync(CONFIG.priceFile, 'utf8'));
      this.alerts = JSON.parse(fs.readFileSync(CONFIG.alertFile, 'utf8'));
      log(`📂 已加载历史数据: ${Object.keys(this.prices).length} 币种, ${this.alerts.length} 告警`);
    } catch(e) {
      log('🆕 初始化新的价格数据库');
    }
  }

  saveHistory() {
    try {
      fs.writeFileSync(CONFIG.priceFile, JSON.stringify(this.prices));
      fs.writeFileSync(CONFIG.alertFile, JSON.stringify(this.alerts.slice(-200)));
    } catch(e) {
      log(`❌ 保存失败: ${e.message}`);
    }
  }

  recordPrice(symbol, price, source) {
    if (!price || price <= 0) return;
    
    if (!this.prices[symbol]) {
      this.prices[symbol] = { window: [], source: '', lastUpdate: 0, count: 0 };
    }

    const data = this.prices[symbol];

    // 去重：同一价格不重复记录
    if (Math.abs(price - data.lastPrice) < 0.0001) return;

    data.lastPrice = price;
    data.source = source;
    data.lastUpdate = Date.now();
    data.count = (data.count || 0) + 1;

    // 维护滑动窗口
    data.window.push(price);
    if (data.window.length > CONFIG.alert.windowSize + 10) {
      data.window = data.window.slice(-CONFIG.alert.windowSize);
    }

    // 计算统计量
    if (data.window.length >= CONFIG.alert.minSamples) {
      const n = data.window.length;
      const mean = data.window.reduce((a,b) => a+b, 0) / n;
      const variance = data.window.reduce((a,b) => a + (b-mean)*(b-mean), 0) / (n-1);
      const std = Math.sqrt(variance);
      
      data.mean = mean;
      data.std = std;
      data.zscore = std > 0 ? (price - mean) / std : 0;
      data.direction = data.zscore > 0 ? 'up' : 'down';
      data.changePct = std > 0 ? ((price - mean) / mean * 100).toFixed(2) : '0.00';

      // 异常检测
      // Adaptive threshold: lower threshold as window grows
      const adaptiveThreshold = data.window.length < 30 ? 3.5 : 
                                data.window.length < 50 ? 3.0 : 2.5;
      if (Math.abs(data.zscore) >= adaptiveThreshold) {
        this.raiseAlert(symbol, price, data);
      }
    }

    // 每10条记录保存一次
    if (data.count % 10 === 0) this.saveHistory();
  }

  raiseAlert(symbol, price, data) {
    const now = Date.now();
    const lastAlert = this.cooldowns[symbol] || 0;

    // 冷却期去重
    if (now - lastAlert < CONFIG.alert.cooldownMs) return;

    this.cooldowns[symbol] = now;

    const alert = {
      t: now,
      ts: new Date().toISOString(),
      symbol,
      price,
      mean: data.mean,
      std: data.std,
      zscore: Math.round(data.zscore * 100) / 100,
      changePct: data.changePct,
      direction: data.direction,
      source: data.source,
      windowSize: data.window.length,
      summary: `🚨 ${symbol.replace('USDT','')} 异常波动: ${data.changePct}% (Z=${(data.zscore).toFixed(1)}) $${price}`
    };

    this.alerts.push(alert);
    if (this.alerts.length > 200) this.alerts = this.alerts.slice(-200);
    
    log(`🚨 ALERT: ${alert.summary}`);
    this.saveHistory();
  }

  getStatus() {
    const coins = {};
    for (const [sym, data] of Object.entries(this.prices)) {
      coins[sym.replace('USDT','')] = {
        price: data.lastPrice,
        source: data.source,
        lastUpdate: data.lastUpdate,
        zscore: data.zscore,
        changePct: data.changePct,
        windowSize: data.window.length
      };
    }
    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      coins,
      alertsCount: this.alerts.length,
      recentAlerts: this.alerts.slice(-10),
      healthy: Object.keys(coins).length > 0
    };
  }
}

// ============ 数据源：Binance WebSocket ============


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
let coingeckoFailures = 0;
function startCoinGeckoFallback(tracker) {
  async function poll() {
    const ids = ['bitcoin','ethereum','solana','binancecoin','arbitrum','optimism','aave','uniswap'];
    const symbols = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','ARBUSDT','OPUSDT','AAVEUSDT','UNIUSDT'];
    
    try {
      const url = `${CONFIG.restApi.coingeckoUrl}?ids=${ids.join(',')}&vs_currencies=usd`;
      const data = await new Promise((resolve, reject) => {
        https.get(url, {timeout:10000}, (res) => {
          let body = '';
          res.on('data', c => body += c);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); } catch(e) { reject(e); }
          });
        }).on('error', reject);
      });

      coingeckoFailures = 0;
      const idMap = {bitcoin:'BTCUSDT',ethereum:'ETHUSDT',solana:'SOLUSDT',binancecoin:'BNBUSDT',
                     arbitrum:'ARBUSDT',optimism:'OPUSDT',aave:'AAVEUSDT',uniswap:'UNIUSDT'};
      
      for (const [id, sym] of Object.entries(idMap)) {
        if (data[id] && data[id].usd) {
          tracker.recordPrice(sym, data[id].usd, 'coingecko_fallback');
        }
      }
    } catch(e) {
      coingeckoFailures++;
      log(`⚠️ CoinGecko 备胎失败 x${coingeckoFailures}: ${e.message}`);
    }
  }

  // 每5分钟轮询一次
  poll();
  setInterval(poll, 300000);
}

// ============ 监控状态 API ============

function startStatusAPI(tracker) {
  const app = express();
  
  // CORS
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });

  // 状态
  app.get('/status', (req, res) => {
    res.json(tracker.getStatus());
  });

  // 价格
  app.get('/prices', (req, res) => {
    const coins = {};
    for (const [sym, d] of Object.entries(tracker.prices)) {
      coins[sym.replace('USDT','')] = { price: d.lastPrice, source: d.source, zscore: d.zscore };
    }
    res.json({ t: new Date().toISOString(), coins });
  });

  // 告警
  app.get('/alerts', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json({ count: tracker.alerts.length, alerts: tracker.alerts.slice(-limit) });
  });

  // 健康
  app.get('/health', (req, res) => {
    res.json({ ok: true, uptime: Math.floor((Date.now() - tracker.startTime) / 1000), coins: Object.keys(tracker.prices).length });
  });

  app.listen(CONFIG.port, '0.0.0.0', () => {
    log(`📡 监控状态 API 启动: http://0.0.0.0:${CONFIG.port}`);
  });
}

// ============ 主入口 ============

log('🫘 GoldBean 链上情报监控守护进程 V2 启动');
log(`监视 ${CONFIG.watchList.length} 个币种, Z-Score 阈值: ${CONFIG.alert.zscoreThreshold}`);

const tracker = new PriceTracker();

// 启动所有子系统
startBitgetPolling(tracker);      // 实时数据流
startCoinGeckoFallback(tracker); // REST 备胎
startStatusAPI(tracker);      // 状态 API

// 自动保存定时器
setInterval(() => {
  tracker.saveHistory();
  log(`💾 自动保存 | 活跃: ${Object.keys(tracker.prices).length} 币 | 告警: ${tracker.alerts.length}`);
}, 300000); // 5分钟

// 内存监控
setInterval(() => {
  const mem = process.memoryUsage();
  log(`📊 内存: ${(mem.heapUsed/1024/1024).toFixed(1)}MB / ${(mem.heapTotal/1024/1024).toFixed(1)}MB`);
  if (mem.heapUsed > 500 * 1024 * 1024) {
    log('⚠️ 内存超限触发GC');
    global.gc && global.gc();
  }
}, 600000); // 10分钟

log('✅ 全部子系统已启动');

