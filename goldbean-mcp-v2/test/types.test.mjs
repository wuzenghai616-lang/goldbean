/**
 * Runtime coverage test for the GoldBean MCP type definitions.
 *
 * The canonical tool schema is the GoldBean MCP server v9.8.0 —
 * `mcp.json` (51 tools) backed by `goldbean_mcp_http.js` inputSchemas
 * (see https://goldbean-api.xyz/.well-known/mcp.json). This test verifies:
 *
 *   1. The tool list declared in mcp.json matches the server's TOOLS array.
 *   2. Every one of those tools has a matching `<ToolName>Params` interface
 *      declared in types.d.ts.
 *   3. Every param the schema marks `required` is required (no `?`) in the
 *      corresponding interface, so a runtime schema change fails the test
 *      instead of silently drifting.
 *   4. The ToolParamsByName map covers exactly the schema's tool set.
 *
 * The compile-time shape of the interfaces (property names, types,
 * optionality) is covered separately by test/types.check.ts via `tsc`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const typesSource = readFileSync(join(__dirname, "..", "types.d.ts"), "utf8");

// --- Parse the canonical server TOOLS array (goldbean_mcp_http.js) ---
// The module starts an HTTP server on import, so evaluate just the TOOLS
// declaration in a sandbox instead.
function serverTools() {
  const src = readFileSync(join(ROOT, "goldbean_mcp_http.js"), "utf8");
  const start = src.indexOf("const TOOLS = [");
  const end = src.indexOf("\n];", start);
  const block = src.slice(start, end + 3).replace("const TOOLS = ", "globalThis.__T = ");
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(block + ";", sandbox);
  const tools = sandbox.__T;
  if (!Array.isArray(tools) || tools.length === 0) {
    throw new Error("Could not parse TOOLS from goldbean_mcp_http.js");
  }
  return tools;
}

// --- Cross-check the canonical tool names against mcp.json ---
function mcpJsonToolNames() {
  const mcp = JSON.parse(readFileSync(join(ROOT, "mcp.json"), "utf8"));
  const names = mcp.capabilities?.tools;
  assert.ok(Array.isArray(names) && names.length > 0, "mcp.json capabilities.tools missing");
  return names;
}

const tools = serverTools();
// NOTE: `tools` lives in a `vm` sandbox realm, so arrays derived from it carry
// the sandbox's Array prototype. assert.deepStrictEqual compares prototypes, so
// spread them into fresh main-realm arrays before asserting equality.
const schemaToolNames = [...tools.map((t) => t.name)];

// --- types.d.ts coverage helpers ---
// Tool names are snake_case ("baidu_ocr") but the interfaces are PascalCase
// ("BaiduOcrParams"), so convert before matching.
function interfaceNameFor(toolName) {
  const pascal = toolName
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  return `${pascal}Params`;
}

function paramsInterfaceExists(name) {
  return new RegExp(`export interface ${interfaceNameFor(name)}\\b`).test(
    typesSource
  );
}

function interfaceBody(name) {
  const match = typesSource.match(
    new RegExp(
      `export interface ${interfaceNameFor(name)}\\b[^]*?\\{([\\s\\S]*?)\\n\\}`
    )
  );
  return match ? match[1] : "";
}

function fieldIsRequired(body, field) {
  const re = new RegExp(`(?:^|\\n)\\s*${field}(\\??):`);
  const m = body.match(re);
  return m ? m[1] !== "?" : false;
}

// --- Assertions ---

test("mcp.json tool list is a subset of the server TOOLS array", () => {
  // mcp.json omits service_health (a free health-check tool) even though the
  // server exposes and serves it — so assert subset, not exact equality.
  const inMcpButNotServer = mcpJsonToolNames().filter(
    (n) => !schemaToolNames.includes(n)
  );
  assert.deepEqual(
    inMcpButNotServer,
    [],
    `mcp.json lists tools the server does not expose: ${inMcpButNotServer.join(", ")}`
  );
});

test("every schema tool has a matching <ToolName>Params interface", () => {
  const missing = schemaToolNames.filter((n) => !paramsInterfaceExists(n));
  assert.deepEqual(
    missing,
    [],
    `tools missing a params interface in types.d.ts: ${missing.join(", ")}`
  );
});

test("every required schema param is required in the interface", () => {
  const failures = [];
  for (const tool of tools) {
    const required = tool.inputSchema?.required || [];
    if (required.length === 0) continue;
    const body = interfaceBody(tool.name);
    for (const field of required) {
      if (!fieldIsRequired(body, field)) {
        failures.push(
          `${tool.name}.${field} is required in inputSchema but optional (?) in the interface`
        );
      }
    }
  }
  assert.deepEqual(
    failures,
    [],
    "required param mismatches:\n" + failures.join("\n")
  );
});

test("ToolParamsByName covers exactly the schema tool set", () => {
  const mapBody = typesSource.match(
    /export interface ToolParamsByName\b[^]*?\{([\s\S]*?)\n\}/
  );
  assert.ok(mapBody, "ToolParamsByName interface not found in types.d.ts");
  const mapped = [...mapBody[1].matchAll(/^\s{2}([a-z0-9_]+):/gm)].map((m) => m[1]);
  assert.deepEqual(mapped.sort(), schemaToolNames.sort());
});
