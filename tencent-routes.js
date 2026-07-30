/**
 * tencent-routes.js
 * GoldBean 腾讯云混元（TokenHub）API 路由模块
 * 覆盖：Hy3 preview, DeepSeek-V4-Pro/Flash, GLM-5, Hunyuan-Vision/Translation/Embedding
 * 协议：OpenAI 兼容
 * 认证：Bearer Token
 */

const axios = require('axios');

// 腾讯云 TokenHub 配置
const TENCENT_CONFIG = {
  baseURL: process.env.TENCENT_TOKENHUB_BASE || 'https://tokenhub.tencentmaas.com/v1',
  apiKey: process.env.TENCENT_TOKENHUB_KEY,
  timeout: 60000
};

// 模型映射表
const MODEL_MAP = {
  'hy3-preview': 'hy3-preview',
  'deepseek-v4-pro': 'deepseek-v4-pro',
  'deepseek-v4-flash': 'deepseek-v4-flash',
  'glm-5': 'glm-5',
  'hunyuan-vision': 'hunyuan-vision',
  'hunyuan-translation': 'hunyuan-translation',
  'hunyuan-embedding': 'hunyuan-embedding'
};

// 统一请求客户端
const tencentClient = axios.create({
  baseURL: TENCENT_CONFIG.baseURL,
  headers: {
    'Authorization': `Bearer ${TENCENT_CONFIG.apiKey}`,
    'Content-Type': 'application/json'
  },
  timeout: TENCENT_CONFIG.timeout
});

// 错误处理中间件
function handleTencentError(error, res) {
  const code = error.response?.status;
  const data = error.response?.data;
  
  const errorMap = {
    401: { code: 'tencent_auth_failed', message: 'Tencent API key invalid or expired' },
    429: { code: 'tencent_rate_limit', message: 'Tencent rate limit exceeded. Retry after 60s' },
    400: { code: 'tencent_bad_request', message: data?.error?.message || 'Invalid request parameters' },
    500: { code: 'tencent_internal_error', message: 'Tencent service internal error' },
    503: { code: 'tencent_service_unavailable', message: 'Tencent service temporarily unavailable' }
  };
  
  const mapped = errorMap[code] || {
    code: 'tencent_unknown_error',
    message: `Tencent error: ${error.message}`
  };
  
  res.status(code || 500).json({
    error: mapped.code,
    message: mapped.message,
    provider: 'tencent',
    retryable: code === 429 || code >= 500,
    timestamp: new Date().toISOString()
  });
}

// 通用 LLM 聊天接口
async function tencentChat(req, res, modelName) {
  try {
    const { messages, temperature = 0.7, max_tokens = 2048, stream = false } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'messages array is required'
      });
    }
    
    const targetModel = MODEL_MAP[modelName] || modelName;
    
    const response = await tencentClient.post('/chat/completions', {
      model: targetModel,
      messages,
      temperature,
      max_tokens,
      stream
    });
    
    res.json({
      provider: 'tencent',
      model: targetModel,
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      finish_reason: response.data.choices[0].finish_reason,
      id: response.data.id,
      created: response.data.created
    });
  } catch (error) {
    handleTencentError(error, re);
  }
}

// 视觉理解接口（Hunyuan-Vision）
async function tencentVision(req, res) {
  try {
    const { image, prompt = 'Describe this image', model = 'hunyuan-vision' } = req.body;
    
    if (!image) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'image URL or base64 is required'
      });
    }
    
    const targetModel = MODEL_MAP[model] || model;
    
    const messages = [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: image } },
        { type: 'text', text: prompt }
      ]
    }];
    
    const response = await tencentClient.post('/chat/completions', {
      model: targetModel,
      messages,
      max_tokens: 2048
    });
    
    res.json({
      provider: 'tencent',
      model: targetModel,
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      id: response.data.id
    });
  } catch (error) {
    handleTencentError(error, res);
  }
}

// 翻译接口（Hunyuan-Translation）
async function tencentTranslate(req, res) {
  try {
    const { text, source_lang = 'auto', target_lang = 'en', model = 'hunyuan-translation' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'text is required'
      });
    }
    
    const messages = [{
      role: 'user',
      content: `Translate from ${source_lang} to ${target_lang}:\n\n${text}\n\nOnly return the translation, no explanation.`
    }];
    
    const response = await tencentClient.post('/chat/completions', {
      model: MODEL_MAP[model],
      messages,
      temperature: 0.1,
      max_tokens: 4096
    });
    
    res.json({
      provider: 'tencent',
      model: model,
      translation: response.data.choices[0].message.content,
      source_lang,
      target_lang,
      usage: response.data.usage
    });
  } catch (error) {
    handleTencentError(error, res);
  }
}

