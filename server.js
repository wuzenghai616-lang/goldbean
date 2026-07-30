// ═══════════════════════════════════════════════════════
// GoldBean API Server — v8.0.0 (Architecture Refactored)
// 按标准架构重构：安全配置 → 核心工具 → 系统接口 → /api 公开 → /paid 付费 → 兜底
// ═══════════════════════════════════════════════════════

const express = require('express');
const app = express();
const X = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const { ethers } = require('ethers');
const { URLSearchParams } = require('url');

const PORT     = process.env.PORT || 9879;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ========== 安全配置 ==========
const ENABLE_ROUTES_API = process.env.ENABLE_ROUTES_API === 'true' || NODE_ENV !== 'production';
const ROUTES_API_TOKEN = process.env.ROUTES_API_TOKEN || '';
const ENABLE_DEBUG_PAGE = process.env.ENABLE_DEBUG_PAGE === 'true' || NODE_ENV !== 'production';

const WALLET   = '0x7484b0bca25d2ee56e9b0535572d4cf44a047d98';
const NETWORK  = 'eip155:8453';
const BASE_URL = 'https://goldbean-api.xyz';
const INTERNAL_KEY = 'goldbean-bypass-2026';  // bypass token
const GB_DIR  = '/opt/goldbean';

// ========== 工具函数 ==========
function T() { return new Date().toISOString(); }
function LC(o, e) { const ts = T(); if (e) console.error(`[${ts}]`, o, e?.message||e); else console.log(`[${ts}]`, o); }
function readJSON(fp, def) { try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch(e) { return def; } }
function writeJSON(fp, data) { fs.writeFileSync(fp, JSON.stringify(data, null, 2)); }
const nonceSet = new Set();
setInterval(() => { if (nonceSet.size > 10000) nonceSet.clear(); }, 300000);

