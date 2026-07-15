'use strict';

const http = require('http');
const fs = require('fs');
const url = require('url');

// ========== Constants ==========
const API_BASE = 'http://127.0.0.1:9879';
const PUBLIC_URL = 'https://goldbean-api.xyz';
const VERSION = '9.8.0';
const PORT = 3099;

// ========== Tools Definition (51 Baidu AI Tools) ==========
const TOOLS = [
  // ==================== Service (1) ====================
  {
    name: 'service_health',
    description: 'Checks GoldBean API service health, version, and active endpoint count. Use this FIRST before calling any other tool to verify the service is operational. Returns JSON: {status: "ok"|"degraded", version: string, uptime: number, endpoints: number, baidu: boolean, payment: boolean}. No authentication required. Pricing: Free. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    annotations: { readOnlyHint: true, category: 'Service', pricing: 'Free' }
  },

  // ==================== OCR (12) ====================
  {
    name: 'baidu_ocr',
    description: 'Extracts printed text from images using Baidu General OCR — the default choice for most OCR tasks. Supports 20+ languages including Chinese, English, Japanese, Korean, and European languages. Use for: screenshots, photos of documents, scanned pages, signs, or any image with printed text. Do NOT use for: handwritten text (use baidu_ocr_handwriting), ID cards (use baidu_ocr_idcard), bank cards (use baidu_ocr_bankcard), business licenses (use baidu_ocr_business_license), tables (use baidu_ocr_table), or complex document layouts requiring contextual understanding (use baidu_deepseek_ocr). Behavior: accepts base64 image or public URL; detects text in 20+ languages; returns word-level and line-level results with bounding boxes. Limitation: accuracy drops on blurry, rotated, or low-contrast images — use baidu_ocr_accurate for those cases. Output: {words_result: [{words: string, location: {top,left,width,height}}], words_result_num: number, language: string, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data (no prefix) or publicly accessible image URL' },
        language_type: { type: 'string', description: 'Language type: CHN_ENG (default), ENG, JAP, KOR, FRE, SPA, POR, GER, ITA, RUS, DAN, DUT, MAL, SWE, IND, POL, ROM, THA, VIET, ARA, HIN' },
        detect_direction: { type: 'boolean', description: 'Whether to detect image orientation. Default: false' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_accurate',
    description: 'High-precision OCR engine for difficult images where baidu_ocr returns insufficient results. Use when: image is blurry, low-resolution, has poor lighting, contains small fonts, or standard OCR missed characters. Supports Chinese, English, Japanese, Korean, French, Spanish. Do NOT use for standard-quality images — baidu_ocr is faster and cheaper for those. Behavior: runs a heavier model with character-level recognition; slower than baidu_ocr but significantly more accurate on challenging inputs. Limitation: supports fewer languages than baidu_ocr; higher latency (~2-3s vs ~1s). Output: {words_result: [{words: string, location: {top,left,width,height}, probability: number}], words_result_num: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data (no prefix) or publicly accessible image URL' },
        language_type: { type: 'string', description: 'Language type: CHN_ENG (default), ENG, JAP, KOR, FRE, SPA' },
        detect_direction: { type: 'boolean', description: 'Whether to detect image orientation. Default: false' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_table',
    description: 'Extracts structured table data — rows, columns, and cell text — from images of spreadsheets, financial statements, or any tabular content. Use when: you need to preserve row/column structure, not just flat text. Do NOT use for: plain text extraction (use baidu_ocr), or complex documents with mixed tables and paragraphs (use baidu_paddleocr_vl). Behavior: detects table grid, maps cell boundaries, extracts text per cell. Supports merged cells and multi-page tables. Limitation: works best on clearly bordered tables; struggles with borderless or nested tables. Output: {tables_result: [{table_location: {top,left,width,height}, body: [{row_start, row_end, col_start, col_end, words: string}]}], tables_result_num: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        cell_location: { type: 'boolean', description: 'Whether to return cell bounding box coordinates. Default: false' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_idcard',
    description: 'Extracts structured fields from Chinese national ID cards (二代身份证). Accepts both front side (photo+info) and back side (issuing authority+validity). Use for: identity verification, KYC workflows, form auto-filling from ID photos. Do NOT use for: non-Chinese ID cards, passports, or driver licenses — use baidu_ocr or baidu_deepseek_ocr for those. Behavior: requires specifying id_card_side ("front" or "back"); auto-detects and crops card region; validates check digit. Limitation: only supports Chinese second-generation ID cards. Output: {name, gender, nationality, birth, address, id_number} (front) or {issue_authority, issue_date, expiry_date} (back), plus image quality scores. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        id_card_side: { type: 'string', description: 'Side of ID card: front (photo side) or back (emblem side)' }
      },
      required: ['image', 'id_card_side']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_handwriting',
    description: 'Recognizes handwritten Chinese or English text from images. Use for: digitizing handwritten notes, forms, signatures, meeting minutes, or classroom notes. Do NOT use for: printed/typed text (use baidu_ocr), or mixed handwritten+printed content (use baidu_deepseek_ocr). Behavior: optimized for cursive and irregular handwriting; supports Chinese (default) and English. Limitation: accuracy varies with handwriting legibility; cannot recognize mathematical formulas or drawings. Output: {words_result: [{words: string, location: {top,left,width,height}}], words_result_num: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        language_type: { type: 'string', description: 'Language: CHN (Chinese handwriting, default) or ENG (English handwriting)' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_qrcode',
    description: 'Detects and decodes QR codes, barcodes, and 2D codes from images. Use for: extracting URLs, payment codes, product barcodes, or ticket codes from photos. Do NOT use for: general text extraction (use baidu_ocr). Behavior: supports QR Code, Data Matrix, PDF417, Aztec, Code128, Code39, EAN-13, UPC-A and more; detects multiple codes in a single image. Limitation: code must be visible and not heavily distorted. Output: {codes_result: [{type: string, text: string, location: {top,left,width,height}}], codes_result_num: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_bankcard',
    description: 'Extracts bank card number, card type, and bank name from images of bank cards. Use for: payment form auto-fill, card digitization, or financial app onboarding. Do NOT use for: ID cards (use baidu_ocr_idcard) or business licenses (use baidu_ocr_business_license). Behavior: auto-detects card edges; validates card number via Luhn algorithm; identifies issuing bank. Limitation: supports Chinese bank cards only; cannot extract CVV or expiry date for security reasons. Output: {bank_card_number: string, bank_name: string, card_type: "debit"|"credit", valid_date: string, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_business_license',
    description: 'Extracts structured fields from Chinese business license certificates (营业执照). Use for: company verification, B2B onboarding, business data entry automation. Do NOT use for: non-Chinese business documents — use baidu_deepseek_ocr for those. Behavior: recognizes both old-style (paper) and new-style (electronic) licenses; extracts all registered fields. Limitation: only supports Chinese business licenses. Output: {company_name, social_credit_code, legal_person, registered_capital, paid_capital, establishment_date, business_scope, address, business_term, log_id}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ocr_webimage',
    description: 'OCR optimized specifically for web images with complex backgrounds, watermarks, non-standard fonts, or embedded text. Use when: extracting text from memes, infographics, product images, social media posts, or screenshots with UI elements. Do NOT use for: clean document scans (use baidu_ocr), or handwritten content (use baidu_ocr_handwriting). Behavior: applies background filtering and watermark removal before OCR; handles stylized fonts and curved text. Limitation: may miss text embedded in complex graphics; not suitable for tables (use baidu_ocr_table). Output: {words_result: [{words: string, location: {top,left,width,height}}], words_result_num: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        detect_direction: { type: 'boolean', description: 'Whether to detect image orientation. Default: false' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_deepseek_ocr',
    description: 'AI-powered OCR using DeepSeek vision model for complex document understanding beyond simple text extraction. Use when: document has mixed content (text + tables + images), complex layouts, stamps/seals, or you need contextual understanding of the content. Do NOT use for: simple text extraction from clean images (use baidu_ocr — faster and cheaper). Behavior: uses VLM (vision-language model) to understand document semantics; can answer questions about document content; handles multi-page and multi-column layouts. Limitation: higher latency (~3-5s); may hallucinate on ambiguous content. Output: {text: string, layout: [{type, content, bbox}], answer: string (if question provided), log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        question: { type: 'string', description: 'Optional question to guide extraction focus' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_paddleocr_vl',
    description: 'Advanced document understanding using PaddleOCR-VL vision-language model — Baidu\'s most capable OCR for complex documents. Use for: documents with tables, mathematical formulas, chemical structures, stamps, seals, or mixed layouts that require visual-language reasoning. Do NOT use for: simple text extraction (use baidu_ocr), or when you need structured table extraction only (use baidu_ocr_table). Behavior: combines OCR with layout analysis and formula recognition; can process multi-page documents; supports question-answering about document content. Limitation: highest latency among OCR tools (~5-8s); requires clear input images. Output: {text: string, tables: [{rows, cols, cells}], formulas: [{latex, bbox}], layout: [{type, bbox, content}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        question: { type: 'string', description: 'Optional question or instruction to guide extraction' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_qianfan_ocr',
    description: 'Custom template-based OCR using Baidu Qianfan platform — for structured field extraction from specific document types you have configured. Use when: you have a custom document template (invoices, receipts, customs forms) set up on Qianfan platform and need to extract predefined fields. Do NOT use for: general text extraction (use baidu_ocr), or documents without a configured template. Behavior: matches input image against your Qianfan template; extracts only the fields defined in the template. Limitation: requires a pre-configured template_id from Qianfan platform; cannot be used without one. Output: {template_name: string, fields: {field_name: value, ...}, confidence: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        template_id: { type: 'string', description: 'Qianfan OCR template ID for custom document recognition' }
      },
      required: ['image', 'template_id']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },

  // ==================== Speech (2) ====================
  {
    name: 'baidu_tts',
    description: 'Converts text to natural-sounding speech audio using Baidu Text-to-Speech engine. Use for: generating voiceover for videos, building accessibility features (screen readers), creating voice assistants, or producing audio content. Supports Chinese (zh) and English (en) with 6 voice personas. Do NOT use for: speech-to-text (use baidu_asr). Behavior: synthesizes speech from text input; supports speed/pitch/volume control; outputs MP3 or WAV. Limitation: max 1024 bytes (Chinese) or 2048 bytes (English) per request; for longer text, split into multiple calls. Output: {audio: base64_string, format: "mp3"|"wav", duration: number, log_id: number}. Pricing: $0.001/call.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to synthesize (max 1024 bytes for Chinese, 2048 for English)' },
        lang: { type: 'string', description: 'Language: zh (Chinese, default) or en (English)' },
        per: { type: 'number', description: 'Voice persona ID: 0 (female), 1 (male), 3 (emotonal male), 4 (emotonal female), 5118 (Xiaoyan), default: 0' },
        spd: { type: 'number', description: 'Speech speed: 0-15, default: 5' },
        pit: { type: 'number', description: 'Pitch: 0-15, default: 5' },
        vol: { type: 'number', description: 'Volume: 0-15, default: 5' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: false, category: 'Speech', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_asr',
    description: 'Converts speech audio to text using Baidu Automatic Speech Recognition. Use for: transcribing voice recordings, building voice commands, meeting transcription, or speech-to-text features. Supports Chinese and English. Do NOT use for: text-to-speech (use baidu_tts). Behavior: accepts base64 audio in WAV, MP3, PCM, or AMR format; returns word-level timestamps; supports 8kHz and 16kHz sample rates. Limitation: max 60 seconds per request; for longer audio, split into segments; noisy environments reduce accuracy. Output: {result: [{text: string, start_time: number, end_time: number}], text: string, language: string, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        audio: { type: 'string', description: 'Base64-encoded audio data (WAV, MP3, PCM, or AMR format)' },
        format: { type: 'string', description: 'Audio format: wav (default), pcm, amr, mp3' },
        rate: { type: 'number', description: 'Sample rate in Hz: 8000 or 16000. Default: 16000' },
        lang: { type: 'string', description: 'Language: zh (default) or en' }
      },
      required: ['audio']
    },
    annotations: { readOnlyHint: true, category: 'Speech', pricing: '$0.001/call' }
  },

  // ==================== LLM (3) ====================
  {
    name: 'baidu_llm_chat',
    description: 'Generates AI text responses using Baidu ERNIE large language models. Use for: conversational AI, question answering, text generation, summarization, code generation, content rewriting, and general reasoning. Supports multi-turn conversations with message history. Do NOT use for: tasks requiring deep multi-step reasoning (use baidu_deepthink), or image analysis (use baidu_vision_chat). Behavior: processes message array with role/content pairs; supports streaming; models include ernie-4.0-8k (most capable), ernie-3.5-8k (balanced), ernie-speed-128k (long context). Limitation: context window varies by model (8K-128K tokens); rate-limited by subscription tier. Output: {result: string, finish_reason: "stop"|"length"|"content_filter", usage: {prompt_tokens, completion_tokens, total_tokens}, log_id: number}. Pricing: $0.002/1K tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        messages: { type: 'array', description: 'Array of message objects: [{role: "user", content: "..."}, {role: "assistant", content: "..."}, {role: "user", content: "..."}]', items: { type: 'object', properties: { role: { type: 'string' }, content: { type: 'string' } } } },
        model: { type: 'string', description: 'Model: ernie-4.0-8k (default), ernie-4.0-turbo-8k, ernie-3.5-8k, ernie-speed-128k, ernie-lite-8k' },
        temperature: { type: 'number', description: 'Sampling temperature 0-1.0. Higher = more creative. Default: 0.8' },
        max_tokens: { type: 'number', description: 'Maximum tokens to generate. Default: 2048' },
        stream: { type: 'boolean', description: 'Whether to stream response. Default: false' }
      },
      required: ['messages']
    },
    annotations: { readOnlyHint: false, category: 'LLM', pricing: '$0.002/1K tokens' }
  },
  {
    name: 'baidu_deepthink',
    description: 'Performs deep multi-step reasoning using ERNIE with extended thinking capability. Use for: mathematical proofs, logical analysis, complex problem-solving, coding challenges, or any task requiring deliberate step-by-step reasoning before answering. Do NOT use for: simple Q&A or text generation (use baidu_llm_chat — faster and cheaper), or image-based reasoning (use baidu_vision_chat). Behavior: allocates a thinking budget (configurable) for internal reasoning before generating the final answer; exposes the reasoning chain in the response. Limitation: higher latency and token consumption than baidu_llm_chat; may over-think simple questions. Output: {result: string, thinking_process: string, finish_reason: string, usage: {prompt_tokens, thinking_tokens, completion_tokens, total_tokens}, log_id: number}. Pricing: $0.002/1K tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        messages: { type: 'array', description: 'Array of message objects with role and content', items: { type: 'object', properties: { role: { type: 'string' }, content: { type: 'string' } } } },
        model: { type: 'string', description: 'Model: ernie-4.0-8k (default) or ernie-4.0-turbo-8k' },
        temperature: { type: 'number', description: 'Sampling temperature 0-1.0. Default: 0.6 (lower for reasoning)' },
        max_tokens: { type: 'number', description: 'Maximum tokens to generate. Default: 4096' },
        thinking_budget: { type: 'number', description: 'Token budget for thinking phase. Default: 2048' }
      },
      required: ['messages']
    },
    annotations: { readOnlyHint: false, category: 'LLM', pricing: '$0.002/1K tokens' }
  },
  {
    name: 'baidu_vision_chat',
    description: 'Analyzes images through conversational interface using Baidu vision-language model (ERNIE-VL). Use for: asking questions about image content, describing scenes, reading text in images, identifying objects, or performing visual reasoning. Do NOT use for: pure text OCR without context (use baidu_ocr — cheaper), or text-only chat (use baidu_llm_chat). Behavior: accepts image as base64 or URL in message content; supports multi-turn visual conversations; can describe, count, compare, and reason about visual elements. Limitation: max 1 image per request; image size should be under 10MB; complex charts/diagrams may be misinterpreted. Output: {result: string, finish_reason: string, usage: {prompt_tokens, completion_tokens, total_tokens}, log_id: number}. Pricing: $0.002/1K tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        messages: { type: 'array', description: 'Array of messages. User messages can include image content: [{role: "user", content: [{type: "text", text: "..."}, {type: "image_url", image_url: {url: "base64 or URL"}}]}]', items: { type: 'object' } },
        model: { type: 'string', description: 'Model: ernie-4.5-vl (default) or ernie-vil-turbo' },
        temperature: { type: 'number', description: 'Sampling temperature 0-1.0. Default: 0.8' },
        max_tokens: { type: 'number', description: 'Maximum tokens to generate. Default: 2048' }
      },
      required: ['messages']
    },
    annotations: { readOnlyHint: false, category: 'LLM', pricing: '$0.002/1K tokens' }
  },

  // ==================== Translation (1) ====================
  {
    name: 'baidu_translate',
    description: 'Translates text between 28+ languages using Baidu Translation API. Supports Chinese, English, Japanese, Korean, French, German, Spanish, Russian, Portuguese, Arabic, Thai, Vietnamese, and more. Use for: any text translation need — content localization, multilingual chat, document translation. Do NOT use for: translating entire documents with formatting preservation — this tool returns plain text only. Behavior: auto-detects source language when "from" is set to "auto"; supports up to 6000 characters per request. Limitation: not optimized for technical/specialized terminology; for domain-specific translation, consider using baidu_llm_chat with translation prompt. Output: {trans_result: [{src: string, dst: string}], from: string, to: string, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to translate (max 6000 characters per request)' },
        from: { type: 'string', description: 'Source language: zh, en, jp, kor, fra, spa, deu, ita, ru, pt, ara, th, vie, auto (auto-detect). Default: auto' },
        to: { type: 'string', description: 'Target language: zh, en, jp, kor, fra, spa, deu, ita, ru, pt, ara, th, vie' }
      },
      required: ['text', 'to']
    },
    annotations: { readOnlyHint: true, category: 'Translation', pricing: '$0.001/call' }
  },

  // ==================== Vision (10) ====================
  {
    name: 'baidu_image_recognition',
    description: 'General-purpose image recognition that identifies objects, scenes, concepts, and activities. Use for: image tagging, content categorization, smart photo albums, or as a pre-filter before more specific recognition tools. Do NOT use for: specific tasks like plant identification (use baidu_plant), animal identification (use baidu_animal), food recognition (use baidu_dish), or logo detection (use baidu_logo) — those specialized tools are more accurate. Behavior: returns top-N recognition results with confidence scores; optionally includes Baidu Baike encyclopedia entries for context. Limitation: may return generic labels for uncommon objects. Output: {result: [{keyword: string, score: number, root: string, baike_info: {description, image_url}}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        baike_num: { type: 'number', description: 'Number of Baidu Baike entries to return. Default: 0' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_object_detect',
    description: 'Detects and locates multiple objects in images with bounding boxes. Use for: object counting, inventory management, surveillance, or building visual search systems. Do NOT use for: identifying what objects are (use baidu_image_recognition), or detecting specific categories like vehicles (use baidu_vehicle_detect), faces (use baidu_face_detect), or logos (use baidu_logo). Behavior: returns all detected objects with name, location (bounding box), and confidence; supports per-category count. Limitation: detects common everyday objects; may miss specialized or rare items. Output: {result: [{name: string, score: number, location: {top,left,width,height}}], object_num: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        count: { type: 'boolean', description: 'Whether to return object count per category. Default: false' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_landmark',
    description: 'Identifies famous landmarks, buildings, and tourist attractions from images. Use for: travel photo tagging, location-based services, or tourism apps. Do NOT use for: general scene recognition (use baidu_image_recognition). Behavior: matches against database of 50,000+ global landmarks; returns landmark name, confidence, and geographic coordinates. Limitation: only recognizes notable landmarks; ordinary buildings return no result. Output: {result: [{landmark: string, score: number, location: {lat, lon}}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_plant',
    description: 'Identifies plant species from images with high accuracy. Use for: botanical identification, gardening apps, nature education, or plant disease research. Do NOT use for: general image recognition (use baidu_image_recognition), or animal identification (use baidu_animal). Behavior: matches against 20,000+ plant species including flowers, trees, herbs, and succulents; returns Latin and common names; optionally includes Baike encyclopedia data. Limitation: requires clear plant photos; blurry or partial images reduce accuracy. Output: {result: [{name: string, score: number, baike_info: {description, image_url}}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        baike_num: { type: 'number', description: 'Number of Baidu Baike entries to return. Default: 0' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_animal',
    description: 'Identifies animal species from images. Use for: wildlife identification, pet breed detection, educational apps, or animal encyclopedias. Do NOT use for: plant identification (use baidu_plant), or general object detection (use baidu_object_detect). Behavior: recognizes 10,000+ animal species including mammals, birds, reptiles, fish, and insects; returns common and scientific names with confidence. Limitation: may confuse similar-looking breeds; works best on clear, well-lit photos of the animal\'s face/body. Output: {result: [{name: string, score: number, baike_info: {description, image_url}}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        baike_num: { type: 'number', description: 'Number of Baidu Baike entries to return. Default: 0' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_dish',
    description: 'Identifies dishes and food items from images. Use for: food logging apps, restaurant menu digitization, dietary tracking, or calorie estimation. Do NOT use for: ingredient identification (use baidu_ingredient), or general image recognition (use baidu_image_recognition). Behavior: recognizes 50,000+ dishes from various cuisines; returns dish name, confidence, calorie estimate, and optional Baike info. Limitation: homemade or hybrid dishes may not be recognized; calorie estimates are approximate. Output: {result: [{name: string, score: number, calorie: number, baike_info: {description, image_url}}], result_num: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        baike_num: { type: 'number', description: 'Number of Baidu Baike entries to return. Default: 0' },
        top_num: { type: 'number', description: 'Number of top results to return. Default: 5' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_logo',
    description: 'Detects and identifies brand logos in images. Use for: brand monitoring, sponsorship analysis, advertisement auditing, or competitor tracking. Do NOT use for: general object detection (use baidu_object_detect). Behavior: detects multiple logos in a single image; returns brand name, location, and confidence; supports both library logos and custom logos. Limitation: only recognizes registered brand logos; obscure or local brands may not be found. Output: {result: [{name: string, type: number, location: {top,left,width,height}, probability: number}], result_num: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        type: { type: 'string', description: 'Detection type: 0 (default, return all logos), 1 (return library logos only)' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_car',
    description: 'Identifies vehicle make, model, and year from images. Use for: vehicle identification, parking management, automotive apps, or car listing verification. Do NOT use for: detecting/counting vehicles in traffic (use baidu_vehicle_detect — that tool detects presence and count, not model identification). Behavior: recognizes 3,000+ vehicle models from global brands; returns brand, model, year, and vehicle type with confidence. Limitation: requires a clear view of the vehicle\'s front or rear; side angles reduce accuracy. Output: {result: [{name: string, score: number, year: string, type: string}], result_num: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        type: { type: 'boolean', description: 'Whether to return detailed vehicle type info. Default: false' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ingredient',
    description: 'Identifies food ingredients and raw materials from images. Use for: cooking apps, dietary analysis, grocery identification, or allergen detection. Do NOT use for: identifying prepared dishes (use baidu_dish — that tool identifies cooked food, not raw ingredients). Behavior: recognizes 1,000+ common ingredients including vegetables, fruits, meats, grains, and spices; returns name and confidence. Limitation: processed or mixed ingredients may be misidentified. Output: {result: [{name: string, score: number}], result_num: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        top_num: { type: 'number', description: 'Number of top results to return. Default: 5' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_vehicle_detect',
    description: 'Detects and counts vehicles in images — returns vehicle count, type classification, and bounding boxes. Use for: traffic monitoring, parking lot management, smart city applications, or vehicle flow analysis. Do NOT use for: identifying specific car models (use baidu_car — that tool identifies make/model/year, not just presence). Behavior: detects cars, trucks, buses, and motorcycles; returns count per type and bounding boxes; supports custom detection area via polygon coordinates. Limitation: aerial/overhead angles work best; side views may miss vehicles behind obstacles. Output: {vehicle_num: number, vehicle_info: [{type: string, location: {top,left,width,height}}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        area: { type: 'string', description: 'Detection area as polygon coordinates (optional)' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },

  // ==================== Face & Body (4) ====================
  {
    name: 'baidu_face_detect',
    description: 'Detects faces in images and extracts 10+ facial attributes. Use for: face analysis, demographic estimation, photo organization, or beauty/cosmetics apps. Do NOT use for: comparing two faces to check if same person (use baidu_face_compare). Behavior: detects up to 10 faces per image; extracts attributes: age, beauty score, expression, face shape, gender, glasses, eye status, emotion, race, mask, and quality. Limitation: requires frontal or near-frontal faces; profile views reduce attribute accuracy. Output: {face_num: number, face_list: [{face_token, location: {top,left,width,height}, age: number, gender: {type, probability}, expression: {type, probability}, glasses: {type, probability}, emotion: {type, probability}, mask: {type, probability}, quality: {blur, illumination, completeness}}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        face_field: { type: 'string', description: 'Comma-separated attributes: age, beauty, expression, face_shape, gender, glasses, eye_status, emotion, race, mask, quality. Default: empty (location only)' },
        max_face_num: { type: 'number', description: 'Maximum number of faces to detect. Default: 10' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Face & Body', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_face_compare',
    description: 'Compares two face images and determines if they belong to the same person. Use for: identity verification, duplicate account detection, photo deduplication, or access control. Do NOT use for: detecting faces or extracting attributes (use baidu_face_detect). Behavior: accepts two face images (base64 or URL); extracts facial features and computes similarity; returns score 0-100 where higher = more similar. Automatically handles different image sizes, angles, and lighting conditions. Limitation: both images must contain exactly one clear face; multi-face images may cause errors; sunglasses/masks reduce accuracy. Output: {score: number, threshold: number, face_list: [{face_token}], log_id: number}. Score interpretation: >80 = same person (high confidence), 60-80 = likely same person, <60 = different persons. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image1: { type: 'string', description: 'Base64-encoded first face image data or URL' },
        image2: { type: 'string', description: 'Base64-encoded second face image data or URL' },
        image_type: { type: 'string', description: 'Image type: BASE64 (default) or URL' }
      },
      required: ['image1', 'image2']
    },
    annotations: { readOnlyHint: true, category: 'Face & Body', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_body_analysis',
    description: 'Analyzes human body attributes in images — detects people and extracts clothing/pose attributes. Use for: crowd analytics, retail fashion analysis, fitness/sports apps, or surveillance. Do NOT use for: face analysis (use baidu_face_detect), or gesture recognition (use baidu_gesture). Behavior: detects multiple bodies; extracts gender, upper/lower clothing color, clothing type, and body orientation. Limitation: works best on standing persons; seated or partially occluded bodies reduce accuracy. Output: {person_num: number, person_info: [{attributes: {gender: {type, probability}, upper_color: {type, probability}, lower_color: {type, probability}, orientation: {type, probability}, location: {top,left,width,height}}}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        type: { type: 'string', description: 'Attribute set to detect. Default: gender,upper_color,lower_color,orientation' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Face & Body', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_gesture',
    description: 'Detects and recognizes hand gestures in images. Use for: touchless interfaces, sign language translation, interactive installations, or gaming. Do NOT use for: body analysis (use baidu_body_analysis), or face detection (use baidu_face_detect). Behavior: recognizes 20+ gesture types including fist, open palm, OK sign, thumbs up, victory, and counting gestures; returns gesture classification and hand keypoints. Limitation: requires visible hand(s); complex overlapping gestures may be misclassified. Output: {result: [{classname: string, probability: number, location: {top,left,width,height}, handparts: {keypoints: [{x, y}]}}], result_num: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Face & Body', pricing: '$0.001/call' }
  },

  // ==================== Image Processing (1) ====================
  {
    name: 'baidu_image_enhance',
    description: 'Enhances image quality through AI-powered denoising, dehazing, and clarity improvement. Use for: improving low-quality photos, removing haze from landscape images, enhancing document scans, or preparing images for OCR (enhance before calling baidu_ocr for better results). Do NOT use for: generating new images (use baidu_image_gen), or editing image content (use baidu_image_edit). Behavior: applies one of four enhancement modes — contrast_enhance, dehaze, denoising, or clarity_enhance — based on the type parameter. Returns a new enhanced image, original is not modified. Limitation: output is base64-encoded image data (not a URL); large images may take 3-5s to process. Output: {image: base64_string, type: string, log_id: number}. Pricing: $0.001/call.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        type: { type: 'string', description: 'Enhancement type: contrast_enhance (contrast), dehaze (dehazing), denoising (noise reduction), clarity_enhance (clarity). Default: contrast_enhance' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: false, category: 'Image Processing', pricing: '$0.001/call' }
  },

  // ==================== Image Generation (2) ====================
  {
    name: 'baidu_image_gen',
    description: 'Generates new images from text descriptions using Baidu AI image generation model. Use for: creating illustrations, concept art, marketing visuals, social media graphics, or any creative content from text prompts. Do NOT use for: editing existing images (use baidu_image_edit), or enhancing image quality (use baidu_image_enhance). Behavior: accepts detailed text prompt with style, content, and composition instructions; supports 4 art styles (realistic, anime, sketch, oil_painting, 3d); generates 1-4 images per call. Limitation: generation takes 5-15 seconds; prompt quality directly affects output quality — be specific about subject, style, lighting, and composition. Output: {images: [{base64: string, url: string}], seed: number, log_id: number}. Pricing: $0.03/call.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Text description of the image to generate. Be specific about style, content, and composition.' },
        size: { type: 'string', description: 'Image size: 1024x1024 (default), 1024x576, 576x1024, 768x768' },
        n: { type: 'number', description: 'Number of images to generate (1-4). Default: 1' },
        style: { type: 'string', description: 'Art style: realistic, anime, sketch, oil_painting, 3d. Default: realistic' }
      },
      required: ['prompt']
    },
    annotations: { readOnlyHint: false, category: 'Image Generation', pricing: '$0.03/call' }
  },
  {
    name: 'baidu_image_edit',
    description: 'Edits existing images using natural language instructions — add, remove, or modify elements via text commands. Use for: background removal, object removal, style transfer, color changes, or any targeted image modification. Do NOT use for: generating new images from scratch (use baidu_image_gen), or quality enhancement without content change (use baidu_image_enhance). Behavior: takes a source image + text instruction describing the edit; optionally accepts a mask image (white regions = editable, black = preserved) for precise control. Supports inpainting, outpainting, and style transfer. Limitation: edit instruction must be clear and specific; complex multi-element edits may produce artifacts; processing takes 5-15 seconds. Output: {image: base64_string, log_id: number}. Pricing: $0.03/call.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded source image data or publicly accessible image URL' },
        prompt: { type: 'string', description: 'Editing instruction describing what to change (e.g., "remove background", "change hair color to blonde")' },
        mask: { type: 'string', description: 'Optional base64-encoded mask image defining editable region (white = editable)' }
      },
      required: ['image', 'prompt']
    },
    annotations: { readOnlyHint: false, category: 'Image Generation', pricing: '$0.03/call' }
  },

  // ==================== Video Generation (2) ====================
  {
    name: 'baidu_video_gen',
    description: 'Generates short videos from text descriptions using Baidu AI video generation model. Use for: creating video clips, animations, motion graphics, social media content, or video ads from text prompts. Do NOT use for: image generation (use baidu_image_gen — faster and cheaper). Behavior: async operation — submits a generation task and returns a task_id; use baidu_video_query to check completion status and retrieve the video URL. Supports 720p and 1080p; duration 1-10 seconds. Limitation: generation takes 2-5 minutes; prompt should include scene description, camera movement, and action details for best results. Output: {task_id: string, status: "pending", log_id: number}. Pricing: $0.08/call.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Text description of the video to generate. Include scene, action, camera movement, and duration details.' },
        model: { type: 'string', description: 'Video model: wenkai-video (default) or other available models' },
        duration: { type: 'number', description: 'Video duration in seconds (1-10). Default: 5' },
        resolution: { type: 'string', description: 'Video resolution: 720p (default) or 1080p' }
      },
      required: ['prompt']
    },
    annotations: { readOnlyHint: false, category: 'Video Generation', pricing: '$0.08/call' }
  },
  {
    name: 'baidu_video_query',
    description: 'Checks the status and retrieves the result of an async video generation task submitted via baidu_video_gen. Use after calling baidu_video_gen to poll for completion. Do NOT use for: initiating video generation (use baidu_video_gen). Behavior: takes a task_id and returns current status; when status is "success", includes video download URL. Poll every 30-60 seconds — typical generation takes 2-5 minutes. Limitation: download URL is valid for 24 hours; video must be downloaded before expiry. Output: {task_status: "pending"|"running"|"success"|"failed", progress: number, video_url: string (when complete), error_msg: string (when failed), log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task ID returned by baidu_video_gen' }
      },
      required: ['task_id']
    },
    annotations: { readOnlyHint: true, category: 'Video Generation', pricing: '$0.001/call' }
  },

  // ==================== NLP (6) ====================
  {
    name: 'baidu_nlp',
    description: 'Performs Chinese natural language processing — lexical analysis, word segmentation, and POS tagging. Use for: Chinese text tokenization, part-of-speech analysis, dependency parsing, or preparing Chinese text for downstream processing. Do NOT use for: sentiment analysis (use baidu_sentiment), text summarization (use baidu_summary), or keyword extraction (use baidu_keyword_extraction). Behavior: supports two tasks — "lexer" (word segmentation + POS tagging) and "dep" (dependency parsing); optimized for Chinese language. Limitation: not suitable for non-Chinese text; max 2048 characters per request. Output: {items: [{word: string, pos: string, offset: number, length: number, items: [{word, pos, offset, length}]}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Input text for NLP analysis (max 2048 characters)' },
        task: { type: 'string', description: 'NLP task: lexer (word segmentation + POS), dep (dependency parsing), default: lexer' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_sentiment',
    description: 'Analyzes sentiment and emotional tone of text — classifies as positive, negative, or neutral with confidence scores. Use for: brand monitoring, customer feedback analysis, social media sentiment tracking, or product review analysis. Do NOT use for: keyword extraction (use baidu_keyword_extraction), or text summarization (use baidu_summary). Behavior: supports general-purpose and finance-domain models; returns sentiment classification, probability (0-1), and intensity (0-1) for positive/negative/neutral classes. Limitation: optimized for Chinese and English; sarcasm and mixed sentiment may reduce accuracy. Output: {items: [{sentiment: "positive"|"negative"|"neutral", probability: number, confidence: number, positive_prob: number, negative_prob: number}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to analyze (max 2048 characters). Supports Chinese and English.' },
        model: { type: 'string', description: 'Model: default (general) or finance (financial domain)' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_summary',
    description: 'Generates concise summaries of long text using Baidu abstractive summarization. Use for: article abstracts, news digests, content previews, or reducing long documents to key points. Do NOT use for: sentiment analysis (use baidu_sentiment), or keyword extraction (use baidu_keyword_extraction). Behavior: takes text (max 3000 chars) and optional title for context; generates a summary of configurable max length; returns compression ratio. Limitation: optimized for Chinese text; very long documents must be chunked; summary quality depends on input text coherence. Output: {summary: string, summary_len: number, compression_ratio: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to summarize (max 3000 characters)' },
        max_summary_len: { type: 'number', description: 'Maximum summary length in characters. Default: 200' },
        title: { type: 'string', description: 'Optional title to guide summarization focus' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_text_corrector',
    description: 'Detects and corrects spelling, grammar, and punctuation errors in Chinese text. Use for: proofreading, content quality assurance, writing assistance, or automated editing. Do NOT use for: English text correction, or sentiment analysis (use baidu_sentiment). Behavior: scans for Chinese-specific errors including homophone confusion, character misuse, punctuation errors, and grammar issues; returns corrected text with error positions and suggestions. Limitation: optimized for Chinese only; cannot correct domain-specific terminology or proper nouns. Output: {corrected_text: string, error_list: [{position: number, original: string, correction: string, type: string}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to correct (max 2000 characters). Optimized for Chinese text.' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_keyword_extraction',
    description: 'Extracts key phrases and keywords from text using Baidu NLP keyword extraction. Use for: content tagging, SEO optimization, document indexing, or topic modeling. Do NOT use for: sentiment analysis (use baidu_sentiment), or text summarization (use baidu_summary). Behavior: analyzes text and returns ranked keywords with relevance weights; supports up to 100,000 characters; configurable number of keywords returned. Limitation: optimized for Chinese text; single-word extraction only (no multi-word phrases). Output: {items: [{score: number, tag: string}], log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Input text for keyword extraction (max 100000 characters)' },
        num: { type: 'number', description: 'Number of keywords to extract. Default: 10' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_word_embedding',
    description: 'Generates word-level vector embeddings for individual words or short phrases. Use for: semantic similarity calculation, word clustering, vocabulary analysis, or as input features for custom NLP models. Do NOT use for: sentence or document embeddings (use baidu_embedding — that tool handles longer texts and is optimized for semantic search). Behavior: maps a single word to a dense vector of configurable dimension (64/128/256/512); higher dimensions capture more semantic nuance. Limitation: single word or short phrase only (max 8 characters); not suitable for sentences or paragraphs. Output: {word: string, vector: [number, ...], dim: number, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Word or short phrase to embed' },
        dim: { type: 'number', description: 'Embedding dimension: 64, 128, 256, 512. Default: 128' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },

  // ==================== Embedding (2) ====================
  {
    name: 'baidu_embedding',
    description: 'Generates dense vector embeddings for text passages using Baidu Embedding model. Use for: semantic search, document clustering, recommendation systems, RAG (Retrieval-Augmented Generation) pipelines, or building vector databases. Do NOT use for: single-word embeddings (use baidu_word_embedding), or reranking search results (use baidu_reranker). Behavior: accepts up to 16 texts per request; supports embedding-v1 (general), bge_large_zh (Chinese-optimized), bge_large_en (English-optimized); returns normalized vectors suitable for cosine similarity. Limitation: max 384 tokens per text; longer texts are truncated. Output: {data: [{object: "embedding", index: number, embedding: [number, ...]}], usage: {prompt_tokens, total_tokens}, model: string, log_id: number}. Pricing: $0.002/1K tokens. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        texts: { type: 'array', description: 'Array of text strings to embed (max 16 texts per request)', items: { type: 'string' } },
        model: { type: 'string', description: 'Embedding model: embedding-v1 (default), bge_large_zh, bge_large_en' }
      },
      required: ['texts']
    },
    annotations: { readOnlyHint: true, category: 'Embedding', pricing: '$0.002/1K tokens' }
  },
  {
    name: 'baidu_reranker',
    description: 'Reranks a list of candidate documents by relevance to a query — improves search precision after initial retrieval. Use for: refining RAG retrieval results, improving search result quality, or reordering candidate documents from any retrieval system. Do NOT use for: generating embeddings (use baidu_embedding — embeddings are for similarity search, reranking is for query-document relevance scoring). Behavior: takes a query and up to 100 candidate documents; computes relevance score for each; returns documents sorted by relevance. Models: reranker-v1 (general), bge_reranker_large (higher accuracy, slower). Limitation: processes up to 100 documents per call; each document max 512 tokens; latency scales with document count. Output: {results: [{index: number, relevance_score: number, document: string}], model: string, log_id: number}. Pricing: $0.002/1K tokens. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query or question text' },
        documents: { type: 'array', description: 'Array of candidate document texts to rerank (max 100)', items: { type: 'string' } },
        model: { type: 'string', description: 'Reranker model: reranker-v1 (default) or bge_reranker_large' },
        top_n: { type: 'number', description: 'Number of top results to return. Default: returns all' }
      },
      required: ['query', 'documents']
    },
    annotations: { readOnlyHint: true, category: 'Embedding', pricing: '$0.002/1K tokens' }
  },

  // ==================== Moderation (2) ====================
  {
    name: 'baidu_text_review',
    description: 'Reviews text content for spam, abuse, profanity, and policy violations. Use for: moderating user-generated content, filtering comments, checking compliance before publishing, or automated content screening. Do NOT use for: image moderation (use baidu_image_review), or sentiment analysis (use baidu_sentiment — that tool analyzes emotion, not policy violations). Behavior: checks text against 6 categories — politics, porn, vulgar, abuse, terrorism, advertising; returns per-category risk level and confidence. Limitation: optimized for Chinese text; English support is limited; context-dependent sarcasm may cause false positives. Output: {results: [{type: string, subType: number, conclusion: "pass"|"reject"|"review", probability: number, hitMsg: string}], conclusion: "pass"|"reject"|"review", log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text content to review (max 20000 characters)' },
        categories: { type: 'array', description: 'Categories to check: politics, porn, vulgar, abuse, terrorism, ad, default: all', items: { type: 'string' } }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'Moderation', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_image_review',
    description: 'Reviews image content for inappropriate, violent, or policy-violating material. Use for: moderating user-uploaded images, content compliance, platform safety, or automated image screening before publishing. Do NOT use for: text moderation (use baidu_text_review), or object detection (use baidu_object_detect — that tool finds objects, this one checks policy compliance). Behavior: checks images against 6 categories — politics, porn, vulgar/abuse, terrorism, advertising, and QR code detection; returns per-category risk level and confidence. Limitation: cartoon/illustration content may have different thresholds than real photos; context-dependent judgment may require human review for borderline cases. Output: {results: [{type: string, subType: number, conclusion: "pass"|"reject"|"review", probability: number, msg: string}], conclusion: "pass"|"reject"|"review", log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        categories: { type: 'array', description: 'Categories: politics, porn, vulgar, abuse, terrorism, ad, default: all', items: { type: 'string' } }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Moderation', pricing: '$0.001/call' }
  },

  // ==================== Science (1) ====================
  {
    name: 'baidu_helixfold',
    description: 'Predicts protein 3D structure from amino acid sequence using Baidu HelixFold — Baidu\'s implementation inspired by AlphaFold. Use for: bioinformatics research, drug discovery, protein engineering, or structural biology studies. Do NOT use for: general AI tasks — this is a specialized scientific tool. Behavior: takes amino acid sequence (single-letter codes, max 2000 residues); predicts 3D folding structure; returns PDB-format coordinates and per-residue confidence (pLDDT) scores. Models: helixfold (standard), helixfold-single (faster, lower accuracy). Limitation: prediction takes 10-30 minutes for long sequences; accuracy drops for sequences >1500 residues; cannot predict protein complexes. Output: {sequence: string, pdb: string, plddt: [{residue: number, score: number}], model: string, log_id: number}. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        sequence: { type: 'string', description: 'Amino acid sequence using single-letter codes (e.g., "MKTV..."). Max 2000 residues.' },
        model: { type: 'string', description: 'Model: helixfold (default) or helixfold-single' }
      },
      required: ['sequence']
    },
    annotations: { readOnlyHint: true, category: 'Science', pricing: '$0.001/call' }
  },

  // ==================== Account (2) ====================
  {
    name: 'register',
    description: 'Registers a new GoldBean API account to access paid endpoints. Use to create an account for any tool that requires authentication. Returns user ID and API key needed for subsequent paid calls. Do NOT use if you already have an account — use check_credits to verify existing credentials. Behavior: creates account with email+password; grants 100 free credits (100 calls) on registration; returns API key for authentication. Limitation: one account per email; API key should be stored securely. Output: {user_id: string, api_key: string, credits: number, plan: "free", log_id: number}. Pricing: Free.',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Email address for account registration and notifications' },
        password: { type: 'string', description: 'Password for account (min 8 characters)' }
      },
      required: ['email', 'password']
    },
    annotations: { readOnlyHint: false, category: 'Account', pricing: 'Free' }
  },
  {
    name: 'check_credits',
    description: 'Checks remaining API credits, usage statistics, and subscription status for a GoldBean account. Use to: monitor usage, check remaining free tier calls, verify subscription plan, or debug authentication issues before calling paid endpoints. Do NOT use for: registering a new account (use register). Behavior: accepts user_id OR api_key for authentication; returns current credit balance, usage history, free tier status, and active subscription. Limitation: only shows data for the authenticated account. Output: {user_id: string, credits_remaining: number, credits_used: number, free_tier: {calls_today: number, limit: number, reset_at: string}, subscription: {plan: string, status: string, expires_at: string}, log_id: number}. Pricing: Free. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'GoldBean user ID' },
        api_key: { type: 'string', description: 'API key for authentication (alternative to user_id)' }
      },
      required: []
    },
    annotations: { readOnlyHint: true, category: 'Account', pricing: 'Free' }
  }
];

