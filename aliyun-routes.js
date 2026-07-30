/**
 * aliyun-routes.js
 * GoldBean 阿里云百炼（Model Studio）API 路由模块
 * 覆盖：Qwen3.7-Max/Turbo/Plus/VL/Coder/Math
 * 协议：OpenAI 兼容
 * 认证：Bearer Token (sk-xxxxx)
 */

const axios = require('axios');

// 阿里云百炼配置
const ALIYUN_CONFIG = {
  baseURL: process.env.ALIYUN_DASHSCOPE_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.ALIYUN_DASHSCOPE_KEY,
  timeout: 60000
};

// 模型映射表（阿里云百炼实际模型 ID）
const MODEL_MAP = {
  'qwen-max': 'qwen-max',
  'qwen-plus': 'qwen-plus',
  'qwen-turbo': 'qwen-turbo',
  'qwen-vl-plus': 'qwen-vl-plus',
  'qwen-coder-plus': 'qwen-coder-plus',
  'qwen-math-plus': 'qwen-math-plus'
};

// 统一请求客户端
const aliyunClient = axios.create({
  baseURL: ALIYUN_CONFIG.baseURL,
  headers: {
    'Authorization': `Bearer ${ALIYUN_CONFIG.apiKey}`,
    'Content-Type': 'application/json'
  },
  timeout: ALIYUN_CONFIG.timeout
});

// 错误处理中间件
function handleAliyunError(error, res) {
  const code = error.response?.status;
  const data = error.response?.data;
  
  const errorMap = {
    401: { code: 'aliyun_auth_failed', message: 'Aliyun API key invalid or expired' },
    429: { code: 'aliyun_rate_limit', message: 'Aliyun rate limit exceeded. Retry after 60s' },
    400: { code: 'aliyun_bad_request', message: data?.error?.message || 'Invalid request parameters' },
    500: { code: 'aliyun_internal_error', message: 'Aliyun service internal error' },
    503: { code: 'aliyun_service_unavailable', message: 'Aliyun service temporarily unavailable' }
  };
  
  const mapped = errorMap[code] || {
    code: 'aliyun_unknown_error',
    message: `Aliyun error: ${error.message}`
  };
  
  res.status(code || 500).json({
    error: mapped.code,
    message: mapped.message,
    provider: 'aliyun',
    retryable: code === 429 || code >= 500,
    timestamp: new Date().toISOString()
  });
}

// 通用 LLM 聊天接口
async function aliyunChat(req, res, modelName) {
  try {
    const { messages, temperature = 0.7, max_tokens = 2048, stream = false } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'messages array is required'
      });
    }
    
    const targetModel = MODEL_MAP[modelName] || modelName;
    
    const response = await aliyunClient.post('/chat/completions', {
      model: targetModel,
      messages,
      temperature,
      max_tokens,
      stream
    });
    
    res.json({
      provider: 'aliyun',
      model: targetModel,
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      finish_reason: response.data.choices[0].finish_reason,
      id: response.data.id,
      created: response.data.created
    });
  } catch (error) {
    handleAliyunError(error, res);
  }
}

// 视觉理解接口（Qwen-VL）
async function aliyunVL(req, res) {
  try {
    const { image, prompt = 'Describe this image', model = 'qwen-vl-max' } = req.body;
    
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
    
    const response = await aliyunClient.post('/chat/completions', {
      model: targetModel,
      messages,
      max_tokens: 2048
    });
    
    res.json({
      provider: 'aliyun',
      model: targetModel,
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      id: response.data.id
    });
  } catch (error) {
    handleAliyunError(error, res);
  }
}

// 代码生成接口（Qwen-Coder）
async function aliyunCode(req, res) {
  try {
    const { prompt, language = 'javascript', model = 'qwen-coder-plus' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'prompt is required'
      });
    }
    
    const messages = [{
      role: 'user',
      content: `Generate ${language} code for: ${prompt}\n\nOnly return the code, no explanation.`
    }];
    
    const response = await aliyunClient.post('/chat/completions', {
      model: MODEL_MAP[model],
      messages,
      temperature: 0.2,
      max_tokens: 4096
    });
    
    res.json({
      provider: 'aliyun',
      model: model,
      code: response.data.choices[0].message.content,
      language,
      usage: response.data.usage
    });
  } catch (error) {
    handleAliyunError(error, res);
  }
}

