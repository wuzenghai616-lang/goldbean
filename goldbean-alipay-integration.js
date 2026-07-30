const AXIOS = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USD_TO_CNY = 7.25;
function usdToCny(usdAmount) {
  const cny = parseFloat(usdAmount) * USD_TO_CNY;
  return Math.max(cny, 0.01).toFixed(2);
}

const PRICE_MAP = {
  'baidu-ocr':          { usd: '0.01', cny: '0.10', desc: 'OCR' },
  'baidu-tts':          { usd: '0.01', cny: '0.10', desc: 'TTS' },
  'baidu-translate':    { usd: '0.02', cny: '0.15', desc: 'Translation' },
  'baidu-llm-chat':     { usd: '0.03', cny: '0.20', desc: 'AI Chat' },
  'baidu-asr':          { usd: '0.02', cny: '0.15', desc: 'ASR' },
  'baidu-image-recognition': { usd: '0.02', cny: '0.15', desc: 'Image Recognition' },
  'baidu-face-detect':  { usd: '0.02', cny: '0.15', desc: 'Face Detect' },
  'baidu-nlp':          { usd: '0.01', cny: '0.10', desc: 'NLP' },
};
const DEFAULT_CNY = '0.10';

const GB_DIR = '/opt/goldbean';
const PENDING_ORDERS_PATH = path.join(GB_DIR, 'pending_orders.json');

function readJSON(fp, def) { try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch(e) { return def; } }
function writeJSON(fp, data) { fs.writeFileSync(fp, JSON.stringify(data, null, 2)); }

function savePendingOrder(orderId, info) {
  const orders = readJSON(PENDING_ORDERS_PATH, {});
  orders[orderId] = Object.assign(info, { createdAt: new Date().toISOString() });
  writeJSON(PENDING_ORDERS_PATH, orders);
}

function getPendingOrder(orderId) {
  const orders = readJSON(PENDING_ORDERS_PATH, {});
  return orders[orderId] || null;
}

