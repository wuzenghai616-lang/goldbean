'use strict';

const http = require('http');

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
    description: 'Checks the health status of the GoldBean API service. Use to verify service availability before making other API calls or for uptime monitoring. Returns JSON with status, uptime, version, and active endpoint count. Pricing: Free. Read-only.',
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
    description: 'Recognizes text in images using Baidu General OCR engine. Use when you need to extract text from photos, screenshots, or scanned documents. Supports Chinese, English, and multi-language text. Returns JSON with recognized words, bounding boxes, and confidence scores. Pricing: $0.001/call. Read-only.',
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
    description: 'Performs high-accuracy text recognition on images using Baidu Accurate OCR engine. Use when standard OCR results are insufficient and higher precision is needed for complex or low-quality images. Returns JSON with recognized text, character-level bounding boxes, and confidence scores. Pricing: $0.001/call. Read-only.',
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
    description: 'Extracts table structure and text from images using Baidu Table OCR. Use when you need to parse tabular data from screenshots or scanned spreadsheets. Returns JSON with table cells, row/column structure, and cell text content. Pricing: $0.001/call. Read-only.',
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
    description: 'Extracts information from Chinese ID cards (front and back) using Baidu ID Card OCR. Use to automate identity verification or form filling from ID card photos. Returns JSON with name, gender, nationality, birth date, address, ID number (front) or issuing authority, validity period (back). Pricing: $0.001/call. Read-only.',
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
    description: 'Recognizes handwritten text in images using Baidu Handwriting OCR. Use to digitize handwritten notes, forms, or signatures. Returns JSON with recognized handwritten text, word bounding boxes, and confidence scores. Pricing: $0.001/call. Read-only.',
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
    description: 'Detects and decodes QR codes and barcodes in images using Baidu QR Code OCR. Use to extract information from QR codes, barcodes, or QR-based payment codes. Returns JSON with decoded text content, code type, and bounding box position. Pricing: $0.001/call. Read-only.',
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
    description: 'Extracts bank card number and type from images using Baidu Bank Card OCR. Use to automate payment form filling or card information digitization. Returns JSON with bank card number, card type (debit/credit), and bank name. Pricing: $0.001/call. Read-only.',
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
    description: 'Extracts information from Chinese business license images using Baidu Business License OCR. Use to automate company registration data entry or business verification workflows. Returns JSON with company name, unified social credit code, legal representative, registered capital, establishment date, business scope, and address. Pricing: $0.001/call. Read-only.',
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
    description: 'Extracts text from web images using Baidu Web Image OCR. Optimized for images with complex backgrounds, watermarks, or non-standard fonts commonly found online. Returns JSON with recognized text, word bounding boxes, and confidence scores. Pricing: $0.001/call. Read-only.',
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
    description: 'Performs OCR using DeepSeek vision model for complex document understanding. Use when traditional OCR fails on complex layouts, mixed content, or documents requiring contextual understanding. Returns JSON with structured text extraction and layout analysis. Pricing: $0.001/call. Read-only.',
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
    description: 'Uses PaddleOCR-VL vision-language model for advanced document understanding and text extraction. Use for complex documents with tables, formulas, stamps, or mixed layouts that require visual-language reasoning. Returns JSON with structured extraction results including text, tables, and layout information. Pricing: $0.001/call. Read-only.',
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
    description: 'Performs custom OCR using Qianfan platform template-based recognition. Use when you have a specific document template configured on Qianfan and need structured field extraction. Returns JSON with template-specific field values and confidence scores. Pricing: $0.001/call. Read-only.',
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
    description: 'Converts text to natural-sounding speech using Baidu Text-to-Speech engine. Use to generate audio for content, accessibility features, or voice assistants. Supports Chinese and English with multiple voice options. Returns audio data in MP3 or WAV format (base64-encoded). Pricing: $0.001/call.',
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
    description: 'Converts speech audio to text using Baidu Automatic Speech Recognition. Use to transcribe voice recordings, build voice commands, or enable speech-to-text features. Supports Chinese and English audio. Returns JSON with transcribed text and word-level timestamps. Pricing: $0.001/call. Read-only.',
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
    description: 'Generates text responses using Baidu large language models (ERNIE series). Use for conversational AI, text generation, question answering, summarization, code generation, and reasoning tasks. Returns JSON with generated text, finish reason, and token usage. Pricing: $0.002/1K tokens.',
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
    description: 'Performs deep reasoning tasks using Baidu ERNIE with extended thinking capability. Use for complex multi-step reasoning, mathematical proofs, logical analysis, and tasks requiring deliberate thought chains. Returns JSON with reasoning process, final answer, and token usage. Pricing: $0.002/1K tokens.',
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
    description: 'Analyzes images through conversational interface using Baidu vision-language model. Use to ask questions about image content, describe scenes, answer visual questions, or perform image-based reasoning. Returns JSON with text response describing or answering questions about the image. Pricing: $0.002/1K tokens.',
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
    description: 'Translates text between languages using Baidu Translation API. Supports over 20 languages including Chinese, English, Japanese, Korean, French, German, Spanish, Russian, and more. Returns JSON with translated text and detected source language. Pricing: $0.001/call. Read-only.',
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
    description: 'Performs general image recognition to identify objects, scenes, and concepts using Baidu Image Recognition. Use to tag images, categorize content, or build image search features. Returns JSON with recognized labels, confidence scores, and optional Baidu Baike entries. Pricing: $0.001/call. Read-only.',
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
    description: 'Detects and locates multiple objects in images using Baidu Object Detection. Use to find and count items, build inventory systems, or enable object-based image search. Returns JSON with detected object names, bounding boxes, and confidence scores. Pricing: $0.001/call. Read-only.',
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
    description: 'Identifies landmarks and famous locations in images using Baidu Landmark Recognition. Use to tag travel photos, build location-based services, or identify tourist attractions. Returns JSON with landmark name, confidence score, and location coordinates. Pricing: $0.001/call. Read-only.',
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
    description: 'Identifies plant species from images using Baidu Plant Recognition. Use for botanical identification, gardening apps, or nature education tools. Returns JSON with plant name, confidence score, and optional Baidu Baike information. Pricing: $0.001/call. Read-only.',
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
    description: 'Identifies animal species from images using Baidu Animal Recognition. Use for wildlife identification, pet breed detection, or educational applications. Returns JSON with animal name, confidence score, and optional Baidu Baike information. Pricing: $0.001/call. Read-only.',
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
    description: 'Identifies dishes and food items from images using Baidu Dish Recognition. Use for food logging, restaurant menu digitization, or dietary tracking apps. Returns JSON with dish name, confidence score, calorie estimate, and optional Baidu Baike information. Pricing: $0.001/call. Read-only.',
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
    description: 'Detects and identifies brand logos in images using Baidu Logo Recognition. Use for brand monitoring, advertisement analysis, or sponsorship tracking. Returns JSON with logo name, bounding box, and confidence score. Pricing: $0.001/call. Read-only.',
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
    description: 'Identifies vehicle make, model, and year from images using Baidu Car Recognition. Use for vehicle identification, parking management, or automotive apps. Returns JSON with car brand, model, year, and confidence score. Pricing: $0.001/call. Read-only.',
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
    description: 'Identifies food ingredients and raw materials from images using Baidu Ingredient Recognition. Use for cooking apps, dietary analysis, or grocery identification. Returns JSON with ingredient name and confidence score. Pricing: $0.001/call. Read-only.',
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
    description: 'Detects and counts vehicles in images using Baidu Vehicle Detection. Use for traffic monitoring, parking lot management, or smart city applications. Returns JSON with vehicle count, types (car, truck, bus, motorcycle), and bounding boxes. Pricing: $0.001/call. Read-only.',
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
    description: 'Detects faces in images and extracts facial attributes using Baidu Face Detection. Use for face analysis, demographic estimation, or photo organization. Returns JSON with face count, bounding boxes, and attributes (age, gender, expression, glasses, race, mask). Pricing: $0.001/call. Read-only.',
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
    description: 'Compares two face images to determine if they belong to the same person using Baidu Face Comparison. Use for identity verification, duplicate account detection, or photo matching. Returns JSON with similarity score (0-100), threshold pass/fail, and face token pairs. Pricing: $0.001/call. Read-only.',
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
    description: 'Analyzes human body attributes in images using Baidu Body Analysis. Use for crowd analytics, retail analytics, or fitness applications. Returns JSON with body count, bounding boxes, and attributes (gender, upper/lower clothing color, orientation). Pricing: $0.001/call. Read-only.',
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
    description: 'Detects and recognizes hand gestures in images using Baidu Gesture Recognition. Use for touchless interfaces, sign language translation, or interactive applications. Returns JSON with detected gesture classification, hand bounding boxes, and keypoint coordinates. Pricing: $0.001/call. Read-only.',
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
    description: 'Enhances image quality through denoising, dehazing, and clarity improvement using Baidu Image Enhancement. Use to improve low-quality photos, remove haze from landscape images, or enhance document scans. Returns base64-encoded enhanced image data. Pricing: $0.001/call.',
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
    description: 'Generates images from text descriptions using Baidu AI image generation model. Use to create illustrations, concept art, marketing visuals, or creative content from text prompts. Returns JSON with base64-encoded generated image(s) and metadata. Pricing: $0.03/call.',
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
    description: 'Edits images using text instructions with Baidu AI image editing model. Use to modify existing images, add/remove objects, change styles, or apply transformations via natural language. Returns JSON with base64-encoded edited image. Pricing: $0.03/call.',
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
    description: 'Generates videos from text descriptions using Baidu AI video generation model. Use to create short video clips, animations, or motion graphics from text prompts. Returns JSON with task ID for async video generation (use baidu_video_query to check status). Pricing: $0.08/call.',
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
    description: 'Queries the status and result of an async video generation task. Use after calling baidu_video_gen to check if the video is ready for download. Returns JSON with task status (pending, running, success, failed), progress percentage, and video download URL when complete. Pricing: $0.001/call. Read-only.',
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
    description: 'Performs general natural language processing tasks using Baidu NLP engine. Use for lexical analysis, word segmentation, part-of-speech tagging, and basic text understanding. Returns JSON with tokenized words, POS tags, and dependency parsing results. Pricing: $0.001/call. Read-only.',
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
    description: 'Analyzes sentiment and emotional tone of text using Baidu Sentiment Analysis. Use for brand monitoring, customer feedback analysis, or social media sentiment tracking. Returns JSON with sentiment classification (positive, negative, neutral), confidence probability, and sentiment intensity. Pricing: $0.001/call. Read-only.',
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
    description: 'Generates concise summaries of long text using Baidu Text Summarization. Use to create article abstracts, news digests, or content previews. Returns JSON with summary text and compression ratio. Pricing: $0.001/call. Read-only.',
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
    description: 'Detects and corrects spelling, grammar, and punctuation errors in Chinese text using Baidu Text Correction. Use for proofreading, content quality assurance, or writing assistance. Returns JSON with corrected text, error positions, and correction suggestions. Pricing: $0.001/call. Read-only.',
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
    description: 'Extracts key phrases and keywords from text using Baidu Keyword Extraction. Use for content tagging, SEO optimization, or document indexing. Returns JSON with ranked keywords, weights, and relevance scores. Pricing: $0.001/call. Read-only.',
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
    description: 'Generates word-level vector embeddings using Baidu Word Embedding. Use for semantic similarity calculation, word clustering, or as input features for downstream NLP models. Returns JSON with word vector (float array) and dimension info. Pricing: $0.001/call. Read-only.',
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
    description: 'Generates dense vector embeddings for text using Baidu Embedding model. Use for semantic search, document clustering, recommendation systems, or RAG (Retrieval-Augmented Generation) pipelines. Returns JSON with embedding vectors and token counts. Pricing: $0.002/1K tokens.',
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
    description: 'Reranks documents by relevance to a query using Baidu Reranker model. Use to improve search result quality, refine RAG retrieval, or reorder candidate documents. Returns JSON with reranked document indices and relevance scores. Pricing: $0.002/1K tokens.',
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
    description: 'Reviews text content for spam, abuse, profanity, and policy violations using Baidu Text Moderation. Use for user-generated content filtering, comment moderation, or compliance checking. Returns JSON with risk labels, confidence scores, and violation details. Pricing: $0.001/call. Read-only.',
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
    description: 'Reviews image content for inappropriate, violent, or policy-violating material using Baidu Image Moderation. Use for user-uploaded image filtering, content compliance, or platform safety. Returns JSON with risk labels, confidence scores, and violation details. Pricing: $0.001/call. Read-only.',
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
    description: 'Predicts protein 3D structure from amino acid sequence using Baidu HelixFold. Use for bioinformatics research, drug discovery, or protein engineering. Returns JSON with predicted structure (PDB format), confidence scores (pLDDT), and model metadata. Pricing: $0.001/call. Read-only.',
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
    description: 'Registers a new GoldBean API account. Use to create an account for accessing paid API endpoints. Returns JSON with user ID, API key, and initial free credits (100 credits = 100 calls). Pricing: Free.',
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
    description: 'Checks remaining API credits and usage statistics for a GoldBean account. Use to monitor usage, check remaining free tier calls, or verify subscription status. Returns JSON with remaining credits, used credits, free tier status, and subscription plan. Pricing: Free. Read-only.',
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

async function handleToolsCall(params) {
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

  var result = await proxyToApi(endpoint, httpMethod, requestBody);

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
              result = await handleToolsCall(params);
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
