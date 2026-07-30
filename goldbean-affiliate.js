/**
 * GoldBean 分销代理系统
 * 
 * 功能：
 * - 注册代理账户
 * - 生成分销链接
 * - 追踪佣金
 * - 佣金提现
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PRICING = require('./goldbean-pricing').pricing;
const RECORDS_PATH = path.join(__dirname, 'affiliate_records.json');

// 初始化分销记录文件
function initRecords() {
  try {
    if (!fs.existsSync(RECORDS_PATH)) {
      fs.writeFileSync(RECORDS_PATH, JSON.stringify([], null, 2));
    }
  } catch (e) {
    console.error('[Affiliate] 初始化记录文件失败:', e.message);
  }
}
initRecords();

/**
 * 读取分销记录
 */
function readRecords() {
  try {
    return JSON.parse(fs.readFileSync(RECORDS_PATH, 'utf8'));
  } catch (e) {
    return [];
  }
}

/**
 * 写入分销记录
 */
function writeRecords(records) {
  fs.writeFileSync(RECORDS_PATH, JSON.stringify(records, null, 2));
}

/**
 * 生成唯一代理 ID
 */
function generateAffiliateId() {
  return 'GB_' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

/**
 * 生成唯一分销链接
 */
function generateReferralCode() {
  return 'REF_' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * POST /paid/affiliate/register
 * 注册分销代理
 */
function registerAffiliate(req, res) {
  try {
    const { email, name, phone, website } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: '邮箱必填'
      });
    }

    // 检查是否已注册
    const records = readRecords();
    const existing = records.find(r => r.email === email);
    if (existing) {
      return res.json({
        success: false,
        error: '该邮箱已注册代理账户',
        affiliateId: existing.affiliateId,
        referralCode: existing.referralCode
      });
    }

    // 创建代理账户
    const affiliate = {
      affiliateId: generateAffiliateId(),
      referralCode: generateReferralCode(),
      email: email,
      name: name || email.split('@')[0],
      phone: phone || '',
      website: website || '',
      status: 'active',           // active, suspended, pending
      commissionRate: PRICING.affiliate.tiers.basic.commission,  // 初始 30%
      totalEarned: 0,
      totalWithdrawn: 0,
      pendingAmount: 0,
      referrals: [],              // 推荐客户列表
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    records.push(affiliate);
    writeRecords(records);

    console.log(`[Affiliate] 新注册代理: ${affiliate.affiliateId} (${email})`);

    // 生成分销链接
    const referralLink = `https://goldbean-api.xyz/ref/${affiliate.referralCode}`;

    res.json({
      success: true,
      message: '代理账户注册成功',
      affiliateId: affiliate.affiliateId,
      referralCode: affiliate.referralCode,
      referralLink: referralLink,
      commissionRate: affiliate.commissionRate,
      tiers: {
        basic: PRICING.affiliate.tiers.basic,
        vip: PRICING.affiliate.tiers.vip,
        partner: PRICING.affiliate.tiers.partner
      }
    });
  } catch (error) {
    console.error('[Affiliate] 注册失败:', error.message);
    res.status(500).json({
      success: false,
      error: '注册失败',
      details: error.message
    });
  }
}

/**
 * GET /paid/affiliate/:referralCode
 * 追踪推荐客户（分销链接入口）
 */
function trackReferral(req, res) {
  try {
    const { referralCode } = req.params;
    const records = readRecords();
    const affiliate = records.find(r => r.referralCode === referralCode);
    
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: '无效的分销链接'
      });
    }

    // 记录客户来源（通过 cookie 或 session）
    // 实际场景中需要记录客户 ID 和注册时间
    
    // 如果客户后续购买了套餐，自动计算佣金
    res.json({
      success: true,
      message: '推荐追踪成功',
      affiliateId: affiliate.affiliateId,
      name: affiliate.name,
      referralCode: affiliate.referralCode
    });
  } catch (error) {
    console.error('[Affiliate] 追踪失败:', error.message);
    res.status(500).json({
      success: false,
      error: '追踪失败'
    });
  }
}

/**
 * POST /paid/affiliate/commission
 * 佣金结算（支付完成后调用）
 */