// ========== Agent Handoff ==========
var AGENT_HANDOFF = {
  name: 'GoldBean MCP Server',
  version: VERSION,
  description: 'A pay-per-call AI API marketplace providing 51 Baidu AI tools via MCP protocol. Covers OCR, speech, LLM, translation, vision, face & body, image generation, video generation, NLP, embedding, moderation, and protein structure prediction.',
  public_url: PUBLIC_URL,
  api_base: API_BASE,
  pricing_model: 'Pay-per-call starting at $0.001/call. Free tier: 50 calls/day/IP. LLM: $0.002/1K tokens. Image gen: $0.03/call. Video gen: $0.08/call.',
  subscription_plans: ['Starter $5/mo', 'Monthly $9.9/mo', 'Quarterly $25/3mo', 'Yearly $89/yr'],
  free_tier: '50 calls/day/IP, 100 credits on registration',
  tool_count: TOOLS.length,
  categories: ['Service', 'OCR', 'Speech', 'LLM', 'Translation', 'Vision', 'Face & Body', 'Image Processing', 'Image Generation', 'Video Generation', 'NLP', 'Embedding', 'Moderation', 'Science', 'Account'],
  documentation: 'https://goldbean-api.xyz/docs',
  contact: 'wuzenghai616@gmail.com',
  github: 'https://github.com/wuzenghai616-lang/goldbean',
  capabilities: {
    streaming: true,
    batch: false,
    async_tasks: true,
    file_upload: false
  }
};

