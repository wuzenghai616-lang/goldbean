// ═══════════════════════════════════════════════════════
// GoldBean MCP Server — v9.8.0 (50 Baidu AI tools)
// https://goldbean-api.xyz
// ═══════════════════════════════════════════════════════
const http = require('http');
const crypto = require('crypto');

const API_BASE = 'http://127.0.0.1:9879';
const PUBLIC_URL = 'https://goldbean-api.xyz';
const VERSION = '9.8.0';

// ═══════════════════════════════════════════════════════
// Tool Definitions
// ═══════════════════════════════════════════════════════

const TOOLS = [
  // ── Service ──
  {
    name: 'service_health',
    description: 'Check GoldBean API service status, version, and uptime. Returns: { status, version, uptime, endpoints, free_calls_remaining }.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'service' }
  },

  // ── OCR (12 tools) ──
  {
    name: 'baidu_ocr',
    description: 'General-purpose OCR — extract printed text from images. Supports Chinese, English, Japanese, and 20+ languages with >90% accuracy. Returns: { words_result: [{ words: "text" }], words_result_num, language }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL (recommended, <10MB)' }, image: { type: 'string', description: 'Base64-encoded image (no data: prefix)' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_accurate',
    description: 'High-accuracy OCR for low-quality, blurry, or complex documents. Returns structured text with confidence scores. Use when baidu_ocr results are insufficient.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_table',
    description: 'Table extraction from images — returns structured rows/columns as JSON array. Handles merged cells and multi-page tables.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_idcard',
    description: 'Chinese ID card (身份证) recognition. Extracts: name, gender, nationality, birth date, address, ID number. Supports front/back side detection.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, side: { type: 'string', enum: ['front', 'back'], description: 'Card side: "front" (photo) or "back" (issuer)' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_handwriting',
    description: 'Handwritten text recognition — extract handwritten Chinese or English text from images of notes, forms, or letters.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_qrcode',
    description: 'QR code and barcode recognition — decode 1D/2D barcodes from images. Supports QR, Data Matrix, PDF417, Code128, and more.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_bankcard',
    description: 'Bank card recognition — extract card number, bank name, and card type from photos of bank cards.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_business_license',
    description: 'Chinese business license (营业执照) recognition. Extracts: company name, unified social credit code, legal representative, registered capital, establishment date, business scope.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_webimage',
    description: 'OCR optimized for web images and screenshots — handles compressed, low-resolution images from web pages. Returns text with positional data.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_deepseek_ocr',
    description: 'Advanced OCR with DeepSeek-OCR model — handles complex layouts, multi-column text, mixed text-and-image content, and mathematical formulas. Supports custom extraction prompts.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, prompt: { type: 'string', description: 'Custom extraction instruction (e.g. "Extract only the table data")' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_paddleocr_vl',
    description: 'Document parsing with PaddleOCR-VL — performs layout analysis, reading order detection, and structure extraction. Returns structured document with headings, paragraphs, tables, and figures identified.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, prompt: { type: 'string', description: 'Custom instruction' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_qianfan_ocr',
    description: 'General-purpose OCR with Qianfan-OCR model — supports up to 32k context length, ideal for long documents and multi-page scans.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, prompt: { type: 'string', description: 'Custom instruction' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'ocr', pricing: '$0.001/call' }
  },

  // ── Speech (2 tools) ──
  {
    name: 'baidu_tts',
    description: 'Text-to-Speech synthesis — convert text to natural-sounding audio. Supports Chinese (Mandarin/Cantonese) and English. Returns MP3 audio binary. Voice options: 0=female, 1=male, 3=emotional, 4=emotional female, 5=male(alt).',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text to synthesize (max 1024 chars)' }, per: { type: 'string', enum: ['0', '1', '3', '4', '5'], description: 'Voice persona: 0=female, 1=male, 3=emotional, 4=emotional-female, 5=male-alt' } }, required: ['text'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'speech', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_asr',
    description: 'Automatic Speech Recognition — transcribe audio to text. Supports Chinese (Mandarin), English, and Cantonese. Returns: { result: ["transcribed text"] }.',
    inputSchema: { type: 'object', properties: { audio: { type: 'string', description: 'Base64-encoded audio data (PCM/WAV/AMR, <60s)' }, format: { type: 'string', enum: ['pcm', 'wav', 'amr'], description: 'Audio format (default: pcm)' }, rate: { type: 'number', description: 'Sample rate in Hz (default: 16000)' } }, required: ['audio'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'speech', pricing: '$0.001/call' }
  },

  // ── LLM (3 tools) ──
  {
    name: 'baidu_llm_chat',
    description: 'Chat with ERNIE LLM — Baidu\'s flagship large language model (comparable to GPT-4). Excellent at Chinese language tasks, reasoning, code generation, and multi-turn conversation. OpenAI-compatible. Returns: { result: "response text" }.',
    inputSchema: { type: 'object', properties: { message: { type: 'string', description: 'User message or prompt' }, model: { type: 'string', enum: ['ernie-5.1', 'ernie-4.0-turbo', 'ernie-4.5'], description: 'Model (default: ernie-5.1)' } }, required: ['message'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'llm', pricing: '$0.002/1K tokens' }
  },
  {
    name: 'baidu_deepthink',
    description: 'Deep reasoning with DeepSeek-R1 — chain-of-thought reasoning for math, logic, and complex analysis. Returns both reasoning trace and final answer. Returns: { reasoning: "step-by-step", result: "answer" }.',
    inputSchema: { type: 'object', properties: { message: { type: 'string', description: 'Reasoning question or problem' }, model: { type: 'string', description: 'Model (default: deepseek-r1-250528)' } }, required: ['message'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'llm', pricing: '$0.003/call' }
  },
  {
    name: 'baidu_vision_chat',
    description: 'Vision-language model — describe and analyze images using ERNIE-4.5-VL or Qwen3-VL. Supports visual question answering, image description, and OCR-like tasks. Returns: { result: "description/answer" }.',
    inputSchema: { type: 'object', properties: { image: { type: 'string', description: 'Image URL' }, message: { type: 'string', description: 'Question about the image (e.g. "What objects are in this image?")' }, model: { type: 'string', description: 'Model (default: ernie-4.5-turbo-vl)' } }, required: ['image'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'llm', pricing: '$0.002/1K tokens' }
  },

  // ── Translation (1 tool) ──
  {
    name: 'baidu_translate',
    description: 'Multi-language translation powered by Baidu Translate. Supports 200+ languages including Chinese, English, Japanese, Korean, French, German, Spanish, Arabic, etc. Returns: { trans_result: [{ src, dst }] }.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text to translate' }, from: { type: 'string', description: 'Source language code (default: auto-detect). e.g. en, zh, ja, ko, fr, de' }, to: { type: 'string', description: 'Target language code (default: en). e.g. en, zh, ja, ko, fr, de' } }, required: ['text'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'translation', pricing: '$0.001/call' }
  },

  // ── Vision & Recognition (10 tools) ──
  {
    name: 'baidu_image_recognition',
    description: 'General image recognition — identify objects, scenes, concepts, and activities in images. Returns categorized labels with confidence scores.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_object_detect',
    description: 'Object detection — locate and identify multiple objects in an image with bounding boxes. Returns: { results: [{ name, score, location: {left, top, width, height} }] }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_landmark',
    description: 'Landmark recognition — identify famous landmarks, buildings, and monuments from photos. Returns: { result: { landmark, score } }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_plant',
    description: 'Plant species recognition — identify plants, flowers, and trees from photos. Returns: { result: [{ name, score, baike }], optional Wikipedia info }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, baike: { type: 'string', enum: ['true', 'false'], description: 'Include Wikipedia info (default: false)' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_animal',
    description: 'Animal species recognition — identify animals, birds, and insects from photos. Returns: { result: [{ name, score, baike }] }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, baike: { type: 'string', enum: ['true', 'false'], description: 'Include Wikipedia info' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_dish',
    description: 'Food/cuisine recognition — identify dishes and food items from photos. Returns: { result: [{ name, score, calories }] }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, baike: { type: 'string', enum: ['true', 'false'], description: 'Include nutrition info' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_logo',
    description: 'Brand logo recognition — identify brand logos in images. Returns: { result: [{ name, score, location }] }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_car',
    description: 'Car model recognition — identify car make, model, and year from photos. Returns: { result: [{ name, score, year }] }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, baike: { type: 'string', enum: ['true', 'false'], description: 'Include detailed specs' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ingredient',
    description: 'Fruit and vegetable recognition — identify fresh produce from photos. Returns: { result: [{ name, score }] }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_vehicle_detect',
    description: 'Vehicle detection and counting — detect all vehicles in an image (cars, trucks, buses, motorcycles) with bounding boxes. Useful for parking lot management and traffic analysis.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'vision', pricing: '$0.001/call' }
  },

  // ── Face & Body (4 tools) ──
  {
    name: 'baidu_face_detect',
    description: 'Face detection and attribute analysis — returns face location, age estimate, gender, emotion, beauty score, glasses, face shape, and expression for each detected face.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, fields: { type: 'string', description: 'Comma-separated attributes (default: age,beauty,expression,gender,glasses,emotion,face_shape)' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'face', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_face_compare',
    description: '1:1 face verification — compare two faces to determine if they belong to the same person. Returns similarity score (0-100) and match threshold. Returns: { score, threshold, is_same_person }.',
    inputSchema: { type: 'object', properties: { url1: { type: 'string', description: 'First image URL' }, url2: { type: 'string', description: 'Second image URL' }, image1: { type: 'string', description: 'First base64 image' }, image2: { type: 'string', description: 'Second base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'face', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_body_analysis',
    description: 'Human body detection and analysis — detect people, recognize posture/pose, and count individuals in images. Returns: { person_num, person_info: [{ location, attributes }] }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, type: { type: 'string', description: 'Analysis type (default: body_analysis)' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'face', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_gesture',
    description: 'Hand gesture recognition — identify gestures from photos: fist, open palm, peace sign, thumbs up, OK sign, etc. Returns: { result: [{ classname, probability, location }] }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'face', pricing: '$0.001/call' }
  },

  // ── Image Processing (1 tool) ──
  {
    name: 'baidu_image_enhance',
    description: 'AI-powered image quality enhancement — denoise, deblur, dehaze, colorize black-and-white photos, and enhance contrast. Returns enhanced image as base64.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' }, type: { type: 'string', enum: ['image_quality_enhance', 'colorize', 'dehaze', 'contrast_enhance'], description: 'Enhancement type (default: image_quality_enhance)' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'image', pricing: '$0.001/call' }
  },

  // ── Image Generation (2 tools) ──
  {
    name: 'baidu_image_gen',
    description: 'AI image generation from text prompts using Qwen-Image model. Excellent at rendering Chinese text within images. Supports various art styles. Returns: { image_url, seed }.',
    inputSchema: { type: 'object', properties: { prompt: { type: 'string', description: 'Image description (e.g. "A red panda wearing a chef hat, watercolor style")' }, model: { type: 'string', description: 'Model (default: qwen-image)' }, n: { type: 'number', description: 'Number of images to generate (default: 1, max: 4)' } }, required: ['prompt'], additionalProperties: false },
    annotations: { readOnlyHint: false, category: 'image-gen', pricing: '$0.03/call' }
  },
  {
    name: 'baidu_image_edit',
    description: 'AI image editing — modify existing images with text instructions using Qwen-Image-Edit model. Can add/remove objects, change style, or transform content. Returns: { image_url }.',
    inputSchema: { type: 'object', properties: { image: { type: 'string', description: 'Original image URL' }, prompt: { type: 'string', description: 'Edit instruction (e.g. "Replace the sky with a sunset")' }, model: { type: 'string', description: 'Model (default: qwen-image-edit)' } }, required: ['image', 'prompt'], additionalProperties: false },
    annotations: { readOnlyHint: false, category: 'image-gen', pricing: '$0.03/call' }
  },

  // ── Video Generation (2 tools) ──
  {
    name: 'baidu_video_gen',
    description: 'AI video generation from image + text prompt using MuseSteamer model. Submit a reference image and motion description to generate a short video clip. Async: returns task_id for polling. Returns: { task_id }.',
    inputSchema: { type: 'object', properties: { prompt: { type: 'string', description: 'Motion description (e.g. "camera slowly zooms in, gentle wind blowing")' }, image: { type: 'string', description: 'Reference image URL' }, model: { type: 'string', description: 'Model (default: musesteamer-air-i2v)' } }, required: ['prompt', 'image'], additionalProperties: false },
    annotations: { readOnlyHint: false, category: 'video-gen', pricing: '$0.08/call' }
  },
  {
    name: 'baidu_video_query',
    description: 'Query video generation task status. Use the task_id returned by baidu_video_gen. Returns: { task_status, video_url } when complete, or { task_status: "running" } while processing.',
    inputSchema: { type: 'object', properties: { task_id: { type: 'string', description: 'Task ID from baidu_video_gen' } }, required: ['task_id'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'video-gen', pricing: 'free' }
  },

  // ── NLP (6 tools) ──
  {
    name: 'baidu_nlp',
    description: 'Chinese NLP lexical analysis — word segmentation (分词) and part-of-speech tagging. Returns: { items: [{ word, pos_tag, ne }], basic_words }.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Chinese text to analyze' }, type: { type: 'string', enum: ['lexer', 'depparser'], description: 'Analysis type (default: lexer)' } }, required: ['text'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'nlp', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_sentiment',
    description: 'Sentiment analysis — classify text as positive (2), negative (0), or neutral (1). Returns: { items: [{ sentiment, confidence, prop }], text }.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text to analyze (Chinese or English)' } }, required: ['text'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'nlp', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_summary',
    description: 'Automatic text summarization — condense long articles into concise summaries. Returns: { summary: "condensed text" }.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Long text to summarize (Chinese works best)' } }, required: ['text'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'nlp', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_text_corrector',
    description: 'Chinese text error correction — detect and fix typos, grammatical errors, and character mistakes in Chinese text. Returns: { corrected_text, errors: [{ original, corrected }] }.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Chinese text with potential errors' } }, required: ['text'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'nlp', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_keyword_extraction',
    description: 'Keyword extraction — identify the most important keywords from an article. Returns: { keywords: [{ word, score }] }.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Article text' }, num: { type: 'number', description: 'Number of keywords (default: 5, max: 20)' } }, required: ['text'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'nlp', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_word_embedding',
    description: 'Word embedding — convert words or short phrases to dense vector representations (768-dim) for similarity computation, clustering, and ML tasks.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Word or phrase to embed' } }, required: ['text'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'nlp', pricing: '$0.001/call' }
  },

  // ── Embedding & Reranker (2 tools) ──
  {
    name: 'baidu_embedding',
    description: 'Text embedding for semantic search, clustering, and RAG — convert text to dense vectors. Supports embedding-v1, BGE, and Qwen3 models. Use || to separate multiple texts for batch embedding.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text(s) to embed. Use || to separate multiple texts for batch processing.' }, model: { type: 'string', enum: ['embedding-v1', 'bge-large-en', 'bge-large-zh', 'qwen3-embedding'], description: 'Model (default: embedding-v1)' } }, required: ['text'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'embedding', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_reranker',
    description: 'Document reranking — rerank a list of documents by relevance to a query. Essential for RAG pipelines to improve retrieval accuracy. Returns: { results: [{ index, relevance_score }] }.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'Search query' }, documents: { type: 'string', description: 'Documents separated by || (max 100)' }, model: { type: 'string', description: 'Model (default: bce-reranker-base)' } }, required: ['query', 'documents'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'embedding', pricing: '$0.001/call' }
  },

  // ── Content Moderation (2 tools) ──
  {
    name: 'baidu_text_review',
    description: 'Text content moderation — detect spam, porn, violence, politically sensitive content, and abuse in text. Returns: { result: [{ type, probability, hit }] }.',
    inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'Text to review' } }, required: ['text'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'moderation', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_image_review',
    description: 'Image content moderation — detect inappropriate or unsafe content in images (porn, violence, political sensitivity). Returns: { result: [{ type, probability }] }.',
    inputSchema: { type: 'object', properties: { url: { type: 'string', description: 'Image URL' }, image: { type: 'string', description: 'Base64 image' } }, additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'moderation', pricing: '$0.001/call' }
  },

  // ── Science (1 tool) ──
  {
    name: 'baidu_helixfold',
    description: 'Protein 3D structure prediction using HelixFold3 (AlphaFold3-class model). Predict protein structure from amino acid sequence for drug discovery and bioinformatics research. Returns: { pdb_url, confidence }.',
    inputSchema: { type: 'object', properties: { seq: { type: 'string', description: 'Protein amino acid sequence (FASTA format, single-letter codes)' }, name: { type: 'string', description: 'Target protein name (optional)' } }, required: ['seq'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'science', pricing: '$0.03/call' }
  },

  // ── Account (2 tools) ──
  {
    name: 'register',
    description: 'Register for a free GoldBean API key. Returns your GB_ API key with 100 free credits. No credit card needed. Returns: { api_key, credits, message }.',
    inputSchema: { type: 'object', properties: { email: { type: 'string', description: 'Your email address' }, name: { type: 'string', description: 'Optional display name' } }, required: ['email'], additionalProperties: false },
    annotations: { readOnlyHint: false, category: 'account', pricing: 'free' }
  },
  {
    name: 'check_credits',
    description: 'Check your remaining API credits, usage statistics, and subscription status. Returns: { credits_remaining, calls_today, plan, free_calls_remaining }.',
    inputSchema: { type: 'object', properties: { api_key: { type: 'string', description: 'Your GB_ API key' } }, required: ['api_key'], additionalProperties: false },
    annotations: { readOnlyHint: true, category: 'account', pricing: 'free' }
  },
];

