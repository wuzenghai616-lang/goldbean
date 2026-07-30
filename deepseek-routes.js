/**
 * deepseek-routes.js
 * GoldBean DeepSeek API Routes
 * Models: deepseek-v4-flash, deepseek-v4-pro
 * Protocol: OpenAI-compatible
 * Auth: Bearer Token
 */

const axios = require("axios");

const DS_CONFIG = {
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
  apiKey: process.env.DEEPSEEK_API_KEY,
  timeout: 120000
};

const MODEL_MAP = {
  "deepseek": "deepseek-v4-pro",
  "deepseek-pro": "deepseek-v4-pro",
  "deepseek-flash": "deepseek-v4-flash",
  "deepseek-v4-pro": "deepseek-v4-pro",
  "deepseek-v4-flash": "deepseek-v4-flash"
};

const dsClient = axios.create({
  baseURL: DS_CONFIG.baseURL,
  headers: {
    "Authorization": "Bearer " + DS_CONFIG.apiKey,
    "Content-Type": "application/json"
  },
  timeout: DS_CONFIG.timeout
});

function handleDSError(error, res) {
  var code = error.response ? error.response.status : 0;
  var data = error.response ? error.response.data : null;
  var errorMap = {
    401: { code: "deepseek_auth_failed", message: "DeepSeek API key invalid or expired" },
    429: { code: "deepseek_rate_limit", message: "DeepSeek rate limit exceeded. Retry after 60s" },
    400: { code: "deepseek_bad_request", message: (data && data.error && data.error.message) || "Invalid request parameters" },
    404: { code: "deepseek_model_not_found", message: "Model not found or not available" },
    500: { code: "deepseek_internal_error", message: "DeepSeek service internal error" },
    503: { code: "deepseek_service_unavailable", message: "DeepSeek service temporarily unavailable" }
  };
  var mapped = errorMap[code] || { code: "deepseek_unknown_error", message: "DeepSeek error: " + error.message };
  res.status(code || 500).json({
    error: mapped.code,
    message: mapped.message,
    provider: "deepseek",
    retryable: code === 429 || code >= 500,
    timestamp: new Date().toISOString()
  });
}

async function dsChat(req, res, modelName) {
  try {
    var body = req.body || {};
    var messages = body.messages;
    var temperature = body.temperature != null ? body.temperature : 0.7;
    var max_tokens = body.max_tokens || 4096;
    var stream = body.stream || false;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "bad_request", message: "messages array is required" });
    }
    var targetModel = MODEL_MAP[modelName] || modelName;
    var payload = {
      model: targetModel,
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
      stream: stream
    };
    var response = await dsClient.post("/chat/completions", payload);
    var choice = response.data.choices[0];
    var result = {
      provider: "deepseek",
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
    handleDSError(error, res);
  }
}

async function dsVision(req, res) {
  try {
    var body = req.body || {};
    var image = body.image;
    var prompt = body.prompt || "Describe this image in detail";
    var model = body.model || "deepseek";
    if (!image) {
      return res.status(400).json({ error: "bad_request", message: "image URL or base64 is required" });
    }
    var targetModel = MODEL_MAP[model] || MODEL_MAP["deepseek"];
    var messages = [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: image } },
        { type: "text", text: prompt }
      ]
    }];
    var response = await dsClient.post("/chat/completions", {
      model: targetModel,
      messages: messages,
      max_tokens: 4096
    });
    var choice = response.data.choices[0];
    var result = {
      provider: "deepseek",
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
    handleDSError(error, res);
  }
}

async function dsModels(req, res) {
  res.json({
    provider: "deepseek",
    models: [
      {
        id: "deepseek",
        name: "DeepSeek V4 Pro",
        description: "Flagship model, strong reasoning and coding capabilities",
        pricing: { input: 2, output: 8, unit: "CNY/MTok" }
      },
      {
        id: "deepseek-flash",
        name: "DeepSeek V4 Flash",
        description: "Lightweight model, faster and cheaper for simple tasks",
        pricing: { input: 1, output: 2, unit: "CNY/MTok" }
      }
    ]
  });
}

async function dsHealth(req, res) {
  try {
    var response = await dsClient.post("/chat/completions", {
      model: MODEL_MAP["deepseek"],
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 5
    });
    res.json({
      provider: "deepseek",
      status: "healthy",
      model_tested: MODEL_MAP["deepseek"],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      provider: "deepseek",
      status: "unhealthy",
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
    app.post("/ai/ds/chat", goldbeanAuth, function(req, res) { dsChat(req, res, "deepseek"); });
    app.post("/ai/ds/flash", goldbeanAuth, function(req, res) { dsChat(req, res, "deepseek-flash"); });
    app.post("/ai/ds/vision", goldbeanAuth, dsVision);
    app.get("/ai/ds/models", dsModels);
    app.get("/ai/ds/health", dsHealth);
    console.log("[DeepSeek] Routes registered: /ai/ds/*");
  },
  dsChat: dsChat,
  dsVision: dsVision,
  dsModels: dsModels,
  dsHealth: dsHealth,
  handleDSError: handleDSError
};
