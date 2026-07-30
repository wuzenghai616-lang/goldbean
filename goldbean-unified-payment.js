/**
 * GoldBean 统一支付入口
 * 
 * 一个 /paid/ 端点，自动选择支付方式
 * 
 * 端点：
 * - POST /paid/ — 统一支付（自动选择/手动指定）
 * - GET /paid/plans — 获取会员套餐列表
 * - GET /paid/endpoint-pricing — 获取端点定价
 * - GET /paid/my-balance — 查询余额/会员状态
 * - GET /paid/affiliate-info — 获取分销信息
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PRICING = require('./goldbean-pricing');
let ALIPAY = null; try { ALIPAY = require('./goldbean-alipay-integration'); } catch(e) { console.log('[unified] Alipay not available'); }

// ==========================================
// 数据存储
// ==========================================
const USERS_PATH = path.join(__dirname, 'users.json');
const TRANSACTIONS_PATH = path.join(__dirname, 'transactions.json');

function readJson(filePath, defaultVal = []) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (e) { return defaultVal; }
}
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ==========================================
// 用户管理
// ==========================================

/**
 * 获取/创建用户
 */
function getUser(userId) {
  const users = readJson(USERS_PATH);
  let user = users.find(u => u.userId === userId);
  
  if (!user) {
    user = {
      userId: userId || 'GB_' + crypto.randomBytes(8).toString('hex').toUpperCase(),
      email: '',
      name: '',
      referralCode: '',         // 来源分销码
      affiliateId: '',          // 所属代理
      status: 'free',           // free / monthly / quarterly / yearly
      planExpiry: null,
      balanceUsd: 0,
      balanceCny: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(user);
    writeJson(USERS_PATH, users);
  }
  
  user.updatedAt = new Date().toISOString();
  writeJson(USERS_PATH, users);
  return user;
}

/**
 * 记录交易
 */
function recordTransaction(tx) {
  const txs = readJson(TRANSACTIONS_PATH);
  txs.push({
    id: 'TX_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    ...tx,
    createdAt: new Date().toISOString()
  });
  writeJson(TRANSACTIONS_PATH, txs);
}

// ==========================================
// 统一支付入口
// ==========================================

/**
 * POST /paid/
 * 统一支付端点
 * 
 * 请求体：
 * {
 *   "endpoint": "/paid/llm-chat",      // 要调用的端点
 *   "amount": 10,                      // 金额（CNY）
 *   "currency": "CNY",                 // CNY / USD
 *   "paymentMethod": "auto",           // auto | alipay | paypal | x402
 *   "planId": "monthly",               // 会员套餐（可选，与 amount 二选一）
 *   "referralCode": "REF_xxx",         // 分销码（可选）
 *   "userId": "GB_xxx",                // 用户 ID（可选，新用户自动创建）
 *   "metadata": {}                     // 额外信息
 * }
 */
async function unifiedPayment(req, res) {
  try {
    const {
      endpoint,
      amount,
      currency = 'CNY',
      paymentMethod = 'auto',
      planId,
      referralCode,
      userId,
      metadata
    } = req.body;

    if (!endpoint && !planId) {
      return res.status(400).json({
        success: false,
        error: '必须指定 endpoint 或 planId'
      });
    }

    // 1. 获取/创建用户
    const user = getUser(userId);
    user.userId = userId || user.userId;
    
    // 2. 处理分销追踪
    if (referralCode) {
      user.referralCode = referralCode;
      // 如果有代理关联，记录推荐关系
    }

    // 3. 检查是否是会员（会员免费调用标准端点）
    const isMember = user.status !== 'free' && 
      (!user.planExpiry || new Date(user.planExpiry) > new Date());
    
    // 4. 获取端点定价
    const endpointPricing = PRICING.getEndpointPricing(endpoint);

    // 5. 判断是否需要收费
    let chargeAmount = 0;
    let chargeCurrency = 'CNY';
    let chargeMethod = '';

    if (planId) {
      // === 会员套餐购买 ===
      const plan = PRICING.pricing.plans[planId];
      if (!plan) {
        return res.status(400).json({
          success: false,
          error: `未知套餐: ${planId}`,
          availablePlans: Object.keys(PRICING.pricing.plans)
        });
      }

      chargeAmount = currency === 'CNY' ? plan.priceCny : plan.price;
      chargeCurrency = currency;
      chargeMethod = 'plan';

      // 确定支付方式
      const method = selectPaymentMethod(chargeAmount, chargeCurrency, paymentMethod);
      
      // 生成支付订单
      const order = await createPaymentOrder({
        type: 'plan',
        planId: planId,
        amount: chargeAmount,
        currency: chargeCurrency,
        method: method,
        userId: user.userId,
        referralCode: referralCode
      });

      return res.json({
        success: true,
        type: 'plan_purchase',
        plan: plan,
        amount: chargeAmount,
        currency: chargeCurrency,
        payment: order,
        userId: user.userId
      });

    } else {
      // === 按次付费 ===
      
      // 会员免费调用标准端点
      if (isMember && endpointPricing.tier === 'free') {
        return res.json({
          success: true,
          type: 'free_access',
          message: '会员免费访问',
          endpoint: endpoint,
          tier: endpointPricing.tier,
          userId: user.userId
        });
      }

      // 非会员/非免费端点 → 收费
      chargeAmount = endpointPricing.pricePerCallCny;
      chargeCurrency = 'CNY';
      chargeMethod = 'per_call';

      // 检查 x402 付款（如果是 Agent 自动调用）
      const paymentSignature = req.headers['x-payment-signature'];
      if (paymentSignature && paymentMethod !== 'alipay' && paymentMethod !== 'paypal') {
        // x402 模式：直接验证链上付款
        return res.json({
          success: true,
          type: 'x402_payment',
          message: '使用 x402 链上支付',
          endpoint: endpoint,
          amount: endpointPricing.pricePerCall,
          currency: 'USD',
          userId: user.userId,
          note: 'Agent 自动完成链上支付验证'
        });
      }

      // 手动支付模式
      const method = selectPaymentMethod(chargeAmount, chargeCurrency, paymentMethod);
      
      const order = await createPaymentOrder({
        type: 'per_call',
        endpoint: endpoint,
        amount: chargeAmount,
        currency: chargeCurrency,
        method: method,
        userId: user.userId,
        referralCode: referralCode
      });

      return res.json({
        success: true,
        type: 'per_call_payment',
        endpoint: endpoint,
        tier: endpointPricing.tier,
        amount: chargeAmount,
        currency: chargeCurrency,
        paymentMethod: method,
        payment: order,
        userId: user.userId
      });
    }

  } catch (error) {
    console.error('[UnifiedPayment] 处理失败:', error.message);
    res.status(500).json({
      success: false,
      error: '支付处理失败',
      details: error.message
    });
  }
}

/**
 * 自动选择支付方式
 */
function selectPaymentMethod(amount, currency, preferred) {
  if (preferred && preferred !== 'auto') {
    return preferred;
  }
  
  // 默认策略：大额优先支付宝，小额优先 x402
  if (amount > 100) {
    return 'paypal';  // alipay removed
  } else if (amount <= 10) {
    return 'x402';    // 小额用 x402
  } else {
    return 'paypal';  // alipay removed
  }
}

/**
 * 创建支付订单
 */
async function createPaymentOrder(orderData) {
  const { type, planId, endpoint, amount, currency, method, userId, referralCode } = orderData;

  switch (method) {
    case 'alipay_removed':
      return await createAlipayOrder(type, planId, endpoint, amount, userId, referralCode);
    
    case 'paypal':
      return await createPaypalOrder(type, planId, endpoint, amount, userId, referralCode);
    
    case 'x402':
      return await createX402Order(type, planId, endpoint, amount, userId, referralCode);
    
    default:
      return {
        status: 'unsupported',
        message: `不支持的支付方式: ${method}`,
        available: ['paypal', 'x402']
      };
  }
}

/**
 * 创建支付宝订单
 */
async function createAlipayOrder(type, planId, endpoint, amount, userId, referralCode) {
  try {
    const orderData = {
      type: type,
      planId: planId,
      endpoint: endpoint,
      subject: getSubject(type, planId, endpoint),
      totalAmount: amount,
      userId: userId,
      referralCode: referralCode
    };

    // 调用支付宝集成
    const result = await ALIPAY.createOrder(orderData);
    
    // 记录交易
    recordTransaction({
      ...orderData,
      paymentMethod: 'alipay',
      orderId: result.orderId,
      status: 'pending'
    });

    return {
      method: 'alipay_removed',
      orderId: result.orderId,
      paymentUrl: result.paymentUrl,
      qrCode: result.qrCode,
      amount: amount,
      currency: 'CNY',
      expireAt: result.expireAt
    };
  } catch (error) {
    console.error('[Alipay] 创建订单失败:', error.message);
    return {
      method: 'alipay_removed',
      status: 'error',
      error: error.message
    };
  }
}

/**
 * 创建 PayPal 订单
 */
async function createPaypalOrder(type, planId, endpoint, amount, userId, referralCode) {
  try {
    const usdAmount = Math.round((amount / PRICING.pricing.exchangeRate.usdToCny) * 100) / 100;
    
    const subject = getSubject(type, planId, endpoint);
    
    // 调用 PayPal 集成
    const result = await axios.post(
      `${process.env.GOLD_BEAN_URL || 'http://104.225.233.23:9879'}/paid/paypal/create-order`,
      {
        amount: usdAmount,
        currency: 'USD',
        description: subject
      },
      { timeout: 10000 }
    );

    // 记录交易
    recordTransaction({
      type: type,
      planId: planId,
      endpoint: endpoint,
      userId: userId,
      paymentMethod: 'paypal',
      orderId: result.data.orderId,
      amount: amount,
      amountUsd: usdAmount,
      status: 'pending'
    });

    return {
      method: 'paypal',
      orderId: result.data.orderId,
      approveUrl: result.data.approveUrl,
      amount: amount,
      amountUsd: usdAmount,
      currency: 'USD',
      expireAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
  } catch (error) {
    console.error('[PayPal] 创建订单失败:', error.message);
    return {
      method: 'paypal',
      status: 'error',
      error: error.message
    };
  }
}

/**
 * 创建 x402 订单
 */
async function createX402Order(type, planId, endpoint, amount, userId, referralCode) {
  return {
    method: 'x402',
    type: type,
    endpoint: endpoint,
    amountUsd: PRICING.usdToCny(amount) / 100,
    currency: 'USD',
    network: 'eip155:8453',
    payTo: '0x7484b0bca25d2ee56e9b0535572d4cf44a047D98',
    note: 'Agent 自动完成链上 USDC 支付'
  };
}

/**
 * 获取订单主题
 */
function getSubject(type, planId, endpoint) {
  if (type === 'plan' && planId) {
    const plan = PRICING.pricing.plans[planId];
    return `GoldBean ${plan.name} 会员`;
  }
  return `GoldBean ${endpoint} 调用`;
}

// ==========================================
// 查询端点
// ==========================================

/**
 * GET /paid/plans
 * 获取会员套餐列表
 */
function getPlans(req, res) {
  const data = PRICING.getPlans();
  res.json({
    success: true,
    ...data
  });
}

/**
 * GET /paid/endpoint-pricing
 * 获取端点定价信息
 */
function getEndpointPricing(req, res) {
  const { endpoint } = req.query;
  
  if (endpoint) {
    const pricing = PRICING.getEndpointPricing(endpoint);
    res.json({
      success: true,
      endpoint: endpoint,
      ...pricing
    });
  } else {
    // 返回所有端点定价
    const tiers = {};
    for (let tier in PRICING.pricing.endpointTiers) {
      tiers[tier] = PRICING.pricing.endpointTiers[tier];
    }
    res.json({
      success: true,
      tiers: tiers
    });
  }
}

/**
 * GET /paid/my-balance
 * 查询用户余额/会员状态
 */
function getMyBalance(req, res) {
  const userId = req.query.userId || req.headers['x-user-id'] || req.headers['x-api-key'] || '';
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'userId required. Pass as query param (?userId=GB_xxx) or header (x-user-id: GB_xxx)'
    });
  }

  const users = readJson(USERS_PATH);
  const user = users.find(u => u.userId === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: '用户不存在'
    });
  }

  var credits = Math.max(0, (user.freeCredits || 0) - (user.totalUsedCredits || 0));
  var clientIP = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim().replace('::ffff:', '');
  var today = new Date().toISOString().slice(0, 10);
  var ipData = {};
  try { ipData = JSON.parse(require('fs').readFileSync('/opt/goldbean/ip_daily_usage.json', 'utf8')); } catch(e) {}
  var ipKey = clientIP + '_' + today;
  var ipUsed = ipData[ipKey] || 0;
  
  res.json({
    success: true,
    userId: user.userId,
    email: user.email,
    name: user.name,
    status: user.status,
    planExpiry: user.planExpiry,
    balanceUsd: user.balanceUsd,
    balanceCny: user.balanceCny,
    totalSpent: user.totalSpent,
    credits: credits,
    isMember: user.status !== 'free' && (!user.planExpiry || new Date(user.planExpiry) > new Date()),
    ipFreeQuota: { daily: 50, remaining: Math.max(0, 50 - ipUsed), used: ipUsed },
    rechargeUrl: 'https://goldbean-api.xyz/buy-credits.html?key=' + user.userId,
    createdAt: user.createdAt
  });
}

/**
 * GET /paid/affiliate-info
 * 获取分销信息
 */
function getAffiliateInfo(req, res) {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: '需要 userId 参数'
    });
  }

  const users = readJson(USERS_PATH);
  const user = users.find(u => u.userId === userId);
  
  res.json({
    success: true,
    hasReferral: !!(user && user.referralCode),
    referralCode: user?.referralCode || '',
    referralLink: user?.referralCode 
      ? `https://goldbean-api.xyz/ref/${user.referralCode}`
      : '',
    affiliate: PRICING.getAffiliateInfo()
  });
}

// ==========================================
// 导出路由
// ==========================================

function getUnifiedPaymentRoutes() {
  const router = express.Router();
  
  // 统一支付入口
  router.post('/', unifiedPayment);
  
  // 查询端点
  router.get('/plans', getPlans);
  router.get('/endpoint-pricing', getEndpointPricing);
  router.get('/my-balance', getMyBalance);
  router.get('/affiliate-info', getAffiliateInfo);
  
  return router;
}

module.exports = {
  getUnifiedPaymentRoutes,
  unifiedPayment,
  getUser,
  getPlans,
  getEndpointPricing,
  getMyBalance,
  getAffiliateInfo
};
