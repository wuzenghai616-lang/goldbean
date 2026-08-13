# Example usage for goldbean MCP server
import asyncio
from mcp.client.stdio import stdio_client

async def main():
    server_cmd = "npx"
    server_args = ["-y", "@wuzenghai616/goldbean"]
    
    async with stdio_client(server_cmd, *server_args) as (read, write):
        print("Successfully connected to the goldbean MCP server!")
        # Add specific Baidu AI tool calls here

if __name__ == "__main__":
    asyncio.run(main())