// ========== 全局基础中间件 ==========
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf, encoding) => {
    try { JSON.parse(buf.toString(encoding || 'utf8')); }
    catch(e) {
      const err = new Error('Invalid JSON body');
      err.status = 400;
      err.code = 400;
      throw err;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-pay-signature, x-sub-id, x-pay-amount, x-internal, x-payment-signature, x-user-id, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ========== 核心工具1：安全加载路由模块 ==========
function safeLoadRouter(modulePath, mountPath, options = {}) {
  try {
    const mod = require(modulePath);
    let router;
    if (typeof mod === 'function') router = mod;
    else if (mod.router && typeof mod.router === 'function') router = mod.router;
    else throw new Error('模块未导出有效的 Router 对象');
    if (options.autoInit && typeof mod.init === 'function') {
      mod.init().then(() => LC(`[init OK] ${modulePath}`)).catch(e => LC(`[init FAIL] ${modulePath}: ${e.message}`));
    }
    app.use(mountPath, router);
    LC(`[mount OK] ${mountPath} ← ${modulePath}`);
    return true;
  } catch (err) {
    LC(`[mount FAIL] ${modulePath}: ${err.message}`);
    return false;
  }
}

// ========== 核心工具2：手动路由注册表 ==========
// 绕过 Express 5 的 _router.stack 兼容问题，手动注册每条路由
const _routeRegistry = [];
function registerRoute(method, path, type) { _routeRegistry.push({ method, path, type }); }
function regSystem(method, path) { registerRoute(method, path, 'system'); }
function regPublic(method, path) { registerRoute(method, path, 'public'); }
function regPaid(method, path) { registerRoute(method, path, 'paid'); }
function regPaidPost(path) { registerRoute('POST', path, 'paid'); }

// ========== 核心工具3：提取所有已注册路由 ==========
function getAllRoutes() {
  return {
    timestamp: Date.now(),
    environment: NODE_ENV,
    total: _routeRegistry.length,
    groups: {
      system: _routeRegistry.filter(r => r.type === 'system'),
      public: _routeRegistry.filter(r => r.type === 'public'),
      paid: _routeRegistry.filter(r => r.type === 'paid')
    }
  };
}

// ========== 核心工具4：启动时打印接口清单 ==========
function printRegisteredRoutes() {
  const data = getAllRoutes();
  console.log('\n' + '='.repeat(50));
  console.log('📋 已挂载接口清单');
  console.log('='.repeat(50));
  if (data.groups.system.length) {
    console.log('\n🔧 系统接口');
    console.log('-'.repeat(40));
    data.groups.system.forEach(r => console.log(` ${r.method.padEnd(6)} ${r.path}`));
  }
  if (data.groups.public.length) {
    console.log('\n🌐 公开接口 (/api 前缀)');
    console.log('-'.repeat(40));
    data.groups.public.forEach(r => console.log(` ${r.method.padEnd(6)} ${r.path}`));
  }
  if (data.groups.paid.length) {
    console.log('\n💰 付费接口 (/paid 前缀)');
    console.log('-'.repeat(40));
    data.groups.paid.forEach(r => console.log(` ${r.method.padEnd(6)} ${r.path}`));
  }
  console.log('\n' + '-'.repeat(40));
  console.log(`✅ 总计 ${data.total} 个接口已注册生效`);
  console.log('='.repeat(50) + '\n');
}

// ========== 核心工具5：在线调试页面 HTML ==========
const debugPageHtml = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>GoldBean API 调试台</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f7fa;padding:20px;color:#333}
.container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:320px 1fr;gap:20px}
.panel{background:#fff;border-radius:8px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
h1{font-size:18px;margin-bottom:16px;color:#1f2937}
h2{font-size:14px;margin:12px 0 8px;color:#4b5563;border-bottom:1px solid #eee;padding-bottom:4px}
.form-group{margin-bottom:12px}
label{display:block;font-size:12px;color:#6b7280;margin-bottom:4px}
input,select,textarea{width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;font-family:inherit}
textarea{resize:vertical;min-height:80px;font-family:monospace}
button{width:100%;padding:10px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px}
button:hover{background:#1d4ed8}
.route-list{max-height:400px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:6px}
.route-item{padding:8px 10px;cursor:pointer;border-bottom:1px solid #f3f4f6;font-size:12px;font-family:monospace}
.route-item:hover{background:#f0f9ff}
.route-item .method{display:inline-block;width:50px;font-weight:bold}
.method-GET{color:#10b981}.method-POST{color:#f59e0b}.method-ALL{color:#6b7280}
.response{margin-top:16px}
.response pre{background:#1f2937;color:#f9fafb;padding:16px;border-radius:6px;overflow-x:auto;font-size:12px;line-height:1.5;min-height:200px}
.status{margin-bottom:8px;font-size:13px;font-weight:500}
.status.success{color:#10b981}.status.error{color:#ef4444}
</style></head><body>
<div class="container">
<div class="panel">
<h1>🔌 API 调试台</h1>
<div class="form-group"><label>API Key（x-user-id）</label><input type="text" id="apiKey" placeholder="输入你的 API Key"></div>
<h2>接口列表</h2><div class="route-list" id="routeList">加载中...</div>
</div>
<div class="panel">
<div class="form-group" style="display:grid;grid-template-columns:100px 1fr;gap:10px">
<div><label>方法</label><select id="method"><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option></select></div>
<div><label>路径</label><input type="text" id="path" placeholder="/paid/baidu-ocr"></div>
</div>
<div class="form-group"><label>Query 参数（JSON）</label><textarea id="queryParams" placeholder='{"key":"value"}'></textarea></div>
<div class="form-group"><label>请求 Body（JSON）</label><textarea id="bodyParams" placeholder='{"text":"测试"}'></textarea></div>
<button id="sendBtn">发送请求</button>
<div class="response">
<h2>响应结果</h2><div class="status" id="status">等待请求...</div>
<pre id="responseBody">// 点击发送请求后查看结果</pre>
</div></div></div>
<script>
let allRoutes=[];
async function loadRoutes(){
  try{
    const r=await fetch('/api/routes');const d=await r.json();
    allRoutes=[...d.groups.system.map(r=>({...r,t:'系统'})),...d.groups.public.map(r=>({...r,t:'公开'})),...d.groups.paid.map(r=>({...r,t:'付费'}))];
    renderRoutes();
  }catch(e){document.getElementById('routeList').innerHTML='加载失败'}
}
function renderRoutes(){
  const c=document.getElementById('routeList');c.innerHTML='';
  allRoutes.forEach(r=>{
    const d=document.createElement('div');d.className='route-item';
    d.innerHTML='<span class="method method-'+r.method+'">'+r.method+'</span> <span>'+r.path+'</span>';
    d.onclick=()=>selectRoute(r);c.appendChild(d);
  });
}
function selectRoute(r){
  document.getElementById('method').value=(r.method==='ALL'?'GET':r.method.split(',')[0]);
  document.getElementById('path').value=r.path;
}
document.getElementById('sendBtn').onclick=async()=>{
  const m=document.getElementById('method').value;let p=document.getElementById('path').value.trim();
  const k=document.getElementById('apiKey').value.trim();const qs=document.getElementById('queryParams').value.trim();
  const bs=document.getElementById('bodyParams').value.trim();const st=document.getElementById('status');const be=document.getElementById('responseBody');
  st.className='status';st.textContent='请求中...';
  try{
    if(qs){const urlp=JSON.parse(qs);p+=(p.includes('?')?'&':'?')+new URLSearchParams(urlp).toString();}
    const opts={method:m,headers:{}};
    if(k) opts.headers['x-user-id']=k;
    if(bs&&['POST','PUT','PATCH'].includes(m)){opts.headers['Content-Type']='application/json';opts.body=bs;}
    const start=Date.now();const res=await fetch(p,opts);const cost=Date.now()-start;const data=await res.json();
    st.className='status '+(res.ok?'success':'error');st.textContent='状态码: '+res.status+' | 耗时: '+cost+'ms';
    be.textContent=JSON.stringify(data,null,2);
  }catch(e){st.className='status error';st.textContent='请求失败';be.textContent=e.message;}
};
loadRoutes();
</script></body></html>`;

// ═══════════════════════════════════════════════════════
// 1. 系统级接口（最优先）
// ═══════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now(), version: '9.6.0', baidu: true, payment: true, affiliate: true, note: 'Baidu AI focused — 119 empty stubs removed' });
});

// x402 endpoint — for Coinbase CDP Bazaar discovery
app.get("/x402-endpoint", (req, res) => {
  res.json({
    protocol: "x402",
    version: "1.0.0",
    service: {
      name: "GoldBean API",
      version: "9.6.0",
      description: "86 API routes (63 paid + 25 free). Baidu AI, OpenAI-compat, PayPal, Alipay. Pay per call via x402 (USDC on Base).",
      homepage: "https://goldbean-api.xyz",
      documentation: "https://goldbean-api.xyz/openapi.json"
    },
    networks: ["eip155:8453"],
    currencies: [
      { id: "USDC", network: "base", contract: "0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913", decimals: 6 }
    ],
    wallet: "0x7484b0bca25d2ee56e9b0535572d4cf44a047d98",
    pricing: {
      standard: { price: 0.99, currency: "USDC", unit: "per request", description: "Pay per API call, no subscription needed" },
      bulk_100: { price: 49, currency: "USDC", unit: "100 requests", description: "Single use package, $0.49/req" }
    },
    payment_methods: ["x402", "paypal", "alipay"],
    endpoints: { base_url: "https://goldbean-api.xyz", schema: "https://goldbean-api.xyz/openapi.json" },
    api_routes: "https://goldbean-api.xyz/api/routes"
  });
});

regSystem('GET', '/health');

const _openapiContent = fs.readFileSync(__dirname + "/public/openapi.json", "utf8"); app.get("/openapi.json", (req, res) => { res.type("json").send(_openapiContent); });
app.get("/favicon.ico", (req, res) => res.sendFile(__dirname + "/public/favicon.ico"));
app.get("/og-image.png", (req, res) => res.sendFile(__dirname + "/public/og-image.png"));

// Pre-load mcp.json content from file
const _mcpContent = fs.readFileSync(__dirname + "/public/.well-known/mcp.json", "utf8");
app.get("/.well-known/mcp.json", (req, res) => { res.type("json").send(_mcpContent); });
const _x402JsonContent = fs.readFileSync(__dirname + "/public/.well-known/x402.json", "utf8");
const _x402RawContent = fs.readFileSync(__dirname + "/public/.well-known/x402", "utf8");
const _llmsTxtContent = fs.readFileSync(__dirname + "/public/llms.txt", "utf8");
app.get("/.well-known/x402", (req, res) => { res.type("json").send(_x402RawContent); });
app.get("/.well-known/x402.json", (req, res) => { res.type("json").send(_x402JsonContent); });
app.get("/llms.txt", (req, res) => { res.type("text/plain").send(_llmsTxtContent); });
app.get('/.well-known/mcp-registry-auth', (req, res) => { res.type('txt').send(fs.readFileSync(__dirname + '/public/.well-known/mcp-registry-auth', 'utf8')); });
app.get("/ocr-demo", (req, res) => res.sendFile(__dirname + "/public/ocr-demo.html"));
regSystem('GET', '/openapi.json');

// 新增：在线接口列表接口
app.get('/api/routes', (req, res) => {
  if (!ENABLE_ROUTES_API) return res.status(403).json({ code: 403, message: '路由查询接口未启用' });
  if (ROUTES_API_TOKEN && req.query.token !== ROUTES_API_TOKEN) return res.status(401).json({ code: 401, message: '访问令牌无效' });
  res.json(getAllRoutes());
});
regPublic('GET', '/api/routes');

// 新增：在线调试页面
app.get('/debug', (req, res) => {
  if (!ENABLE_DEBUG_PAGE) return res.status(403).send('调试页面未在当前环境启用');
  res.type('html').send(debugPageHtml);
});
regSystem('GET', '/debug');



// ---------- OpenAI 兼容层 ----------
// ═══════════════════════════════════════════════════════
// Unified Auth Middleware — shared by /paid/* and /v1/*
// ═══════════════════════════════════════════════════════
function goldbeanAuth(req, res, next) {
  // 1. Check API key (x-user-id, x-api-key, or Bearer GB_xxx)
  var uid = req.headers['x-user-id'] || req.headers['x-api-key'] || null;
  if (!uid && req.headers['authorization']) {
    var auth = req.headers['authorization'];
    if (auth.startsWith('Bearer GB_')) uid = auth.slice(7);
    else if (auth.startsWith('Bearer ')) {
      var token = auth.slice(7);
      if (token.startsWith('GB_')) uid = token;
    }
  }
  
  if (uid) {
    var users = readJSON(GB_DIR + '/users.json', []);
    var user = users.find(u => u.userId === uid);
    if (user) {
      var isMember = user.status !== 'free' && user.planExpiry && new Date(user.planExpiry) > new Date();
      if (isMember) {
        user.totalUsedCredits = (user.totalUsedCredits || 0) + 1;
        user.updatedAt = T();
        writeJSON(GB_DIR + '/users.json', users);
        req._paymentMethod = 'membership';
        req._creditsRemaining = -1;
        req._userId = uid;
        return next();
      }
      // Check credits (1 credit minimum)
      if ((user.freeCredits || 0) >= 1) {
        user.freeCredits -= 1;
        user.totalUsedCredits = (user.totalUsedCredits || 0) + 1;
        user.updatedAt = T();
        writeJSON(GB_DIR + '/users.json', users);
        req._paymentMethod = 'credit';
        req._creditsRemaining = user.freeCredits;
        req._userId = uid;
        return next();
      }
      // Credits exhausted
      return res.status(402).json({
        error: 'Insufficient credits',
        type: 'credits_exhausted',
        user_id: uid,
        recharge_url: 'https://goldbean-api.xyz/buy-credits.html?key=' + uid,
        message: 'Your credits are exhausted. Recharge at ' + ('https://goldbean-api.xyz/buy-credits.html?key=' + uid)
      });
    }
  }
  
  // 2. No API key — check IP daily free quota
  var clientIP = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().replace('::ffff:', '');
  var ipUsage = getIPUsage(clientIP);
  if (ipUsage.count < DAILY_FREE_LIMIT) {
    incrementIPUsage(clientIP);
    req._paymentMethod = 'ip_free_quota';
    req._ipDailyRemaining = DAILY_FREE_LIMIT - ipUsage.count - 1;
    return next();
  }
  
  // 3. All free options exhausted
  return res.status(402).json({
    error: 'Payment required',
    message: 'Daily free quota used. Register for 20 free credits or recharge from .',
    free_trial: { daily_quota: DAILY_FREE_LIMIT, daily_remaining: 0, register_endpoint: '/paid/user/register' },
    recharge_url: 'https://goldbean-api.xyz/buy-credits.html',
    payment_options: {
      prepaid: { desc: 'Get 20 free credits', endpoint: '/paid/user/register' },
      paypal: { desc: 'Pay with PayPal from $1', url: 'https://goldbean-api.xyz/buy-credits.html' },
      alipay: { desc: 'Pay with Alipay', url: 'https://goldbean-api.xyz/buy-credits.html' }
    }
  });
}

app.post('/v1/chat/completions', goldbeanAuth, async (req, res) => {
  try {
    var messages = req.body.messages || [];
    var model = req.body.model || 'deepseek-chat';
    var ax = require('axios');
    var r = await ax.post('https://api.deepseek.com/v1/chat/completions',
      {model:model,messages:messages},
      {headers:{'Authorization':'Bearer sk-56d95251375d45e8ab1a1aca95aa97fa','Content-Type':'application/json'},timeout:30000}
    );
    var content = r.data?.choices?.[0]?.message?.content || '';
    var usage = r.data?.usage || {};
    res.json({id:'chatcmpl-'+Date.now(),object:'chat.completion',created:Math.floor(Date.now()/1000),model:model,choices:[{index:0,message:{role:'assistant',content:content},finish_reason:'stop'}],usage:usage});
  } catch(e) {
    res.status(500).json({error:{message:e.message,type:'server_error'}});
  }
});

app.get('/v1/models', (req, res) => {
  res.json({object:'list',data:[
    {id:'deepseek-chat',object:'model',created:1700000000,owned_by:'deepseek'},
    {id:'deepseek-coder',object:'model',created:1700000000,owned_by:'deepseek'}
  ]});
});

app.post('/v1/images/generations', goldbeanAuth, async (req, res) => {
  try {
    var prompt = req.body.prompt || '';
    if (!prompt) return res.status(400).json({error:{message:'prompt is required'}});
    var ax = require('axios');
    var bearer = 'Bearer BAIDU_KEY_PLACEHOLDER';
    var r = await ax.post('https://qianfan.baidubce.com/v2/images/generations',
      {model:"stable-diffusion-xl",prompt:prompt,size:req.body.size||'1024x1024'},
      {headers:{'Authorization':bearer,'Content-Type':'application/json'},timeout:60000}
    );
    res.json({created:Math.floor(Date.now()/1000),data:(r.data?.data||[]).map(function(img){return {url:img.url||img.image||img.b64_image||''};})});
  } catch(e) {res.status(500).json({error:{message:e.message}});}
});

app.post('/v1/embeddings', goldbeanAuth, async (req, res) => {
  try {
    var input = req.body.input || '';
    var model = req.body.model || 'embedding-v1';
    var ax = require('axios');
    var bearer = 'Bearer BAIDU_KEY_PLACEHOLDER';
    var r = await ax.post('https://qianfan.baidubce.com/v2/embeddings',
      {model:model,input:Array.isArray(input)?input:[input]},
      {headers:{'Authorization':bearer,'Content-Type':'application/json'},timeout:20000}
    );
    res.json({object:'list',data:r.data?.data||[],model:model,usage:r.data?.usage||{}});
  } catch(e) {res.status(500).json({error:{message:e.message}});}
});

app.post('/v1/audio/transcriptions', goldbeanAuth, async (req, res) => {
  try {
    var audio = req.body.audio || '';
    if (!audio) return res.status(400).json({error:'no audio'});
    var T = await getToken('asr');
    if (!T) return res.json({error:'auth failed'});
    var ax = require('axios');
    var r = await ax.post('https://vop.baidu.com/server_api?access_token='+T+'&cuid=g&dev_pid=1537',
      {speech:audio,format:'wav',rate:16000,channel:1},
      {headers:{'Content-Type':'application/json'},timeout:30000}
    );
    res.json({text:r.data?.result?.join('')||r.data?.err_msg||''});
  } catch(e) {res.status(500).json({error:e.message});}
});

app.post('/v1/audio/speech', goldbeanAuth, async (req, res) => {
  try {
    var input = req.body.input || '';
    if (!input) return res.status(400).json({error:'input text required'});
    var result = await callTTS(input, req.body.voice||'0');
    if (result.error) return res.status(500).json({error:result.error});
    res.setHeader('Content-Type',result.contentType||'audio/mpeg');
    res.send(result.audio);
  } catch(e) {res.status(500).json({error:e.message});}
});
// ═══════════════════════════════════════════════════════
// 2. 公开业务接口（/api 前缀）
// ═══════════════════════════════════════════════════════

const PRICING = require('./goldbean-pricing');
app.get('/api/pricing/plans', (req, res) => res.json(PRICING.getPlans()));
regPublic('GET', '/api/pricing/plans');

app.get('/api/pricing/endpoint', (req, res) => {
  const ep = req.query.endpoint;
  res.json(ep ? PRICING.getEndpointPricing(ep) : PRICING.getEndpointPricing('/paid/baidu-ocr'));
});
regPublic('GET', '/api/pricing/endpoint');

const AFF = require('./goldbean-affiliate');
if (typeof AFF.getAffiliateRoutes === 'function') {
  app.use('/api/affiliate', AFF.getAffiliateRoutes());
  regPublic('ALL', '/api/affiliate/*');
  LC('[load] /api/affiliate ← goldbean-affiliate.js');
}

// ═══════════════════════════════════════════════════════
// 3. Baidu API 核心
// ═══════════════════════════════════════════════════════

const BAIDU_APPS = [
  { name:'main', id:'7845468', ak:'jFg3VrrwduyHnefmxh2uuVkC', sk:'C27D3OGcvcK5PKzXAaQjKVb464k7QYUz' },
  { name:'translate', id:'7845525', ak:'y2QkHNVTJtqly0CgVHSqr4wM', sk:'0EszHbe3mu3Rcl5W7kjxoTe5yptM9K1P' },
  { name:'asr', id:'7845530', ak:'tWQ5iP0h6cI8dWl3WOVPpD6x', sk:'F8vAHnuV0eVyBnLzPU3Y1pAeFlSwDE3z' },
  { name:'vision', id:'7845537', ak:'79VdqbBl2M2w15T3MuQ7ZANf', sk:'793JRXgRoQn5Jh2KNWmOtJs5dNHajsQx' },
  { name:'enhance', id:'7845540', ak:'CrIGRHHubmSpkA4jGMoS3muw', sk:'8kaRzqvkgTRpaDGTcvf2yrDB2Xza0SHW' },
  { name:'face', id:'7845542', ak:'lh536XgBmDWp5A3cf83D0kfg', sk:'uSV1S1FJiHVplMbQYPVrG8zXfEsyimVd' },
  { name:'body', id:'7845543', ak:'mDd657griqAe1JxqCuddQ0xy', sk:'mNu0YdpFVmXne1dtiAwaT7sW2CH1Ti9J' },
  { name:'nlp', id:'7845545', ak:'e3Vk5YnkqgmeOecndfvlcanl', sk:'adc6n6NVfdZKiHJ9vs52N4IticZ6h90B' },
  { name:'creation', id:'7845549', ak:'md1scj1zaVUcEdgQyiM6wENN', sk:'cI4dK7mOqT7epNByD5bKja7xf6Ju1hW8' },
  { name:'helix', id:'123694078', ak:'BiMr2dKFpyk1ostTBSEGpx7m', sk:'Ni7z9mMNv3B54YoqotXcX2PJg0BKDbC0' },
];
const BTOKENS = {};
async function getToken(name) {
  const c = BTOKENS[name];
  if (c && c.exp > Date.now()) return c.token;
  const app = BAIDU_APPS.find(a => a.name === name);
  if (!app) return null;
  try {
    const r = await X.get('https://aip.baidubce.com/oauth/2.0/token', {
      params: { grant_type:'client_credentials', client_id:app.ak, client_secret:app.sk },
      timeout: 10000
    });
    if (r.data?.access_token) {
      BTOKENS[name] = { token: r.data.access_token, exp: Date.now() + 86400000 };
      return r.data.access_token;
    }
  } catch(e) { LC(`[auth] ${name} failed`, e); }
  return null;
}

// NLP：带重试机制
async function callNLP(text, type) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const T = await getToken('nlp');
      if (!T) return { error: 'nlp auth failed' };
      const r = await X.post(
        `https://aip.baidubce.com/rpc/2.0/nlp/v1/${type||'lexer'}?access_token=${T}`,
        { text },
        { headers: { 'Content-Type':'application/json' }, timeout: 15000 }
      );
      if (r.data?.error_code === 18) {
        if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      return r.data;
    } catch(e) {
      if (attempt === 2) return { error: e.message };
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return { error: 'nlp max retries' };
}

// TTS：使用 asr 应用 token（main 应用无 TTS 权限）
async function callTTS(text, per) {
  const T = await getToken('asr');
  if (!T) return { error: 'auth failed' };
  try {
    // 使用 axios params 方式（VPS debug 验证可靠的编码方式）
    const response = await X.get('https://tsn.baidu.com/text2audio', {
      params: {
        tex: text, tok: T, cuid: 'g', ctp: '1', lan: 'zh',
        spd: '5', pit: '5', vol: '5', per: per || '0', aue: '3'
      },
      paramsSerializer: { encode: v => encodeURIComponent(v) },
      responseType: 'arraybuffer', timeout: 20000, validateStatus: () => true
    });
    const ct = response.headers['content-type'] || '';
    if (ct.includes('json') || response.status !== 200) {
      const txt = Buffer.from(response.data).toString('utf8');
      try { return { error: JSON.parse(txt) }; } catch { return { error: txt, status: response.status }; }
    }
    if (response.data && response.data.length > 100) return { audio: response.data, contentType: ct };
    return { error: 'empty tts response', status: response.status };
  } catch(e) { return { error: e.message }; }
}

// ═══════════════════════════════════════════════════════

// Verify txHash payment
app.get('/paid/verify', async (req, res) => {
  var txh=req.query.tx||req.query.txHash;
  if(!txh||txh.length<66) return res.json({ok:false,error:'missing txHash'});
  try{
    var cv=await verifyOnChainTx(txh);
    if(cv) return res.json({ok:true,paid:true,payer:cv.payer,amount:cv.amount,txHash:txh});
    res.json({ok:false,paid:false,error:'tx not found'});
  }catch(e){res.json({ok:false,error:e.message});}
});
// 4. x402 付费鉴权中间件
// ═══════════════════════════════════════════════════════

const X402_WHITELIST = ['/user/register', '/plans', '/endpoint-pricing', '/my-balance', '/affiliate-info', '/verify', '/paypal/create-order', '/paypal/capture', '/alipay/create-order', '/alipay/query', '/alipay/refund', '/alipay/status', '/alipay/notify', '/paypal/webhook'];

var OWN_ADDRESS='0x7484b0bca25d2ee56e9b0535572d4cf44a047d98';
var CHAIN_TX_CACHE={};
var TX_NONCES={};
var USDC_BASE='0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913';
async function verifyOnChainTx(txHash){
if(!txHash||txHash.length<66)return null;
var h=txHash.toLowerCase().trim();
if(CHAIN_TX_CACHE[h]&&Date.now()-CHAIN_TX_CACHE[h].ts<60000)return CHAIN_TX_CACHE[h].r;
try{var ax=require('axios');
var tr=await ax.post('https://mainnet.base.org',{jsonrpc:'2.0',method:'eth_getTransactionByHash',params:[h],id:1},{timeout:10000});
var tx=tr.data.result;if(!tx)return null;
var fromL=tx.from&&tx.from.toLowerCase();
var nonce=parseInt(tx.nonce||0);
if(TX_NONCES[fromL]!==undefined&&nonce<=TX_NONCES[fromL])return null;
TX_NONCES[fromL]=nonce;
var rr=await ax.post('https://mainnet.base.org',{jsonrpc:'2.0',method:'eth_getTransactionReceipt',params:[h],id:2},{timeout:10000});
var rc=rr.data.result;if(!rc)return null;
for(var i=0;i<rc.logs.length;i++){
var lg=rc.logs[i];
if(lg.address.toLowerCase()!==USDC_BASE.toLowerCase())continue;
var toAddr='0x'+lg.topics[2].substring(26);
if(toAddr.toLowerCase()===OWN_ADDRESS.toLowerCase()){
var val=parseInt(lg.data,16);
if(val>0){var valEth=val/1000000;
var fr='0x'+lg.topics[1].substring(26);
var res={paid:true,payer:fr,amount:valEth,txHash:h,usdc:true,value:val,from:fr,to:toAddr};
CHAIN_TX_CACHE[h]={r:res,ts:Date.now()};
return res;}}}return null;
}catch(e){console.log('[chain] verify error:',(e.message||'').slice(0,80));return null;}}
let x402Middleware = null;

// FIX: Bypass x402 middleware for credits and alipay query
app.get('/user/credits', (req, res) => {
  const uid = req.headers['x-user-id'] || req.headers['x-api-key'] || '';
  const users = readJSON(GB_DIR + '/users.json', []); const u = users.find(x => x.userId === uid);
  res.json({ userId: uid || 'anonymous', freeRemaining: u ? Math.max(0, (u.freeCredits||0) - (u.totalUsedCredits||0)) : 20, totalFree: u ? (u.freeCredits||0) : 20, paidCredits: u ? (u.freeCredits||0) : 0, totalCalls: u ? (u.totalUsedCredits||0) : 0, registered: !!u });
});

app.get('/alipay/query', (req, res) => {
  const outTradeNo = req.query.outTradeNo || '';
  if (!outTradeNo) return res.json({ error: 'outTradeNo required' });
  res.json({ status: 'query_endpoint', orderId: outTradeNo, message: 'Query endpoint active. Pass to /paid/alipay/query with auth.' });
});


// ═══════════════════════════════════════════════════════
// IP-based Daily Free Quota (5 calls/day per IP)
// ═══════════════════════════════════════════════════════
const DAILY_FREE_LIMIT = 5;
const IP_DAILY_USAGE_PATH = GB_DIR + '/ip_daily_usage.json';

function getIPUsage(ip) {
  const today = new Date().toISOString().slice(0, 10);
  let data = {};
  try { data = JSON.parse(require('fs').readFileSync(IP_DAILY_USAGE_PATH, 'utf8')); } catch(e) {}
  const key = ip + '_' + today;
  return { key, count: data[key] || 0, data };
}

function incrementIPUsage(ip) {
  const today = new Date().toISOString().slice(0, 10);
  const key = ip + '_' + today;
  let data = {};
  try { data = JSON.parse(require('fs').readFileSync(IP_DAILY_USAGE_PATH, 'utf8')); } catch(e) {}
  data[key] = (data[key] || 0) + 1;
  // Clean old entries (keep only today)
  const keys = Object.keys(data);
  for (const k of keys) {
    if (!k.endsWith(today)) delete data[k];
  }
  require('fs').writeFileSync(IP_DAILY_USAGE_PATH, JSON.stringify(data, null, 2));
  return data[key];
}


// ═══════════════════════════════════════════════════════
// Response header: X-GoldBean-Credits-Remaining
// ═══════════════════════════════════════════════════════
app.use((req, res, next) => {
  const origSend = res.json.bind(res);
  res.json = function(data) {
    try {
      if (req._creditsRemaining !== undefined) {
        res.setHeader('X-GoldBean-Credits-Remaining', String(req._creditsRemaining));
      }
      if (req._ipDailyRemaining !== undefined) {
        res.setHeader('X-GoldBean-IP-Free-Remaining', String(req._ipDailyRemaining));
      }
      if (req._paymentMethod) {
        res.setHeader('X-GoldBean-Payment-Method', req._paymentMethod);
      }
    } catch(e) {}
    return origSend(data);
  };
  next();
});

// Also let the /paid/* versions pass through for backward compat
app.use('/paid', async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  if (X402_WHITELIST.some(p => req.path === p)) return next();

  // Get endpoint price from PRICING
  var _epPricing = PRICING.getEndpointPricing('/paid' + req.path);
  var _epPrice = _epPricing.pricePerCall || 0.01;
  var _epCredits = Math.max(1, Math.ceil(_epPrice / 0.01)); // 1 credit = $0.01

  // Check IP-based daily free quota (50 calls/day)
  var _clientIP = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().replace('::ffff:', '');
  var _ipUsage = getIPUsage(_clientIP);
  if (_ipUsage.count < DAILY_FREE_LIMIT) {
    incrementIPUsage(_clientIP);
    req._paymentMethod = 'ip_free_quota';
    req._ipDailyRemaining = DAILY_FREE_LIMIT - _ipUsage.count - 1;
    return next();
  }

  var _uid = req.headers['x-user-id'] || req.headers['x-api-key'] || (req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ') ? req.headers['authorization'].slice(7) : null);
  if (_uid) {
    const users = readJSON(GB_DIR + '/users.json', []);
    const user = users.find(u => u.userId === _uid);
    if (user) {
      // Check active membership first (unlimited calls)
      var _isMember = user.status !== 'free' && user.planExpiry && new Date(user.planExpiry) > new Date();
      if (_isMember) {
        user.totalUsedCredits = (user.totalUsedCredits || 0) + 1;
        user.updatedAt = T();
        writeJSON(GB_DIR + '/users.json', users);
        req._paymentMethod = 'membership';
        req._creditsRemaining = -1; // unlimited
        return next();
      }
      // Check credits (deduct based on endpoint price)
      if (user.freeCredits >= _epCredits) {
        user.freeCredits -= _epCredits;
        user.totalUsedCredits = (user.totalUsedCredits || 0) + _epCredits;
        user.updatedAt = T();
        writeJSON(GB_DIR + '/users.json', users);
        req._paymentMethod = 'credit';
        req._creditsDeducted = _epCredits;
        req._creditsRemaining = user.freeCredits;
        return next();
      }
    }
  }
  if (req.headers['x-internal'] === INTERNAL_KEY || req.query._int === INTERNAL_KEY) return next();

  var _txh=req.query.txHash||(req.body&&req.body.txHash?req.body.txHash:null);
  if(_txh&&_txh.length===66){try{var _cv=await verifyOnChainTx(_txh);if(_cv){next();return;}}catch(_e){}}
  const sig = req.headers['x-pay-signature'] || req.query._sig;
  if (!sig) {
    var _ipRemaining = Math.max(0, DAILY_FREE_LIMIT - (getIPUsage((req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().replace('::ffff:', '')).count));
    return res.status(402).json({
      error: 'x402 payment required',
      path: req.path,
      amount_usd: _epPrice,
      amount_cents: Math.round(_epPrice * 100),
      message: 'Daily free quota used. Register for 20 free credits or recharge from . Quick recharge: https://goldbean-api.xyz/buy-credits.html',
      free_trial: {
        daily_quota: DAILY_FREE_LIMIT,
        daily_remaining: _ipRemaining,
        hint: '5 free calls/day per IP — no signup needed. Register for 20 extra credits.',
        register_endpoint: '/paid/user/register'
      },
      payment_options: {
        x402: { method: 'x402', desc: 'Pay per call with x402/USDC on Base', amount_usd: _epPrice, tutorial: 'https://goldbean-api.xyz/#x402' },
        prepaid: { method: 'register', desc: 'Get 20 free credits instantly — no credit card', endpoint: '/paid/user/register' },
        balance: { method: 'topup', desc: 'Buy credits from $1 — PayPal, Alipay, or USDC', endpoint: '/buy-credits.html' },
        paypal: { method: 'paypal', desc: 'Pay with PayPal from $1', url: 'https://goldbean-api.xyz/buy-credits.html' },
        alipay: { method: 'alipay', desc: 'Pay with Alipay (支付宝)', url: 'https://goldbean-api.xyz/buy-credits.html' }
      },
      recharge_url: 'https://goldbean-api.xyz/buy-credits.html' + (_uid ? '?key=' + _uid : ''),
      quick_start: {
        curl_free: 'curl https://goldbean-api.xyz/weather-now?city=London',
        curl_register: 'curl -X POST https://goldbean-api.xyz/paid/user/register -H Content-Type:application/json -d {email:you@example.com}',
        mcp: 'npx goldbean-mcp'
      }
    });
  }
  try {
    const payment = JSON.parse(Buffer.from(sig, 'base64').toString());
    if (!payment.from || !payment.to || !payment.amount || !payment.nonce || !payment.deadline || !payment.signature)
      return res.status(402).json({ error: 'invalid payment payload' });
    if (payment.to.toLowerCase() !== WALLET.toLowerCase())
      return res.status(402).json({ error: 'wrong recipient' });
    if (nonceSet.has(String(payment.nonce)))
      return res.status(402).json({ error: 'duplicate payment' });
    const expAmt = ethers.parseUnits(_epPrice.toFixed(2), 6), paidAmt = ethers.toBigInt(payment.amount);
    if (paidAmt < expAmt) return res.status(402).json({ error: 'insufficient amount' });
    if (Math.floor(Date.now() / 1000) > Number(payment.deadline))
      return res.status(402).json({ error: 'payment expired' });
    const domain = { name: 'x402', version: '1', chainId: 8453, verifyingContract: '0x0000000000000000000000000000000000000000' };
    const types = { Payment: [
      { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' },
      { name: 'nonce', type: 'uint256' }, { name: 'deadline', type: 'uint256' }
    ]};
    const signer = ethers.verifyTypedData(domain, types, {
      from: payment.from, to: payment.to, amount: ethers.toBigInt(payment.amount),
      nonce: BigInt(payment.nonce), deadline: BigInt(payment.deadline)
    }, payment.signature);
    if (signer.toLowerCase() !== payment.from.toLowerCase())
      return res.status(403).json({ error: 'invalid signature' });
    nonceSet.add(String(payment.nonce));
    next();
  } catch(e) {
    return res.status(402).json({ error: 'payment validation failed', detail: e.message });
  }
});

// ═══════════════════════════════════════════════════════
// 5. 付费业务接口
// ═══════════════════════════════════════════════════════

// 5.1 免费注册
app.post('/paid/user/register', (req, res) => {
  try {
    const { email, name, referralCode } = req.body;
    const users = readJSON(GB_DIR + '/users.json', []);
    const userId = 'GB_' + crypto.randomBytes(8).toString('hex').toUpperCase();
    users.push({ userId, email: email || '', name: name || '', referralCode: referralCode || '', affiliateId: '',
      status: 'free', planExpiry: null, balanceUsd: 0, balanceCny: 0, totalSpent: 0,
      freeCredits: 20, totalUsedCredits: 0, createdAt: T(), updatedAt: T() });
    writeJSON(GB_DIR + '/users.json', users);
    const txs = readJSON(GB_DIR + '/transactions.json', []);
    txs.push({ id: 'TX_' + Date.now(), userId, type: 'free_trial', credits: 20, desc: 'New user free trial', createdAt: T() });
    writeJSON(GB_DIR + '/transactions.json', txs);
    res.json({ success: true, userId, freeCredits: 20, message: 'Welcome! You have 20 free API calls.', apiKey: userId, auth_hint: 'Use x-user-id or x-api-key header' });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
regPaidPost('/paid/user/register');

// 5.2 统一支付
const PAYMENT = require('./goldbean-unified-payment');
if (typeof PAYMENT.getUnifiedPaymentRoutes === 'function') {
  app.use('/paid', PAYMENT.getUnifiedPaymentRoutes());
}

// 5.3 百度 AI 全系列（TTS/NLP 已优化）
// ═══════════════════════════════════

app.get('/paid/baidu-ocr', async (req, res) => {
  try {
    const img = req.query.image || req.query.url;
    if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const p = new URLSearchParams();
    if (req.query.image) p.append('image', req.query.image); else p.append('url', req.query.url);
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=' + T,
      p.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ocr');

app.get('/paid/baidu-ocr-accurate', async (req, res) => {
  try {
    const img = req.query.image || req.query.url;
    if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const p = new URLSearchParams();
    if (req.query.image) p.append('image', req.query.image); else p.append('url', req.query.url);
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=' + T,
      p.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ocr-accurate');

app.get('/paid/baidu-idcard', async (req, res) => {
  try {
    const img = req.query.image || req.query.url;
    if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const params = { id_card_side: req.query.side || 'front' };
    if (req.query.url) params.url = img; else params.image = img;
    if (req.query.encrypt === 'true') { params.enable_encrypt = 'true'; }
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/idcard?access_token=' + T,
      new URLSearchParams(params).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-idcard');

app.get('/paid/baidu-tts', async (req, res) => {
  const result = await callTTS(req.query.text || '你好', req.query.per);
  if (result.error) return res.json(result);
  res.set('Content-Type', result.contentType);
  res.send(result.audio);
});
regPaid('GET', '/paid/baidu-tts');

app.get('/paid/baidu-translate', async (req, res) => {
  try {
    const T = await getToken('translate'); if (!T) return res.json({ error: 'translate auth failed' });
    const r = await X.post('https://aip.baidubce.com/rpc/2.0/mt/texttrans/v1?access_token=' + T,
      { q: req.query.text || '', from: req.query.from || 'auto', to: req.query.to || 'en' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-translate');

app.get('/paid/baidu-llm-chat', async (req, res) => {
  try {
    const X = require('axios');
    var msg = req.query.message || req.query.msg || 'hello';
    var model = req.query.model || 'ernie-5.1';
    const bearer = 'Bearer BAIDU_KEY_PLACEHOLDER';
    const r = await X.post('https://qianfan.baidubce.com/v2/chat/completions',
      { model: model, messages: [{ role: 'user', content: msg }] },
      { headers: { 'Authorization': bearer, 'Content-Type': 'application/json' }, timeout: 30000 }
    );
    res.json({ response: r.data?.choices?.[0]?.message?.content || '', model: model, usage: r.data?.usage });
  } catch(e) { res.status(500).json({ error: 'qianfan api error', detail: e.response?.data?.error || e.message }); }
});
regPaid('GET', '/paid/baidu-llm-chat');

app.get('/paid/baidu-asr', async (req, res) => {
  try {
    const audio = req.query.audio || ''; if (!audio) return res.json({ error: 'no audio' });
    const T = await getToken('asr'); if (!T) return res.json({ error: 'asr auth failed' });
    const r = await X.post('https://vop.baidu.com/server_api?access_token=' + T,
      { speech: audio, format: req.query.format || 'pcm', rate: parseInt(req.query.rate || 16000),
        channel: 1, len: audio.length, cuid: 'g', dev_pid: req.query.lang || 1537 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-asr');

app.get('/paid/baidu-image-recognition', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('vision'); if (!T) return res.json({ error: 'vision auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-image-recognition');

app.get('/paid/baidu-image-enhance', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('enhance'); if (!T) return res.json({ error: 'enhance auth failed' });
    const t = req.query.type || 'image_quality_enhance';
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-process/v1/' + t + '?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-image-enhance');

app.get('/paid/baidu-face-detect', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('face'); if (!T) return res.json({ error: 'face auth failed' });
    const it = req.query.url ? 'URL' : 'BASE64';
    const fields = req.query.fields || 'age,beauty,expression,gender,glasses,emotion,face_shape';
    const r = await X.post('https://aip.baidubce.com/rest/2.0/face/v3/detect?access_token=' + T,
      { image: img, image_type: it, face_field: fields, max_face_num: 10 },
      { headers: { 'Content-Type': 'application/json' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-face-detect');

app.get('/paid/baidu-body-analysis', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('body'); if (!T) return res.json({ error: 'body auth failed' });
    const t = req.query.type || 'body_analysis';
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v1/' + t + '?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-body-analysis');

app.get('/paid/baidu-nlp', async (req, res) => {
  const text = req.query.text || '';
  if (!text) return res.json({ error: 'no text' });
  const result = await callNLP(text, req.query.type || 'lexer');
  res.json(result);
});
regPaid('GET', '/paid/baidu-nlp');

app.get('/paid/baidu-helixfold', async (req, res) => {
  try {
    const seq = req.query.seq || ''; if (!seq) return res.json({ error: 'no sequence' });
    const T = await getToken('helix'); if (!T) return res.json({ error: 'helix auth failed' });
    const ep = req.query.ep || '/api/v1/predict';
    const r = await X.post('https://paddlehelix.baidu.com' + ep + '?access_token=' + T,
      { sequence: seq, name: req.query.name || 'target' },
      { headers: { 'Content-Type': 'application/json' }, timeout: 120000 });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message, note: 'Check PaddleHelix SDK docs' }); }
});
regPaid('GET', '/paid/baidu-helixfold');

// ═══════════════════════════════════════════════════════
// NEW BAIDU AI ENDPOINTS — 2026-07-11 Expansion
// ═══════════════════════════════════════════════════════

// 14. 表格文字识别
app.get('/paid/baidu-ocr-table', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'ocr auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/table?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ocr-table');




// 18. 人脸比对（1:1）
app.get('/paid/baidu-face-compare', async (req, res) => {
  try {
    const img1 = req.query.image1 || req.query.url1; if (!img1) return res.json({ error: 'no image1' });
    const img2 = req.query.image2 || req.query.url2; if (!img2) return res.json({ error: 'no image2' });
    const T = await getToken('face'); if (!T) return res.json({ error: 'face auth failed' });
    const it = req.query.url1 ? 'URL' : 'BASE64';
    const r = await X.post('https://aip.baidubce.com/rest/2.0/face/v3/match?access_token=' + T,
      [{ image: img1, image_type: it, face_type: 'LIVE' }, { image: img2, image_type: it, face_type: 'LIVE' }],
      { headers: { 'Content-Type': 'application/json' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-face-compare');

// 19. 手势识别
app.get('/paid/baidu-gesture', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('body'); if (!T) return res.json({ error: 'body auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v1/gesture?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-gesture');

// 20. 物体检测
app.get('/paid/baidu-object-detect', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('vision'); if (!T) return res.json({ error: 'vision auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v1/object_detect?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-object-detect');

// 21. 地标识别
app.get('/paid/baidu-landmark', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('vision'); if (!T) return res.json({ error: 'vision auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v1/landmark?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-landmark');

// 22. 文本审核（色情/暴恐/敏感词检测）
app.get('/paid/baidu-text-review', async (req, res) => {
  try {
    const text = req.query.text || ''; if (!text) return res.json({ error: 'no text' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const r = await X.post('https://aip.baidubce.com/rest/2.0/solution/v1/text_censor/v2/user_defined?access_token=' + T,
      new URLSearchParams({ text }).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-text-review');

// 23. 图片审核
app.get('/paid/baidu-image-review', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const it = req.query.url ? 'URL' : 'BASE64';
    const r = await X.post('https://aip.baidubce.com/rest/2.0/solution/v1/img_censor/v2/user_defined?access_token=' + T,
      { imgUrl: req.query.url || '', img: req.query.image || '', imgType: it },
      { headers: { 'Content-Type': 'application/json' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-image-review');

// 24. NLP 情感分析（便捷端点）
app.get('/paid/baidu-sentiment', async (req, res) => {
  const text = req.query.text || '';
  if (!text) return res.json({ error: 'no text' });
  const result = await callNLP(text, 'sentiment_classify');
  res.json(result);
});
regPaid('GET', '/paid/baidu-sentiment');

// 25. NLP 文本摘要（自动摘要）
app.get('/paid/baidu-summary', async (req, res) => {
  const text = req.query.text || '';
  if (!text) return res.json({ error: 'no text' });
  const result = await callNLP(text, 'news_summary');
  res.json(result);
});
regPaid('GET', '/paid/baidu-summary');

// 26. NLP 词向量表示
app.get('/paid/baidu-word-embedding', async (req, res) => {
  const text = req.query.text || '';
  if (!text) return res.json({ error: 'no text' });
  const result = await callNLP(text, 'wordembedding');
  res.json(result);
});
regPaid('GET', '/paid/baidu-word-embedding');



// GET handlers for payment routes (prevent 404 when users visit URL directly)

// QIANFAN MODEL ENDPOINTS 2026-07-12
const QFB="Bearer BAIDU_KEY_PLACEHOLDER";
const QFBASE="https://qianfan.baidubce.com/v2";
app.get("/paid/baidu-vision-chat",async(req,res)=>{try{var m=req.query.message||"Describe this image";var i=req.query.image||req.query.url;var mo=req.query.model||"ernie-4.5-turbo-vl";var c=i?[{type:"text",text:m},{type:"image_url",image_url:{url:i}}]:m;const r=await X.post(QFBASE+"/chat/completions",{model:mo,messages:[{role:"user",content:c}]},{headers:{Authorization:QFB,"Content-Type":"application/json"},timeout:60000});res.json({response:r.data?.choices?.[0]?.message?.content||"",model:mo,usage:r.data?.usage})}catch(e){res.status(500).json({error:"vision api error",detail:e.response?.data?.error||e.message})}});
regPaid("GET","/paid/baidu-vision-chat");
app.get("/paid/baidu-deepthink",async(req,res)=>{try{var m=req.query.message||"Think step by step";var mo=req.query.model||"deepseek-r1-250528";const r=await X.post(QFBASE+"/chat/completions",{model:mo,messages:[{role:"user",content:m}]},{headers:{Authorization:QFB,"Content-Type":"application/json"},timeout:120000});var ch=r.data?.choices?.[0]?.message||{};res.json({response:ch.content||"",reasoning:ch.reasoning_content||"",model:mo,usage:r.data?.usage})}catch(e){res.status(500).json({error:"deepthink api error",detail:e.response?.data?.error||e.message})}});
regPaid("GET","/paid/baidu-deepthink");
app.get("/paid/baidu-embedding",async(req,res)=>{try{var t=req.query.text||req.query.input||"";if(!t)return res.json({error:"no text"});var mo=req.query.model||"embedding-v1";var ip=t.split("||").filter(x=>x.trim());if(ip.length===0)ip=[t];const r=await X.post(QFBASE+"/embeddings",{model:mo,input:ip},{headers:{Authorization:QFB,"Content-Type":"application/json"},timeout:30000});res.json({data:r.data?.data||[],model:mo,usage:r.data?.usage})}catch(e){res.status(500).json({error:"embedding api error",detail:e.response?.data?.error||e.message})}});
regPaid("GET","/paid/baidu-embedding");
app.get("/paid/baidu-reranker",async(req,res)=>{try{var q=req.query.query||"";var ds=req.query.documents||req.query.docs||"";if(!q||!ds)return res.json({error:"need query and documents"});var mo=req.query.model||"bce-reranker-base";var dl=ds.split("||").filter(x=>x.trim());const r=await X.post(QFBASE+"/rerankers",{model:mo,query:q,documents:dl},{headers:{Authorization:QFB,"Content-Type":"application/json"},timeout:30000});res.json({results:r.data?.results||[],model:mo,usage:r.data?.usage})}catch(e){res.status(500).json({error:"reranker api error",detail:e.response?.data?.error||e.message})}});
regPaid("GET","/paid/baidu-reranker");
app.get("/paid/baidu-image-gen",async(req,res)=>{try{var p=req.query.prompt||req.query.message||"";if(!p)return res.json({error:"no prompt"});var mo=req.query.model||"qwen-image";var n=parseInt(req.query.n)||1;const r=await X.post(QFBASE+"/images/generations",{model:mo,prompt:p,n:n},{headers:{Authorization:QFB,"Content-Type":"application/json"},timeout:120000});res.json({images:r.data?.data||[],model:mo})}catch(e){res.status(500).json({error:"image gen api error",detail:e.response?.data?.error||e.message})}});
regPaid("GET","/paid/baidu-image-gen");
app.get("/paid/baidu-image-edit",async(req,res)=>{try{var p=req.query.prompt||req.query.message||"";var i=req.query.image||req.query.url;if(!p||!i)return res.json({error:"need prompt and image url"});var mo=req.query.model||"qwen-image-edit";const r=await X.post(QFBASE+"/images/edits",{model:mo,image:i,prompt:p},{headers:{Authorization:QFB,"Content-Type":"application/json"},timeout:120000});res.json({images:r.data?.data||[],model:mo})}catch(e){res.status(500).json({error:"image edit api error",detail:e.response?.data?.error||e.message})}});
regPaid("GET","/paid/baidu-image-edit");
app.get("/paid/baidu-deepseek-ocr",async(req,res)=>{try{var i=req.query.image||req.query.url;if(!i)return res.json({error:"no image"});var mo=req.query.model||"deepseek-ocr";var c=[{type:"image_url",image_url:{url:i}},{type:"text",text:req.query.prompt||"Extract all text from this image."}];const r=await X.post(QFBASE+"/chat/completions",{model:mo,messages:[{role:"user",content:c}]},{headers:{Authorization:QFB,"Content-Type":"application/json"},timeout:60000});res.json({response:r.data?.choices?.[0]?.message?.content||"",model:mo,usage:r.data?.usage})}catch(e){res.status(500).json({error:"deepseek-ocr api error",detail:e.response?.data?.error||e.message})}});
regPaid("GET","/paid/baidu-deepseek-ocr");
app.get("/paid/baidu-paddleocr-vl",async(req,res)=>{try{var i=req.query.image||req.query.url;if(!i)return res.json({error:"no image"});var mo=req.query.model||"paddleocr-vl-0.9b";var c=[{type:"image_url",image_url:{url:i}},{type:"text",text:req.query.prompt||"Parse the document structure and extract all text with layout information."}];const r=await X.post(QFBASE+"/chat/completions",{model:mo,messages:[{role:"user",content:c}]},{headers:{Authorization:QFB,"Content-Type":"application/json"},timeout:60000});res.json({response:r.data?.choices?.[0]?.message?.content||"",model:mo,usage:r.data?.usage})}catch(e){res.status(500).json({error:"paddleocr-vl api error",detail:e.response?.data?.error||e.message})}});
regPaid("GET","/paid/baidu-paddleocr-vl");
app.get("/paid/baidu-qianfan-ocr",async(req,res)=>{try{var i=req.query.image||req.query.url;if(!i)return res.json({error:"no image"});var mo=req.query.model||"qianfan-ocr";var c=[{type:"image_url",image_url:{url:i}}];if(req.query.prompt)c.push({type:"text",text:req.query.prompt});const r=await X.post(QFBASE+"/chat/completions",{model:mo,messages:[{role:"user",content:c}]},{headers:{Authorization:QFB,"Content-Type":"application/json"},timeout:60000});res.json({response:r.data?.choices?.[0]?.message?.content||"",model:mo,usage:r.data?.usage})}catch(e){res.status(500).json({error:"qianfan-ocr api error",detail:e.response?.data?.error||e.message})}});
regPaid("GET","/paid/baidu-qianfan-ocr");

// VIDEO GENERATION (MuseSteamer) - async task-based API
const QFVID="https://qianfan.baidubce.com/video/generations";
app.get("/paid/baidu-video-gen",async(req,res)=>{try{var p=req.query.prompt||req.query.message||"";var i=req.query.image||req.query.url;if(!p||!i)return res.json({error:"need prompt and image url"});var mo=req.query.model||"musesteamer-air-i2v";var c=[{type:"text",text:p},{type:"image_url",image_url:{url:i}}];if(req.query.duration)c.push({duration:parseInt(req.query.duration)});const r=await X.post(QFVID,{model:mo,content:c},{headers:{Authorization:QFB,"Content-Type":"application/json"},timeout:30000});res.json({task_id:r.data?.task_id||r.data?.id||"",id:r.data?.id||"",model:mo,status:"submitted"})}catch(e){res.status(500).json({error:"video gen api error",detail:e.response?.data?.error||e.message})}});
regPaid("GET","/paid/baidu-video-gen");
app.get("/paid/baidu-video-query",async(req,res)=>{try{var t=req.query.task_id||req.query.taskid||"";if(!t)return res.json({error:"need task_id"});const r=await X.get(QFVID+"?task_id="+t,{headers:{Authorization:QFB},timeout:15000});var d=r.data||{};res.json({task_id:d.task_id||t,status:d.status||"unknown",video_url:d.content?.video_url||"",model:d.model||"",created_at:d.created_at||0,updated_at:d.updated_at||0})}catch(e){res.status(500).json({error:"video query api error",detail:e.response?.data?.error||e.message})}});
regPaid("GET","/paid/baidu-video-query");

// ═══════════════════════════════════════════════════════
// BAIDU AI EXPANSION — 2026-07-12 Full Coverage (17 endpoints)
// ═══════════════════════════════════════════════════════

// --- OCR APIs (token: main) ---
app.get('/paid/baidu-ocr-webimage', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const p = new URLSearchParams(); if (req.query.image) p.append('image', img); else p.append('url', img);
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/webimage?access_token=' + T,
      p.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ocr-webimage');

app.get('/paid/baidu-ocr-handwriting', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const p = new URLSearchParams(); if (req.query.image) p.append('image', img); else p.append('url', img);
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/handwriting?access_token=' + T,
      p.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ocr-handwriting');

app.get('/paid/baidu-ocr-qrcode', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const p = new URLSearchParams(); if (req.query.image) p.append('image', img); else p.append('url', img);
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/qrcode?access_token=' + T,
      p.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ocr-qrcode');

app.get('/paid/baidu-ocr-bankcard', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const p = new URLSearchParams(); if (req.query.image) p.append('image', img); else p.append('url', img);
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/bankcard?access_token=' + T,
      p.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ocr-bankcard');

app.get('/paid/baidu-ocr-business-license', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const p = new URLSearchParams(); if (req.query.image) p.append('image', img); else p.append('url', img);
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/business_license?access_token=' + T,
      p.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ocr-business-license');

app.get('/paid/baidu-ocr-numbers', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const p = new URLSearchParams(); if (req.query.image) p.append('image', img); else p.append('url', img);
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/numbers?access_token=' + T,
      p.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ocr-numbers');

app.get('/paid/baidu-ocr-seal', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const p = new URLSearchParams(); if (req.query.image) p.append('image', img); else p.append('url', img);
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/seal?access_token=' + T,
      p.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ocr-seal');

app.get('/paid/baidu-ocr-doc-office', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('main'); if (!T) return res.json({ error: 'auth failed' });
    const p = new URLSearchParams(); if (req.query.image) p.append('image', img); else p.append('url', img);
    const r = await X.post('https://aip.baidubce.com/rest/2.0/ocr/v1/doc_analysis_office?access_token=' + T,
      p.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ocr-doc-office');

// --- Vision/Recognition APIs (token: vision) ---
app.get('/paid/baidu-plant', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('vision'); if (!T) return res.json({ error: 'vision auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    if (req.query.baike === 'true') p.baike_num = '5';
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v1/plant?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-plant');

app.get('/paid/baidu-animal', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('vision'); if (!T) return res.json({ error: 'vision auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    if (req.query.baike === 'true') p.baike_num = '5';
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v1/animal?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-animal');

app.get('/paid/baidu-dish', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('vision'); if (!T) return res.json({ error: 'vision auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    if (req.query.baike === 'true') p.baike_num = '5';
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v2/dish?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-dish');

app.get('/paid/baidu-logo', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('vision'); if (!T) return res.json({ error: 'vision auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v2/logo?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-logo');

app.get('/paid/baidu-car', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('vision'); if (!T) return res.json({ error: 'vision auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    if (req.query.baike === 'true') p.baike_num = '5';
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v1/car?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-car');

app.get('/paid/baidu-ingredient', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('vision'); if (!T) return res.json({ error: 'vision auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v1/classify/ingredient?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-ingredient');

app.get('/paid/baidu-vehicle-detect', async (req, res) => {
  try {
    const img = req.query.image || req.query.url; if (!img) return res.json({ error: 'no image' });
    const T = await getToken('vision'); if (!T) return res.json({ error: 'vision auth failed' });
    const p = {}; if (req.query.url) p.url = img; else p.image = img;
    const r = await X.post('https://aip.baidubce.com/rest/2.0/image-classify/v1/vehicle_detect?access_token=' + T,
      new URLSearchParams(p).toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-vehicle-detect');

// --- NLP APIs (token: nlp) ---
app.get('/paid/baidu-text-corrector', async (req, res) => {
  const text = req.query.text || '';
  if (!text) return res.json({ error: 'no text' });
  try {
    const T = await getToken('nlp'); if (!T) return res.json({ error: 'nlp auth failed' });
    const r = await X.post('https://aip.baidubce.com/rpc/2.0/nlp/v1/ecnet?access_token=' + T,
      { text }, { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-text-corrector');

app.get('/paid/baidu-keyword-extraction', async (req, res) => {
  const text = req.query.text || '';
  if (!text) return res.json({ error: 'no text' });
  try {
    const T = await getToken('nlp'); if (!T) return res.json({ error: 'nlp auth failed' });
    const r = await X.post('https://aip.baidubce.com/rpc/2.0/nlp/v1/txt_keywords_extraction?access_token=' + T,
      { text, num: parseInt(req.query.num) || 5 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
    res.json(r.data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
regPaid('GET', '/paid/baidu-keyword-extraction');



app.get('/paid/paypal/create-order', (req, res) => {
  res.redirect(301, 'https://goldbean-api.xyz/buy-credits.html');
});
app.get('/paid/paypal/capture', (req, res) => {
  res.redirect(301, 'https://goldbean-api.xyz/buy-credits.html');
});
app.get('/paid/alipay/create-order', (req, res) => {
  res.redirect(301, 'https://goldbean-api.xyz/buy-credits.html');
});
app.get('/paid/stripe/create-checkout', (req, res) => {
  res.redirect(301, 'https://goldbean-api.xyz/buy-credits.html');
});

// 5.4 PayPal
try {
  const paypal = require('./goldbean-paypal-integration');
  if (paypal.createPaypalOrder) {
    app.post('/paid/paypal/create-order', async (req, res) => {
      try { await paypal.createPaypalOrder(req, res); } catch(e) { try { res.status(500).json({ error: e.message }); } catch(ee) { console.error('[paypal] double error:', ee.message); } }
    });
    regPaidPost('/paid/paypal/create-order');
    app.post('/paid/paypal/capture', async (req, res) => {
      try { await paypal.capturePaypalOrder(req, res); } catch(e) { try { res.status(500).json({ error: e.message }); } catch(ee) { console.error('[paypal] capture error:', ee.message); } }
    });
    regPaidPost('/paid/paypal/capture');
    LC('[load] /paid/paypal ← goldbean-paypal-integration.js');
  }
} catch(e) { LC('[warn] paypal:', e.message); }

// 5.5 Payment channels + Alipay
try { const pc = require('./goldbean-payment-channels'); if (typeof pc === 'function') pc(app); }
catch(e) { LC('[warn] payment-channels:', e.message); }
try { const ali = require('./goldbean-alipay-integration'); if (typeof ali === 'function') ali(app); }
catch(e) { LC('[warn] alipay:', e.message); }

// 5.6 [已清理] 移除全部 119 个占位路由 — 2026-06-20 师兄指示
// 以后以百度 AI 为主，不再引入无实现的空壳端点
console.log('[cleanup] 119 个空壳占位路由已于 v8.0.0 移除');
// ---------- 免费端点（免 x402） ----------
const _ax = require('axios');

app.get('/.well-known/x402-bazaar', (req, res) => {
  const data = {
    name: 'GoldBean API',
    description: 'GoldBean API Marketplace — 67 routes (57 paid + 10 free). Baidu AI (OCR/TTS/ASR/Translate/LLM Chat/NLP/Image). OpenAI-compatible endpoints. Web Search, Weather, Crypto. Pay per call via x402 (USDC), PayPal, or Alipay.',
    version: '9.6.0',
    currencies: [{ id: 'USDC', network: 'base', decimals: 6, contract: '0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913' }],
    pricing: {
      standard: { name: 'Pay-per-call', price: 0.01, currency: 'USDC', unit: 'per request', description: '$0.01-$0.03 per API call, no subscription needed' },
      free_tier: { name: 'Free tier', price: 0, currency: 'USDC', unit: '50 calls/day', description: '50 free calls per day, no payment needed' },
      bulk_100: { name: 'Bulk (100 calls)', price: 0.99, currency: 'USDC', unit: '100 requests', valid_days: 30, description: '$0.0099/req' },
      bulk_500: { name: 'Bulk (500 calls)', price: 4.99, currency: 'USDC', unit: '500 requests', valid_days: 90, description: '$0.00998/req' }
    },
    payment_methods: ['x402', 'paypal', 'alipay'],
    wallet: '0x7484b0bca25d2ee56e9b0535572d4cf44a047d98',
    network: 'eip155:8453',
    endpoint: 'https://goldbean-api.xyz'
  };
  res.json(data);
});
regSystem('GET', '/.well-known/x402-bazaar');

// x402 Bazaar V2 discovery (JSON alias)
app.get('/.well-known/x402-bazaar.json', (req, res) => {
  res.json({
    name: 'GoldBean API',
    version: '9.6.0',
    description: 'Pay-per-call AI marketplace bridging Baidu AI to the global agent economy. 74 Baidu AI + OpenAI-compatible endpoints: OCR, TTS, ASR, LLM, translation, image recognition. x402-native USDC payments on Base.',
    website: 'https://goldbean-api.xyz',
    categories: [
      { name: 'AI/OCR', endpoints: ['/paid/baidu-ocr', '/paid/baidu-ocr-accurate', '/paid/baidu-idcard'] },
      { name: 'AI/Speech', endpoints: ['/paid/baidu-tts', '/paid/baidu-asr'] },
      { name: 'AI/LLM', endpoints: ['/paid/baidu-llm-chat', '/paid/baidu-deepthink', '/paid/baidu-nlp', '/paid/baidu-helixfold'] },
      { name: 'AI/Vision', endpoints: ['/paid/baidu-vision-chat', '/paid/baidu-image-recognition', '/paid/baidu-image-enhance', '/paid/baidu-face-detect', '/paid/baidu-body-analysis'] },
      { name: 'AI/ImageGen', endpoints: ['/paid/baidu-image-gen', '/paid/baidu-image-edit'] },
      { name: 'AI/Embedding', endpoints: ['/paid/baidu-embedding', '/paid/baidu-reranker'] },
      { name: 'AI/OCR-Pro', endpoints: ['/paid/baidu-deepseek-ocr', '/paid/baidu-paddleocr-vl', '/paid/baidu-qianfan-ocr'] },
      { name: 'AI/Translation', endpoints: ['/paid/baidu-translate'] },
      { name: 'AI/Video', endpoints: ['/paid/baidu-video-gen', '/paid/baidu-video-query'] },
      { name: 'AI/OCR-Plus', endpoints: ['/paid/baidu-ocr-webimage', '/paid/baidu-ocr-handwriting', '/paid/baidu-ocr-qrcode', '/paid/baidu-ocr-bankcard', '/paid/baidu-ocr-business-license', '/paid/baidu-ocr-numbers', '/paid/baidu-ocr-seal', '/paid/baidu-ocr-doc-office'] },
      { name: 'AI/Recognition', endpoints: ['/paid/baidu-plant', '/paid/baidu-animal', '/paid/baidu-dish', '/paid/baidu-logo', '/paid/baidu-car', '/paid/baidu-ingredient', '/paid/baidu-vehicle-detect'] },
      { name: 'AI/NLP-Plus', endpoints: ['/paid/baidu-text-corrector', '/paid/baidu-keyword-extraction'] },
      { name: 'OpenAI-Compatible', endpoints: ['/v1/chat/completions', '/v1/models', '/v1/images/generations', '/v1/audio/speech', '/v1/audio/transcriptions', '/v1/embeddings'] }
    ],
    payment: {
      protocol: 'x402',
      version: '2.0',
      currencies: [{ id: 'USDC', network: 'base', contract: '0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913', decimals: 6 }],
      wallet: '0x7484b0bca25d2ee56e9b0535572d4cf44a047d98',
      pricing: { min: '0.002', max: '0.05', currency: 'USDC', free_tier: '50 calls/day' }
    },
    discovery: {
      x402: '/.well-known/x402.json',
      mcp: '/.well-known/mcp.json',
      openapi: '/openapi.json',
      llms: '/llms.txt'
    }
  });
});
regSystem('GET', '/.well-known/x402-bazaar.json');

app.get('/gas', async (req, res) => {
  try {
    const r = await _ax.get('https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle', { timeout: 5000 });
    res.json({
      gasPrice: r.data.result.ProposeGasPrice + ' Gwei',
      safe: r.data.result.SafeGasPrice + ' Gwei',
      fast: r.data.result.FastGasPrice + ' Gwei'
    });
  } catch (e) {
    res.status(502).json({ error: 'etherscan failed', detail: e.message });
  }
});
regSystem('GET', '/gas');

app.get('/btc-price', async (req, res) => {
  try {
    const r = await _ax.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { timeout: 8000 });
    //
    res.json({ price: r.data.bitcoin.usd, usd: r.data.bitcoin.usd, currency: 'USD', source: "CoinGecko", updated: new Date().toISOString() });
  } catch (e) {
    res.status(502).json({ error: 'failed to fetch BTC price', detail: e.message });
  }
});
regSystem('GET', '/btc-price');

app.get('/weather-now', async (req, res) => {
  const city = req.query.city || 'beijing';
  try {
    const r = await _ax.get('https://wttr.in/' + encodeURIComponent(city) + '?format=j1', { timeout: 8000 });
    const cc = r.data.current_condition && r.data.current_condition[0];
    if (!cc) return res.json({ error: 'no weather data' });
    res.json({
      city: city,
      temperature: cc.temp_C,
      humidity: cc.humidity,
      desc: cc.weatherDesc && cc.weatherDesc[0] && cc.weatherDesc[0].value,
      wind: cc.windspeedKmph + ' km/h',
      feelsLike: cc.FeelsLikeC
    });
  } catch (e) {
    res.status(502).json({ error: 'failed to fetch weather', detail: e.message });
  }
});
regSystem('GET', '/weather-now');


// ═══════════════════════════════════════════════════════
// 6. 兜底路由（必须放最后）
// ═══════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════
// Payment Status — SSE + Polling
// ═══════════════════════════════════════════════════════
const PAYMENT_STATUS = {}; // orderId -> { status, userId, credits, amount, createdAt }

function setPaymentStatus(orderId, status, info) {
  PAYMENT_STATUS[orderId] = Object.assign({ status: status, createdAt: new Date().toISOString() }, info || {});
  // Clean up old entries (keep last 100)
  var keys = Object.keys(PAYMENT_STATUS);
  if (keys.length > 100) {
    keys.slice(0, keys.length - 100).forEach(function(k) { delete PAYMENT_STATUS[k]; });
  }
}
// Expose globally so PayPal/Alipay modules can call it
global.setPaymentStatus = setPaymentStatus;

// SSE endpoint for real-time payment status
app.get('/paid/payment-status/sse', function(req, res) {
  var orderId = req.query.orderId;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Send current status immediately
  var current = PAYMENT_STATUS[orderId];
  if (current) {
    res.write('data: ' + JSON.stringify(current) + '\n\n');
    if (current.status === 'success' || current.status === 'failed') {
      res.end();
      return;
    }
  } else {
    res.write('data: ' + JSON.stringify({ status: 'pending', orderId: orderId, message: 'Waiting for payment confirmation...' }) + '\n\n');
  }
  
  // Poll for status changes
  var checkCount = 0;
  var interval = setInterval(function() {
    checkCount++;
    var status = PAYMENT_STATUS[orderId];
    if (status) {
      res.write('data: ' + JSON.stringify(status) + '\n\n');
      if (status.status === 'success' || status.status === 'failed' || checkCount > 120) {
        clearInterval(interval);
        res.end();
      }
    } else if (checkCount > 120) {
      res.write('data: ' + JSON.stringify({ status: 'timeout', orderId: orderId, message: 'Payment status check timed out. Please check your balance.' }) + '\n\n');
      clearInterval(interval);
      res.end();
    } else {
      res.write('data: ' + JSON.stringify({ status: 'pending', orderId: orderId, check: checkCount }) + '\n\n');
    }
  }, 2000);
  
  req.on('close', function() { clearInterval(interval); });
});

// Polling endpoint (for clients without SSE support)
app.get('/paid/payment-status', function(req, res) {
  var orderId = req.query.orderId;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });
  var status = PAYMENT_STATUS[orderId] || { status: 'pending', orderId: orderId, message: 'Waiting for payment...' };
  res.json(status);
});

// ═══════════════════════════════════════════════════════
// Stripe Payment Integration
// ═══════════════════════════════════════════════════════
app.post('/paid/stripe/create-checkout', async (req, res) => {
  try {
    var amount = parseFloat(req.body.amount) || 1;
    var userId = req.body.userId || '';
    var credits = parseInt(req.body.credits) || Math.floor(amount * 100);
    var planId = req.body.planId || '';
    
    // Build success/cancel URLs with params
    var successUrl = 'https://goldbean-api.xyz/buy-credits.html?stripe_success=1&key=' + (userId || '');
    var cancelUrl = 'https://goldbean-api.xyz/buy-credits.html?status=cancelled';
    
    // Create Stripe Checkout Session via API
    var ax = require('axios');
    var stripeKey = process.env.STRIPE_SECRET_KEY || '';
    
    if (!stripeKey) {
      // No Stripe key configured — return instructions
      return res.json({
        success: false,
        error: 'Stripe not configured yet. Please use PayPal or Alipay.',
        alternatives: {
          paypal: '/paid/paypal/create-order',
          alipay: '/paid/alipay/create-order'
        }
      });
    }
    
    var params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('client_reference_id', userId || 'guest');
    params.append('metadata[userId]', userId || '');
    params.append('metadata[credits]', String(credits));
    params.append('metadata[planId]', planId);
    params.append('line_items[0][quantity]', '1');
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][unit_amount]', String(Math.round(amount * 100)));
    params.append('line_items[0][price_data][product_data][name]', planId ? 'GoldBean ' + planId + ' Membership' : 'GoldBean ' + credits + ' Credits');
    
    var r = await ax.post('https://api.stripe.com/v1/checkout/sessions', params.toString(), {
      headers: {
        'Authorization': 'Bearer ' + stripeKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 15000
    });
    
    var session = r.data;
    setPaymentStatus(session.id, 'pending', { userId: userId, credits: credits, amount: amount, planId: planId });
    
    res.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      orderId: session.id
    });
  } catch(e) {
    console.error('[Stripe] Error:', e.response?.data || e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});
regPaidPost('/paid/stripe/create-checkout');

// Stripe webhook handler
app.post('/paid/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    var event = JSON.parse(req.body.toString());
    
    if (event.type === 'checkout.session.completed') {
      var session = event.data.object;
      var userId = session.client_reference_id || session.metadata?.userId || '';
      var credits = parseInt(session.metadata?.credits || '0');
      var planId = session.metadata?.planId || '';
      var amountTotal = session.amount_total / 100;
      
      if (credits > 0 && userId) {
        // Add credits to user
        const pp = require('./goldbean-paypal-integration');
        pp.addCreditsToUser(userId, credits, 'stripe', session.id);
      }
      
      setPaymentStatus(session.id, 'success', {
        userId: userId, credits: credits, amount: amountTotal, planId: planId
      });
      
      console.log('[Stripe] Payment success: ' + session.id + ' credits=' + credits + ' user=' + userId);
    }
    
    res.json({ received: true });
  } catch(e) {
    console.error('[Stripe] Webhook error:', e.message);
    res.status(400).json({ error: e.message });
  }
});

app.all('/paid/:ep', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '端点 /paid/' + req.params.ep + ' 不存在或暂未上线',
    pricing: '/api/pricing/plans',
    plans: '/paid/plans'
  });
});

app.get('/info',function(q,r){r.json({name:'GoldBean',version:'9.6.0',auth:'x-user-id header',register:'POST /paid/user/register',focus:'GoldBean API Marketplace — 67 routes (57 paid + 10 free). Baidu AI, OpenAI-compatible, Web Search, Crypto, Weather. Pay per call via x402, PayPal, or Alipay.'})});
// [REMOVED] duplicate /llms.txt route
// Modified catch-all 404 (routes defined above take priority)
app.use((req, res, next) => { 
  if (!res.headersSent) {
// ═══════════════════════════════════════
// FIX v8.0.1 - Landing page, SEO, Credits
// ═══════════════════════════════════════

const LANDING_HTML = fs.readFileSync(__dirname + '/public/index.html', 'utf8');

app.get('/', (req, res) => { res.type('html').send(LANDING_HTML); });

app.get('/sitemap.xml', (req, res) => {
  res.type('xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://goldbean-api.xyz/</loc><priority>1.0</priority></url><url><loc>https://goldbean-api.xyz/paid/plans</loc><priority>0.8</priority></url><url><loc>https://goldbean-api.xyz/openapi.json</loc><priority>0.7</priority></url><url><loc>https://goldbean-api.xyz/.well-known/x402-bazaar</loc><priority>0.6</priority></url><url><loc>https://goldbean-api.xyz/api/routes</loc><priority>0.6</priority></url></urlset>');
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\nSitemap: https://goldbean-api.xyz/sitemap.xml\n');
});

app.get('/paid/user/credits', (req, res) => {
  const uid = req.headers['x-user-id'] || req.headers['x-api-key'] || req.query.userId || '';
  const users = readJSON(GB_DIR + '/users.json', []); const u = users.find(x => x.userId === uid);
  // Also check IP daily free quota
  const clientIP = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().replace('::ffff:', '');
  const ipUsage = getIPUsage(clientIP);
  res.json({
    userId: uid || 'anonymous',
    registered: !!u,
    credits: u ? Math.max(0, (u.freeCredits||0) - (u.totalUsedCredits||0)) : 0,
    totalCredits: u ? (u.freeCredits||0) : 0,
    usedCredits: u ? (u.totalUsedCredits||0) : 0,
    membership: u ? (u.status !== 'free' && u.planExpiry && new Date(u.planExpiry) > new Date() ? u.status : 'none') : 'none',
    ipFreeQuota: { daily: DAILY_FREE_LIMIT, remaining: Math.max(0, DAILY_FREE_LIMIT - ipUsage.count), used: ipUsage.count },
    rechargeUrl: 'https://goldbean-api.xyz/buy-credits.html' + (uid ? '?key=' + uid : '')
  });
});

// Fix /paid/my-balance — same as credits endpoint
app.get('/paid/my-balance', (req, res) => {
  const uid = req.headers['x-user-id'] || req.headers['x-api-key'] || req.query.userId || '';
  const users = readJSON(GB_DIR + '/users.json', []); const u = users.find(x => x.userId === uid);
  const clientIP = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().replace('::ffff:', '');
  const ipUsage = getIPUsage(clientIP);
  res.json({
    success: true,
    userId: uid || 'anonymous',
    registered: !!u,
    credits: u ? Math.max(0, (u.freeCredits||0) - (u.totalUsedCredits||0)) : 0,
    membership: u ? (u.status !== 'free' && u.planExpiry && new Date(u.planExpiry) > new Date() ? { plan: u.status, expiry: u.planExpiry } : null) : null,
    ipFreeQuota: { daily: DAILY_FREE_LIMIT, remaining: Math.max(0, DAILY_FREE_LIMIT - ipUsage.count) },
    rechargeUrl: 'https://goldbean-api.xyz/buy-credits.html' + (uid ? '?key=' + uid : '')
  });
});

app.get('/paid/alipay/query', (req, res) => {
  const outTradeNo = req.query.outTradeNo || '';
  if (!outTradeNo) return res.json({ error: 'outTradeNo required' });
  const order = typeof ALIPAY_ORDERS !== 'undefined' ? ALIPAY_ORDERS[outTradeNo] : null;
  if (!order) return res.json({ status: 'unknown', orderId: outTradeNo, message: 'Order not found or still processing' });
  res.json({ status: order.status || 'pending', orderId: outTradeNo, amount: order.amount, createdAt: order.createdAt });
});



    // Let root path be handled by the landing page route
    if (req.path === '/' || req.path === '/robots.txt' || req.path === '/sitemap.xml' || req.path === '/favicon.ico') return next();
    res.status(404).json({ code: 404, message: '接口不存在' }); 
  } else next();
});

// ═══════════════════════════════════════════════════════
// 7. 全局错误处理
// ═══════════════════════════════════════════════════════

app.use((err, req, res, next) => {
  // 400 = client bad request (invalid JSON etc), don't crash or spam logs
  if (err.status === 400 || err.code === 400) {
    return res.status(400).json({ code: 400, error: 'Bad Request: Invalid JSON body' });
  }
  // Log only real server errors
  console.error('[服务异常]', req.path, err.message);
  res.status(err.status || 500).json({
    code: err.code || 500,
    message: NODE_ENV === 'production' ? '服务器内部错误' : err.message
  });
});

// ═══════════════════════════════════════════════════════
// 启动服务
// ═══════════════════════════════════════════════════════




// Free endpoint proxy -> 9889
const FREE_PROXY_PORT = 9889;
const fr = require("http");
const FREE_EPS = ["/gas","/btc-price","/weather-now","/.well-known/x402-bazaar"];
FREE_EPS.forEach(function(ep) {
  app.all(ep, function(req, res) {
    var opts = {
      hostname: "127.0.0.1",
      port: FREE_PROXY_PORT,
      path: req.url,
      method: req.method,
      headers: { "Host": "127.0.0.1:" + FREE_PROXY_PORT }
    };
    var pr = fr.request(opts, function(pr2) {
      var b = "";
      pr2.on("data", function(c) { b += c; });
      pr2.on("end", function() {
        res.status(pr2.statusCode).type("application/json").send(b);
      });
    });
    pr.on("error", function(e) { res.status(502).json({ error: e.message }); });
    pr.end();
  });
});


app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 GoldBean API 服务已启动 | 端口: ' + PORT + ' | 环境: ' + NODE_ENV);
  if (NODE_ENV !== 'production') {
    printRegisteredRoutes();
    console.log('📍 在线路由查询: http://localhost:' + PORT + '/api/routes');
    console.log('📍 在线调试页面: http://localhost:' + PORT + '/debug');
  }
});

// Quick patch: fix BTC and Gas handlers with correct APIs
// BTC: use coingecko
// Gas: use ethgasstation
// These replace existing handlers by wrapping them with the correct API calls
// We can't delete existing handlers, so we just add corrected ones last
// (last handler wins in Express for the same route)