function settleCommission(req, res) {
  try {
    const { orderId, amount, currency, referralCode, paymentMethod } = req.body;
    
    if (!referralCode) {
      // 非推荐购买，没有佣金
      return res.json({
        success: true,
        message: '无推荐关系，佣金 0',
        commission: 0
      });
    }

    const records = readRecords();
    const affiliate = records.find(r => r.referralCode === referralCode);
    
    if (!affiliate) {
      return res.json({
        success: false,
        error: '无效的分销链接'
      });
    }

    // 计算佣金
    const commissionRate = affiliate.commissionRate;
    const commission = parseFloat((amount * commissionRate).toFixed(4));

    // 更新代理账户
    affiliate.totalEarned = parseFloat((affiliate.totalEarned + commission).toFixed(4));
    affiliate.pendingAmount = parseFloat((affiliate.pendingAmount + commission).toFixed(4));
    affiliate.updatedAt = new Date().toISOString();

    // 检查是否可以升级代理等级
    const tiers = PRICING.affiliate.tiers;
    let newRate = affiliate.commissionRate;
    if (affiliate.totalEarned >= tiers.partner.minJoinAmount) {
      newRate = tiers.partner.commission;
      console.log(`[Affiliate] 🎉 ${affiliate.affiliateId} 升级为合作伙伴 (${newRate * 100}%)`);
    } else if (affiliate.totalEarned >= tiers.vip.minJoinAmount) {
      newRate = tiers.vip.commission;
      console.log(`[Affiliate] 🎉 ${affiliate.affiliateId} 升级为 VIP 代理 (${newRate * 100}%)`);
    }
    affiliate.commissionRate = newRate;

    // 写入记录
    writeRecords(records);

    // 记录佣金流水
    const commissionRecord = {
      id: 'COM_' + Date.now(),
      affiliateId: affiliate.affiliateId,
      referralCode: referralCode,
      orderId: orderId,
      amount: amount,
      currency: currency,
      commission: commission,
      commissionRate: commissionRate,
      status: 'pending',  // pending, paid
      paymentMethod: paymentMethod,
      createdAt: new Date().toISOString()
    };

    // 保存到佣金流水文件
    const ledgerPath = path.join(__dirname, 'commission_ledger.json');
    let ledger = [];
    try {
      ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    } catch (e) {
      ledger = [];
    }
    ledger.push(commissionRecord);
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));

    console.log(`[Affiliate] 佣金结算: ${affiliate.affiliateId} +$${commission.toFixed(4)} (${commissionRate * 100}%)`);

    res.json({
      success: true,
      commission: commission,
      commissionRate: commissionRate * 100,
      pendingAmount: affiliate.pendingAmount,
      totalEarned: affiliate.totalEarned
    });
  } catch (error) {
    console.error('[Affiliate] 佣金结算失败:', error.message);
    res.status(500).json({
      success: false,
      error: '佣金结算失败'
    });
  }
}

/**
 * POST /paid/affiliate/withdraw
 * 佣金提现
 */
function withdrawCommission(req, res) {
  try {
    const { affiliateId, amount, method, account } = req.body;
    
    if (!affiliateId || !amount || !method) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段'
      });
    }

    const records = readRecords();
    const affiliate = records.find(r => r.affiliateId === affiliateId);
    
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: '代理账户不存在'
      });
    }

    // 检查提现条件
    if (amount < PRICING.affiliate.minPayout) {
      return res.status(400).json({
        success: false,
        error: `最低提现金额为 $${PRICING.affiliate.minPayout}`
      });
    }

    if (amount > affiliate.pendingAmount) {
      return res.status(400).json({
        success: false,
        error: '提现金额超出可用佣金'
      });
    }

    // 执行提现
    affiliate.pendingAmount = parseFloat((affiliate.pendingAmount - amount).toFixed(4));
    affiliate.totalWithdrawn = parseFloat((affiliate.totalWithdrawn + amount).toFixed(4));
    affiliate.updatedAt = new Date().toISOString();

    writeRecords(records);

    console.log(`[Affiliate] 提现: ${affiliateId} -$${amount.toFixed(2)} via ${method}`);

    res.json({
      success: true,
      message: '提现申请已提交',
      affiliateId: affiliateId,
      amount: amount,
      method: method,
      pendingAmount: affiliate.pendingAmount,
      totalWithdrawn: affiliate.totalWithdrawn,
      note: '提现将在 1-3 个工作日内处理'
    });
  } catch (error) {
    console.error('[Affiliate] 提现失败:', error.message);
    res.status(500).json({
      success: false,
      error: '提现失败'
    });
  }
}

/**
 * GET /paid/affiliate/status/:affiliateId
 * 查询代理状态和佣金
 */
function getAffiliateStatus(req, res) {
  try {
    const { affiliateId } = req.params;
    const records = readRecords();
    const affiliate = records.find(r => r.affiliateId === affiliateId);
    
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: '代理账户不存在'
      });
    }

    // 读取佣金流水
    let commissionHistory = [];
    try {
      const ledger = JSON.parse(fs.readFileSync(path.join(__dirname, 'commission_ledger.json'), 'utf8'));
      commissionHistory = ledger.filter(r => r.affiliateId === affiliateId);
    } catch (e) {
      commissionHistory = [];
    }

    res.json({
      success: true,
      affiliateId: affiliate.affiliateId,
      name: affiliate.name,
      email: affiliate.email,
      status: affiliate.status,
      commissionRate: affiliate.commissionRate * 100,
      totalEarned: affiliate.totalEarned,
      pendingAmount: affiliate.pendingAmount,
      totalWithdrawn: affiliate.totalWithdrawn,
      referralCode: affiliate.referralCode,
      referralLink: `https://goldbean-api.xyz/ref/${affiliate.referralCode}`,
      referrals: affiliate.referrals,
      commissionHistory: commissionHistory.slice(-10),  // 最近 10 条
      tiers: {
        basic: PRICING.affiliate.tiers.basic,
        vip: PRICING.affiliate.tiers.vip,
        partner: PRICING.affiliate.tiers.partner
      }
    });
  } catch (error) {
    console.error('[Affiliate] 查询失败:', error.message);
    res.status(500).json({
      success: false,
      error: '查询失败'
    });
  }
}

// 导出路由
function getAffiliateRoutes() {
  const router = express.Router();
  
  router.post('/register', registerAffiliate);
  router.get('/:referralCode', trackReferral);
  router.post('/commission', settleCommission);
  router.post('/withdraw', withdrawCommission);
  router.get('/status/:affiliateId', getAffiliateStatus);
  
  return router;
}

module.exports = {
  getAffiliateRoutes,
  registerAffiliate,
  trackReferral,
  settleCommission,
  withdrawCommission,
  getAffiliateStatus
};