// 数学推理接口（Qwen-Math）
async function aliyunMath(req, res) {
  try {
    const { problem, model = 'qwen-math-plus' } = req.body;
    
    if (!problem) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'problem is required'
      });
    }
    
    const messages = [{
      role: 'user',
      content: `Solve this math problem step by step:\n\n${problem}\n\nShow your reasoning.`
    }];
    
    const response = await aliyunClient.post('/chat/completions', {
      model: MODEL_MAP[model],
      messages,
      temperature: 0.1,
      max_tokens: 4096
    });
    
    res.json({
      provider: 'aliyun',
      model: model,
      solution: response.data.choices[0].message.content,
      usage: response.data.usage
    });
  } catch (error) {
    handleAliyunError(error, res);
  }
}

// 模型列表接口
async function aliyunModels(req, res) {
  try {
    // 阿里云没有直接的模型列表 API，返回预定义列表
    res.json({
      provider: 'aliyun',
      models: [
        { id: 'qwen-max', name: 'Qwen-Max', description: 'Flagship model, best quality', pricing: { input: 20, output: 60, unit: 'CNY/MTok' } },
        { id: 'qwen-turbo', name: 'Qwen-Turbo', description: 'Fast and cost-effective', pricing: { input: 2, output: 6, unit: 'CNY/MTok' } },
        { id: 'qwen-plus', name: 'Qwen-Plus', description: 'Balanced quality and speed', pricing: { input: 5, output: 15, unit: 'CNY/MTok' } },
        { id: 'qwen-vl-plus', name: 'Qwen-VL-Plus', description: 'Vision understanding', pricing: { input: 20, output: 60, unit: 'CNY/MTok' } },
        { id: 'qwen-coder-plus', name: 'Qwen-Coder-Plus', description: 'Code generation', pricing: { input: 2, output: 6, unit: 'CNY/MTok' } },
        { id: 'qwen-math-plus', name: 'Qwen-Math-Plus', description: 'Math reasoning', pricing: { input: 5, output: 15, unit: 'CNY/MTok' } }
      ]
    });
  } catch (error) {
    handleAliyunError(error, res);
  }
}

// 健康检查
async function aliyunHealth(req, res) {
  try {
    // 通过调用一个轻量级接口验证连通性
    const response = await aliyunClient.post('/chat/completions', {
      model: 'qwen-turbo',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 1
    });
    
    res.json({
      provider: 'aliyun',
      status: 'healthy',
      latency: response.headers['x-request-time'] || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      provider: 'aliyun',
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
      console.warn('[Aliyun] Warning: goldbeanAuth not provided, routes will be unprotected');
      goldbeanAuth = (req, res, next) => next();
    }
    // LLM 聊天
    app.post('/ai/qwen/chat', goldbeanAuth, (req, res) => aliyunChat(req, res, 'qwen-max'));
    app.post('/ai/qwen/turbo', goldbeanAuth, (req, res) => aliyunChat(req, res, 'qwen-turbo'));
    app.post('/ai/qwen/plus', goldbeanAuth, (req, res) => aliyunChat(req, res, 'qwen-plus'));
    
    // 视觉
    app.post('/ai/qwen/vl', goldbeanAuth, aliyunVL);
    
    // 代码
    app.post('/ai/qwen/code', goldbeanAuth, aliyunCode);
    
    // 数学
    app.post('/ai/qwen/math', goldbeanAuth, aliyunMath);
    
    // 模型列表
    app.get('/ai/qwen/models', aliyunModels);
    
    // 健康检查
    app.get('/ai/qwen/health', aliyunHealth);
    
    console.log('[Aliyun] Routes registered: /ai/qwen/*');
  },
  
  // 导出核心函数供其他模块使用
  aliyunChat,
  aliyunVL,
  aliyunCode,
  aliyunMath,
  aliyunModels,
  aliyunHealth,
  handleAliyunError
};
