/**
 * GoldBean MCP — TypeScript type definitions.
 *
 * Covers the 51 tool input schemas (as of GoldBean v9.8.0, .well-known/mcp.json)
 * plus the MCP JSON-RPC 2.0 request/response wire format.
 *
 * Every tool has a matching `<ToolName>Params` interface, and `ToolParamsByName`
 * maps each canonical tool name to its argument type so clients get autocomplete
 * and type-safe arguments when calling `tools/call`.
 */

// ============================================================
// JSON Schema (the `inputSchema` shape returned by tools/list)
// ============================================================

export type JsonSchemaType =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "null";

export interface JsonSchemaProperty {
  type: JsonSchemaType;
  description?: string;
  /** Element type for `type: "array"` properties. */
  items?: JsonSchemaProperty;
  /** Nested properties for `type: "object"` properties. */
  properties?: Record<string, JsonSchemaProperty>;
}

export interface JsonSchemaObject {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  category?: string;
  pricing?: string;
}

export interface GoldBeanTool<P extends JsonSchemaObject = JsonSchemaObject> {
  name: string;
  description: string;
  inputSchema: P;
  annotations?: ToolAnnotations;
}

// ============================================================
// Chat message shapes (baidu_llm_chat / baidu_deepthink / baidu_vision_chat)
// ============================================================

/** Text message for LLM chat tools. */
export interface ChatMessage {
  role: string;
  content: string;
}

/** Image reference used in vision chat messages. */
export interface VisionImageUrl {
  url: string;
}

export interface VisionTextPart {
  type: "text";
  text: string;
}

export interface VisionImagePart {
  type: "image_url";
  image_url: VisionImageUrl;
}

export interface VisionChatMessage {
  role: string;
  content: Array<VisionTextPart | VisionImagePart>;
}

// ============================================================
// Tool parameter interfaces (one per tool, from .well-known/mcp.json v9.8.0)
// ============================================================

/** service_health — no parameters. */
export interface ServiceHealthParams {}

export interface BaiduOcrParams {
  /** Base64-encoded image data (no prefix) or publicly accessible image URL. */
  image: string;
  /** Language type: CHN_ENG (default), ENG, JAP, KOR, FRE, SPA, POR, GER, ITA, RUS, DAN, DUT, MAL, SWE, IND, POL, ROM, THA, VIET, ARA, HIN. */
  language_type?: string;
  /** Whether to detect image orientation. Default: false. */
  detect_direction?: boolean;
}

export interface BaiduOcrAccurateParams {
  /** Base64-encoded image data (no prefix) or publicly accessible image URL. */
  image: string;
  /** Language type: CHN_ENG (default), ENG, JAP, KOR, FRE, SPA. */
  language_type?: string;
  /** Whether to detect image orientation. Default: false. */
  detect_direction?: boolean;
}

export interface BaiduOcrTableParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Whether to return cell bounding box coordinates. Default: false. */
  cell_location?: boolean;
}

export interface BaiduOcrIdcardParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Side of ID card: front (photo side) or back (emblem side). */
  id_card_side: string;
}

export interface BaiduOcrHandwritingParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Language: CHN (Chinese handwriting, default) or ENG (English handwriting). */
  language_type?: string;
}

export interface BaiduOcrQrcodeParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
}

export interface BaiduOcrBankcardParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
}

export interface BaiduOcrBusinessLicenseParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
}

export interface BaiduOcrWebimageParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Whether to detect image orientation. Default: false. */
  detect_direction?: boolean;
}

export interface BaiduDeepseekOcrParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Optional question to guide extraction focus. */
  question?: string;
}

export interface BaiduPaddleocrVlParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Optional question or instruction to guide extraction. */
  question?: string;
}

export interface BaiduQianfanOcrParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Qianfan OCR template ID for custom document recognition. */
  template_id: string;
}

export interface BaiduTtsParams {
  /** Text to synthesize (max 1024 bytes for Chinese, 2048 for English). */
  text: string;
  /** Language: zh (Chinese, default) or en (English). */
  lang?: string;
  /** Voice persona ID: 0 (female), 1 (male), 3 (emotional male), 4 (emotional female), 5118 (Xiaoyan). Default: 0. */
  per?: number;
  /** Speech speed: 0-15, default 5. */
  spd?: number;
  /** Pitch: 0-15, default 5. */
  pit?: number;
  /** Volume: 0-15, default 5. */
  vol?: number;
}

export interface BaiduAsrParams {
  /** Base64-encoded audio data (WAV, MP3, PCM, or AMR format). */
  audio: string;
  /** Audio format: wav (default), pcm, amr, mp3. */
  format?: string;
  /** Sample rate in Hz: 8000 or 16000. Default: 16000. */
  rate?: number;
  /** Language: zh (default) or en. */
  lang?: string;
}

