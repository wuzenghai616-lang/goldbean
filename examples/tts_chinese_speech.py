"""
GoldBean Example — TTS: Convert Chinese Text to Speech Audio
================================================================
Uses the `baidu-tts` endpoint exposed by the GoldBean MCP server (Baidu
Text-to-Speech) to turn Chinese text into an MP3 file you can play back.

How it works
------------
Call `GET /paid/baidu-tts` with `text` and an optional voice `per`
param, then save the returned audio bytes to disk.

Voice options (per):
    0 = female (default), 1 = male, 3 = emotional, 4 = emotional female,
    5 = male (2)

You get 5 free calls/day per IP with no API key. To go past that, register
for a free key at https://goldbean-api.xyz and pass it with --api-key
(or set the GOLDBEAN_API_KEY env var).

Installation
------------
    pip install requests

Usage
-----
    # Convert the built-in sample sentence to speech -> output.mp3
    python tts_chinese_speech.py

    # Convert your own text
    python tts_chinese_speech.py --text "今天天气真不错"

    # Pick a different voice and output filename
    python tts_chinese_speech.py --text "你好" --voice 1 --output hello.mp3

    # Use a GoldBean API key (optional, raises your daily call limit)
    python tts_chinese_speech.py --api-key GB_XXXXXXXX
"""

import argparse
import os
import sys

import requests

API_BASE = "https://goldbean-api.xyz"
TTS_ENDPOINT = "/paid/baidu-tts"

SAMPLE_TEXT = "你好，欢迎使用 GoldBean 语音合成示例。"


def text_to_speech(text: str, voice: str = "0", api_key: str = None) -> bytes:
    params = {"text": text, "per": voice}
    headers = {"x-user-id": api_key} if api_key else {}

    resp = requests.get(f"{API_BASE}{TTS_ENDPOINT}", params=params, headers=headers, timeout=30)
    resp.raise_for_status()

    # If something went wrong, GoldBean returns JSON with an "error" field
    # instead of audio bytes.
    content_type = resp.headers.get("content-type", "")
    if "json" in content_type:
        raise RuntimeError(resp.json())

    return resp.content


def main():
    parser = argparse.ArgumentParser(description="Convert Chinese text to speech via GoldBean TTS")
    parser.add_argument("--text", default=SAMPLE_TEXT, help="Chinese text to synthesize")
    parser.add_argument("--voice", default="0", help="Voice: 0=female, 1=male, 3=emotional, 4=emotional female, 5=male(2)")
    parser.add_argument("--output", default="output.mp3", help="Output audio file path (default: output.mp3)")
    parser.add_argument(
        "--api-key",
        default=os.environ.get("GOLDBEAN_API_KEY"),
        help="GoldBean API key (optional; falls back to 5 free calls/day per IP)",
    )
    args = parser.parse_args()

    print("GoldBean TTS — Chinese Text to Speech")
    print("=" * 50)
    print(f"Text: {args.text}")
    print(f"Voice: {args.voice}\n")

    try:
        audio_bytes = text_to_speech(args.text, args.voice, args.api_key)
    except requests.RequestException as e:
        print(f"Request failed: {e}", file=sys.stderr)
        sys.exit(1)
    except RuntimeError as e:
        print(f"API returned an error: {e}", file=sys.stderr)
        sys.exit(1)

    with open(args.output, "wb") as f:
        f.write(audio_bytes)

    print(f"Saved {len(audio_bytes)} bytes of audio to {args.output}")


if __name__ == "__main__":
    main()