// ========== Helper Functions ==========

function mapEndpoint(toolName) {
  if (toolName === 'service_health') {
    return { endpoint: '/health', method: 'GET' };
  }
  if (toolName === 'register') {
    return { endpoint: '/paid/user/register', method: 'POST' };
  }
  if (toolName === 'check_credits') {
    return { endpoint: '/paid/user/credits', method: 'GET' };
  }
  var endpoint = '/paid/' + toolName.replace(/_/g, '-');
  return { endpoint: endpoint, method: 'POST' };
}

function proxyToApi(endpoint, method, body) {
  return new Promise(function (resolve, reject) {
    var bodyStr = body ? JSON.stringify(body) : null;

    var options = {
      hostname: '127.0.0.1',
      port: 9879,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (bodyStr) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    var req = http.request(options, function (res) {
      var data = '';
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function () {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
          }
        } else {
          var errMsg;
          try {
            errMsg = JSON.parse(data);
          } catch (e) {
            errMsg = { error: data || 'API returned status ' + res.statusCode };
          }
          reject(new Error(JSON.stringify(errMsg)));
        }
      });
    });

    req.on('error', function (err) {
      reject(err);
    });

    req.setTimeout(60000, function () {
      req.destroy(new Error('Request timeout after 60s'));
    });

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
}

