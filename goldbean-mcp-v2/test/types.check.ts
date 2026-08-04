/**
 * Compile-time checks for the GoldBean MCP type definitions.
 *
 * This file is type-checked by `tsc --noEmit` (npm run test:types). If any
 * assertion below fails to type-check, the type definitions are wrong — a
 * client would get autocomplete/correctness guarantees that don't match how
 * the server actually accepts arguments.
 *
 * Each positive case is a valid assignment; each negative case is annotated
 * with `@ts-expect-error` so that a regression (e.g. a required field made
 * optional, a wrong literal type) becomes a compile error at the assignment
 * site — and a test that stops erroring fails with an "Unused directive".
 */
import type {
  ToolParamsByName,
  ToolParams,
  ToolName,
  TypedCallToolParams,
  JsonRpcRequest,
  JsonRpcResponse,
  CallToolParams,
  ToolsCallResult,
  McpToolDefinition,
  InitializeResult,
} from "../types.d.ts";

// --- 1. Required vs optional fields per tool ---
const ocr: ToolParamsByName["baidu_ocr"] = {
  image: "data:...",
  // language_type, detect_direction are optional — assigning them is fine
  language_type: "CHN_ENG",
  detect_direction: true,
};
// @ts-expect-error — image is required
const ocrMissingImage: ToolParamsByName["baidu_ocr"] = { detect_direction: true };

// Two-image face compare requires both images.
const faceCompare: ToolParamsByName["baidu_face_compare"] = {
  image1: "a",
  image2: "b",
};
// @ts-expect-error — image2 is required
const faceCompareMissing: ToolParamsByName["baidu_face_compare"] = { image1: "a" };

// register requires email + password.
const register: ToolParamsByName["register"] = { email: "a@b.c", password: "secret" };
// @ts-expect-error — password is required
const registerMissing: ToolParamsByName["register"] = { email: "a@b.c" };

// check_credits has no required fields.
const credits: ToolParamsByName["check_credits"] = {};
const creditsWithKey: ToolParamsByName["check_credits"] = { api_key: "k" };

// --- 2. Array-typed params ---
const embedding: ToolParamsByName["baidu_embedding"] = { texts: ["a", "b"] };
// @ts-expect-error — texts must be an array
const embeddingNotArray: ToolParamsByName["baidu_embedding"] = { texts: "a" };

const reranker: ToolParamsByName["baidu_reranker"] = {
  query: "q",
  documents: ["d1", "d2"],
};
// @ts-expect-error — documents is required
const rerankerMissing: ToolParamsByName["baidu_reranker"] = { query: "q" };

// --- 3. LLM chat message shapes ---
const chat: ToolParamsByName["baidu_llm_chat"] = {
  messages: [
    { role: "user", content: "hi" },
    { role: "assistant", content: "hello" },
  ],
};
// @ts-expect-error — content is required on chat messages
const chatBadMessage: ToolParamsByName["baidu_llm_chat"] = { messages: [{ role: "user" }] };

const visionChat: ToolParamsByName["baidu_vision_chat"] = {
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "what is this?" },
        { type: "image_url", image_url: { url: "https://..." } },
      ],
    },
  ],
};
// @ts-expect-error — image_url part requires a url
const visionBadPart: ToolParamsByName["baidu_vision_chat"] = { messages: [{ role: "user", content: [{ type: "image_url", image_url: {} }] }] };

// --- 4. Generic ToolParams<T> lookup ---
const genericOcr: ToolParams<"baidu_ocr"> = { image: "x" };
// @ts-expect-error — ToolParams<"baidu_ocr"> is the OCR params type, not messages
const wrongGeneric: ToolParams<"baidu_ocr"> = { messages: [] };

const validNames: ToolName[] = [
  "service_health",
  "baidu_ocr",
  "baidu_face_compare",
  "register",
];

// --- 5. MCP wire format ---
const callRequest: JsonRpcRequest<TypedCallToolParams<"baidu_ocr">> = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: { name: "baidu_ocr", arguments: { image: "..." } },
};
// @ts-expect-error — arguments must satisfy the tool's schema
const callRequestBad: JsonRpcRequest<TypedCallToolParams<"baidu_ocr">> = { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "baidu_ocr", arguments: { no_such_field: "x" } } };

const looseCall: JsonRpcRequest<CallToolParams> = {
  jsonrpc: "2.0",
  id: "abc",
  method: "tools/call",
  params: { name: "baidu_ocr", arguments: { anything: true } },
};

type CallOk = JsonRpcResponse<ToolsCallResult>;
const okResponse: CallOk = {
  jsonrpc: "2.0",
  id: 1,
  result: { content: [{ type: "text", text: "done" }], isError: false },
};
const errResponse: CallOk = {
  jsonrpc: "2.0",
  id: 1,
  error: { code: -32601, message: "Method not found" },
};

// tools/list returns McpToolDefinition[]
declare const listResult: { tools: McpToolDefinition[] };
const listed: McpToolDefinition[] = listResult.tools;
const firstSchema = listed[0].inputSchema;
// inputSchema is always an object with properties/required
firstSchema.properties["anything"];

declare const initResult: InitializeResult;
initResult.serverInfo.name;

// --- unused-var guard: keep everything reachable so tsc checks all bodies ---
void [
  ocr, ocrMissingImage, faceCompare, faceCompareMissing, register, registerMissing,
  credits, creditsWithKey, embedding, embeddingNotArray, reranker, rerankerMissing,
  chat, chatBadMessage, visionChat, visionBadPart, genericOcr, wrongGeneric,
  validNames, callRequest, callRequestBad, looseCall, okResponse, errResponse,
  listed, firstSchema, initResult,
];
