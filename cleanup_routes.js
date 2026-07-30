const fs = require("fs");
const path = "/opt/goldbean/server.js";
let code = fs.readFileSync(path, "utf8");

// 1. Remove PAYMENT_ROUTES array and the forEach loop (103 fake endpoints)
const oldPaymentRoutes = `const PAYMENT_ROUTES = [
  "llm-chat", "llm-embed", "llm-stream", "llm-complete",
  "image-gen", "image-edit", "image-variation",
  "video-gen", "video-edit",
  "audio-transcribe", "audio-translate", "audio-tts",
  "ocr-general", "ocr-accurate", "ocr-table", "ocr-form",
  "translate-text", "translate-detect",
  "nsfw-check", "content-moderation",
  "face-detect", "face-compare", "face-search",
  "object-detect", "object-segment",
  "speech-recog", "speech-synth",
  "doc-analysis", "doc-summary", "doc-qa",
  "code-gen", "code-review", "code-explain",
  "search-web", "search-news", "search-image",
  "email-send", "email-read", "email-list",
  "sms-send", "sms-status",
  "storage-upload", "storage-get", "storage-list",
  "db-query", "db-insert", "db-update", "db-delete",
  "auth-login", "auth-verify", "auth-refresh",
  "payment-charge", "payment-refund", "payment-balance",
  "notify-push", "notify-email", "notify-sms",
  "analytics-page", "analytics-event", "analytics-user",
  "social-post", "social-like", "social-share", "social-comment",
  "map-geocode", "map-reverse", "map-distance", "map-search",
  "weather-current", "weather-forecast", "weather-history",
  "finance-stock", "finance-crypto", "finance-forex",
  "news-top", "news-category", "news-search",
  "ip-geo", "ip-dns", "ip-whois",
  "file-convert", "file-compress", "file-split", "file-merge",
  "calendar-read", "calendar-create", "calendar-update",
  "contact-list", "contact-get", "contact-create",
  "task-create", "task-read", "task-update", "task-delete",
  "note-create", "note-read", "note-update", "note-delete",
  "form-create", "form-submit", "form-results",
  "survey-create", "survey-vote", "survey-results",
  "poll-create", "poll-vote", "poll-results",
  "quiz-create", "quiz-attempt", "quiz-score",
  "office-docx", "office-xlsx", "office-pptx", "office-pdf", "office-ocr",
  "health-check", "status-ping", "debug-info", "debug-test",
  "debug-echo", "admin-status", "admin-config", "admin-logs"
];

PAYMENT_ROUTES.forEach(ep => {
  const price = PRICING[ep] || DEFAULT_AMT;
  const amtCents = Math.round(price * 100);
  A.get("/paid/" + ep, (req, res) => {
    // Payment check handled by middleware above; these routes require x402 sig
    res.status(402).set("x402-authenticate", \`amount=\${amtCents}\`)
      .json({ error: "payment required", ep, amount_usd: price });
  });
});

// OPTIONS handler
A.options("/paid/:ep", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-pay-signature, x-sub-id, x-pay-amount, x-internal");
  res.status(200).end();
});`;

const newNoFake = `// ═══ Fake endpoints removed — only real Baidu routes remain ═══`;

if (code.includes(oldPaymentRoutes)) {
  code = code.replace(oldPaymentRoutes, newNoFake);
  console.log("✅ 103 fake endpoints removed");
} else {
  console.log("❌ Payment routes not found, trying shorter match...");
  // Try to find the array start
  const idx = code.indexOf('const PAYMENT_ROUTES');
  if (idx >= 0) {
    console.log("Found PAYMENT_ROUTES at byte", idx);
    // Find the end of the forEach
    const feIdx = code.indexOf("PAYMENT_ROUTES.forEach");
    if (feIdx >= 0) {
      const endOptIdx = code.indexOf("// OPTIONS handler", feIdx);
      if (endOptIdx >= 0) {
        console.log("Removing from", idx, "to", endOptIdx + 250);
        code = code.substring(0, idx) + "// ═══ Fake endpoints removed — only real Baidu routes remain ═══" + code.substring(endOptIdx + 250);
        console.log("✅ Removed manually");
      }
    }
  }
}

// 2. Remove generic POST /paid/:ep (the passthrough do-nothing handler)
const oldGenericPost = `// ═══ POST /paid/:ep (with x402 payment check via middleware) ═══
A.post("/paid/:ep", async (req, res) => {
  try {
    const ep = req.params.ep;
    res.json({ ok: true, ep, data: req.body });
  } catch (e) { res.status(500).json({ error: e.message }); }
});`;

const newNoGeneric = `// ═══ Generic catch-all POST removed — use specific Baidu endpoints ═══`;

if (code.includes(oldGenericPost)) {
  code = code.replace(oldGenericPost, newNoGeneric);
  console.log("✅ Generic POST /paid/:ep removed");
} else {
  console.log("❌ Generic POST not found");
}

// 3. Remove non-Baidu endpoints from PRICING object (keep only Baidu keys)
const oldPricingStart = `const PRICING = {`;
const pricingEnd = `const DEFAULT_AMT = 0.04;`;

let pricingStartIdx = code.indexOf(oldPricingStart);
let pricingEndIdx = code.indexOf(pricingEnd);
if (pricingStartIdx >= 0 && pricingEndIdx >= 0) {
  console.log("PRICING at", pricingStartIdx, "to", pricingEndIdx + pricingEnd.length);
  // Read the full PRICING object
  let pricingSection = code.substring(pricingStartIdx, pricingEndIdx + pricingEnd.length);
  console.log("PRICING section length:", pricingSection.length);
  
  // Replace PRICING to only have Baidu endpoints
  const baiduKeys = [
    'baidu-ocr', 'baidu-ocr-accurate', 'baidu-idcard',
    'baidu-tts', 'baidu-translate', 'baidu-llm-chat',
    'baidu-asr', 'baidu-image-recognition', 'baidu-image-enhance',
    'baidu-face-detect', 'baidu-body-analysis', 'baidu-nlp',
    'baidu-helixfold', 'baidu-helixfold/query'
  ];
  
  const newPricing = `const PRICING = {
  // ═══ Baidu API pricing (in USD) ═══
  'baidu-ocr': 0.01,
  'baidu-ocr-accurate': 0.02,
  'baidu-idcard': 0.01,
  'baidu-tts': 0.01,
  'baidu-translate': 0.01,
  'baidu-llm-chat': 0.08,
  'baidu-asr': 0.02,
  'baidu-image-recognition': 0.02,
  'baidu-image-enhance': 0.02,
  'baidu-face-detect': 0.01,
  'baidu-body-analysis': 0.02,
  'baidu-nlp': 0.01,
  'baidu-helixfold': 0.50,
  'baidu-helixfold/query': 0.02
};
const DEFAULT_AMT = 0.04;`;
  
  code = code.substring(0, pricingStartIdx) + newPricing + code.substring(pricingEndIdx + pricingEnd.length);
  console.log("✅ PRICING updated — only Baidu endpoints");
}

fs.writeFileSync(path, code, "utf8");
console.log("Written:", code.length, "bytes");