function sendJsonRpcError(res, id, code, message) {
  setCorsHeaders(res);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    jsonrpc: '2.0',
    id: id,
    error: { code: code, message: message }
  }));
}

function sendJsonRpcResult(res, id, result) {
  setCorsHeaders(res);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    jsonrpc: '2.0',
    id: id,
    result: result
  }));
}

// ========== Auth & Audit (Task #23 / #25) ==========
const USERS_FILE = '/opt/goldbean/users.json';
const MCP_AUDIT_LOG = '/opt/goldbean/mcp_audit.log';
// Auth is on by default. Set MCP_REQUIRE_AUTH=false to disable (not recommended).
const MCP_REQUIRE_AUTH = (process.env.MCP_REQUIRE_AUTH || 'true').toLowerCase() !== 'false';
// Optional safety-valve master key. If set, it always authenticates (set via pm2 env).
const MCP_MASTER_KEY = process.env.MCP_MASTER_KEY || '';

function parseQuery(req) {
  try {
    return url.parse(req.url || '', true).query || {};
  } catch (e) {
    return {};
  }
}

function getClientIp(req) {
  var xff = req.headers && req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || '';
}

function extractApiKey(req, query) {
  var key = query.api_key || query.apikey || query.key || '';
  if (!key && req.headers) key = req.headers['x-api-key'] || '';
  if (!key && req.headers && req.headers['authorization']) {
    var m = String(req.headers['authorization']).match(/^Bearer\s+(.+)$/i);
    if (m) key = m[1];
  }
  return String(key || '').trim();
}

