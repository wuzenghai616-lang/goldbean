#!/usr/bin/env node
/**
 * GoldBean MCP v2 Stateless HTTP Adapter
 * Compatible with MCP 2026-07-28 specification
 * 
 * Changes from v1:
 * - Removed initialize/initialized handshake
 * - Removed Mcp-Session-Id header
 * - Each request is self-contained with _meta field
 * - Protocol version carried in MCP-Protocol-Version header
 * - Stateless: no session state maintained server-side
 */

'use strict';

const http = require('http');
const https = require('https');

// ========== Configuration ==========
const API_BASE = process.env.GOLDBEAN_API_BASE || 'http://127.0.0.1:9879';
const PUBLIC_URL = process.env.GOLDBEAN_PUBLIC_URL || 'https://goldbean-api.xyz';
const VERSION = '10.0.0';
const PROTOCOL_VERSION = '2026-07-28';
const MCP_PORT = process.env.MCP_PORT || 9878;

// ========== v2 Protocol Constants ==========
const V2_HEADERS = {
  PROTOCOL_VERSION: 'MCP-Protocol-Version',
  METHOD: 'Mcp-Method',
  NAME: 'Mcp-Name',
};

// ========== Tools Definition (51 Baidu AI Tools) ==========
const TOOLS = [
  // ==================== Service (1) ====================
  {
    name: 'service_health',
    description: 'Checks the health status of the GoldBean API service. Use to verify service availability before making other API calls or for uptime monitoring. Returns JSON with status, uptime, version, and active endpoint count. Pricing: Free. Read-only.',
    inputSchema: { type: 'object', properties: {}, required: [] },
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
    name: 'baidu_ocr_business_license',
    description: 'Extracts information from Chinese business license images using Baidu Business License OCR. Use to automate business registration verification or supplier onboarding. Returns JSON with unified social credit code, company name, type, address, legal representative, registered capital, establishment date, validity period, and business scope. Pricing: $0.001/call. Read-only.',
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
    name: 'baidu_ocr_bank_card',
    description: 'Extracts information from bank card images using Baidu Bank Card OCR. Use to automate payment card entry or financial document processing. Returns JSON with bank card number, bank name, card type (debit/credit), and validity period. Pricing: $0.001/call. Read-only.',
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
    name: 'baidu_ocr_driving_license',
    description: 'Extracts information from Chinese driving license images using Baidu Driving License OCR. Use for driver verification or insurance claim processing. Returns JSON with name, gender, nationality, address, birth date, issue date, class, valid from, valid until, and issuing authority. Pricing: $0.001/call. Read-only.',
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
    name: 'baidu_ocr_vehicle_license',
    description: 'Extracts information from Chinese vehicle license images using Baidu Vehicle License OCR. Use for fleet management or insurance processing. Returns JSON with plate number, vehicle type, owner, address, brand model, VIN, engine number, registration date, and issue date. Pricing: $0.001/call. Read-only.',
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
    name: 'baidu_ocr_passport',
    description: 'Extracts information from passport images using Baidu Passport OCR. Use for international identity verification or visa processing. Returns JSON with passport number, name, nationality, date of birth, sex, date of expiry, date of issue, place of birth, and issuing authority. Pricing: $0.001/call. Read-only.',
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
    name: 'baidu_ocr_invoice',
    description: 'Extracts information from Chinese VAT invoices using Baidu Invoice OCR. Use for automated expense reporting or accounting. Returns JSON with invoice type, code, number, date, amount, seller info, buyer info, and item details. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.001/call' }
  },
  // ==================== NLP (8) ====================
  {
    name: 'baidu_sentiment',
    description: 'Analyzes sentiment of Chinese text using Baidu NLP Sentiment Analysis. Use to gauge public opinion, customer satisfaction, or brand perception. Returns JSON with sentiment label (positive/negative/neutral) and confidence score. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Chinese text to analyze. Max 2048 characters.' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_ner',
    description: 'Performs Named Entity Recognition on Chinese text using Baidu NLP NER. Use to extract entities like persons, organizations, locations, products from unstructured text. Returns JSON with entity list, types, and positions. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Chinese text to analyze. Max 4096 characters.' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_text_similarity',
    description: 'Calculates semantic similarity between two Chinese texts using Baidu NLP. Use for duplicate detection, content matching, or recommendation systems. Returns JSON with similarity score (0-1). Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text1: { type: 'string', description: 'First text for comparison' },
        text2: { type: 'string', description: 'Second text for comparison' }
      },
      required: ['text1', 'text2']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_kw_extraction',
    description: 'Extracts keywords from Chinese text using Baidu NLP Keyword Extraction. Use for tagging, summarization, or SEO optimization. Returns JSON with keyword list and weights. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Chinese text to analyze. Max 65535 characters.' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_topic_analysis',
    description: 'Performs topic classification on Chinese text using Baidu NLP. Use for content categorization or trend analysis. Returns JSON with topic labels and confidence scores. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Chinese text to analyze. Max 65535 characters.' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_text_correction',
    description: 'Corrects spelling and grammar errors in Chinese text using Baidu NLP Text Correction. Use for content quality assurance or document editing. Returns JSON with corrected text and error list. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Chinese text to correct. Max 2000 characters.' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_news_summary',
    description: 'Generates abstractive summary of Chinese news articles using Baidu NLP. Use for news aggregation or content digest. Returns JSON with summary text and key sentences. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Chinese news text to summarize. Max 65535 characters.' },
        max_summary_len: { type: 'integer', description: 'Maximum summary length. Default: 200' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_couplet',
    description: 'Generates Chinese couplets (duilian) matching a given theme or phrase using Baidu NLP. Use for cultural content creation or creative writing. Returns JSON with matching upper and lower verses. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Theme or phrase for couplet generation' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'NLP', pricing: '$0.001/call' }
  },
  // ==================== Vision (4) ====================
  {
    name: 'baidu_image_enhance',
    description: 'Enhances image quality using Baidu Image Enhancement (Super-Resolution). Use to upscale low-resolution images, improve clarity for archival photos or compressed images. Returns enhanced image URL. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        scale: { type: 'number', description: 'Enhancement scale: 2 or 4. Default: 2' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_image_dehaze',
    description: 'Removes haze and fog from images using Baidu Dehaze. Use for improving visibility in outdoor photos taken in poor weather. Returns dehazed image URL. Pricing: $0.001/call. Read-only.',
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
    name: 'baidu_image_stitching',
    description: 'Stitches multiple images into a panorama using Baidu Image Stitching. Use for creating wide-angle photos from multiple shots. Returns stitched panorama image URL. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        images: { type: 'array', description: 'Array of image URLs to stitch (2-4 images)', items: { type: 'string' } }
      },
      required: ['images']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_image_colourize',
    description: 'Colorizes black and white images using Baidu Colorization. Use for restoring old photos or creative editing. Returns colorized image URL. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Vision', pricing: '$0.001/call' }
  },
  // ==================== Speech (4) ====================
  {
    name: 'baidu_asr',
    description: 'Converts Chinese speech to text using Baidu Automatic Speech Recognition. Use for voice transcription, meeting notes, or voice command processing. Supports Mandarin, English, and Sichuan dialect. Returns JSON with transcribed text and confidence scores. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        audio: { type: 'string', description: 'Base64-encoded audio data (PCM/WAV/AMR) or publicly accessible audio URL' },
        format: { type: 'string', description: 'Audio format: pcm (default), wav, amr' },
        rate: { type: 'integer', description: 'Sample rate: 16000 (default), 8000' },
        dev_pid: { type: 'integer', description: 'Language model ID: 1537=Mandarin+English (default), 1737=English, 1637=Sichuan dialect' }
      },
      required: ['audio']
    },
    annotations: { readOnlyHint: true, category: 'Speech', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_tts',
    description: 'Synthesizes Chinese text to speech using Baidu Text-to-Speech. Use for voice notifications, audiobooks, or accessibility features. Supports multiple voices and speeds. Returns audio data URL. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Chinese text to synthesize. Max 2048 characters.' },
        voice: { type: 'string', description: 'Voice type: 0=Female (default), 1=Male, 3=Emotional, 4=Neutral, 5003=Child' },
        speed: { type: 'integer', description: 'Speech speed: -5 to 5 (0=normal). Default: 0' },
        pitch: { type: 'integer', description: 'Pitch adjustment: -5 to 5 (0=normal). Default: 0' },
        volume: { type: 'integer', description: 'Volume: 0 to 15 (5=normal). Default: 5' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'Speech', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_voice_conversion',
    description: 'Converts voice characteristics while preserving content using Baidu Voice Conversion. Use for voice anonymization or voice style transfer. Returns converted audio URL. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        audio: { type: 'string', description: 'Base64-encoded audio data or publicly accessible audio URL' },
        target_voice: { type: 'string', description: 'Target voice type from available presets' }
      },
      required: ['audio', 'target_voice']
    },
    annotations: { readOnlyHint: true, category: 'Speech', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_voice_clone',
    description: 'Clones a voice from a short sample using Baidu Voice Cloning. Use for personalized TTS or voice assistants. Returns cloned voice model ID for subsequent TTS calls. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        audio: { type: 'string', description: 'Base64-encoded audio sample (5-30 seconds)' },
        text: { type: 'string', description: 'Text to synthesize with cloned voice. Max 500 characters.' }
      },
      required: ['audio']
    },
    annotations: { readOnlyHint: true, category: 'Speech', pricing: '$0.001/call' }
  },
  // ==================== Translation (3) ====================
  {
    name: 'baidu_translate',
    description: 'Translates text between Chinese and 200+ languages using Baidu Translate API. Use for multilingual content, localization, or cross-border communication. Returns JSON with translated text and source language detection. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to translate. Max 6000 characters.' },
        from: { type: 'string', description: 'Source language: auto (default), zh, en, jp, kor, fra, spa, etc.' },
        to: { type: 'string', description: 'Target language: en (default), zh, jp, kor, fra, spa, etc.' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'Translation', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_translate_pro',
    description: 'Professional-grade translation with domain-specific terminology support using Baidu Translate Pro. Use for technical, legal, or medical documents requiring high accuracy. Returns JSON with translated text, terminology glossary, and quality score. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to translate. Max 10000 characters.' },
        from: { type: 'string', description: 'Source language: auto (default), zh, en, etc.' },
        to: { type: 'string', description: 'Target language: en (default), zh, etc.' },
        domain: { type: 'string', description: 'Domain specialization: general (default), finance, medical, legal, tech' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'Translation', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_translate_doc',
    description: 'Translates full documents (DOCX/PDF/TXT) while preserving formatting using Baidu Document Translation. Use for business documents, contracts, or academic papers. Returns translated document URL. Pricing: $0.003/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        file_url: { type: 'string', description: 'Publicly accessible document URL (DOCX, PDF, or TXT)' },
        from: { type: 'string', description: 'Source language: auto (default), zh, en' },
        to: { type: 'string', description: 'Target language: en (default), zh, jp, etc.' }
      },
      required: ['file_url']
    },
    annotations: { readOnlyHint: true, category: 'Translation', pricing: '$0.003/call' }
  },
  // ==================== Face (3) ====================
  {
    name: 'baidu_face_detect',
    description: 'Detects faces in images and returns location, landmarks, and attributes using Baidu Face Detection. Use for photo tagging, identity verification, or crowd counting. Returns JSON with face count, bounding boxes, landmarks, and attributes (age, gender, expression). Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        face_field: { type: 'string', description: 'Attributes to return: age,beauty,expression,face_shape,gender,glasses,emotion,face_type. Comma-separated.' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Face', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_face_verify',
    description: 'Verifies if two face images belong to the same person using Baidu Face Verification. Use for identity confirmation, access control, or account recovery. Returns JSON with similarity score and match result. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image1: { type: 'string', description: 'Base64-encoded face image or URL (first face)' },
        image2: { type: 'string', description: 'Base64-encoded face image or URL (second face)' }
      },
      required: ['image1', 'image2']
    },
    annotations: { readOnlyHint: true, category: 'Face', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_face_search',
    description: 'Searches a face against a registered face database using Baidu Face Search. Use for employee verification, customer recognition, or security screening. Returns JSON with user ID and confidence score. Requires pre-registered face database. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded face image or URL to search' },
        group_id: { type: 'string', description: 'Face database group ID' }
      },
      required: ['image', 'group_id']
    },
    annotations: { readOnlyHint: true, category: 'Face', pricing: '$0.001/call' }
  },
  // ==================== Body (2) ====================
  {
    name: 'baidu_body_analysis',
    description: 'Analyzes human body pose and attributes in images using Baidu Body Analysis. Use for fitness apps, motion capture, or crowd analytics. Returns JSON with key points, pose estimation, and body attributes. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Body', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_body_seg',
    description: 'Segments human body from background in images using Baidu Body Segmentation. Use for portrait editing, virtual try-on, or background replacement. Returns segmented image with alpha channel. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        return_type: { type: 'string', description: 'Return format: label (default), score, or foreground' }
      },
      required: ['image']
    },
    annotations: { readOnlyHint: true, category: 'Body', pricing: '$0.001/call' }
  },
  // ==================== Creation (4) ====================
  {
    name: 'baidu_image_gen',
    description: 'Generates images from text prompts using Baidu Image Generation (ERNIE-ViLG). Use for marketing visuals, concept art, or product mockups. Supports Chinese and English prompts. Returns generated image URL. Pricing: $0.002/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Text description of desired image. Max 200 characters. Supports Chinese and English.' },
        style: { type: 'string', description: 'Art style: realistic, anime, oil_painting, watercolor, sketch. Default: realistic' },
        size: { type: 'string', description: 'Image size: 1024x1024 (default), 1024x1536, 1536x1024' }
      },
      required: ['prompt']
    },
    annotations: { readOnlyHint: true, category: 'Creation', pricing: '$0.002/call' }
  },
  {
    name: 'baidu_image_edit',
    description: 'Edits images based on text instructions using Baidu Image Editing (ERNIE-ViLG Edit). Use for inpainting, object removal, or style transfer. Returns edited image URL. Pricing: $0.002/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image data or publicly accessible image URL' },
        prompt: { type: 'string', description: 'Edit instruction. E.g., "Remove the car", "Change background to beach".' }
      },
      required: ['image', 'prompt']
    },
    annotations: { readOnlyHint: true, category: 'Creation', pricing: '$0.002/call' }
  },
  {
    name: 'baidu_doc_gen',
    description: 'Generates structured documents from outlines using Baidu Document Generation. Use for report drafting, proposal creation, or content templates. Returns DOCX/URL. Pricing: $0.002/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        outline: { type: 'string', description: 'Document outline or topic. E.g., "Annual report for tech company".' },
        format: { type: 'string', description: 'Output format: docx (default), pdf, html' },
        pages: { type: 'integer', description: 'Target page count. Default: 5' }
      },
      required: ['outline']
    },
    annotations: { readOnlyHint: true, category: 'Creation', pricing: '$0.002/call' }
  },
  {
    name: 'baidu_qianfan_chat',
    description: 'Chat completion using Baidu QianFan (ERNIE Bot / Yi-34B / DeepSeek-V3). Use for general conversation, coding assistance, reasoning tasks. Returns streaming or non-streaming response. Pricing: $0.001/1K tokens input, $0.002/1K tokens output. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        messages: { type: 'array', description: 'Array of {role, content} objects. Role: system, user, assistant.', items: { type: 'object', properties: { role: { type: 'string' }, content: { type: 'string' } } } },
        model: { type: 'string', description: 'Model: ERNIE-Bot-4 (default), ERNIE-Speed, Yi-34B, DeepSeek-V3' },
        temperature: { type: 'number', description: 'Sampling temperature: 0.0-1.0. Default: 0.7' },
        max_tokens: { type: 'integer', description: 'Max output tokens. Default: 1024' },
        stream: { type: 'boolean', description: 'Enable streaming. Default: false' }
      },
      required: ['messages']
    },
    annotations: { readOnlyHint: true, category: 'LLM', pricing: '$0.001-0.002/1K tokens' }
  },
  // ==================== Search (2) ====================
  {
    name: 'baidu_search',
    description: 'Performs web search using Baidu Search API. Use for real-time information retrieval, fact-checking, or research assistance. Returns JSON with search results including title, URL, snippet, and source. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string' },
        num: { type: 'integer', description: 'Number of results. Default: 10, Max: 50' },
        site: { type: 'string', description: 'Restrict to specific site/domain (optional)' }
      },
      required: ['query']
    },
    annotations: { readOnlyHint: true, category: 'Search', pricing: '$0.001/call' }
  },
  {
    name: 'baidu_knowledge',
    description: 'Queries Baidu Knowledge Graph for structured entity information. Use for research, data enrichment, or fact extraction. Returns JSON with entity attributes, relationships, and facts. Pricing: $0.001/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Entity name or query' },
        type: { type: 'string', description: 'Entity type filter: person, org, location, product, event (optional)' }
      },
      required: ['query']
    },
    annotations: { readOnlyHint: true, category: 'Search', pricing: '$0.001/call' }
  },
  // ==================== x402 Paid (5) ====================
  {
    name: 'paid_baidu_search',
    description: 'Performs web search using Baidu Search API (x402 Paid Endpoint). Same as baidu_search but requires x402 USDC micropayment. Pricing: $0.005/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string' },
        num: { type: 'integer', description: 'Number of results. Default: 10' }
      },
      required: ['query']
    },
    annotations: { readOnlyHint: true, category: 'Search', pricing: '$0.005/call' }
  },
  {
    name: 'paid_baidu_translate_pro',
    description: 'Professional-grade document translation (x402 Paid Endpoint). Same as baidu_translate_pro but requires x402 USDC micropayment. Pricing: $0.003/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to translate. Max 10000 characters.' },
        from: { type: 'string', description: 'Source language' },
        to: { type: 'string', description: 'Target language' },
        domain: { type: 'string', description: 'Domain: general, finance, medical, legal, tech' }
      },
      required: ['text']
    },
    annotations: { readOnlyHint: true, category: 'Translation', pricing: '$0.003/call' }
  },
  {
    name: 'paid_baidu_ocr_batch',
    description: 'Batch OCR processing for up to 10 images (x402 Paid Endpoint). Requires x402 USDC micropayment. Pricing: $0.008/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        images: { type: 'array', description: 'Array of image URLs or base64 strings. Max 10.', items: { type: 'string' } },
        language_type: { type: 'string', description: 'Language type: CHN_ENG (default)' }
      },
      required: ['images']
    },
    annotations: { readOnlyHint: true, category: 'OCR', pricing: '$0.008/call' }
  },
  {
    name: 'paid_baidu_asr_long',
    description: 'Long-form speech recognition for audio up to 4 hours (x402 Paid Endpoint). Requires x402 USPC micropayment. Pricing: $0.005/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        audio_url: { type: 'string', description: 'Publicly accessible audio URL (MP3/WAV, max 4 hours)' },
        format: { type: 'string', description: 'Audio format: pcm, wav, mp3' }
      },
      required: ['audio_url']
    },
    annotations: { readOnlyHint: true, category: 'Speech', pricing: '$0.005/call' }
  },
  {
    name: 'paid_baidu_doc_analysis',
    description: 'Comprehensive document analysis with OCR + NER + summary (x402 Paid Endpoint). Requires x402 USDC micropayment. Pricing: $0.008/call. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        file_url: { type: 'string', description: 'Publicly accessible document URL (PDF/DOCX/TXT)' },
        tasks: { type: 'array', description: 'Analysis tasks: ocr, ner, summary, keywords', items: { type: 'string' } }
      },
      required: ['file_url']
    },
    annotations: { readOnlyHint: true, category: 'Document', pricing: '$0.008/call' }
  }
];