function addCreditsToUser(userId, credits, paymentMethod, orderId) {
  if (!userId || !credits) return false;
  const users = readJSON(GB_DIR + '/users.json', []);
  let user = users.find(u => u.userId === userId);
  if (!user) {
    user = {
      userId: userId, email: '', name: '', referralCode: '', affiliateId: '',
      status: 'free', planExpiry: null, balanceUsd: 0, balanceCny: 0,
      totalSpent: 0, freeCredits: 0, totalUsedCredits: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    users.push(user);
  }
  const creditsNum = parseInt(credits);
  user.freeCredits = (user.freeCredits || 0) + creditsNum;
  user.updatedAt = new Date().toISOString();
  writeJSON(GB_DIR + '/users.json', users);

  const txs = readJSON(GB_DIR + '/transactions.json', []);
  txs.push({
    id: 'TX_' + Date.now(), userId: userId, type: 'paid_credits',
    method: paymentMethod, orderId: orderId || '', credits: creditsNum,
    desc: 'Added ' + creditsNum + ' credits via ' + paymentMethod,
    createdAt: new Date().toISOString()
  });
  writeJSON(GB_DIR + '/transactions.json', txs);
  console.log('[credits] Added ' + creditsNum + ' credits to ' + userId + ' via ' + paymentMethod);
  return true;
}


function activateMembership(userId, planId, paymentMethod, orderId) {
  if (!userId || !planId) return false;
  const plans = {
    'plan_monthly':   { duration: 'month',    name: 'Monthly' },
    'plan_quarterly': { duration: 'quarter',  name: 'Quarterly' },
    'plan_yearly':    { duration: 'year',     name: 'Yearly' }
  };
  const plan = plans[planId];
  if (!plan) return false;

  const users = readJSON(GB_DIR + '/users.json', []);
  let user = users.find(u => u.userId === userId);
  if (!user) {
    user = {
      userId: userId, email: '', name: '', referralCode: '', affiliateId: '',
      status: 'free', planExpiry: null, balanceUsd: 0, balanceCny: 0,
      totalSpent: 0, freeCredits: 0, totalUsedCredits: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    users.push(user);
  }

  const now = new Date();
  let expiry = new Date(now);
  if (plan.duration === 'month') expiry.setMonth(expiry.getMonth() + 1);
  else if (plan.duration === 'quarter') expiry.setMonth(expiry.getMonth() + 3);
  else if (plan.duration === 'year') expiry.setFullYear(expiry.getFullYear() + 1);

  user.status = plan.duration;
  user.planExpiry = expiry.toISOString();
  user.updatedAt = now.toISOString();
  writeJSON(GB_DIR + '/users.json', users);

  const txs = readJSON(GB_DIR + '/transactions.json', []);
  txs.push({
    id: 'TX_' + Date.now(), userId: userId, type: 'membership',
    method: paymentMethod, orderId: orderId || '', planId: planId,
    desc: plan.name + ' membership activated',
    planExpiry: user.planExpiry,
    createdAt: now.toISOString()
  });
  writeJSON(GB_DIR + '/transactions.json', txs);

  console.log('[membership] Activated ' + plan.name + ' for ' + userId + ' until ' + user.planExpiry);
  return true;
}

module.exports = function setupAlipay(app) {
  const ALIPAY_APP_ID = process.env.ALIPAY_APP_ID || '';
  const ALIPAY_PRIVATE_KEY = fs.readFileSync('/opt/goldbean/alipay_private_key_pkcs1.pem', 'utf8').trim();

  let alipaySdk = null;
  let ALIPAY_ENABLED = !!(ALIPAY_APP_ID && ALIPAY_PRIVATE_KEY);

  if (ALIPAY_ENABLED) {
    try {
      const { AlipaySdk } = require('alipay-sdk');
      alipaySdk = new AlipaySdk({
        appId: ALIPAY_APP_ID,
        privateKey: ALIPAY_PRIVATE_KEY,
        alipayPublicKey: fs.readFileSync('/opt/goldbean/alipay_public_key.pem', 'utf8'),
        signType: "RSA2",
        keyType: "PKCS8",
        gateway: 'https://openapi.alipay.com/gateway.do',
        timeout: 10000,
      });
      console.log('[alipay] SDK initialized successfully');
    } catch (e) {
      console.error('[alipay] SDK init failed:', e.message);
      ALIPAY_ENABLED = false;
    }
  }

  // POST /paid/alipay/create-order
  app.post('/paid/alipay/create-order', async (req, res) => {
    try {
      const { ep, amount, description, userId, credits } = req.body;
      let price;
      if (ep && PRICE_MAP[ep]) {
        price = PRICE_MAP[ep];
      } else {
        const usdVal = parseFloat(amount) || 0.01;
        price = { usd: usdVal.toFixed(2), cny: usdToCny(usdVal), desc: description || 'GoldBean Credits' };
      }

      if (!alipaySdk) {
        return res.json({
          status: 'order_created', orderId: 'SIM_' + Date.now(),
          endpoint: ep, message: 'SDK not configured - simulation',
          amount: { cny: price.cny, usd: price.usd },
          description: price.desc, qrCode: '',
          paymentUrl: '', expiresIn: '30 minutes', mode: 'simulation'
        });
      }

      const orderId = 'GBALI' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();

      // 使用手机网站支付（alipay.trade.wap.pay），生成可跳转的支付URL
      const result = await alipaySdk.exec('alipay.trade.wap.pay', {
        notifyUrl: 'https://goldbean-api.xyz/paid/alipay/notify',
        bizContent: {
          outTradeNo: orderId,
          totalAmount: price.cny,
          subject: 'GoldBean: ' + price.desc,
          body: 'Endpoint: ' + (ep || 'credits'),
          qrCodeTimeoutExpress: '30m',
          productCode: 'QUICK_WAP_WAY',
        },
      });

      // result 是支付宝返回的完整支付URL（包含签名）
      // 保存 pending order
      savePendingOrder(orderId, {
        userId: userId || '',
        credits: credits || Math.floor(parseFloat(price.usd) * 100),
        amountCny: price.cny,
        amountUsd: price.usd,
        method: 'alipay',
        ep: ep || '',
        planId: req.body.planId || ''
      });

      return res.json({
        status: 'order_created',
        orderId: orderId,
        endpoint: ep || 'credits',
        message: 'Alipay order created via real SDK',
        amount: { cny: price.cny, usd: price.usd },
        description: price.desc,
        qrCode: '',
        paymentUrl: result,
        expiresIn: '30 minutes',
        executeAfterPayment: '/paid/' + (ep || 'baidu-ocr') + '?alipay_order=' + orderId,
      });
    } catch (sdkError) {
      console.error('[alipay] SDK error:', sdkError.message);
      // Fallback: 使用 precreate（扫码支付）
      try {
        const ep = req.body.ep || 'credits';
        const amount = parseFloat(req.body.amount) || 0.01;
        const cnyAmount = usdToCny(amount);
        const orderId = 'GBALI' + Date.now();

        const result = await alipaySdk.exec('alipay.trade.precreate', {
          notifyUrl: 'https://goldbean-api.xyz/paid/alipay/notify',
          bizContent: {
            outTradeNo: orderId,
            totalAmount: cnyAmount,
            subject: 'GoldBean Credits',
            body: 'Credits purchase',
            qrCodeTimeoutExpress: '30m',
          },
        });

        savePendingOrder(orderId, {
          userId: req.body.userId || '',
          credits: req.body.credits || Math.floor(amount * 100),
          amountCny: cnyAmount,
          amountUsd: amount.toFixed(2),
          method: 'alipay',
          planId: req.body.planId || ''
        });

        return res.json({
          status: 'order_created',
          orderId: orderId,
          message: 'Alipay order created (QR mode)',
          amount: { cny: cnyAmount, usd: amount.toFixed(2) },
          qrCode: result.qrCode || '',
          paymentUrl: '',
          expiresIn: '30 minutes',
        });
      } catch(e2) {
        return res.status(500).json({ error: 'Alipay order failed: ' + e2.message });
      }
    }
  });

  // POST /paid/alipay/notify — 支付宝异步回调
  app.post('/paid/alipay/notify', async (req, res) => {
    try {
      const params = req.body;
      console.log('[alipay/notify] Received:', params.trade_status, params.out_trade_no);

      // 验证签名 (alipay-sdk v4 uses checkNotifySign)
      if (alipaySdk && typeof alipaySdk.checkNotifySign === 'function') {
        try {
          const verifyResult = alipaySdk.checkNotifySign(params);
          if (!verifyResult) {
            console.error('[alipay/notify] Sign verification FAILED');
            return res.send('fail');
          }
        } catch(verifyErr) {
          console.error('[alipay/notify] Sign verification error:', verifyErr.message);
        }
      } else {
        console.warn('[alipay/notify] checkNotifySign not available, skipping verification');
      }

      // 只有 TRADE_SUCCESS 或 TRADE_FINISHED 才处理
      if (params.trade_status === 'TRADE_SUCCESS' || params.trade_status === 'TRADE_FINISHED') {
        const orderId = params.out_trade_no;
        const tradeNo = params.trade_no;
        const totalAmount = params.total_amount;

        const pending = getPendingOrder(orderId);
        if (pending) {
          const userId = pending.userId;
          const credits = pending.credits;
          if (pending.planId && pending.planId.startsWith('plan_')) {
            activateMembership(userId, pending.planId, 'alipay', orderId);
            console.log('[alipay/notify] Membership activated:', userId, pending.planId, 'Order:', orderId);
          } else if (userId && credits) {
            addCreditsToUser(userId, credits, 'alipay', orderId);
            console.log('[alipay/notify] Credits added:', userId, credits, 'Order:', orderId);
          } else {
            console.warn('[alipay/notify] No userId/credits for order:', orderId);
          }
        } else {
          console.warn('[alipay/notify] Unknown order:', orderId);
        }

        // 写入支付宝支付记录
        const recordsPath = path.join(GB_DIR, 'alipay_payments.json');
        let records = [];
        try { records = JSON.parse(fs.readFileSync(recordsPath, 'utf8')); } catch(e) { records = []; }
        records.push({
          orderId: orderId, tradeNo: tradeNo, amount: totalAmount,
          status: 'completed', userId: pending?.userId || '',
          credits: pending?.credits || 0,
          createdAt: new Date().toISOString()
        });
        fs.writeFileSync(recordsPath, JSON.stringify(records, null, 2));
      }

      // 支付宝要求返回 "success"（小写）
      return res.send('success');
    } catch (e) {
      console.error('[alipay/notify] Error:', e.message);
      return res.send('fail');
    }
  });

  // GET /paid/alipay/notify — 支付宝可能用GET回调
  app.get('/paid/alipay/notify', async (req, res) => {
    try {
      const params = req.query;
      console.log('[alipay/notify GET] Received:', params.trade_status, params.out_trade_no);

      if (params.trade_status === 'TRADE_SUCCESS' || params.trade_status === 'TRADE_FINISHED') {
        const orderId = params.out_trade_no;
        const pending = getPendingOrder(orderId);
        if (pending) {
          const userId = pending.userId;
          const credits = pending.credits;
          if (pending.planId && pending.planId.startsWith('plan_')) {
            activateMembership(userId, pending.planId, 'alipay', orderId);
            console.log('[alipay/notify GET] Membership activated:', userId, pending.planId);
          } else if (userId && credits) {
            addCreditsToUser(userId, credits, 'alipay', orderId);
            console.log('[alipay/notify GET] Credits added:', userId, credits);
          }
        }
      }
      return res.send('success');
    } catch(e) {
      return res.send('fail');
    }
  });

  // POST /paid/alipay/query
  app.post('/paid/alipay/query', async (req, res) => {
    try {
      const { orderId } = req.body || {};
      if (!orderId) return res.status(400).json({ error: 'orderId required' });
      if (!alipaySdk) return res.json({ status: 'simulation', orderId: orderId, message: 'SDK not configured' });

      const result = await alipaySdk.exec('alipay.trade.query', { bizContent: { outTradeNo: orderId } });
      return res.json({
        status: result.tradeStatus || 'WAIT_BUYER_PAY',
        orderId: orderId, tradeNo: result.tradeNo || '',
        buyerId: result.buyerUserId || '', totalAmount: result.totalAmount || '0.00',
      });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to query: ' + e.message });
    }
  });

  // POST /paid/alipay/refund
  app.post('/paid/alipay/refund', async (req, res) => {
    try {
      const { orderId, amount } = req.body || {};
      if (!orderId) return res.status(400).json({ error: 'orderId required' });
      if (!alipaySdk) return res.json({ status: 'simulation', orderId: orderId, message: 'SDK not configured' });

      const result = await alipaySdk.exec('alipay.trade.refund', {
        bizContent: { outTradeNo: orderId, refundAmount: amount || '0.01', refundReason: 'User requested refund' }
      });
      return res.json({ status: result.fundChange === 'Y' ? 'refunded' : 'pending', orderId: orderId, refundFee: result.refundFee || '0.00' });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to refund: ' + e.message });
    }
  });

  // GET /paid/alipay/status
  app.get('/paid/alipay/status', (req, res) => {
    return res.json({
      configured: ALIPAY_ENABLED, app_id: ALIPAY_APP_ID || null,
      mode: ALIPAY_ENABLED ? 'production' : 'not_configured',
      sdk_version: 'alipay-sdk', sdk_init: alipaySdk !== null,
      prices_note: 'CNY prices are USD * 7.25',
      endpoints: Object.keys(PRICE_MAP).map(function(ep) {
        return { ep: ep, cny: PRICE_MAP[ep].cny, usd: PRICE_MAP[ep].usd, desc: PRICE_MAP[ep].desc };
      }),
    });
  });

  console.log('[alipay] Integration ' + (ALIPAY_ENABLED ? 'ACTIVE' : 'INACTIVE (no ALIPAY_PRIVATE_KEY)'));
  console.log('[alipay] ' + Object.keys(PRICE_MAP).length + ' priced endpoints for CNY');
};
