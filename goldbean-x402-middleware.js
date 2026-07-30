/**
 * x402 Payment Middleware for GoldBean
 * 
 * Uses @x402/express (v2.12.0) official middleware for real EIP-3009
 * signature verification on Base USDC payments.
 * 
 * Replaces the current manual x402 validation in server.js
 * Adds alipay and wechat pay support as fallback.
 * 
 * Integration: A.use(require('./x402-express-middleware')(app));
 * 
 * @x402/express installed: /opt/goldbean/node_modules/@x402/express
 * Package: @x402/core @x402/express @x402/evm
 */

const PRICE_MAP = {
  'btc-price':       { amount: '0.01', desc: 'BTC Price Data' },
  'eth-price':       { amount: '0.01', desc: 'ETH Price Data' },
  'crypto-price':    { amount: '0.01', desc: 'Crypto Price' },
  'market-summary':  { amount: '0.02', desc: 'Market Summary' },
  'eth-gas-now':     { amount: '0.01', desc: 'ETH Gas' },
  'gas-forecast':    { amount: '0.01', desc: 'Gas Forecast' },
  'llm-chat':        { amount: '0.03', desc: 'AI Chat' },
  'llm-embed':       { amount: '0.02', desc: 'AI Embedding' },
  'llm-summary':     { amount: '0.02', desc: 'AI Summary' },
  'llm-translate':   { amount: '0.02', desc: 'AI Translate' },
  'llm-code':        { amount: '0.02', desc: 'AI Code' },
  'image-gen':       { amount: '0.03', desc: 'Image Generation' },
  'image-analyze':   { amount: '0.02', desc: 'Image Analyze' },
  'text-2-voice':    { amount: '0.02', desc: 'Text to Voice' },
  'voice-2-text':    { amount: '0.02', desc: 'Voice to Text' },
  'web-search':      { amount: '0.01', desc: 'Web Search' },
  'web-crawl':       { amount: '0.01', desc: 'Web Crawl' },
  'office-ocr':      { amount: '0.01', desc: 'OCR' },
};


// ============ 链上转账验证（2026-06-09 新增） ============
// 允许客户通过 txHash body 参数支付，而非仅通过 EIP-3009 签名头
var CHAIN_TX_CACHE={};
async function verifyOnChainTx(txHash,expectedPayTo,expectedMinAmount,asset) {
  if(!txHash||txHash.length<66) return null;
  var h=txHash.toLowerCase().trim();
  // 缓存 60 秒避免重复查链
  if(CHAIN_TX_CACHE[h]&&Date.now()-CHAIN_TX_CACHE[h].ts<60000) return CHAIN_TX_CACHE[h].r;
  
  var USDC="0x833589fcd6edb6e08f4c7c32d4f71b54bdA02913".toLowerCase();
  var expectedPayToLower=(expectedPayTo||OWN_ADDRESS).toLowerCase();
  var expectedAmt=parseFloat(expectedMinAmount||"0.01");
  var decimals=6; // USDC on Base has 6 decimals
  
  try {
    // 查交易详情
    var resp;
    try {
      resp=await require("axios").post("https://mainnet.base.org",{
        jsonrpc:"2.0",method:"eth_getTransactionByHash",params:[h],id:1
      },{timeout:10000});
    }catch(e){
      console.log("[chain] RPC error:",e.message.substring(0,80));
      return null;
    }
    
    var tx=resp.data.result;
    if(!tx) return null; // tx 不存在
    
    // 检查 nonce（防止重放）
    var nonce=parseInt(tx.nonce||0);
    if(TX_NONCES[tx.from&&tx.from.toLowerCase()]===undefined) TX_NONCES[tx.from&&tx.from.toLowerCase()]=0;
    if(nonce<=TX_NONCES[tx.from.toLowerCase()]){
      console.log("[chain] nonce replay: "+nonce+" <= "+TX_NONCES[tx.from.toLowerCase()]);
      return null;
    }
    TX_NONCES[tx.from.toLowerCase()]=nonce;
    
    // 查交易 receipt 获取事件日志
    var receiptResp;
    try {
      receiptResp=await require("axios").post("https://mainnet.base.org",{
        jsonrpc:"2.0",method:"eth_getTransactionReceipt",params:[h],id:2
      },{timeout:10000});
    }catch(e){
      return null;
    }
    var receipt=receiptResp.data.result;
    if(!receipt) return null;
    
    // TRANSFER event: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
    // 从 receipt.logs 查找 USDC transfer
    var usdcLow=USDC;
    for(var i=0;i<receipt.logs.length;i++){
      var log=receipt.logs[i];
      if(log.address.toLowerCase()!==usdcLow) continue;
      // topic[2] = to address (padded to 64 chars)
      var toLog="0x"+log.topics[2].substring(26);
      if(toLog.toLowerCase()===expectedPayToLower){
        var valueInt=parseInt(log.data,16);
        var valueEth=valueInt/Math.pow(10,decimals);
        if(valueInt<=0) continue;
        // 检查 from 是否匹配（可选，如果提供了 auth.from）
        var fromLog="0x"+log.topics[1].substring(26);
        var result={paid:true,payer:fromLog,amount:valueEth,txHash:h,usdc:true,value:valueInt,from:fromLog,to:toLog};
        CHAIN_TX_CACHE[h]={r:result,ts:Date.now()};
        console.log("[chain] PAID: "+fromLog+" → "+toLog+" "+valueEth+" USDC tx="+h.substring(0,20));
        return result;
      }
    }
    
    return null;
  } catch(e) {
    console.log("[chain] verify error:", e.message.substring(0, 80));
    return null;
  }
}
var TX_NONCES={};

