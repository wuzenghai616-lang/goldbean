/**
 * GoldBean MCP Server - Node.js x402 Payment Example
 *
 * This example demonstrates:
 * 1. Using @goldbean/x402-sdk for micro-payments
 * 2. Calling GoldBean MCP endpoints from Node.js
 * 3. Batch calling multiple endpoints
 */

const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { SSEClientTransport } = require("@modelcontextprotocol/sdk/client/sse.js");
const { GoldBeanX402 } = require("@goldbean/x402-sdk");

// Initialize x402 payment signer
const x402 = new GoldBeanX402({
  privateKey: process.env.WALLET_PRIVATE_KEY,
  token: "USDC",
  chain: "base",
});

// --- Example 1: Call OCR endpoint ---

async function runOCR() {
  const payment = await x402.signPayment({
    amount: 1000,
    endpoint: "baidu_ocr",
  });

  const transport = new SSEClientTransport(
    new URL("https://goldbean-api.xyz/sse"),
    {
      requestInit: {
        headers: { "X-Payment": payment },
      },
    }
  );

  const client = new Client(
    { name: "goldbean-example", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  const result = await client.callTool({
    name: "baidu_ocr",
    arguments: { image_url: "https://example.com/document.jpg" },
  });

  console.log("OCR Result:", result.content);
  await client.close();
}

// --- Example 2: Batch call with single payment ---

async function batchCall() {
  const payment = await x402.signBatchPayment([
    { endpoint: "baidu_ocr", amount: 1000 },
    { endpoint: "llm_chat", amount: 3000 },
    { endpoint: "baidu_tts", amount: 3000 },
  ]);

  const transport = new SSEClientTransport(
    new URL("https://goldbean-api.xyz/sse"),
    {
      requestInit: { headers: { "X-Payment": payment } },
    }
  );

  const client = new Client(
    { name: "goldbean-batch", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  const ocrResult = await client.callTool({
    name: "baidu_ocr",
    arguments: { image_url: "https://example.com/invoice.png" },
  });
  console.log("OCR:", ocrResult.content[0].text.substring(0, 100));

  const llmResult = await client.callTool({
    name: "llm_chat",
    arguments: {
      messages: [{ role: "user", content: "Summarize: " + ocrResult.content[0].text }],
    },
  });
  console.log("Summary:", llmResult.content[0].text);

  const ttsResult = await client.callTool({
    name: "baidu_tts",
    arguments: { text: llmResult.content[0].text, voice: "en" },
  });
  console.log("Audio URL:", ttsResult.content[0].text);

  await client.close();
}

// --- Example 3: List all available tools ---

async function listTools() {
  const transport = new SSEClientTransport(
    new URL("https://goldbean-api.xyz/sse")
  );

  const client = new Client(
    { name: "goldbean-lister", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  const tools = await client.listTools();

  console.log("Available tools:");
  tools.tools.forEach((tool, i) => {
    console.log(`  ${i + 1}. ${tool.name} - ${tool.description || "No description"}`);
  });

  await client.close();
}

// Run examples
listTools().catch(console.error);
// runOCR().catch(console.error);
// batchCall().catch(console.error);
