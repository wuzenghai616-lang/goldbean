/**
 * bytedance-routes.js
 * GoldBean ByteDance Volcengine Ark (Doubao) API Routes
 * Models: doubao-seed-2-0-pro / mini / lite
 * Protocol: OpenAI-compatible
 * Auth: Bearer Token (ark-xxxxx)
 */

const axios = require('axios');

const ARK_CONFIG = {
  baseURL: process.env.BYTEDANCE_ARK_BASE || 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: process.env.BYTEDANCE_ARK_KEY,
  timeout: 120000
};

const MODEL_MAP = {
  'doubao-pro': 'doubao-seed-2-0-pro-260215',
  'doubao-mini': 'doubao-seed-2-0-mini-260428',
  'doubao-lite': 'doubao-seed-2-0-lite-260428',
  'doubao-seed-2-0-pro': 'doubao-seed-2-0-pro-260215',
  'doubao-seed-2-0-mini': 'doubao-seed-2-0-mini-260428',
  'doubao-seed-2-0-lite': 'doubao-seed-2-0-lite-260428'
};

const arkClient = axios.create({
  baseURL: ARK_CONFIG.baseURL,
  headers: {
    'Authorization': 'Bearer ' + ARK_CONFIG.apiKey,
    'Content-Type': 'application/json'
  },
  timeout: ARK_CONFIG.timeout
});

function handleArkError(error, res) {
  const code = error.response ? error.response.status : 0;
  const data = error.response ? error.response.data : null;

  var errorMap = {
    401: { code: 'ark_auth_failed', message: 'ByteDance Ark API key invalid or expired' },
    429: { code: 'ark_rate_limit', message: 'Ark rate limit exceeded. Retry after 60s' },
    400: { code: 'ark_bad_request', message: (data && data.error && data.error.message) || 'Invalid request parameters' },
    404: { code: 'ark_model_not_found', message: (data && data.error && data.error.message) || 'Model not found or not activated' },
    500: { code: 'ark_internal_error', message: 'Ark service internal error' },
    503: { code: 'ark_service_unavailable', message: 'Ark service temporarily unavailable' }
  };

  var mapped = errorMap[code] || { code: 'ark_unknown_error', message: 'Ark error: ' + error.message };

  res.status(code || 500).json({
    error: mapped.code,
    message: mapped.message,
    provider: 'bytedance',
    retryable: code === 429 || code >= 500,
    timestamp: new Date().toISOString()
  });
}

async function arkChat(req, res, modelName) {
  try {
    var body = req.body || {};
    var messages = body.messages;
    var temperature = body.temperature != null ? body.temperature : 0.7;
    var max_tokens = body.max_tokens || 4096;
    var stream = body.stream || false;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'bad_request', message: 'messages array is required' });
    }

    var targetModel = MODEL_MAP[modelName] || modelName;

    var payload = {
      model: targetModel,
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
      stream: stream
    };

    var response = await arkClient.post('/chat/completions', payload);

    var choice = response.data.choices[0];
    var result = {
      provider: 'bytedance',
      model: targetModel,
      content: choice.message.content,
      role: choice.message.role,
      finish_reason: choice.finish_reason,
      usage: response.data.usage,
      id: response.data.id,
      created: response.data.created
    };

    if (choice.message.reasoning_content) {
      result.reasoning_content = choice.message.reasoning_content;
    }

    res.json(result);
  } catch (error) {
    handleArkError(error, res);
  }
}

async function arkVision(req, res) {
  try {
    var body = req.body || {};
    var image = body.image;
    var prompt = body.prompt || 'Describe this image in detail';
    var model = body.model || 'doubao-pro';

    if (!image) {
      return res.status(400).json({ error: 'bad_request', message: 'image URL or base64 is required' });
    }

    var targetModel = MODEL_MAP[model] || MODEL_MAP['doubao-pro'];

    var messages = [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: image } },
        { type: 'text', text: prompt }
      ]
    }];

    var response = await arkClient.post('/chat/completions', {
      model: targetModel,
      messages: messages,
      max_tokens: 4096
    });

    var choice = response.data.choices[0];
    var result = {
      provider: 'bytedance',
      model: targetModel,
      content: choice.message.content,
      usage: response.data.usage,
      id: response.data.id
    };

    if (choice.message.reasoning_content) {
      result.reasoning_content = choice.message.reasoning_content;
    }

    res.json(result);
  } catch (error) {
    handleArkError(error, res);
  }
}

async function arkModels(req, res) {
  res.json({
    provider: 'bytedance',
    models: [
      { id: 'doubao-pro', name: 'Doubao Seed 2.0 Pro', description: 'Flagship multimodal LLM, 262K context, text+image+video input', pricing: { input: 4, output: 12, unit: 'CNY/MTok' } },
      { id: 'doubao-mini', name: 'Doubao Seed 2.0 Mini', description: 'Fast multimodal model, 262K context, text+image+video+audio input', pricing: { input: 0.5, output: 1.5, unit: 'CNY/MTok' } },
      { id: 'doubao-lite', name: 'Doubao Seed 2.0 Lite', description: 'Lightweight multimodal, 262K context, text+image+video+audio input', pricing: { input: 0.3, output: 0.9, unit: 'CNY/MTok' } }
    ]
  });
}

async function arkHealth(req, res) {
  try {
    var response = await arkClient.post('/chat/completions', {
      model: MODEL_MAP['doubao-mini'],
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5
    });

    res.json({
      provider: 'bytedance',
      status: 'healthy',
      model_tested: MODEL_MAP['doubao-mini'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      provider: 'bytedance',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  registerRoutes: function(app, goldbeanAuth) {
    if (!goldbeanAuth) {
      goldbeanAuth = function(req, res, next) { next(); };
    }

    app.post('/ai/doubao/chat', goldbeanAuth, function(req, res) { arkChat(req, res, 'doubao-pro'); });
    app.post('/ai/doubao/mini', goldbeanAuth, function(req, res) { arkChat(req, res, 'doubao-mini'); });
    app.post('/ai/doubao/lite', goldbeanAuth, function(req, res) { arkChat(req, res, 'doubao-lite'); });
    app.post('/ai/doubao/vision', goldbeanAuth, arkVision);
    app.get('/ai/doubao/models', arkModels);
    app.get('/ai/doubao/health', arkHealth);

    console.log('[ByteDance Ark] Routes registered: /ai/doubao/*');
  },

  arkChat: arkChat,
  arkVision: arkVision,
  arkModels: arkModels,
  arkHealth: arkHealth,
  handleArkError: handleArkError
};