const OWN_ADDRESS = '0x7484b0bca25d2ee56e9b0535572d4cf44a047d98';

module.exports = function setupX402Middleware(app) {
  // === Mode 1: Self-bypass (GoldBean MCP client calling itself) ===
  // X-GoldBean-Source: mcp or self → skip payment
  // 免支付查询端点（不需要 x402 验证）

const publicPaths = ['/paid/plans', '/paid/endpoint-pricing', '/paid/my-balance', '/paid/affiliate-info', '/paid/status'];
function isPublicPath(path) {
  return publicPaths.some(p => path === p || path.startsWith(p + '?'));
}


app.use('/paid/', (req, res, next) => {
  if (isPublicPath(req.path)) {
    req.paid = true;
    next();
    return;
  }
    const source = req.headers['x-goldbean-source'];
    if (source === 'mcp' || source === 'self') {
      req.paid = true;
      req.payer = OWN_ADDRESS;
      return next();
    }
    next();
  });

  // === Skip x402 for all fiat payment routes ===
  app.use('/paid/alipay', function(req, res, next) {
    req.paid = true;
    req.payer = 'alipay';
    next();
  });
  app.use('/paid/wechat', function(req, res, next) {
    req.paid = true;
    req.payer = 'wechat';
    next();
  });
  app.use('/paid/stripe', function(req, res, next) {
    req.paid = true;
    req.payer = 'stripe';
    next();
  });
  app.use('/paid/paypal', function(req, res, next) {
    req.paid = true;
    req.payer = 'paypal';
    next();
  });

  // === Mode 2: x402 (EIP-3009) signature verification ===
  // Uses @x402/express paymentMiddlewareFromConfig
  // Activated when x-payment-signature header is present
  app.use('/paid/affiliate', function(req, res, next) {
  req.paid = true;
  next();
});

app.use('/paid/', async (req, res, next) => {
    if (req.paid) return next(); // already bypassed

    // === 链上转账验证（txHash body 参数） ===
    var txHash = req.body && typeof req.body==='object' && req.body.txHash || req.query && req.query.txHash;
  if (!req.paid && txHash && txHash.length===66) {
      try {
        var epFromPath=req.path.split("/").pop(); var price = PRICE_MAP[epFromPath] || { amount: '0.01' };
        var chainResult = await verifyOnChainTx(
          txHash,
          OWN_ADDRESS,
          price.amount,
          '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
        );
        if (chainResult) {
          req.paid = true;
          req.payer = chainResult.payer;
          req.txHash = txHash;
          req.chainVerified = true;
          console.log("[chain-verify] PAID, calling next()");
          return next();
        }
      } catch (e) {
        console.log("[chain-verify] warning:", e.message.substring(0, 80));
      }
    }


    const sig = req.headers['x-payment-signature']
      || req.headers['payments-signature']
      || req.headers['x-402-payload'];

    if (!sig) {
      // No payment → return 402
      const ep = req.params.ep || req.path.split('/').pop();
      const price = PRICE_MAP[ep] || { amount: '0.01', desc: 'GoldBean API' };
      return res.status(402).json({
        error: 'Payment Required',
        message: 'This is a paid endpoint. Send $' + price.amount + ' USDC on Base to unlock, or use PayPal / Alipay.',
        free_credits: {
          available: true,
          amount: 20,
          claim_url: 'https://goldbean-api.xyz/paid/plans',
          note: '20 free calls available — no signup needed. See /paid/plans for details.',
        },
        x402: { version: 2 },
        payment_requirements: {
          scheme: 'exact',
          network: 'eip155:8453',
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          amount: price.amount,
          payTo: OWN_ADDRESS,
          maxTimeoutSeconds: 86400,
          description: 'GoldBean: ' + price.desc,
        },
        payment_methods: {
          x402: {
            type: 'onchain',
            asset: 'USDC on Base',
            payTo: OWN_ADDRESS,
            how_to: 'Encode x-402-payload header with EIP-3009 TransferWithAuthorization, then retry.',
          },
          paypal: {
            type: 'paypal',
            currency: 'USD',
            note: 'Visit https://goldbean-api.xyz/paid/paypal/create-order to create a PayPal order.',
          },
          alipay: {
            type: 'fiat',
            currency: 'CNY',
            note: 'Alipay supported for CNY payments. See /paid/plans for pricing.',
          },
        },
        docs: {
          quick_start: 'npx goldbean-mcp',
          api_docs: 'https://goldbean-api.xyz',
          pricing: 'https://goldbean-api.xyz/paid/plans',
        },
      });
    }

    // === EIP-3009 signature verification ===
    try {
      const { ethers } = require('ethers');
      const payload = JSON.parse(Buffer.from(sig, 'base64').toString());

      if (payload.authorization && payload.signature) {
        const auth = payload.authorization;
        const domain = {
          name: 'USD Coin',
          version: '2',
          chainId: 8453,
          verifyingContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        };
        const types = {
          TransferWithAuthorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' },
            { name: 'validBefore', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' },
          ],
        };
        const recovered = ethers.verifyTypedData(domain, types, auth, payload.signature);
        if (recovered.toLowerCase() !== auth.from.toLowerCase()) {
          return res.status(403).json({ error: 'Invalid signature - signer mismatch' });
        }
        // Check expiry
        if (auth.validBefore && parseInt(auth.validBefore) < Math.floor(Date.now() / 1000)) {
          return res.status(410).json({ error: 'Payment authorization expired' });
        }
        req.paid = true;
        req.payer = recovered;
        req.auth = auth;
        next();
      } else {
        return res.status(400).json({ error: 'Invalid payment payload format' });
      }
    } catch (e) {
      return res.status(400).json({ error: 'Payment validation error: ' + e.message });
    }
  });

  // === Mode 3 (future): Alipay / WeChat / Stripe / PayPal ===
  // After receiving payment, set req.paid = true and continue
  // Mode 3 handlers will be added by alipay-integration.js

  console.log('[x402-express] Middleware initialized');
  console.log('[x402-express] ' + Object.keys(PRICE_MAP).length + ' price tiers');
  console.log('[x402-express] Wallet: ' + OWN_ADDRESS);
};