// 文本嵌入接口（Hunyuan-Embedding）
async function tencentEmbedding(req, res) {
  try {
    const { text, model = 'hunyuan-embedding' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'text is required'
      });
    }
    
    const response = await tencentClient.post('/embeddings', {
      model: MODEL_MAP[model],
      input: text
    });
    
    res.json({
      provider: 'tencent',
      model: model,
      embedding: response.data.data[0].embedding,
      dimensions: response.data.data[0].embedding.length,
      usage: response.data.usage
    });
  } catch (error) {
    handleTencentError(error, res);
  }
}

// 模型列表接口
async function tencentModels(req, res) {
  try {
    res.json({
      provider: 'tencent',
      models: [
        { id: 'hy3-preview', name: 'Hy3 Preview', description: 'Tencent flagship, 295B MoE, 256K context', pricing: { input: '1.2-2', output: '4-8', unit: 'CNY/MTok' } },
        { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', description: 'Deep reasoning', pricing: { input: 'free', output: 'free', unit: 'CNY/MTok (within quota)' } },
        { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', description: 'Fast inference', pricing: { input: 'free', output: 'free', unit: 'CNY/MTok (within quota)' } },
        { id: 'glm-5', name: 'GLM-5', description: 'Tsinghua GLM series', pricing: { input: 'free', output: 'free', unit: 'CNY/MTok (within quota)' } },
        { id: 'hunyuan-vision', name: 'Hunyuan-Vision', description: 'Vision understanding', pricing: { input: 3, output: 9, unit: 'CNY/MTok' } },
        { id: 'hunyuan-translation', name: 'Hunyuan-Translation', description: 'Text translation', pricing: { input: 1.2, output: 3.6, unit: 'CNY/MTok' } },
        { id: 'hunyuan-embedding', name: 'Hunyuan-Embedding', description: 'Text embedding', pricing: { input: 0.7, output: 0.7, unit: 'CNY/MTok' } }
      ]
    });
  } catch (error) {
    handleTencentError(error, res);
  }
}

// 健康检查
async function tencentHealth(req, res) {
  try {
    const response = await tencentClient.post('/chat/completions', {
      model: 'hy3-preview',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 1
    });
    
    res.json({
      provider: 'tencent',
      status: 'healthy',
      latency: response.headers['x-request-time'] || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      provider: 'tencent',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  // 路由注册函数 - 接受 goldbeanAuth 作为参数
  registerRoutes: (app, goldbeanAuth) => {
    if (!goldbeanAuth) {
      console.warn('[Tencent] Warning: goldbeanAuth not provided, routes will be unprotected');
      goldbeanAuth = (req, res, next) => next();
    }
    
    // LLM 聊天
    app.post('/ai/hy3/chat', goldbeanAuth, (req, res) => tencentChat(req, res, 'hy3-preview'));
    app.post('/ai/deepseek/chat', goldbeanAuth, (req, res) => tencentChat(req, res, 'deepseek-v4-pro'));
    app.post('/ai/glm/chat', goldbeanAuth, (req, res) => tencentChat(req, res, 'glm-5'));
    
    // 视觉
    app.post('/ai/hunyuan/vision', goldbeanAuth, tencentVision);
    
    // 翻译
    app.post('/ai/hunyuan/translate', goldbeanAuth, tencentTranslate);
    
    // 嵌入
    app.post('/ai/hunyuan/embedding', goldbeanAuth, tencentEmbedding);
    
    // 模型列表
    app.get('/ai/tencent/models', tencentModels);
    
    // 健康检查
    app.get('/ai/tencent/health', tencentHealth);
    
    console.log('[Tencent] Routes registered: /ai/hy3/*, /ai/deepseek/*, /ai/glm/*, /ai/hunyuan/*');
  },
  
  // 导出核心函数
  tencentChat,
  tencentVision,
  tencentTranslate,
  tencentEmbedding,
  tencentModels,
  tencentHealth,
  handleTencentError
};
