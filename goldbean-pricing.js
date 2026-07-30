/**
 * GoldBean 会员套餐定价系统
 * 
 * 定价策略：
 * - 基础套餐（月/季/年）— 按时间维度定价
 * - 产品套餐（按端点/功能模块）— 按使用场景定价
 * - 分销返佣 — 30%
 */

const PRICING = {
  // ==========================================
  // 1. 基础时间套餐（通用版）
  // ==========================================
  plans: {
        starter: {
      id: 'plan_starter',
      name: 'Starter Pack',
      duration: 'permanent',
      price: 5,          // USD
      priceCny: 36,
      features: [
        '100 API calls — no expiry',
        'All endpoints included',
        'Standard response speed',
        'Email support'
      ],
      usage: {
        endpoints: 'all',
        calls: 100,
        rateLimit: '50 req/min'
      }
    },
    monthly: {
      id: 'plan_monthly',
      name: '月度会员',
      duration: 'month',
      price: 29.9,        // USD
      priceCny: 217,      // USD * 7.25（固定汇率）
      features: [
        '所有端点无限制调用',
        '标准 API 响应速度',
        '邮件技术支持',
        '基础数据分析'
      ],
      usage: {
        endpoints: 'all',
        rateLimit: '100 req/min'
      }
    },
    quarterly: {
      id: 'plan_quarterly',
      name: '季度会员',
      duration: 'quarter',
      price: 69,          // USD（省 $20.7，相当于打 77 折）
      priceCny: 500,      // 整数定价
      features: [
        '所有端点无限制调用',
        '优先 API 响应速度',
        '邮件 + 在线技术支持',
        '高级数据分析',
        '自定义 API 配额'
      ],
      usage: {
        endpoints: 'all',
        rateLimit: '500 req/min'
      }
    },
    yearly: {
      id: 'plan_yearly',
      name: '年度会员',
      duration: 'year',
      price: 269,         // USD（省 $97.9，相当于打 69 折）
      priceCny: 1950,     // 整数定价
      features: [
        '所有端点无限制调用',
        '极速 API 响应速度',
        '专属技术支持经理',
        '完整数据分析报表',
        '自定义 API 配额',
        '优先接入新功能',
        'API 使用量保底 10 万次/月'
      ],
      usage: {
        endpoints: 'all',
        rateLimit: '1000 req/min'
      }
    }
  },

  // ==========================================
  // 2. 产品端点二次定价（按功能模块）
  // ==========================================
  endpointTiers: {
    // Tier F: 免费端点 — 系统信息查询，完全免费
    free: {
      tier: 0,
      label: '免费',
      pricePerCall: 0,
      endpoints: [
        '/paid/plans',
        '/paid/endpoint-pricing',
        '/paid/my-balance',
        '/paid/affiliate-info',
        '/paid/health'
      ],
      description: '基础信息查询，完全免费'
    },

    // Tier 1: 轻量百度 API — $0.01/次
    basic: {
      tier: 1,
      label: '轻量',
      pricePerCall: 0.01,
      endpoints: [
        '/paid/baidu-ocr',             // 通用文字识别
        '/paid/baidu-idcard',          // 身份证识别
        '/paid/baidu-tts',             // 语音合成
        '/paid/baidu-translate',       // 文本翻译
        '/paid/baidu-face-detect',     // 人脸检测
        '/paid/baidu-nlp',
        '/paid/baidu-text-review',
        '/paid/baidu-image-review',
        '/paid/baidu-sentiment',
        '/paid/baidu-summary',
        '/paid/baidu-word-embedding',
        '/paid/baidu-embedding',
        '/paid/baidu-reranker',
        '/paid/baidu-text-corrector',
        '/paid/baidu-keyword-extraction'
      ],
      description: '百度轻量 AI 接口，$0.01/次'
    },

    // Tier 2: 标准百度 API — $0.02/次
    standard: {
      tier: 2,
      label: '标准',
      pricePerCall: 0.02,
      endpoints: [
        '/paid/baidu-ocr-accurate',       // 高精度文字识别
        '/paid/baidu-asr',                // 语音识别
        '/paid/baidu-image-recognition',  // 图像识别
        '/paid/baidu-image-enhance',      // 图像增强
        '/paid/baidu-body-analysis',
        '/paid/baidu-ocr-table',
        
        
        
        '/paid/baidu-face-compare',
        '/paid/baidu-gesture',
        '/paid/baidu-object-detect',
        '/paid/baidu-landmark',
        '/paid/baidu-plant',
        '/paid/baidu-animal',
        '/paid/baidu-dish',
        '/paid/baidu-ingredient',
        '/paid/baidu-logo',
        '/paid/baidu-vision-chat',
        '/paid/baidu-deepseek-ocr',
        '/paid/baidu-paddleocr-vl',
        '/paid/baidu-qianfan-ocr',
        '/paid/baidu-ocr-webimage',
        '/paid/baidu-ocr-handwriting',
        '/paid/baidu-ocr-qrcode',
        '/paid/baidu-ocr-bankcard',
        '/paid/baidu-ocr-business-license',
        '/paid/baidu-ocr-numbers',
        '/paid/baidu-ocr-seal',
        '/paid/baidu-ocr-doc-office',
        '/paid/baidu-car',
        '/paid/baidu-vehicle-detect'
      ],
      description: '百度标准 AI 接口，$0.02/次'
    }
  },

  // ═══ 单独定价的高价值接口（不在通用层级中）═══
  premiumEndpoints: {
    '/paid/baidu-llm-chat': {
      name: '百度文心大模型',
      pricePerCall: 0.002,      // $0.002/1K tokens (按token计费)
      pricePerCallNote: '约 $0.002/1K tokens，每次调用约 500-2000 tokens = $0.001-0.004',
      type: 'token_billing',
      billingUnit: 'per_1k_tokens',
      note: '按对话轮次计费，每次约消耗 500-2000 tokens'
    },
    '/paid/baidu-helixfold': {
      name: '百度 HelixFold3 蛋白质结构预测',
      pricePerCall: 0.50,       // $0.50/次，百度按任务高价计费
      type: 'compute_intensive',
      note: '单次预测消耗约 10-30 分钟算力'
    },
    '/paid/baidu-deepthink': {
      name: 'Deep Thinking (DeepSeek-R1)',
      pricePerCall: 0.005,
      type: 'token_billing',
      note: 'Deep reasoning with chain-of-thought'
    },
    '/paid/baidu-image-gen': {
      name: 'Image Generation (Qwen-Image)',
      pricePerCall: 0.05,
      type: 'image_generation',
      note: 'Text-to-image with CJK text rendering'
    },
    '/paid/baidu-image-edit': {
      name: 'Image Editing (Qwen-Image-Edit)',
      pricePerCall: 0.05,
      type: 'image_edit',
      note: 'Semantic image editing, multi-image fusion'
    },
    '/paid/baidu-video-gen': {
      name: 'Video Generation (MuseSteamer)',
      pricePerCall: 0.10,
      type: 'video_generation',
      note: 'Text+Image to Video, async task-based. Submit then query.'
    },
    '/paid/baidu-video-query': {
      name: 'Video Generation Task Query',
      pricePerCall: 0.01,
      type: 'standard',
      note: 'Query video generation task status and result'
    },
    '/paid/baidu-helixfold/query': {
      name: 'HelixFold3 任务状态查询',
      pricePerCall: 0.02,       // $0.02/次
      type: 'standard',
      note: '查询已提交任务的运行状态'
    }
  },

  // ==========================================
  // 3. 分销代理佣金
  // ==========================================
  affiliate: {
    commissionRate: 0.30,      // 30% 返佣
    minPayout: 50,             // 最低提现 $50
    payoutMethods: ['paypal', 'usdc', 'alipay'],
    tiers: {
      basic: {
        name: '普通代理',
        commission: 0.30,      // 30%
        minJoinAmount: 0
      },
      vip: {
        name: 'VIP 代理',
        commission: 0.35,      // 35%
        minJoinAmount: 500,    // 累计分销 $500 升级
      },
      partner: {
        name: '合作伙伴',
        commission: 0.40,      // 40%
        minJoinAmount: 2000    // 累计分销 $2000 升级
      }
    }
  },

  // ==========================================
  // 4. 汇率
  // ==========================================
  exchangeRate: {
    usdToCny: 7.25,
    fixed: true   // 固定汇率，不实时浮动
  }
};