// Build apiKey -> user map from users.json (registry GB_ keys + per-user apiKey field).
function loadKeyStore() {
  var store = new Map();
  try {
    var users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    users.forEach(function (u) {
      var id = String(u.userId || '').trim();
      if (id) store.set(id.toLowerCase(), { userId: id, email: u.email || '', name: u.name || '' });
      var ak = String(u.apiKey || '').trim();
      if (ak) store.set(ak.toLowerCase(), { userId: id, email: u.email || '', name: u.name || '' });
    });
  } catch (e) {
    console.error('[auth] Failed to load key store from ' + USERS_FILE + ': ' + e.message);
  }
  return store;
}

// Returns { ok, user?, reason? }. `register` tool is handled as public by the caller.
function checkAuth(apiKey, profile, clientIp) {
  if (!MCP_REQUIRE_AUTH) return { ok: true, user: null, bypass: true };
  if (MCP_MASTER_KEY && apiKey && apiKey === MCP_MASTER_KEY) return { ok: true, user: { userId: 'master' }, master: true };
  if (!apiKey) return { ok: false, reason: 'missing api_key' };
  var entry = loadKeyStore().get(String(apiKey).toLowerCase());
  if (!entry) return { ok: false, reason: 'invalid api_key' };
  return { ok: true, user: entry };
}