export interface BaiduLlmChatParams {
  /** Array of message objects: [{role: "user", content: "..."}, ...]. */
  messages: ChatMessage[];
  /** Model: ernie-4.0-8k (default), ernie-4.0-turbo-8k, ernie-3.5-8k, ernie-speed-128k, ernie-lite-8k. */
  model?: string;
  /** Sampling temperature 0-1.0. Higher = more creative. Default: 0.8. */
  temperature?: number;
  /** Maximum tokens to generate. Default: 2048. */
  max_tokens?: number;
  /** Whether to stream response. Default: false. */
  stream?: boolean;
}

export interface BaiduDeepthinkParams {
  /** Array of message objects with role and content. */
  messages: ChatMessage[];
  /** Model: ernie-4.0-8k (default) or ernie-4.0-turbo-8k. */
  model?: string;
  /** Sampling temperature 0-1.0. Default: 0.6 (lower for reasoning). */
  temperature?: number;
  /** Maximum tokens to generate. Default: 4096. */
  max_tokens?: number;
  /** Token budget for thinking phase. Default: 2048. */
  thinking_budget?: number;
}

export interface BaiduVisionChatParams {
  /** Array of messages. User messages can include image content. */
  messages: VisionChatMessage[];
  /** Model: ernie-4.5-vl (default) or ernie-vil-turbo. */
  model?: string;
  /** Sampling temperature 0-1.0. Default: 0.8. */
  temperature?: number;
  /** Maximum tokens to generate. Default: 2048. */
  max_tokens?: number;
}

export interface BaiduTranslateParams {
  /** Text to translate (max 6000 characters per request). */
  text: string;
  /** Source language: zh, en, jp, kor, fra, spa, deu, ita, ru, pt, ara, th, vie, auto (auto-detect). Default: auto. */
  from?: string;
  /** Target language: zh, en, jp, kor, fra, spa, deu, ita, ru, pt, ara, th, vie. */
  to: string;
}

export interface BaiduImageRecognitionParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Number of Baidu Baike entries to return. Default: 0. */
  baike_num?: number;
}

export interface BaiduObjectDetectParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Whether to return object count per category. Default: false. */
  count?: boolean;
}

export interface BaiduLandmarkParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
}

export interface BaiduPlantParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Number of Baidu Baike entries to return. Default: 0. */
  baike_num?: number;
}

export interface BaiduAnimalParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Number of Baidu Baike entries to return. Default: 0. */
  baike_num?: number;
}

export interface BaiduDishParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Number of Baidu Baike entries to return. Default: 0. */
  baike_num?: number;
  /** Number of top results to return. Default: 5. */
  top_num?: number;
}

export interface BaiduLogoParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Detection type: 0 (default, return all logos), 1 (return library logos only). */
  type?: string;
}

export interface BaiduCarParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Whether to return detailed vehicle type info. Default: false. */
  type?: boolean;
}

export interface BaiduIngredientParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Number of top results to return. Default: 5. */
  top_num?: number;
}

export interface BaiduVehicleDetectParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Detection area as polygon coordinates (optional). */
  area?: string;
}

export interface BaiduFaceDetectParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Comma-separated attributes: age, beauty, expression, face_shape, gender, glasses, eye_status, emotion, race, mask, quality. Default: empty (location only). */
  face_field?: string;
  /** Maximum number of faces to detect. Default: 10. */
  max_face_num?: number;
}

export interface BaiduFaceCompareParams {
  /** Base64-encoded first face image data or URL. */
  image1: string;
  /** Base64-encoded second face image data or URL. */
  image2: string;
  /** Image type: BASE64 (default) or URL. */
  image_type?: string;
}

export interface BaiduBodyAnalysisParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Attribute set to detect. Default: gender,upper_color,lower_color,orientation. */
  type?: string;
}

export interface BaiduGestureParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
}

export interface BaiduImageEnhanceParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Enhancement type: contrast_enhance (contrast), dehaze (dehazing), denoising (noise reduction), clarity_enhance (clarity). Default: contrast_enhance. */
  type?: string;
}

export interface BaiduImageGenParams {
  /** Text description of the image to generate. Be specific about style, content, and composition. */
  prompt: string;
  /** Image size: 1024x1024 (default), 1024x576, 576x1024, 768x768. */
  size?: string;
  /** Number of images to generate (1-4). Default: 1. */
  n?: number;
  /** Art style: realistic, anime, sketch, oil_painting, 3d. Default: realistic. */
  style?: string;
}