// ========== Tool mapping to GoldBean internal endpoints ==========
const TOOL_MAP = {
  service_health: { method: 'GET', path: '/api/v1/health' },
  baidu_ocr: { method: 'POST', path: '/api/v1/baidu/ocr' },
  baidu_ocr_accurate: { method: 'POST', path: '/api/v1/baidu/ocr/accurate' },
  baidu_ocr_table: { method: 'POST', path: '/api/v1/baidu/ocr/table' },
  baidu_ocr_idcard: { method: 'POST', path: '/api/v1/baidu/ocr/idcard' },
  baidu_ocr_handwriting: { method: 'POST', path: '/api/v1/baidu/ocr/handwriting' },
  baidu_ocr_qrcode: { method: 'POST', path: '/api/v1/baidu/ocr/qrcode' },
  baidu_ocr_business_license: { method: 'POST', path: '/api/v1/baidu/ocr/business_license' },
  baidu_ocr_bank_card: { method: 'POST', path: '/api/v1/baidu/ocr/bank_card' },
  baidu_ocr_driving_license: { method: 'POST', path: '/api/v1/baidu/ocr/driving_license' },
  baidu_ocr_vehicle_license: { method: 'POST', path: '/api/v1/baidu/ocr/vehicle_license' },
  baidu_ocr_passport: { method: 'POST', path: '/api/v1/baidu/ocr/passport' },
  baidu_ocr_invoice: { method: 'POST', path: '/api/v1/baidu/ocr/invoice' },
  baidu_sentiment: { method: 'POST', path: '/api/v1/baidu/nlp/sentiment' },
  baidu_ner: { method: 'POST', path: '/api/v1/baidu/nlp/ner' },
  baidu_text_similarity: { method: 'POST', path: '/api/v1/baidu/nlp/similarity' },
  baidu_kw_extraction: { method: 'POST', path: '/api/v1/baidu/nlp/keywords' },
  baidu_topic_analysis: { method: 'POST', path: '/api/v1/baidu/nlp/topic' },
  baidu_text_correction: { method: 'POST', path: '/api/v1/baidu/nlp/correction' },
  baidu_news_summary: { method: 'POST', path: '/api/v1/baidu/nlp/summary' },
  baidu_couplet: { method: 'POST', path: '/api/v1/baidu/nlp/couplet' },
  baidu_image_enhance: { method: 'POST', path: '/api/v1/baidu/vision/enhance' },
  baidu_image_dehaze: { method: 'POST', path: '/api/v1/baidu/vision/dehaze' },
  baidu_image_stitching: { method: 'POST', path: '/api/v1/baidu/vision/stitching' },
  baidu_image_colourize: { method: 'POST', path: '/api/v1/baidu/vision/colourize' },
  baidu_asr: { method: 'POST', path: '/api/v1/baidu/speech/asr' },
  baidu_tts: { method: 'POST', path: '/api/v1/baidu/speech/tts' },
  baidu_voice_conversion: { method: 'POST', path: '/api/v1/baidu/speech/conversion' },
  baidu_voice_clone: { method: 'POST', path: '/api/v1/baidu/speech/clone' },
  baidu_translate: { method: 'POST', path: '/api/v1/baidu/translate' },
  baidu_translate_pro: { method: 'POST', path: '/api/v1/baidu/translate/pro' },
  baidu_translate_doc: { method: 'POST', path: '/api/v1/baidu/translate/doc' },
  baidu_face_detect: { method: 'POST', path: '/api/v1/baidu/face/detect' },
  baidu_face_verify: { method: 'POST', path: '/api/v1/baidu/face/verify' },
  baidu_face_search: { method: 'POST', path: '/api/v1/baidu/face/search' },
  baidu_body_analysis: { method: 'POST', path: '/api/v1/baidu/body/analysis' },
  baidu_body_seg: { method: 'POST', path: '/api/v1/baidu/body/segmentation' },
  baidu_image_gen: { method: 'POST', path: '/api/v1/baidu/creation/image' },
  baidu_image_edit: { method: 'POST', path: '/api/v1/baidu/creation/edit' },
  baidu_doc_gen: { method: 'POST', path: '/api/v1/baidu/creation/document' },
  baidu_qianfan_chat: { method: 'POST', path: '/api/v1/baidu/qianfan/chat' },
  baidu_search: { method: 'POST', path: '/api/v1/baidu/search' },
  baidu_knowledge: { method: 'POST', path: '/api/v1/baidu/knowledge' },
  paid_baidu_search: { method: 'POST', path: '/paid/baidu-search' },
  paid_baidu_translate_pro: { method: 'POST', path: '/paid/baidu-translate-pro' },
  paid_baidu_ocr_batch: { method: 'POST', path: '/paid/baidu-ocr-batch' },
  paid_baidu_asr_long: { method: 'POST', path: '/paid/baidu-asr-long' },
  paid_baidu_doc_analysis: { method: 'POST', path: '/paid/baidu-doc-analysis' }
};