function auditLog(record) {
  try {
    fs.appendFileSync(MCP_AUDIT_LOG, JSON.stringify(record) + '\n');
  } catch (e) {
    console.error('[audit] Failed to write audit log: ' + e.message);
  }
}

// ========== JSON-RPC Method Handlers ==========

function handleInitialize(params) {
  return {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: { listChanged: false },
      resources: { listChanged: false },
      prompts: { listChanged: false }
    },
    serverInfo: {
      name: AGENT_HANDOFF.name,
      version: VERSION
    },
    agentHandoff: AGENT_HANDOFF
  };
}

function handleToolsList() {
  return { tools: TOOLS };
}

function handleResourcesList() {
  return {
    resources: [
      {
        uri: PUBLIC_URL + '/docs',
        name: 'GoldBean API Documentation',
        description: 'Full API documentation with examples and pricing details',
        mimeType: 'text/html'
      },
      {
        uri: PUBLIC_URL + '/pricing',
        name: 'GoldBean Pricing',
        description: 'Complete pricing table for all 51 tools and subscription plans',
        mimeType: 'text/html'
      }
    ]
  };
}

function handlePromptsList() {
  return {
    prompts: [
      {
        name: 'ocr_workflow',
        description: 'Guide for selecting the right OCR tool based on document type',
        arguments: [
          { name: 'document_type', description: 'Type of document: general, idcard, table, handwriting, business_license', required: true }
        ]
      },
      {
        name: 'vision_workflow',
        description: 'Guide for selecting the right vision tool based on image content',
        arguments: [
          { name: 'image_content', description: 'What is in the image: objects, food, plants, animals, cars, faces, landmarks', required: true }
        ]
      }
    ]
  };
}

