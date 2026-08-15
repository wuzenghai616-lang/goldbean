"""
GoldBean Example — OCR: Extract Text from a Chinese Document Image
====================================================================
Uses the `baidu-ocr` endpoint (General Text Recognition) exposed by the
GoldBean MCP server to pull text out of a scanned/photographed Chinese
document.

How it works
------------
1. Load an image (local file, or a sample doc auto-generated if you don't
   have one handy) and base64-encode it.
2. Call `GET /paid/baidu-ocr` with the `image` param.
3. Print each recognized line of text.

You get 5 free calls/day per IP with no API key. To go past that, register
for a free key at https://goldbean-api.xyz and pass it with --api-key
(or set the GOLDBEAN_API_KEY env var).

Installation
------------
    pip install requests pillow

Usage
-----
    # Auto-generates a small sample Chinese document image and OCRs it
    python ocr_chinese_document.py

    # OCR your own image file
    python ocr_chinese_document.py --image /path/to/document.jpg

    # OCR an image already hosted online
    python ocr_chinese_document.py --url https://example.com/document.jpg

    # Use a GoldBean API key (optional, raises your daily call limit)
    python ocr_chinese_document.py --api-key GB_XXXXXXXX
"""

import argparse
import base64
import io
import os
import sys

import requests

API_BASE = "https://goldbean-api.xyz"
OCR_ENDPOINT = "/paid/baidu-ocr"


def generate_sample_document() -> bytes:
    """Render a tiny synthetic Chinese document so this script works
    out of the box even if you don't have a sample image on hand.

    Kept deliberately small (single short line, 1-bit black/white PNG):
    the OCR endpoint only accepts images via a GET query parameter, and
    a full-size/full-color image base64-encodes to tens of KB, which
    blows past most servers' URL length limits ("414 Request-URI Too
    Large"). This tiny version comfortably fits.
    """
    from PIL import Image, ImageDraw, ImageFont

    text = "欢迎使用 GoldBean"

    candidate_fonts = [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",  # Linux
        "C:/Windows/Fonts/msyh.ttc",       # Windows — Microsoft YaHei
        "C:/Windows/Fonts/simsun.ttc",     # Windows — SimSun
        "C:/Windows/Fonts/simhei.ttf",     # Windows — SimHei
        "/System/Library/Fonts/PingFang.ttc",  # macOS
    ]
    font = None
    for font_path in candidate_fonts:
        if os.path.exists(font_path):
            font = ImageFont.truetype(font_path, 22)
            break
    if font is None:
        print(
            "Warning: no CJK font found on this system — the generated "
            "sample image won't render Chinese text correctly. "
            "Use --image with your own document photo instead."
        )
        font = ImageFont.load_default()

    img = Image.new("L", (300, 60), color=255)  # grayscale, small canvas
    draw = ImageDraw.Draw(img)
    draw.text((8, 15), text, fill=0, font=font)
    img = img.convert("1")  # 1-bit black/white — compresses far smaller than RGB

    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()

    y = 40
    for line in lines:
        draw.text((40, y), line, fill="black", font=font)
        y += 60

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def image_to_base64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def run_ocr(image_b64: str = None, image_url: str = None, api_key: str = None) -> dict:
    params = {}
    if image_url:
        params["url"] = image_url
    elif image_b64:
        params["image"] = image_b64
    else:
        raise ValueError("Provide either an image or a url")

    headers = {"x-user-id": api_key} if api_key else {}

    resp = requests.get(f"{API_BASE}{OCR_ENDPOINT}", params=params, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="Extract text from a Chinese document image via GoldBean OCR")
    parser.add_argument("--image", help="Path to a local image file")
    parser.add_argument("--url", help="URL of an image already hosted online")
    parser.add_argument(
        "--api-key",
        default=os.environ.get("GOLDBEAN_API_KEY"),
        help="GoldBean API key (optional; falls back to 5 free calls/day per IP)",
    )
    args = parser.parse_args()

    print("GoldBean OCR — Chinese Document Text Extraction")
    print("=" * 50)

    try:
        if args.url:
            print(f"Reading image from URL: {args.url}")
            result = run_ocr(image_url=args.url, api_key=args.api_key)
        elif args.image:
            print(f"Reading local image: {args.image}")
            result = run_ocr(image_b64=image_to_base64(args.image), api_key=args.api_key)
        else:
            print("No image provided — generating a sample Chinese document image...")
            sample_bytes = generate_sample_document()
            with open("sample_chinese_document.png", "wb") as f:
                f.write(sample_bytes)
            print("Saved sample image to sample_chinese_document.png")
            b64 = base64.b64encode(sample_bytes).decode()
            result = run_ocr(image_b64=b64, api_key=args.api_key)
    except requests.RequestException as e:
        print(f"Request failed: {e}", file=sys.stderr)
        sys.exit(1)

    if result.get("error"):
        print(f"API returned an error: {result['error']}", file=sys.stderr)
        sys.exit(1)

    words = (
        result.get("words_result")
        or result.get("data", {}).get("words_result")
        or result.get("result", {}).get("words_result")
        or []
    )
    if not words:
        print("No text detected. Raw response:")
        print(result)
        return

    print(f"\nDetected {len(words)} line(s) of text:\n")
    for i, w in enumerate(words, 1):
        print(f"  {i}. {w.get('words', '')}")


if __name__ == "__main__":
    main()
