// ═══════════════════════════════════════════════════════
// GoldBean MCP Server — Full Edition (50+ tools)
// Exposes all Baidu AI endpoints via MCP protocol
// ═══════════════════════════════════════════════════════
const http = require('http');
const crypto = require('crypto');

const API_BASE = 'http://127.0.0.1:9879';
const PUBLIC_URL = 'https://goldbean-api.xyz';

// ═══════════════════════════════════════════════════════
// Tool Definitions
// ═══════════════════════════════════════════════════════

const TOOLS = [
  // --- Free Tools ---
  { name: 'btc_price', description: 'Get current Bitcoin price in USD', inputSchema: { type: 'object', properties: {} } },
  { name: 'eth_gas', description: 'Get current Ethereum gas price in Gwei', inputSchema: { type: 'object', properties: {} } },
  { name: 'weather', description: 'Get current weather for any city worldwide', inputSchema: { type: 'object', properties: { city: { type: 'string', description: 'City name (e.g. London, Beijing, Tokyo)' } }, required: ['city'] } },
  { name: 'service_health', description: 'Check GoldBean API service health and version', inputSchema: { type: 'object', properties: {} } },

  // --- OCR Tools ---
  { name: 'baidu_ocr', description: 'General text OCR — extract text from images. Supports Chinese, English, and mixed text.', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL (recommended)' }, image: { type: 'string', description: 'Base64-encoded image (use url instead if possible)' } } } },
  { name: 'baidu_ocr_accurate', description: 'High-accuracy OCR for complex or low-quality documents', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_ocr_table', description: 'Extract table structure from images — returns structured table data', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_ocr_idcard', description: 'ID card recognition (Chinese 身份证). Extracts name, ID number, address, etc.', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, side: { type: 'string', description: 'Card side: "front" or "back"' } } } },
  { name: 'baidu_ocr_handwriting', description: 'Handwritten text recognition — extract handwritten Chinese or English text', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_ocr_qrcode', description: 'QR code and barcode recognition', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_ocr_bankcard', description: 'Bank card number recognition', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_ocr_business_license', description: 'Business license (营业执照) recognition', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_ocr_webimage', description: 'OCR optimized for web images and screenshots', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_deepseek_ocr', description: 'Advanced OCR with DeepSeek-OCR model — handles complex layouts, multi-column text, and mixed content', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, prompt: { type: 'string', description: 'Custom extraction instruction' } } } },
  { name: 'baidu_paddleocr_vl', description: 'Document parsing with PaddleOCR-VL — layout analysis, reading order, and structure extraction', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, prompt: { type: 'string', description: 'Custom instruction' } } } },
  { name: 'baidu_qianfan_ocr', description: 'General-purpose OCR with Qianfan-OCR model — supports 32k context, good for long documents', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, prompt: { type: 'string', description: 'Custom instruction' } } } },

  // --- Speech Tools ---
  { name: 'baidu_tts', description: 'Text-to-Speech — convert Chinese or English text to natural-sounding audio', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text to convert to speech' }, per: { type: 'string', description: 'Voice: 0=female, 1=male, 3=emotional, 4=emotional female, 5=male(2)' } }, required: ['text'] } },
  { name: 'baidu_asr', description: 'Speech-to-Text — convert audio to text (Chinese)', inputSchema: { type: 'object', properties: { audio: { type: 'string', description: 'Base64-encoded audio data' }, format: { type: 'string', description: 'Audio format: pcm, wav, amr' }, rate: { type: 'number', description: 'Sample rate (default: 16000)' } }, required: ['audio'] } },

  // --- LLM Tools ---
  { name: 'baidu_llm_chat', description: 'Chat with ERNIE LLM (Baidu\'s GPT-class large language model). Good for Chinese language tasks.', inputSchema: { type: 'object', properties: { message: { type: 'string', description: 'Your message or prompt' }, model: { type: 'string', description: 'Model: ernie-5.1 (default), ernie-4.0-turbo' } }, required: ['message'] } },
  { name: 'baidu_deepthink', description: 'Deep reasoning with DeepSeek-R1 — chain-of-thought reasoning for complex problems. Returns both reasoning and answer.', inputSchema: { type: 'object', properties: { message: { type: 'string', description: 'Your reasoning question' }, model: { type: 'string', description: 'Model (default: deepseek-r1-250528)' } }, required: ['message'] } },
  { name: 'baidu_vision_chat', description: 'Vision LLM — describe and analyze images using ERNIE-4.5-VL or Qwen3-VL models', inputSchema: { type: 'object', properties: { image: { type: 'string', description: 'Image URL' }, message: { type: 'string', description: 'Question about the image' }, model: { type: 'string', description: 'Model (default: ernie-4.5-turbo-vl)' } }, required: ['image'] } },

  // --- Translation ---
  { name: 'baidu_translate', description: 'Multi-language translation powered by Baidu Translate. Supports 200+ languages.', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text to translate' }, from: { type: 'string', description: 'Source language (default: auto-detect)' }, to: { type: 'string', description: 'Target language (default: en). Use zh for Chinese, ja for Japanese, ko for Korean, etc.' } }, required: ['text'] } },

  // --- Vision & Recognition ---
  { name: 'baidu_image_recognition', description: 'General image recognition — identify objects, scenes, and concepts in images', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_object_detect', description: 'Object detection with bounding boxes — locate and identify multiple objects in an image', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_landmark', description: 'Landmark recognition — identify famous landmarks and buildings', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_plant', description: 'Plant species recognition — identify plants from photos', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, baike: { type: 'string', description: 'Set "true" to include Wikipedia info' } } } },
  { name: 'baidu_animal', description: 'Animal species recognition — identify animals from photos', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, baike: { type: 'string', description: 'Set "true" to include Wikipedia info' } } } },
  { name: 'baidu_dish', description: 'Dish/cuisine recognition — identify food dishes from photos', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, baike: { type: 'string', description: 'Set "true" to include info' } } } },
  { name: 'baidu_logo', description: 'Brand logo recognition — identify brand logos in images', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_car', description: 'Car model recognition — identify car make and model from photos', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, baike: { type: 'string', description: 'Set "true" for info' } } } },
  { name: 'baidu_ingredient', description: 'Fruit and vegetable recognition', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },
  { name: 'baidu_vehicle_detect', description: 'Vehicle detection — count and locate vehicles in images (good for parking lots)', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },

  // --- Face & Body ---
  { name: 'baidu_face_detect', description: 'Face detection and analysis — returns age, gender, emotion, beauty score, glasses, etc.', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, fields: { type: 'string', description: 'Fields to return (default: age,beauty,expression,gender,glasses,emotion,face_shape)' } } } },
  { name: 'baidu_face_compare', description: '1:1 face comparison — verify if two faces belong to the same person. Returns similarity score.', inputSchema: { type: 'object', properties: { url1: { type: 'string', description: 'First image URL' }, url2: { type: 'string', description: 'Second image URL' }, image1: { type: 'string', description: 'First base64 image' }, image2: { type: 'string', description: 'Second base64 image' } } } },
  { name: 'baidu_body_analysis', description: 'Body analysis — human body detection, posture recognition, people counting', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, type: { type: 'string', description: 'Analysis type (default: body_analysis)' } } } },
  { name: 'baidu_gesture', description: 'Hand gesture recognition — identify gestures like fist, open palm, peace sign, etc.', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },

  // --- Image Processing ---
  { name: 'baidu_image_enhance', description: 'Image quality enhancement — denoise, deblur, and improve image quality', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, type: { type: 'string', description: 'Enhancement type: image_quality_enhance, colorize, dehaze, contrast_enhance' } } } },

  // --- Image Generation ---
  { name: 'baidu_image_gen', description: 'AI image generation from text prompts using Qwen-Image model. Excellent at Chinese text rendering in images.', inputSchema: { type: 'object', properties: { prompt: { type: 'string', description: 'Image description' }, model: { type: 'string', description: 'Model (default: qwen-image)' }, n: { type: 'number', description: 'Number of images (default: 1)' } }, required: ['prompt'] } },
  { name: 'baidu_image_edit', description: 'AI image editing — modify existing images with text instructions using Qwen-Image-Edit', inputSchema: { type: 'object', properties: { image: { type: 'string', description: 'Original image URL' }, prompt: { type: 'string', description: 'Edit instruction' }, model: { type: 'string', description: 'Model (default: qwen-image-edit)' } }, required: ['image', 'prompt'] } },

  // --- Video Generation ---
  { name: 'baidu_video_gen', description: 'AI video generation from image + text prompt using MuseSteamer. Returns a task_id for async polling.', inputSchema: { type: 'object', properties: { prompt: { type: 'string', description: 'Video description (e.g. "slow zoom in")' }, image: { type: 'string', description: 'Reference image URL' }, model: { type: 'string', description: 'Model (default: musesteamer-air-i2v)' } }, required: ['prompt', 'image'] } },
  { name: 'baidu_video_query', description: 'Query video generation task status. Use the task_id from baidu_video_gen.', inputSchema: { type: 'object', properties: { task_id: { type: 'string', description: 'Task ID from video generation' } }, required: ['task_id'] } },

  // --- NLP ---
  { name: 'baidu_nlp', description: 'NLP lexical analysis — Chinese word segmentation and POS tagging', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text to analyze' }, type: { type: 'string', description: 'Analysis type: lexer (default), depparser, etc.' } }, required: ['text'] } },
  { name: 'baidu_sentiment', description: 'Sentiment analysis — classify text as positive, negative, or neutral', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text to analyze' } }, required: ['text'] } },
  { name: 'baidu_summary', description: 'Automatic text summarization — condense long articles into short summaries', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Long text to summarize' } }, required: ['text'] } },
  { name: 'baidu_text_corrector', description: 'Text error correction — detect and fix Chinese text errors', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text with potential errors' } }, required: ['text'] } },
  { name: 'baidu_keyword_extraction', description: 'Keyword extraction — extract the most important keywords from an article', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Article text' }, num: { type: 'number', description: 'Number of keywords (default: 5)' } }, required: ['text'] } },
  { name: 'baidu_word_embedding', description: 'Word vector embedding — convert text to vector representations for ML tasks', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Word or text to embed' } }, required: ['text'] } },

  // --- Embedding & Reranker ---
  { name: 'baidu_embedding', description: 'Text embedding — convert text to dense vectors for semantic search, clustering, and RAG. Supports embedding-v1, BGE, Qwen3 models.', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text(s) to embed. Use || to separate multiple texts.' }, model: { type: 'string', description: 'Model (default: embedding-v1)' } }, required: ['text'] } },
  { name: 'baidu_reranker', description: 'Document reranking — rerank documents by relevance to a query. Useful for RAG pipelines.', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Search query' }, documents: { type: 'string', description: 'Documents separated by ||' }, model: { type: 'string', description: 'Model (default: bce-reranker-base)' } }, required: ['query', 'documents'] } },

  // --- Content Moderation ---
  { name: 'baidu_text_review', description: 'Text content moderation — detect spam, porn, violence, and sensitive content in text', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text to review' } }, required: ['text'] } },
  { name: 'baidu_image_review', description: 'Image content moderation — detect inappropriate content in images', inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } } } },

  // --- Science ---
  { name: 'baidu_helixfold', description: 'Protein structure prediction using HelixFold3 (AlphaFold3-class). Predict 3D structure from amino acid sequence.', inputSchema: { type: 'object', properties: { seq: { type: 'string', description: 'Protein amino acid sequence' }, name: { type: 'string', description: 'Target name' } }, required: ['seq'] } },

  // --- Account ---
  { name: 'register', description: 'Register for a free API key (20 free credits). Returns your GB_ API key.', inputSchema: { type: 'object', properties: { email: { type: 'string', description: 'Your email address' }, name: { type: 'string', description: 'Optional display name' } }, required: ['email'] } },
  { name: 'check_credits', description: 'Check your remaining API credits and usage', inputSchema: { type: 'object', properties: { api_key: { type: 'string', description: 'Your GB_ API key' } }, required: ['api_key'] } },
];

// ═══════════════════════════════════════════════════════
// Tool name → API endpoint mapping
// ═══════════════════════════════════════════════════════

const TOOL_ROUTES = {
  // Free
  btc_price: { method: 'GET', path: '/btc-price' },
  eth_gas: { method: 'GET', path: '/gas' },
  weather: { method: 'GET', path: '/weather-now', params: { city: 'city' } },
  service_health: { method: 'GET', path: '/health' },

  // OCR
  baidu_ocr: { method: 'GET', path: '/paid/baidu-ocr' },
  baidu_ocr_accurate: { method: 'GET', path: '/paid/baidu-ocr-accurate' },
  baidu_ocr_table: { method: 'GET', path: '/paid/baidu-ocr-table' },
  baidu_ocr_idcard: { method: 'GET', path: '/paid/baidu-idcard' },
  baidu_ocr_handwriting: { method: 'GET', path: '/paid/baidu-ocr-handwriting' },
  baidu_ocr_qrcode: { method: 'GET', path: '/paid/baidu-ocr-qrcode' },
  baidu_ocr_bankcard: { method: 'GET', path: '/paid/baidu-ocr-bankcard' },
  baidu_ocr_business_license: { method: 'GET', path: '/paid/baidu-ocr-business-license' },
  baidu_ocr_webimage: { method: 'GET', path: '/paid/baidu-ocr-webimage' },
  baidu_deepseek_ocr: { method: 'GET', path: '/paid/baidu-deepseek-ocr' },
  baidu_paddleocr_vl: { method: 'GET', path: '/paid/baidu-paddleocr-vl' },
  baidu_qianfan_ocr: { method: 'GET', path: '/paid/baidu-qianfan-ocr' },

  // Speech
  baidu_tts: { method: 'GET', path: '/paid/baidu-tts', params: { text: 'text', per: 'per' } },
  baidu_asr: { method: 'GET', path: '/paid/baidu-asr' },

  // LLM
  baidu_llm_chat: { method: 'GET', path: '/paid/baidu-llm-chat', params: { message: 'message', model: 'model' } },
  baidu_deepthink: { method: 'GET', path: '/paid/baidu-deepthink', params: { message: 'message', model: 'model' } },
  baidu_vision_chat: { method: 'GET', path: '/paid/baidu-vision-chat', params: { image: 'image', message: 'message', model: 'model' } },

  // Translation
  baidu_translate: { method: 'GET', path: '/paid/baidu-translate', params: { text: 'text', from: 'from', to: 'to' } },

  // Vision
  baidu_image_recognition: { method: 'GET', path: '/paid/baidu-image-recognition' },
  baidu_object_detect: { method: 'GET', path: '/paid/baidu-object-detect' },
  baidu_landmark: { method: 'GET', path: '/paid/baidu-landmark' },
  baidu_plant: { method: 'GET', path: '/paid/baidu-plant' },
  baidu_animal: { method: 'GET', path: '/paid/baidu-animal' },
  baidu_dish: { method: 'GET', path: '/paid/baidu-dish' },
  baidu_logo: { method: 'GET', path: '/paid/baidu-logo' },
  baidu_car: { method: 'GET', path: '/paid/baidu-car' },
  baidu_ingredient: { method: 'GET', path: '/paid/baidu-ingredient' },
  baidu_vehicle_detect: { method: 'GET', path: '/paid/baidu-vehicle-detect' },

  // Face & Body
  baidu_face_detect: { method: 'GET', path: '/paid/baidu-face-detect' },
  baidu_face_compare: { method: 'GET', path: '/paid/baidu-face-compare' },
  baidu_body_analysis: { method: 'GET', path: '/paid/baidu-body-analysis' },
  baidu_gesture: { method: 'GET', path: '/paid/baidu-gesture' },

  // Image Processing
  baidu_image_enhance: { method: 'GET', path: '/paid/baidu-image-enhance' },

  // Image Gen
  baidu_image_gen: { method: 'GET', path: '/paid/baidu-image-gen' },
  baidu_image_edit: { method: 'GET', path: '/paid/baidu-image-edit' },

  // Video
  baidu_video_gen: { method: 'GET', path: '/paid/baidu-video-gen' },
  baidu_video_query: { method: 'GET', path: '/paid/baidu-video-query' },

  // NLP
  baidu_nlp: { method: 'GET', path: '/paid/baidu-nlp' },
  baidu_sentiment: { method: 'GET', path: '/paid/baidu-sentiment' },
  baidu_summary: { method: 'GET', path: '/paid/baidu-summary' },
  baidu_text_corrector: { method: 'GET', path: '/paid/baidu-text-corrector' },
  baidu_keyword_extraction: { method: 'GET', path: '/paid/baidu-keyword-extraction' },
  baidu_word_embedding: { method: 'GET', path: '/paid/baidu-word-embedding' },

  // Embedding & Reranker
  baidu_embedding: { method: 'GET', path: '/paid/baidu-embedding' },
  baidu_reranker: { method: 'GET', path: '/paid/baidu-reranker' },

  // Moderation
  baidu_text_review: { method: 'GET', path: '/paid/baidu-text-review' },
  baidu_image_review: { method: 'GET', path: '/paid/baidu-image-review' },

  // Science
  baidu_helixfold: { method: 'GET', path: '/paid/baidu-helixfold' },

  // Account
  register: { method: 'POST', path: '/paid/user/register' },
  check_credits: { method: 'GET', path: '/paid/user/credits' },
};

// ═══════════════════════════════════════════════════════
// HTTP helper
// ═══════════════════════════════════════════════════════

function fetchUrl(url, options = {}) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? require('https') : http;
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (url.startsWith('https') ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 120000,
    };
    const req = mod.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        const ct = res.headers['content-type'] || '';
        resolve({ status: res.statusCode, headers: res.headers, body: body.toString('utf8'), contentType: ct });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout (120s)')); });
    if (options.body) req.write(options.body);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════
// Tool execution
// ═══════════════════════════════════════════════════════

async function executeTool(toolName, args) {
  const route = TOOL_ROUTES[toolName];
  if (!route) {
    return JSON.stringify({ error: 'Unknown tool: ' + toolName, available_tools: Object.keys(TOOL_ROUTES) });
  }

  // Special handling for register
  if (toolName === 'register') {
    const body = JSON.stringify({ email: args.email, name: args.name || '' });
    const res = await fetchUrl(API_BASE + route.path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    });
    return res.body;
  }

  // Special handling for check_credits
  if (toolName === 'check_credits') {
    const res = await fetchUrl(API_BASE + route.path, {
      headers: { 'x-user-id': args.api_key },
    });
    return res.body;
  }

  // Build URL for GET requests
  let url = API_BASE + route.path;
  const apiKey = args.api_key || args.apiKey || '';

  // Map tool args to query params
  const queryParams = {};
  for (const [argName, paramName] of Object.entries(route.params || {})) {
    if (args[argName] !== undefined) {
      queryParams[paramName] = args[argName];
    }
  }
  // Also pass through any extra args that aren't api_key/apiKey
  for (const [k, v] of Object.entries(args)) {
    if (k === 'api_key' || k === 'apiKey') continue;
    if (queryParams[k] === undefined && v !== undefined) {
      queryParams[k] = v;
    }
  }

  const qs = new URLSearchParams(queryParams).toString();
  if (qs) url += '?' + qs;

  const headers = {};
  if (apiKey) headers['x-user-id'] = apiKey;

  const res = await fetchUrl(url, { method: route.method, headers });

  // For TTS (audio response), note that it returns binary
  if (res.contentType && (res.contentType.includes('audio') || res.contentType.includes('octet-stream'))) {
    return JSON.stringify({
      note: 'Audio response received. Use the REST API directly to get the audio file.',
      content_type: res.contentType,
      size_bytes: Buffer.byteLength(res.body),
      endpoint: PUBLIC_URL + route.path + (qs ? '?' + qs : ''),
      hint: 'curl "' + PUBLIC_URL + route.path + (qs ? '?' + qs : '') + '" -H "x-user-id: ' + (apiKey || 'GB_YOUR_KEY') + '" -o audio.mp3',
    });
  }

  return res.body;
}

// ═══════════════════════════════════════════════════════
// MCP Server (HTTP + SSE)
// ═══════════════════════════════════════════════════════

const sessions = new Map();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-api-key');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // SSE endpoint
  if (req.method === 'GET' && url.pathname === '/sse') {
    const sessionId = crypto.randomBytes(16).toString('hex');
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write(`event: endpoint\ndata: /mcp?sessionId=${sessionId}\n\n`);
    sessions.set(sessionId, { res, createdAt: Date.now() });
    const keepalive = setInterval(() => {
      try { res.write(`: keepalive\n\n`); } catch(e) { clearInterval(keepalive); sessions.delete(sessionId); }
    }, 30000);
    req.on('close', () => { clearInterval(keepalive); sessions.delete(sessionId); });
    return;
  }

  // MCP POST endpoint
  if (req.method === 'POST' && url.pathname === '/mcp') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const json = JSON.parse(body);
        const id = json.id || 1;
        const sessionId = url.searchParams.get('sessionId');
        let result = {};

        if (json.method === 'initialize') {
          result = {
            protocolVersion: '2024-11-05',
            capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
            serverInfo: { name: 'GoldBean MCP', version: '2.0.0' }
          };
        } else if (json.method === 'tools/list') {
          result = { tools: TOOLS };
        } else if (json.method === 'resources/list') {
          result = { resources: [
            { uri: PUBLIC_URL + '/openapi.json', name: 'OpenAPI Schema', mimeType: 'application/json' },
            { uri: PUBLIC_URL + '/api/pricing/plans', name: 'Pricing Plans', mimeType: 'application/json' },
            { uri: PUBLIC_URL + '/api/routes', name: 'API Routes', mimeType: 'application/json' },
          ]};
        } else if (json.method === 'prompts/list') {
          result = { prompts: [] };
        } else if (json.method === 'handoff') {
          result = {
            handoff: {
              summary: 'GoldBean — 50+ Baidu AI tools via MCP. OCR, TTS, LLM, Vision, NLP, Image Generation, Video Generation, Translation.',
              pitch_to_human: [
                'GoldBean provides 50+ AI tools powered by Baidu AI — accessible via MCP',
                'Free: 5 calls/day per IP, no registration needed',
                'Register for 20 free credits: POST /paid/user/register',
                'Pay per call from $0.01 — PayPal, Alipay, or USDC',
                'Install: npx goldbean-mcp or use URL: https://goldbean-api.xyz/sse',
              ],
              install_command: 'npx goldbean-mcp',
              links: {
                website: PUBLIC_URL,
                github: 'https://github.com/wuzenghai616-lang/goldbean',
                npm: 'https://www.npmjs.com/package/goldbean-mcp',
                endpoint: PUBLIC_URL + '/.well-known/mcp.json',
              },
            }
          };
        } else if (json.method === 'tools/call') {
          const toolName = json.params?.name;
          const toolArgs = json.params?.arguments || {};
          let toolResult;
          try {
            toolResult = await executeTool(toolName, toolArgs);
          } catch(e) {
            toolResult = JSON.stringify({ error: e.message, tool: toolName });
          }
          result = { content: [{ type: 'text', text: toolResult }] };
        } else {
          result = { error: 'Unknown method: ' + json.method };
        }

        if (sessionId && sessions.has(sessionId)) {
          const session = sessions.get(sessionId);
          session.res.write(`event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id, result })}\n\n`);
          res.writeHead(202);
          res.end();
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', id, result }));
        }
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON', message: e.message }));
      }
    });
    return;
  }

  // GET: info
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      server: 'GoldBean MCP',
      version: '2.0.0',
      tools: TOOLS.length,
      sse_endpoint: '/sse',
      post_endpoint: '/mcp',
      website: PUBLIC_URL,
    }));
    return;
  }

  res.writeHead(405); res.end();
});

const PORT = process.env.MCP_PORT || 3099;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[GoldBean MCP] ${TOOLS.length} tools loaded on port ${PORT}`);
  console.log(`[GoldBean MCP] SSE: http://127.0.0.1:${PORT}/sse`);
  console.log(`[GoldBean MCP] POST: http://127.0.0.1:${PORT}/mcp`);
});
