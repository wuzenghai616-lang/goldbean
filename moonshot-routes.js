/**
 * moonshot-routes.js
 * GoldBean Kimi (Moonshot AI) API Routes
 * Models: kimi-k2.6, kimi-k2.7-code
 * Protocol: OpenAI-compatible
 * Auth: Bearer Token
 */

const axios = require("axios");

const MOONSHOT_CONFIG = {
  baseURL: process.env.MOONSHOT_BASE_URL || "https://api.moonshot.cn/v1",
  apiKey: process.env.MOONSHOT_API_KEY,
  timeout: 120000
};

const MODEL_MAP = {
  "kimi": "kimi-k2.6",
  "kimi-pro": "kimi-k2.6",
  "kimi-code": "kimi-k2.7-code",
  "kimi-k2.6": "kimi-k2.6",
  "kimi-k2.7-code": "kimi-k2.7-code"
};

const moonshotClient = axios.create({
  baseURL: MOONSHOT_CONFIG.baseURL,
  headers: {
    "Authorization": "Bearer " + MOONSHOT_CONFIG.apiKey,
    "Content-Type": "application/json"
  },
  timeout: MOONSHOT_CONFIG.timeout
});

function handleMoonshotError(error, res) {
  var code = error.response ? error.response.status : 0;
  var data = error.response ? error.response.data : null;
  var errorMap = {
    401: { code: "moonshot_auth_failed", message: "Moonshot API key invalid or expired" },
    429: { code: "moonshot_rate_limit", message: "Moonshot rate limit exceeded. Retry after 60s" },
    400: { code: "moonshot_bad_request", message: (data && data.error && data.error.message) || "Invalid request parameters" },
    404: { code: "moonshot_model_not_found", message: "Model not found or not available" },
    500: { code: "moonshot_internal_error", message: "Moonshot service internal error" },
    503: { code: "moonshot_service_unavailable", message: "Moonshot service temporarily unavailable" }
  };
  var mapped = errorMap[code] || { code: "moonshot_unknown_error", message: "Moonshot error: " + error.message };
  res.status(code || 500).json({
    error: mapped.code,
    message: mapped.message,
    provider: "moonshot",
    retryable: code === 429 || code >= 500,
    timestamp: new Date().toISOString()
  });
}

async function moonshotChat(req, res, modelName) {
  try {
    var body = req.body || {};
    var messages = body.messages;
    var temperature = body.temperature != null ? body.temperature : 1;
    var max_tokens = body.max_tokens || 4096;
    var stream = body.stream || false;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "bad_request", message: "messages array is required" });
    }
    var targetModel = MODEL_MAP[modelName] || modelName;
    var payload = {
      model: targetModel,
      messages: messages,
      temperature: 1,
      max_tokens: max_tokens,
      stream: stream
    };
    var response = await moonshotClient.post("/chat/completions", payload);
    var choice = response.data.choices[0];
    var result = {
      provider: "moonshot",
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
    handleMoonshotError(error, res);
  }
}

async function moonshotVision(req, res) {
  try {
    var body = req.body || {};
    var image = body.image;
    var prompt = body.prompt || "Describe this image in detail";
    var model = body.model || "kimi";
    if (!image) {
      return res.status(400).json({ error: "bad_request", message: "image URL or base64 is required" });
    }
    var targetModel = MODEL_MAP[model] || MODEL_MAP["kimi"];
    var messages = [{
      role: "user",
      content: [
        { type: "image_url", image_url: { url: image } },
        { type: "text", text: prompt }
      ]
    }];
    var response = await moonshotClient.post("/chat/completions", {
      model: targetModel,
      messages: messages,
      max_tokens: 4096
    });
    var choice = response.data.choices[0];
    var result = {
      provider: "moonshot",
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
    handleMoonshotError(error, res);
  }
}

async function moonshotModels(req, res) {
  res.json({
    provider: "moonshot",
    models: [
      {
        id: "kimi",
        name: "Kimi K2.6",
        description: "Flagship model, 262K context, supports image/video input and reasoning",
        pricing: { input: 12, output: 60, unit: "CNY/MTok" }
      },
      {
        id: "kimi-code",
        name: "Kimi K2.7 Code",
        description: "Code-optimized model, 262K context, strong at coding tasks",
        pricing: { input: 12, output: 60, unit: "CNY/MTok" }
      }
    ]
  });
}

async function moonshotHealth(req, res) {
  try {
    var response = await moonshotClient.post("/chat/completions", {
      model: MODEL_MAP["kimi"],
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 5
    });
    res.json({
      provider: "moonshot",
      status: "healthy",
      model_tested: MODEL_MAP["kimi"],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      provider: "moonshot",
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
    app.post("/ai/kimi/chat", goldbeanAuth, function(req, res) { moonshotChat(req, res, "kimi"); });
    app.post("/ai/kimi/code", goldbeanAuth, function(req, res) { moonshotChat(req, res, "kimi-code"); });
    app.post("/ai/kimi/vision", goldbeanAuth, moonshotVision);
    app.get("/ai/kimi/models", moonshotModels);
    app.get("/ai/kimi/health", moonshotHealth);
    console.log("[Moonshot Kimi] Routes registered: /ai/kimi/*");
  },
  moonshotChat: moonshotChat,
  moonshotVision: moonshotVision,
  moonshotModels: moonshotModels,
  moonshotHealth: moonshotHealth,
  handleMoonshotError: handleMoonshotError
};
