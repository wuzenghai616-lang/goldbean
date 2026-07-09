"""GoldBean MCP Server - Python Integration Example

This example shows how to call GoldBean endpoints from Python
using the MCP SDK and x402 payment protocol.
"""

import asyncio
import json
from mcp import ClientSession
from mcp.client.sse import sse_client


# --- Example 1: Free endpoint (no payment needed) ---

async def call_free_endpoint():
    """Call a free endpoint - no payment required."""
    async with sse_client("https://goldbean-api.xyz/sse") as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # List all available tools
            tools = await session.list_tools()
            print(f"Available tools: {len(tools.tools)}")

            # Call a free endpoint
            result = await session.call_tool(
                "weather_query",
                arguments={"city": "Beijing"}
            )
            print(f"Weather: {result.content}")


# --- Example 2: Paid endpoint with x402 payment ---

async def call_paid_endpoint():
    """Call a paid endpoint with x402 micro-payment."""
    payment_header = await sign_x402_payment(
        amount=1000,  # $0.01 = 1000 units in USDC
        token="USDC",
        chain="base",
        private_key="YOUR_PRIVATE_KEY"
    )

    async with sse_client(
        "https://goldbean-api.xyz/sse",
        headers={"X-Payment": payment_header}
    ) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # Call OCR endpoint
            result = await session.call_tool(
                "baidu_ocr",
                arguments={"image_url": "https://example.com/receipt.jpg"}
            )
            print(f"OCR Result: {result.content}")


# --- Example 3: LLM chat ---

async def chat_with_llm():
    """Use GoldBean LLM endpoint for chat completion."""
    payment_header = await sign_x402_payment(
        amount=3000,  # $0.03
        token="USDC",
        chain="base",
        private_key="YOUR_PRIVATE_KEY"
    )

    async with sse_client(
        "https://goldbean-api.xyz/sse",
        headers={"X-Payment": payment_header}
    ) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "llm_chat",
                arguments={
                    "messages": [
                        {"role": "user", "content": "Explain MCP protocol in 3 sentences"}
                    ],
                    "model": "ernie-4.0-turbo"
                }
            )
            print(f"LLM Response: {result.content}")


async def sign_x402_payment(amount, token, chain, private_key):
    """Sign an x402 payment using EIP-3009."""
    from web3 import Web3

    w3 = Web3(Web3.HTTPProvider(f"https://{chain}.public.basernodes.com"))
    account = w3.eth.account.from_key(private_key)

    message = w3.solidity_keccak(
        ["address", "uint256", "uint256"],
        [account.address, amount, w3.eth.get_block("latest")["timestamp"]]
    )
    signed = account.sign_message(message)

    return json.dumps({
        "from": account.address,
        "amount": str(amount),
        "token": token,
        "chain": chain,
        "signature": signed.signature.hex(),
        "nonce": w3.eth.get_block("latest")["timestamp"]
    })


if __name__ == "__main__":
    # Run free example (no payment needed)
    asyncio.run(call_free_endpoint())

    # Run paid examples (requires wallet setup)
    # asyncio.run(call_paid_endpoint())
    # asyncio.run(chat_with_llm())