export interface BaiduImageEditParams {
  /** Base64-encoded source image data or publicly accessible image URL. */
  image: string;
  /** Editing instruction describing what to change. */
  prompt: string;
  /** Optional base64-encoded mask image defining editable region (white = editable). */
  mask?: string;
}

export interface BaiduVideoGenParams {
  /** Text description of the video to generate. Include scene, action, camera movement, and duration details. */
  prompt: string;
  /** Video model: wenkai-video (default) or other available models. */
  model?: string;
  /** Video duration in seconds (1-10). Default: 5. */
  duration?: number;
  /** Video resolution: 720p (default) or 1080p. */
  resolution?: string;
}

export interface BaiduVideoQueryParams {
  /** Task ID returned by baidu_video_gen. */
  task_id: string;
}

export interface BaiduNlpParams {
  /** Input text for NLP analysis (max 2048 characters). */
  text: string;
  /** NLP task: lexer (word segmentation + POS), dep (dependency parsing). Default: lexer. */
  task?: string;
}

export interface BaiduSentimentParams {
  /** Text to analyze (max 2048 characters). Supports Chinese and English. */
  text: string;
  /** Model: default (general) or finance (financial domain). */
  model?: string;
}

export interface BaiduSummaryParams {
  /** Text to summarize (max 3000 characters). */
  text: string;
  /** Maximum summary length in characters. Default: 200. */
  max_summary_len?: number;
  /** Optional title to guide summarization focus. */
  title?: string;
}

export interface BaiduTextCorrectorParams {
  /** Text to correct (max 2000 characters). Optimized for Chinese text. */
  text: string;
}

export interface BaiduKeywordExtractionParams {
  /** Input text for keyword extraction (max 100000 characters). */
  text: string;
  /** Number of keywords to extract. Default: 10. */
  num?: number;
}

export interface BaiduWordEmbeddingParams {
  /** Word or short phrase to embed. */
  text: string;
  /** Embedding dimension: 64, 128, 256, 512. Default: 128. */
  dim?: number;
}

export interface BaiduEmbeddingParams {
  /** Array of text strings to embed (max 16 texts per request). */
  texts: string[];
  /** Embedding model: embedding-v1 (default), bge_large_zh, bge_large_en. */
  model?: string;
}

export interface BaiduRerankerParams {
  /** Search query or question text. */
  query: string;
  /** Array of candidate document texts to rerank (max 100). */
  documents: string[];
  /** Reranker model: reranker-v1 (default) or bge_reranker_large. */
  model?: string;
  /** Number of top results to return. Default: returns all. */
  top_n?: number;
}

export interface BaiduTextReviewParams {
  /** Text content to review (max 20000 characters). */
  text: string;
  /** Categories to check: politics, porn, vulgar, abuse, terrorism, ad. Default: all. */
  categories?: string[];
}

export interface BaiduImageReviewParams {
  /** Base64-encoded image data or publicly accessible image URL. */
  image: string;
  /** Categories: politics, porn, vulgar, abuse, terrorism, ad. Default: all. */
  categories?: string[];
}

export interface BaiduHelixfoldParams {
  /** Amino acid sequence using single-letter codes (e.g., "MKTV..."). Max 2000 residues. */
  sequence: string;
  /** Model: helixfold (default) or helixfold-single. */
  model?: string;
}

export interface RegisterParams {
  /** Email address for account registration and notifications. */
  email: string;
  /** Password for account (min 8 characters). */
  password: string;
}

export interface CheckCreditsParams {
  /** GoldBean user ID. */
  user_id?: string;
  /** API key for authentication (alternative to user_id). */
  api_key?: string;
}

// ============================================================
// Tool name → params map
// ============================================================

/**
 * Maps every canonical GoldBean tool name (v9.8.0) to its argument type.
 * Use `ToolParams<T>` for a generic lookup, or index directly:
 *
 *   const args: ToolParamsByName["baidu_ocr"] = { image: "..." };
 */
