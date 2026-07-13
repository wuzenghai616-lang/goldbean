"""
GoldBean API — Python Integration with MCP SDK
================================================
This example shows how to use GoldBean through the MCP protocol
from Python, using the official MCP SDK.

Installation:
    pip install mcp

Usage:
    python mcp-integration.py
"""

import asyncio
import json
from mcp import ClientSession
from mcp.client.sse import sse_client


async def main():
    """Connect to GoldBean MCP server and try some tools."""

    # Connect to the GoldBean MCP server via SSE
    print("Connecting to GoldBean MCP server...")
    async with sse_client("https://goldbean-api.xyz/sse") as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize the session
            await session.initialize()
            print("✅ Connected!\n")

            # List all available tools
            tools = await session.list_tools()
            print(f"📋 Available tools: {len(tools.tools)}")
            for tool in tools.tools[:10]:
                print(f"   - {tool.name}: {tool.description[:60]}...")
            print(f"   ... and {len(tools.tools) - 10} more\n")

            # ── Example 1: Get weather (free, no API key needed) ──
            print("1️⃣  Getting weather for Tokyo...")
            result = await session.call_tool(
                "weather",
                arguments={"city": "Tokyo"}
            )
            print(f"   Result: {result.content[0].text}\n")

            # ── Example 2: Get BTC price (free) ──
            print("2️⃣  Getting BTC price...")
            result = await session.call_tool("btc_price", arguments={})
            print(f"   Result: {result.content[0].text}\n")

            # ── Example 3: Register for free credits ──
            print("3️⃣  Registering for free credits...")
            result = await session.call_tool(
                "register",
                arguments={"email": "demo@example.com"}
            )
            data = json.loads(result.content[0].text)
            if data.get("success"):
                api_key = data["apiKey"]
                print(f"   ✅ API Key: {api_key}")
                print(f"   ✅ Free credits: {data.get('freeCredits', 20)}\n")
            else:
                print(f"   {data}\n")
                api_key = None

            # ── Example 4: OCR (requires credits) ──
            if api_key:
                print("4️⃣  Running OCR on an image...")
                result = await session.call_tool(
                    "baidu_ocr",
                    arguments={
                        "url": "https://goldbean-api.xyz/og-image.png",
                        "api_key": api_key
                    }
                )
                ocr_data = json.loads(result.content[0].text)
                if "words_result" in ocr_data:
                    words = [w["words"] for w in ocr_data["words_result"][:5]]
                    print(f"   📝 Extracted text: {' | '.join(words)}")
                else:
                    print(f"   Result: {json.dumps(ocr_data, ensure_ascii=False)[:200]}")
                print()

                # ── Example 5: Translation ──
                print("5️⃣  Translating 'Hello World' to Chinese...")
                result = await session.call_tool(
                    "baidu_translate",
                    arguments={
                        "text": "Hello World",
                        "to": "zh",
                        "api_key": api_key
                    }
                )
                trans_data = json.loads(result.content[0].text)
                if "trans_result" in trans_data:
                    print(f"   🌐 Translation: {trans_data['trans_result'][0]['dst']}")
                else:
                    print(f"   Result: {json.dumps(trans_data, ensure_ascii=False)[:200]}")
                print()

            # ── Example 6: Check credits ──
            if api_key:
                print("6️⃣  Checking remaining credits...")
                result = await session.call_tool(
                    "check_credits",
                    arguments={"api_key": api_key}
                )
                print(f"   {result.content[0].text}\n")

    print("✅ All done!")


if __name__ == "__main__":
    asyncio.run(main())
