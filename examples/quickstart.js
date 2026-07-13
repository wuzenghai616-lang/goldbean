/**
 * GoldBean API — Node.js Quick Start
 * ===================================
 * A complete example showing how to use GoldBean API from Node.js.
 *
 * No external dependencies needed — uses built-in fetch (Node 18+).
 *
 * Usage:
 *   node quickstart.js
 */

const API_BASE = 'https://goldbean-api.xyz';

class GoldBean {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.base = API_BASE;
  }

  _headers() {
    const h = {};
    if (this.apiKey) h['x-user-id'] = this.apiKey;
    return h;
  }

  async _get(path, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = `${this.base}${path}${qs ? '?' + qs : ''}`;
    const res = await fetch(url, { headers: this._headers() });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('json')) return res.json();
    return res.buffer ? res.buffer() : res.arrayBuffer();
  }

  async _post(path, data) {
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this._headers() },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // ── Free endpoints ──
  weather(city = 'London') { return this._get('/weather-now', { city }); }
  btcPrice() { return this._get('/btc-price'); }
  ethGas() { return this._get('/gas'); }
  health() { return this._get('/health'); }

  // ── Account ──
  register(email, name) { return this._post('/paid/user/register', { email, name }); }
  credits() { return this._get('/paid/user/credits'); }

  // ── OCR ──
  ocr(url, image) { return this._get('/paid/baidu-ocr', { url, image }); }
  ocrAccurate(url, image) { return this._get('/paid/baidu-ocr-accurate', { url, image }); }
  ocrTable(url, image) { return this._get('/paid/baidu-ocr-table', { url, image }); }
  ocrIdcard(url, image, side = 'front') { return this._get('/paid/baidu-idcard', { url, image, side }); }
  ocrHandwriting(url, image) { return this._get('/paid/baidu-ocr-handwriting', { url, image }); }

  // ── Translation ──
  translate(text, to = 'en', from = 'auto') { return this._get('/paid/baidu-translate', { text, from, to }); }

  // ── LLM ──
  chat(message, model = 'ernie-5.1') { return this._get('/paid/baidu-llm-chat', { message, model }); }
  deepthink(message, model = 'deepseek-r1-250528') { return this._get('/paid/baidu-deepthink', { message, model }); }
  visionChat(image, message = 'Describe this image', model = 'ernie-4.5-turbo-vl') {
    return this._get('/paid/baidu-vision-chat', { image, message, model });
  }

  // ── NLP ──
  sentiment(text) { return this._get('/paid/baidu-sentiment', { text }); }
  summary(text) { return this._get('/paid/baidu-summary', { text }); }
  keywords(text, num = 5) { return this._get('/paid/baidu-keyword-extraction', { text, num }); }
  textCorrect(text) { return this._get('/paid/baidu-text-corrector', { text }); }

  // ── Vision ──
  recognizePlant(url, image, baike = 'true') { return this._get('/paid/baidu-plant', { url, image, baike }); }
  recognizeAnimal(url, image, baike = 'true') { return this._get('/paid/baidu-animal', { url, image, baike }); }
  recognizeDish(url, image, baike = 'true') { return this._get('/paid/baidu-dish', { url, image, baike }); }
  faceDetect(url, image) { return this._get('/paid/baidu-face-detect', { url, image }); }
  faceCompare(url1, url2) { return this._get('/paid/baidu-face-compare', { url1, url2 }); }

  // ── Embedding & Reranker ──
  embedding(text, model = 'embedding-v1') { return this._get('/paid/baidu-embedding', { text, model }); }
  reranker(query, documents, model = 'bce-reranker-base') {
    if (Array.isArray(documents)) documents = documents.join('||');
    return this._get('/paid/baidu-reranker', { query, documents, model });
  }

  // ── Content Moderation ──
  textReview(text) { return this._get('/paid/baidu-text-review', { text }); }
  imageReview(url, image) { return this._get('/paid/baidu-image-review', { url, image }); }

  // ── Image Generation ──
  imageGen(prompt, model = 'qwen-image', n = 1) { return this._get('/paid/baidu-image-gen', { prompt, model, n }); }

  // ── OpenAI-compatible ──
  async openaiChat(messages, model = 'deepseek-chat') {
    return this._post('/v1/chat/completions', { model, messages });
  }
}

// ═══════════════════════════════════════════════════════
// Demo
// ═══════════════════════════════════════════════════════

async function main() {
  console.log('='.repeat(50));
  console.log('🫘 GoldBean API — Node.js Quick Start');
  console.log('='.repeat(50));

  // Step 1: Free endpoints
  console.log('\n1️⃣  Free endpoints:');
  const gb = new GoldBean();

  const weather = await gb.weather('Beijing');
  console.log(`   Weather: ${weather.temperature}°C, ${weather.desc}`);

  const btc = await gb.btcPrice();
  console.log(`   BTC: $${btc.price}`);

  // Step 2: Register
  console.log('\n2️⃣  Registering...');
  const reg = await gb.register('demo@example.com');
  if (reg.success) {
    console.log(`   ✅ API Key: ${reg.apiKey}`);
    console.log(`   ✅ Credits: ${reg.freeCredits}`);
    gb.apiKey = reg.apiKey;
  } else {
    console.log(`   ${JSON.stringify(reg)}`);
  }

  // Step 3: OCR
  console.log('\n3️⃣  OCR:');
  const ocr = await gb.ocr('https://goldbean-api.xyz/og-image.png');
  if (ocr.words_result) {
    const text = ocr.words_result.slice(0, 3).map(w => w.words).join(' | ');
    console.log(`   ${text}...`);
  }

  // Step 4: Translate
  console.log('\n4️⃣  Translate:');
  const trans = await gb.translate('Hello World', 'zh');
  if (trans.trans_result) {
    console.log(`   Hello World → ${trans.trans_result[0].dst}`);
  }

  // Step 5: OpenAI-compatible
  console.log('\n5️⃣  OpenAI-compatible chat:');
  const chat = await gb.openaiChat([{ role: 'user', content: 'Say hello in Chinese' }]);
  if (chat.choices) {
    console.log(`   ${chat.choices[0].message.content}`);
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