async function handleToolsCall(params, ctx) {
  var toolName = params.name;
  var args = params.arguments || {};

  var tool = TOOLS.find(function (t) {
    return t.name === toolName;
  });

  if (!tool) {
    throw new Error('Unknown tool: ' + toolName);
  }

  var mapped = mapEndpoint(toolName);
  var endpoint = mapped.endpoint;
  var httpMethod = mapped.method;

  var requestBody = httpMethod === 'GET' ? null : args;
  if (httpMethod === 'GET' && Object.keys(args).length > 0) {
    var queryString = Object.keys(args).map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(args[key]);
    }).join('&');
    endpoint = endpoint + '?' + queryString;
  }

  var result;
  try {
    result = await proxyToApi(endpoint, httpMethod, requestBody);
  } catch (proxyErr) {
    auditLog({
      ts: new Date().toISOString(),
      event: 'tools/call',
      tool: toolName,
      ip: ctx ? ctx.clientIp : '',
      apiKey: ctx ? ctx.apiKey : '',
      profile: ctx ? ctx.profile : '',
      userId: ctx && ctx.user ? ctx.user.userId : null,
      success: false,
      error: String(proxyErr && proxyErr.message ? proxyErr.message : proxyErr)
    });
    throw proxyErr;
  }

  auditLog({
    ts: new Date().toISOString(),
    event: 'tools/call',
    tool: toolName,
    ip: ctx ? ctx.clientIp : '',
    apiKey: ctx ? ctx.apiKey : '',
    profile: ctx ? ctx.profile : '',
    userId: ctx && ctx.user ? ctx.user.userId : null,
    success: true
  });

  var textContent;
  if (typeof result === 'string') {
    textContent = result;
  } else {
    textContent = JSON.stringify(result, null, 2);
  }

  return {
    content: [
      { type: 'text', text: textContent }
    ],
    isError: false
  };
}

