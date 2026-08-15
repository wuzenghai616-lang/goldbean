"""
GoldBean Example — Image Recognition: Classify a Food Photo
================================================================
Uses the `baidu-dish` endpoint exposed by the GoldBean MCP server (Baidu
Dish/Cuisine Recognition) to identify a dish from a food photo, along with
a confidence score and optional Wikipedia-style background info.

How it works
------------
Call `GET /paid/baidu-dish` with either an image `url` or a base64
`image`, plus optional `baike=true` to include background info.

You get 5 free calls/day per IP with no API key. To go past that, register
for a free key at https://goldbean-api.xyz and pass it with --api-key
(or set the GOLDBEAN_API_KEY env var).

Installation
------------
    pip install requests

Usage
-----
    # Classify a food photo hosted online (default: a sample dumpling photo)
    python food_recognition.py

    # Classify your own hosted photo
    python food_recognition.py --url https://example.com/my-lunch.jpg

    # Classify a local photo (base64-encoded automatically)
    python food_recognition.py --image /path/to/food.jpg

    # Skip the Wikipedia-style background info
    python food_recognition.py --no-baike

    # Use a GoldBean API key (optional, raises your daily call limit)
    python food_recognition.py --api-key GB_XXXXXXXX
"""

import argparse
import base64
import os
import sys

import requests

API_BASE = "https://goldbean-api.xyz"
DISH_ENDPOINT = "/paid/baidu-dish"

# A freely-licensed sample food photo used as the default demo image.
SAMPLE_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Jiaozi.jpg/640px-Jiaozi.jpg"


def image_to_base64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def recognize_dish(image_url: str = None, image_b64: str = None, baike: bool = True, api_key: str = None) -> dict:
    params = {"baike": "true" if baike else "false"}
    if image_url:
        params["url"] = image_url
    elif image_b64:
        params["image"] = image_b64
    else:
        raise ValueError("Provide either an image or a url")

    headers = {"x-user-id": api_key} if api_key else {}

    resp = requests.get(f"{API_BASE}{DISH_ENDPOINT}", params=params, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="Classify a food photo via GoldBean dish recognition")
    parser.add_argument("--url", default=None, help="URL of a food photo (default: sample dumpling photo)")
    parser.add_argument("--image", help="Path to a local food photo")
    parser.add_argument("--no-baike", action="store_true", help="Skip Wikipedia-style background info")
    parser.add_argument(
        "--api-key",
        default=os.environ.get("GOLDBEAN_API_KEY"),
        help="GoldBean API key (optional; falls back to 5 free calls/day per IP)",
    )
    args = parser.parse_args()

    print("GoldBean Image Recognition — Food Photo Classifier")
    print("=" * 50)

    try:
        if args.image:
            print(f"Reading local image: {args.image}")
            result = recognize_dish(image_b64=image_to_base64(args.image), baike=not args.no_baike, api_key=args.api_key)
        else:
            url = args.url or SAMPLE_IMAGE_URL
            print(f"Reading image from URL: {url}")
            result = recognize_dish(image_url=url, baike=not args.no_baike, api_key=args.api_key)
    except requests.RequestException as e:
        print(f"Request failed: {e}", file=sys.stderr)
        sys.exit(1)

    if result.get("error"):
        print(f"API returned an error: {result['error']}", file=sys.stderr)
        sys.exit(1)

    dishes = result.get("data", {}).get("result", [])
    if not dishes:
        print("No dish detected. Raw response:")
        print(result)
        return

    print(f"\nTop {len(dishes)} match(es):\n")
    for i, d in enumerate(dishes, 1):
        name = d.get("name", "?")
        prob = d.get("probability", "?")
        print(f"  {i}. {name}  (confidence: {prob})")
        if d.get("baike_info", {}).get("description"):
            print(f"     {d['baike_info']['description'][:150]}...")


if __name__ == "__main__":
    main()