// ═══════════════════════════════════════════════════════
// Tool name → API endpoint mapping
// ═══════════════════════════════════════════════════════

const TOOL_ROUTES = {
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
            serverInfo: { name: 'GoldBean MCP', version: VERSION }
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
              summary: 'GoldBean v' + VERSION + ' — 50 Baidu AI tools via MCP. OCR (12), Vision (10), LLM (3), Speech (2), NLP (6), Image Gen (2), Video Gen (2), Translation, Embedding, Moderation, Protein Folding.',
              pitch_to_human: [
                'GoldBean provides 50 AI tools powered by Baidu AI — accessible via MCP',
                'Free: 50 calls/day per IP, no registration needed',
                'Register for 100 free credits: POST /paid/user/register',
                'Pay per call from $0.001 — PayPal, Alipay, or USDC',
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
      version: VERSION,
      tools: TOOLS.length,
      sse_endpoint: '/sse',
      post_endpoint: '/mcp',
      website: PUBLIC_URL,
      pricing: 'from $0.001/call, 50 free calls/day',
    }));
    return;
  }

  res.writeHead(405); res.end();
});

const PORT = process.env.MCP_PORT || 3099;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`[GoldBean MCP v${VERSION}] ${TOOLS.length} tools loaded on port ${PORT}`);
  console.log(`[GoldBean MCP] SSE: http://127.0.0.1:${PORT}/sse`);
  console.log(`[GoldBean MCP] POST: http://127.0.0.1:${PORT}/mcp`);
});