export interface ToolParamsByName {
  service_health: ServiceHealthParams;
  baidu_ocr: BaiduOcrParams;
  baidu_ocr_accurate: BaiduOcrAccurateParams;
  baidu_ocr_table: BaiduOcrTableParams;
  baidu_ocr_idcard: BaiduOcrIdcardParams;
  baidu_ocr_handwriting: BaiduOcrHandwritingParams;
  baidu_ocr_qrcode: BaiduOcrQrcodeParams;
  baidu_ocr_bankcard: BaiduOcrBankcardParams;
  baidu_ocr_business_license: BaiduOcrBusinessLicenseParams;
  baidu_ocr_webimage: BaiduOcrWebimageParams;
  baidu_deepseek_ocr: BaiduDeepseekOcrParams;
  baidu_paddleocr_vl: BaiduPaddleocrVlParams;
  baidu_qianfan_ocr: BaiduQianfanOcrParams;
  baidu_tts: BaiduTtsParams;
  baidu_asr: BaiduAsrParams;
  baidu_llm_chat: BaiduLlmChatParams;
  baidu_deepthink: BaiduDeepthinkParams;
  baidu_vision_chat: BaiduVisionChatParams;
  baidu_translate: BaiduTranslateParams;
  baidu_image_recognition: BaiduImageRecognitionParams;
  baidu_object_detect: BaiduObjectDetectParams;
  baidu_landmark: BaiduLandmarkParams;
  baidu_plant: BaiduPlantParams;
  baidu_animal: BaiduAnimalParams;
  baidu_dish: BaiduDishParams;
  baidu_logo: BaiduLogoParams;
  baidu_car: BaiduCarParams;
  baidu_ingredient: BaiduIngredientParams;
  baidu_vehicle_detect: BaiduVehicleDetectParams;
  baidu_face_detect: BaiduFaceDetectParams;
  baidu_face_compare: BaiduFaceCompareParams;
  baidu_body_analysis: BaiduBodyAnalysisParams;
  baidu_gesture: BaiduGestureParams;
  baidu_image_enhance: BaiduImageEnhanceParams;
  baidu_image_gen: BaiduImageGenParams;
  baidu_image_edit: BaiduImageEditParams;
  baidu_video_gen: BaiduVideoGenParams;
  baidu_video_query: BaiduVideoQueryParams;
  baidu_nlp: BaiduNlpParams;
  baidu_sentiment: BaiduSentimentParams;
  baidu_summary: BaiduSummaryParams;
  baidu_text_corrector: BaiduTextCorrectorParams;
  baidu_keyword_extraction: BaiduKeywordExtractionParams;
  baidu_word_embedding: BaiduWordEmbeddingParams;
  baidu_embedding: BaiduEmbeddingParams;
  baidu_reranker: BaiduRerankerParams;
  baidu_text_review: BaiduTextReviewParams;
  baidu_image_review: BaiduImageReviewParams;
  baidu_helixfold: BaiduHelixfoldParams;
  register: RegisterParams;
  check_credits: CheckCreditsParams;
}

/** Union of every canonical GoldBean tool name. */
export type ToolName = keyof ToolParamsByName;

/** Arguments for the given tool name. */
export type ToolParams<T extends ToolName> = ToolParamsByName[T];

// ============================================================
// MCP request/response format (JSON-RPC 2.0 over HTTP/SSE/STDIO)
// ============================================================

export type JsonRpcId = number | string | null;

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export interface JsonRpcRequest<P = unknown> {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: P;
}

/** A successful JSON-RPC response carries `result`; a failure carries `error`. */
export type JsonRpcResponse<T = unknown> =
  | { jsonrpc: "2.0"; id: JsonRpcId; result: T }
  | { jsonrpc: "2.0"; id: JsonRpcId; error: JsonRpcError };

/** MCP methods supported by the GoldBean server. */
export type McpMethod =
  | "initialize"
  | "tools/list"
  | "tools/call"
  | "resources/list"
  | "prompts/list";

/** Payload of a `tools/call` request (loosely typed — use TypedCallToolParams for per-tool safety). */
export interface CallToolParams {
  name: string;
  arguments?: Record<string, unknown>;
}

/** `tools/call` params whose arguments are bound to a specific tool's schema. */
export interface TypedCallToolParams<T extends ToolName> {
  name: T;
  arguments: ToolParams<T>;
}

/** A single tool entry as returned by `tools/list`. */
export interface McpToolDefinition {
  name: ToolName;
  description: string;
  inputSchema: JsonSchemaObject;
  annotations?: ToolAnnotations;
}

export interface ToolsListResult {
  tools: McpToolDefinition[];
  nextCursor?: string | null;
}

/** Content returned by a `tools/call`. */
export interface ToolCallContent {
  type: string;
  text: string;
}

export interface ToolsCallResult {
  content: ToolCallContent[];
  isError?: boolean;
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ResourcesListResult {
  resources: ResourceDefinition[];
  nextCursor?: string | null;
}

export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface PromptDefinition {
  name: string;
  description?: string;
  arguments?: PromptArgument[];
}

export interface PromptsListResult {
  prompts: PromptDefinition[];
  nextCursor?: string | null;
}

export interface McpCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean };
  prompts?: { listChanged?: boolean };
}

export interface ServerInfo {
  name: string;
  version: string;
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: McpCapabilities;
  serverInfo: ServerInfo;
  agentHandoff?: Record<string, unknown>;
}
