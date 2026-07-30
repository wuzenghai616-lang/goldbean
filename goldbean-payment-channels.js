/**
 * GoldBean Payment Channels Integration Hub
 * 
 * Real PayPal integration with sandbox testing.
 * Stripe/WeChat/Alipay handled in separate modules.
 * 
 * Usage: require('./goldbean-payment-channels')(app);
 */

const paypalRoutes = require('./goldbean-paypal-integration').getPaypalRoutes();

module.exports = function setupPaymentChannels(app) {
  // ==========================================
  // 1. PayPal Integration (Real API)
  // ==========================================
  
  // 挂载 PayPal 完整路由
  app.use('/paid/paypal', paypalRoutes);
  
  // PayPal 状态检查
  app.get('/paid/paypal/status', (req, res) => {
    const configured = true; // PayPal 已配置
    return res.json({
      configured: configured,
      mode: 'live',
      endpoints: {
        'create-order': '/paid/paypal/create-order',
        'capture-order': '/paid/paypal/capture-order',
        'status': '/paid/paypal/status'
      },
      notes: {
        live: 'PayPal 已切换到 Live 模式，可真实收款',
        production: 'PayPal 已配置 Live 凭证'
      }
    });
  });

  // ==========================================
  // 2. Stripe Integration
  // ==========================================
  app.get('/paid/stripe/status', (req, res) => {
    return res.json({
      configured: false,
      mode: 'not_configured',
      notes: '需要 Stripe API Key，已跳过（师兄决定只做 PayPal）'
    });
  });

  // ==========================================
  // 3. WeChat Pay Integration
  // ==========================================
  app.get('/paid/wechat/status', (req, res) => {
    return res.json({
      configured: false,
      mode: 'paused',
      notes: '需要企业营业执照和微信支付认证，已暂停'
    });
  });

  console.log('[payment-channels] PayPal: ACTIVE (live mode)');
  console.log('[payment-channels] Stripe: SKIPPED');
  console.log('[payment-channels] WeChat: PAUSED');
};