// 导出所有定价
module.exports = {
  pricing: PRICING,

  // 获取套餐列表
  getPlans: function() {
    const premiumList = {};
    if (this.pricing.premiumEndpoints) {
      for (let ep in this.pricing.premiumEndpoints) {
        const p = this.pricing.premiumEndpoints[ep];
        premiumList[ep] = { name: p.name, pricePerCall: p.pricePerCall, type: p.type, note: p.note };
      }
    }
    return {
      plans: this.pricing.plans,
      premiumEndpoints: premiumList,
      exchangeRate: this.pricing.exchangeRate,
      affiliate: this.pricing.affiliate
    };
  },

  // 获取端点定价信息
  getEndpointPricing: function(endpoint) {
    // 先检查 premiumEndpoints（单独定价的高价值接口）
    if (this.pricing.premiumEndpoints && this.pricing.premiumEndpoints[endpoint]) {
      const pe = this.pricing.premiumEndpoints[endpoint];
      return {
        tier: 'premium',
        label: '高级',
        pricePerCall: pe.pricePerCall,
        pricePerCallCny: Math.round(pe.pricePerCall * this.pricing.exchangeRate.usdToCny),
        name: pe.name,
        type: pe.type,
        note: pe.note
      };
    }

    // 普通层级检查
    for (let tier in this.pricing.endpointTiers) {
      const tierData = this.pricing.endpointTiers[tier];
      if (tierData.endpoints.includes(endpoint)) {
        return {
          tier: tier,
          label: tierData.label,
          pricePerCall: tierData.pricePerCall || 0,
          pricePerCallCny: Math.round(tierData.pricePerCall * this.pricing.exchangeRate.usdToCny),
          endpoints: tierData.endpoints
        };
      }
    }
    // 未知端点 fallback
    return {
      tier: 'standard',
      label: '标准',
      pricePerCall: 0.04,
      pricePerCallCny: 0.29,
      endpoints: [endpoint],
      note: '未知端点，按标准定价'
    };
  },

  // 获取分销佣金信息
  getAffiliateInfo: function() {
    return this.pricing.affiliate;
  },

  // 计算 USD → CNY
  usdToCny: function(usd) {
    return Math.round(usd * this.pricing.exchangeRate.usdToCny);
  }
};
