"""
GoldBean Example — LLM: Generate Chinese Text with ERNIE Bot
================================================================
Uses the `baidu-llm-chat` endpoint exposed by the GoldBean MCP server to
chat with Baidu's ERNIE large language model — handy for generating
natural Chinese text, summarizing, brainstorming, etc.

How it works
------------
Call `GET /paid/baidu-llm-chat` with a `message` (your prompt) and an
optional `model` name.

Note: LLM Chat is a "premium" endpoint on GoldBean (may not be covered by
the free tier depending on current plan limits — see
https://goldbean-api.xyz for current pricing). Register for a key at
https://goldbean-api.xyz if you hit a payment/limit error.

Installation
------------
    pip install requests

Usage
-----
    # Ask ERNIE the built-in sample prompt (asks it to reply in Chinese)
    python ernie_llm_chat.py

    # Ask your own question
    python ernie_llm_chat.py --message "用三句话介绍一下人工智能"

    # Pick a specific ERNIE model
    python ernie_llm_chat.py --message "写一首关于秋天的短诗" --model ernie-4.0-turbo

    # Use a GoldBean API key
    python ernie_llm_chat.py --api-key GB_XXXXXXXX
"""

import argparse
import os
import sys

import requests

API_BASE = "https://goldbean-api.xyz"
LLM_CHAT_ENDPOINT = "/paid/baidu-llm-chat"

SAMPLE_PROMPT = "请用中文写一句欢迎语，欢迎大家使用 GoldBean。"


def chat(message: str, model: str = "ernie-5.1", api_key: str = None) -> dict:
    params = {"message": message, "model": model}
    headers = {"x-user-id": api_key} if api_key else {}

    resp = requests.get(f"{API_BASE}{LLM_CHAT_ENDPOINT}", params=params, headers=headers, timeout=60)
    resp.raise_for_status()
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="Generate Chinese text with ERNIE Bot via GoldBean")
    parser.add_argument("--message", default=SAMPLE_PROMPT, help="Prompt to send to ERNIE")
    parser.add_argument("--model", default="ernie-5.1", help="ERNIE model name (default: ernie-5.1)")
    parser.add_argument(
        "--api-key",
        default=os.environ.get("GOLDBEAN_API_KEY"),
        help="GoldBean API key (recommended for this premium endpoint)",
    )
    args = parser.parse_args()

    print("GoldBean LLM Chat — ERNIE Bot")
    print("=" * 50)
    print(f"Prompt: {args.message}")
    print(f"Model: {args.model}\n")

    try:
        result = chat(args.message, args.model, args.api_key)
    except requests.RequestException as e:
        print(f"Request failed: {e}", file=sys.stderr)
        sys.exit(1)

    if result.get("error"):
        print(f"API returned an error: {result['error']}", file=sys.stderr)
        print("If this is a payment/limit error, register for a free key at https://goldbean-api.xyz")
        sys.exit(1)

    print("ERNIE says:")
    print(result.get("response", result))


if __name__ == "__main__":
    main()