// ========== v2 Response Helpers ==========
function v2JsonRpcResponse(id, result, error) {
  const resp = { jsonrpc: '2.0', id };
  if (error) {
    resp.error = error;
  } else {
    resp.result = result;
  }
  return resp;
}

function v2ErrorResponse(id, code, message) {
  return v2JsonRpcResponse(id, null, { code, message });
}

// ========== HTTP Request Helper ==========
function httpRequest(method, url, body) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ========== Server Handler ==========
const server = http.createServer(async (req, res) => {
  const startTime = Date.now();
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, MCP-Protocol-Version, Mcp-Method, Mcp-Name');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only handle POST /mcp
  if (req.method !== 'POST' || req.url !== '/mcp') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. Use POST /mcp' }));
    return;
  }

  // v2: Read protocol version from header (optional, for validation)
  const protocolVersion = req.headers['mcp-protocol-version'];
  const mcpMethod = req.headers['mcp-method'];
  const mcpName = req.headers['mcp-name'];

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    let requestData;
    try {
      requestData = JSON.parse(body);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(v2ErrorResponse(null, -32700, 'Parse error: Invalid JSON')));
      return;
    }

    const { id, method, params } = requestData;

    // v2: No initialize handshake required
    // All requests are self-contained
    // Client info and capabilities are in params._meta
    const clientInfo = params?._meta?.['io.modelcontextprotocol/clientInfo'] || {};
    const clientCapabilities = params?._meta?.['io.modelcontextprotocol/capabilities'] || {};

    try {
      let result;

      switch (method) {
        // v2: Removed initialize/initialized
        // Server info returned via tools/list or a dedicated server/discover method

        case 'server/discover':
          // v2: New method for pre-flight discovery (optional)
          result = {
            protocolVersion: PROTOCOL_VERSION,
            serverInfo: {
              name: 'goldbean-mcp',
              version: VERSION,
              description: 'GoldBean API Market - Chinese AI multimodal APIs via MCP v2'
            },
            capabilities: {
              tools: { listChanged: false },
              resources: { subscribe: false },
              prompts: { listChanged: false }
            },
            tools: TOOLS.map(t => ({
              name: t.name,
              description: t.description.substring(0, 200) + '...',
              annotations: t.annotations
            }))
          };
          break;

        case 'tools/list':
          // v2: Stateless - return full tool list every time
          result = {
            tools: TOOLS,
            nextCursor: null
          };
          break;

        case 'tools/call':
          {
            const toolName = params?.name;
            const toolArgs = params?.arguments || {};
            const mapping = TOOL_MAP[toolName];

            if (!mapping) {
              result = v2ErrorResponse(id, -32602, `Unknown tool: ${toolName}`);
              break;
            }

            // Forward to GoldBean backend
            const backendUrl = API_BASE + mapping.path;
            const backendRes = await httpRequest(mapping.method, backendUrl, toolArgs);

            if (backendRes.status >= 200 && backendRes.status < 300) {
              result = {
                content: [{
                  type: 'text',
                  text: JSON.stringify(backendRes.body)
                }],
                isError: false
              };
            } else {
              result = {
                content: [{
                  type: 'text',
                  text: JSON.stringify({ error: backendRes.body })
                }],
                isError: true
              };
            }
          }
          break;

        case 'resources/list':
          result = { resources: [], nextCursor: null };
          break;

        case 'prompts/list':
          result = { prompts: [], nextCursor: null };
          break;

        default:
          result = v2ErrorResponse(id, -32601, `Method not found: ${method}`);
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': PROTOCOL_VERSION
      });
      res.end(JSON.stringify(v2JsonRpcResponse(id, result)));

      const duration = Date.now() - startTime;
      console.log(`[MCPv2] ${method} | ${clientIp} | ${duration}ms | ${mcpName || ''}`);

    } catch (error) {
      console.error('[MCPv2] Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(v2ErrorResponse(id, -32603, `Internal error: ${error.message}`)));
    }
  });
});

server.listen(MCP_PORT, () => {
  console.log(`========================================`);
  console.log(`GoldBean MCP v2 Server (2026-07-28)`);
  console.log(`Protocol: ${PROTOCOL_VERSION}`);
  console.log(`Version: ${VERSION}`);
  console.log(`Port: ${MCP_PORT}`);
  console.log(`API Backend: ${API_BASE}`);
  console.log(`Stateless: Yes (No session/initialize)`);
  console.log(`Tools: ${TOOLS.length}`);
  console.log(`========================================`);
  console.log(`Ready for stateless requests.`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[MCPv2] SIGTERM received, shutting down gracefully...');
  server.close(() => process.exit(0));
});
