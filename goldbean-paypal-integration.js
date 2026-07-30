const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const PAYPAL_CONFIG = {
  SANDBOX: false,
  CLIENT_ID: 'BAAOSqVega31bZUmOnMoPUXlVTupCZHRgXGzWDeGoxET5jMmwNYeTXP_a6n4Ihu2Ojp84wuWZQbfpvtb-U',
  SECRET: 'ELcTc4GMlj0oCVIov3PsytGxVkhMUv6tRyyZm3IkHLs7aXyz78QikMjD9i3Gdd54vYchp9NIsRmxsIOw',
  BASE_URL: 'https://api-m.paypal.com',
  CURRENCY: 'USD',
  CALLBACK_URL: 'https://goldbean-api.xyz/paid/paypal/webhook'
};

const USD_TO_CNY = 7.25;
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
      userId: userId,
      email: '', name: '', referralCode: '', affiliateId: '',
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
    id: 'TX_' + Date.now(),
    userId: userId,
    type: 'paid_credits',
    method: paymentMethod,
    orderId: orderId || '',
    credits: creditsNum,
    desc: 'Added ' + creditsNum + ' credits via ' + paymentMethod,
    createdAt: new Date().toISOString()
  });
  writeJSON(GB_DIR + '/transactions.json', txs);

  console.log('[credits] Added ' + creditsNum + ' credits to ' + userId + ' via ' + paymentMethod);
  // Notify payment status (for SSE/webhook)
  if (typeof global.setPaymentStatus === 'function') {
    global.setPaymentStatus(orderId || '', 'success', { userId: userId, credits: creditsNum, amount: (creditsNum/100).toFixed(2), method: paymentMethod });
  }
  return true;
}

async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(PAYPAL_CONFIG.CLIENT_ID + ':' + PAYPAL_CONFIG.SECRET).toString('base64');
    const response = await axios.post(
      `${PAYPAL_CONFIG.BASE_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      { headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('[PayPal] Token error:', error.response?.data || error.message);
    throw new Error('PayPal token failed');
  }
}

async function createPaypalOrder(req, res) {
  try {
    const { amount, currency, description, returnUrl, cancelUrl, userId, credits } = req.body;
    const parsedAmount = parseFloat(amount);
    const finalAmount = (isNaN(parsedAmount) || parsedAmount <= 0) ? 1.00 : parsedAmount;
    const usdAmount = finalAmount.toFixed(2);

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        description: description || 'GoldBean API Service',
        amount: { currency_code: currency || PAYPAL_CONFIG.CURRENCY, value: usdAmount.toString() }
      }],
      application_context: {
        return_url: returnUrl || 'https://goldbean-api.xyz/buy-credits.html',
        cancel_url: cancelUrl || 'https://goldbean-api.xyz/buy-credits.html?status=cancelled',
        shipping_preference: 'NO_SHIPPING'
      }
    };

    const accessToken = await getPayPalAccessToken();
    const orderResponse = await axios.post(
      `${PAYPAL_CONFIG.BASE_URL}/v2/checkout/orders`, orderData,
      { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': `GB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` } }
    );

    const approvalLink = orderResponse.data.links.find(link => link.rel === 'approve');

    savePendingOrder(orderResponse.data.id, {
      userId: userId || '',
      credits: credits || Math.floor(finalAmount * 100),
      amountUsd: usdAmount,
      method: 'paypal',
      planId: req.body.planId || ''
    });

    res.json({
      success: true,
      orderId: orderResponse.data.id,
      approveUrl: approvalLink?.href || '',
      currency: currency || PAYPAL_CONFIG.CURRENCY,
      amountUsd: usdAmount
    });
  } catch (error) {
    console.error('[PayPal] Create order error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'PayPal create order failed', details: error.response?.data || error.message });
  }
}

async function capturePaypalOrder(req, res) {
  try {
    const { orderId, orderToken, userId, credits } = req.body;
    if (!orderId) return res.status(400).json({ success: false, error: 'Missing orderId' });

    const accessToken = await getPayPalAccessToken();
    const orderResponse = await axios.post(
      `${PAYPAL_CONFIG.BASE_URL}/v2/checkout/orders/${orderId}/capture`, {},
      { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    const capture = orderResponse.data.purchase_units[0].payments.captures[0];
    if (capture.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, error: `Payment status: ${capture.status}` });
    }

    const capturedAmount = parseFloat(capture.amount?.value || '0');
    const paymentId = capture.id;

    const pending = getPendingOrder(orderId) || {};
    const finalUserId = userId || pending.userId || '';
    const finalCredits = credits || pending.credits || Math.floor(capturedAmount * 100);

    const paymentRecord = {
      id: paymentId, method: 'paypal', amountUsd: capturedAmount,
      amountCny: parseFloat((capturedAmount * USD_TO_CNY).toFixed(2)),
      orderId: orderId, status: 'completed',
      payerEmail: orderResponse.data.payer?.email_address || 'unknown',
      userId: finalUserId, credits: finalCredits,
      createdAt: new Date().toISOString()
    };

    const recordsPath = path.join(__dirname, 'paypal_payments.json');
    let allRecords = [];
    try { allRecords = JSON.parse(fs.readFileSync(recordsPath, 'utf8')); } catch(e) { allRecords = []; }
    allRecords.push(paymentRecord);
    fs.writeFileSync(recordsPath, JSON.stringify(allRecords, null, 2));

    let creditsAdded = false;
    let membershipActivated = false;
    if (finalUserId) {
      const pending = getPendingOrder(orderId) || {};
      const reqPlanId = req.body.planId || '';
      const planId = reqPlanId || pending.planId || '';
      if (planId && planId.startsWith('plan_')) {
        membershipActivated = activateMembership(finalUserId, planId, 'paypal', orderId);
      } else {
        creditsAdded = addCreditsToUser(finalUserId, finalCredits, 'paypal', orderId);
      }
    }

    res.json({
      success: true,
      paymentId: capture.id,
      amountUsd: capturedAmount,
      amountCny: parseFloat((capturedAmount * USD_TO_CNY).toFixed(2)),
      status: capture.status,
      credits: finalCredits,
      creditsAdded: creditsAdded,
      membershipActivated: membershipActivated,
      userId: finalUserId
    });
  } catch (error) {
    console.error('[PayPal] Capture error:', error.response?.data || error.message);
    const ppErr = error.response?.data;
    const isBizError = ppErr && (ppErr.name || ppErr.message || ppErr.error);
    const statusCode = isBizError ? 400 : 500;
    const errMsg = isBizError ? (ppErr.message || ppErr.name || ppErr.error) : 'PayPal capture failed';
    res.status(statusCode).json({ success: false, error: errMsg, details: ppErr || error.message });
  }
}

async function handlePaypalWebhook(req, res) {
  try {
    const event = req.body;
    console.log('[PayPal Webhook] Event:', event.event_type, event.resource?.status);
    res.status(200).json({ status: 'accepted' });
  } catch (error) {
    console.error('[PayPal Webhook] Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Webhook failed' });
  }
}

function getPaypalRoutes() {
  const router = express.Router();
  router.post('/create-order', createPaypalOrder);
  router.post('/capture-order', capturePaypalOrder);
  router.post('/webhook', handlePaypalWebhook);
  return router;
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

module.exports = {
  getPaypalRoutes, createPaypalOrder, capturePaypalOrder, handlePaypalWebhook, getPayPalAccessToken,
  addCreditsToUser
};