// ========== HTTP Server ==========

var server = http.createServer(async function (req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET: Health info
  if (req.method === 'GET') {
    var healthInfo = {
      service: AGENT_HANDOFF.name,
      version: VERSION,
      status: 'running',
      public_url: PUBLIC_URL,
      tool_count: TOOLS.length,
      categories: AGENT_HANDOFF.categories,
      pricing_model: AGENT_HANDOFF.pricing_model,
      free_tier: AGENT_HANDOFF.free_tier,
      endpoints: {
        initialize: 'POST / (JSON-RPC method: initialize)',
        tools_list: 'POST / (JSON-RPC method: tools/list)',
        tools_call: 'POST / (JSON-RPC method: tools/call)',
        resources_list: 'POST / (JSON-RPC method: resources/list)',
        prompts_list: 'POST / (JSON-RPC method: prompts/list)'
      },
      documentation: AGENT_HANDOFF.documentation
    };
    setCorsHeaders(res);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthInfo, null, 2));
    return;
  }

  // POST: JSON-RPC 2.0
  if (req.method === 'POST') {
    var reqQuery = parseQuery(req);
    var reqClientIp = getClientIp(req);
    var reqApiKey = extractApiKey(req, reqQuery);
    var reqProfile = reqQuery.profile || '';
    var body = '';
    req.on('data', function (chunk) {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        sendJsonRpcError(res, null, -32600, 'Request body too large (max 10MB)');
        req.destroy();
      }
    });

    req.on('end', async function () {
      var rpcId = null;
      var rpcMethod = null;

      try {
        var parsed = JSON.parse(body);
        rpcId = parsed.id !== undefined ? parsed.id : null;
        rpcMethod = parsed.method;

        if (!parsed.jsonrpc || parsed.jsonrpc !== '2.0') {
          sendJsonRpcError(res, rpcId, -32600, 'Invalid Request: jsonrpc must be "2.0"');
          return;
        }

        if (!rpcMethod) {
          sendJsonRpcError(res, rpcId, -32600, 'Invalid Request: method is required');
          return;
        }

        var params = parsed.params || {};

        // ---- Auth gate: all POST JSON-RPC except the public 'register' tool ----
        var isPublicRegister = (rpcMethod === 'tools/call' && params.name === 'register');
        var authz = isPublicRegister ? { ok: true, user: null, public: true } : checkAuth(reqApiKey, reqProfile, reqClientIp);
        if (!authz.ok) {
          auditLog({
            ts: new Date().toISOString(),
            event: 'auth_denied',
            ip: reqClientIp,
            apiKey: reqApiKey,
            profile: reqProfile,
            reason: authz.reason
          });
          setCorsHeaders(res);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized', message: authz.reason }));
          return;
        }
        var reqCtx = {
          apiKey: reqApiKey,
          profile: reqProfile,
          clientIp: reqClientIp,
          user: authz.user || null
        };

        var result;

        switch (rpcMethod) {
          case 'initialize':
            result = handleInitialize(params);
            sendJsonRpcResult(res, rpcId, result);
            break;

          case 'tools/list':
            result = handleToolsList();
            sendJsonRpcResult(res, rpcId, result);
            break;

          case 'tools/call':
            if (!params.name) {
              sendJsonRpcError(res, rpcId, -32602, 'Invalid params: tool name is required');
              return;
            }
            try {
              result = await handleToolsCall(params, reqCtx);
              sendJsonRpcResult(res, rpcId, result);
            } catch (callErr) {
              var callErrMsg = callErr.message || 'Tool execution failed';
              sendJsonRpcResult(res, rpcId, {
                content: [{ type: 'text', text: 'Error: ' + callErrMsg }],
                isError: true
              });
            }
            break;

          case 'resources/list':
            result = handleResourcesList();
            sendJsonRpcResult(res, rpcId, result);
            break;

          case 'prompts/list':
            result = handlePromptsList();
            sendJsonRpcResult(res, rpcId, result);
            break;

          default:
            sendJsonRpcError(res, rpcId, -32601, 'Method not found: ' + rpcMethod);
        }

      } catch (parseErr) {
        sendJsonRpcError(res, null, -32700, 'Parse error: ' + parseErr.message);
      }
    });

    req.on('error', function (err) {
      sendJsonRpcError(res, null, -32603, 'Internal error: ' + err.message);
    });

    return;
  }

  // Other methods
  setCorsHeaders(res);
  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed. Use GET or POST.' }));
});

// ========== Start Server ==========

server.listen(PORT, '0.0.0.0', function () {
  console.log('[GoldBean MCP HTTP Server] v' + VERSION);
  console.log('[GoldBean MCP HTTP Server] Listening on port ' + PORT);
  console.log('[GoldBean MCP HTTP Server] Tools: ' + TOOLS.length);
  console.log('[GoldBean MCP HTTP Server] API Base: ' + API_BASE);
  console.log('[GoldBean MCP HTTP Server] Public URL: ' + PUBLIC_URL);
  console.log('[GoldBean MCP HTTP Server] Ready for JSON-RPC 2.0 connections');
});

server.on('error', function (err) {
  if (err.code === 'EADDRINUSE') {
    console.error('[GoldBean MCP HTTP Server] Port ' + PORT + ' is already in use');
  } else {
    console.error('[GoldBean MCP HTTP Server] Server error: ' + err.message);
  }
  process.exit(1);
});

process.on('SIGINT', function () {
  console.log('\n[GoldBean MCP HTTP Server] Shutting down...');
  server.close(function () {
    process.exit(0);
  });
});

process.on('SIGTERM', function () {
  server.close(function () {
    process.exit(0);
  });
});
