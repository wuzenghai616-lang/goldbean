"""
GoldBean Example — Translation: Chinese Text to English
==========================================================
Uses the `baidu-translate` endpoint exposed by the GoldBean MCP server
(Baidu Translate under the hood) to translate Chinese text into English
— or any other supported language pair.

How it works
------------
Call `GET /paid/baidu-translate` with `text`, `from`, and `to` params.

You get 5 free calls/day per IP with no API key. To go past that, register
for a free key at https://goldbean-api.xyz and pass it with --api-key
(or set the GOLDBEAN_API_KEY env var).

Installation
------------
    pip install requests

Usage
-----
    # Translate the built-in sample sentence (Chinese -> English)
    python translate_chinese_to_english.py

    # Translate your own text
    python translate_chinese_to_english.py --text "你好，世界"

    # Translate in the other direction (English -> Chinese)
    python translate_chinese_to_english.py --text "Hello, world" --from en --to zh

    # Use a GoldBean API key (optional, raises your daily call limit)
    python translate_chinese_to_english.py --api-key GB_XXXXXXXX
"""

import argparse
import os
import sys

import requests

API_BASE = "https://goldbean-api.xyz"
TRANSLATE_ENDPOINT = "/paid/baidu-translate"

SAMPLE_TEXT = "你好，欢迎使用 GoldBean。这是一个翻译示例。"


def translate(text: str, from_lang: str = "auto", to_lang: str = "en", api_key: str = None) -> dict:
    params = {"text": text, "from": from_lang, "to": to_lang}
    headers = {"x-user-id": api_key} if api_key else {}

    resp = requests.get(f"{API_BASE}{TRANSLATE_ENDPOINT}", params=params, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="Translate Chinese text to English via GoldBean")
    parser.add_argument("--text", default=SAMPLE_TEXT, help="Text to translate")
    parser.add_argument("--from", dest="from_lang", default="auto", help="Source language code (default: auto)")
    parser.add_argument("--to", dest="to_lang", default="en", help="Target language code (default: en)")
    parser.add_argument(
        "--api-key",
        default=os.environ.get("GOLDBEAN_API_KEY"),
        help="GoldBean API key (optional; falls back to 5 free calls/day per IP)",
    )
    args = parser.parse_args()

    print("GoldBean Translate — Chinese to English")
    print("=" * 50)
    print(f"Source ({args.from_lang}): {args.text}")

    try:
        result = translate(args.text, args.from_lang, args.to_lang, args.api_key)
    except requests.RequestException as e:
        print(f"Request failed: {e}", file=sys.stderr)
        sys.exit(1)

    if result.get("error"):
        print(f"API returned an error: {result['error']}", file=sys.stderr)
        sys.exit(1)

    # The live API has been observed nesting the payload under "data",
    # "result", or returning it at the top level depending on version —
    # check all three so this keeps working either way.
    trans_result = (
        result.get("trans_result")
        or result.get("data", {}).get("trans_result")
        or result.get("result", {}).get("trans_result")
        or []
    )
    if not trans_result:
        print("No translation returned. Raw response:")
        print(result)
        return

    translated = trans_result[0].get("dst", "")
    print(f"Translated ({args.to_lang}): {translated}")


if __name__ == "__main__":
    main()
