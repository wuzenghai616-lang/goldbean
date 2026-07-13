"""
GoldBean API — Python SDK Example
==================================
A complete example showing how to use GoldBean API from Python.

Installation:
    pip install requests

Usage:
    python quickstart.py
"""

import requests
import json
import sys

API_BASE = "https://goldbean-api.xyz"


class GoldBean:
    """GoldBean API client — simple and clean."""

    def __init__(self, api_key=None):
        self.api_key = api_key
        self.base = API_BASE

    def _headers(self):
        return {"x-user-id": self.api_key} if self.api_key else {}

    def _get(self, path, **params):
        url = f"{self.base}{path}"
        r = requests.get(url, params=params, headers=self._headers(), timeout=60)
        return r.json() if r.headers.get("content-type", "").includes("json") else r.content

    def _post(self, path, data):
        r = requests.post(f"{self.base}{path}", json=data, headers=self._headers(), timeout=60)
        return r.json()

    # ── Free endpoints (no API key needed) ──

    def weather(self, city="London"):
        return self._get("/weather-now", city=city)

    def btc_price(self):
        return self._get("/btc-price")

    def eth_gas(self):
        return self._get("/gas")

    def health(self):
        return self._get("/health")

    # ── Account ──

    def register(self, email, name=None):
        data = {"email": email}
        if name:
            data["name"] = name
        return self._post("/paid/user/register", data)

    def credits(self):
        return self._get("/paid/user/credits")

    # ── OCR ──

    def ocr(self, url=None, image=None):
        params = {}
        if url:
            params["url"] = url
        if image:
            params["image"] = image
        return self._get("/paid/baidu-ocr", **params)

    def ocr_accurate(self, url=None, image=None):
        params = {"url": url} if url else {"image": image}
        return self._get("/paid/baidu-ocr-accurate", **params)

    def ocr_table(self, url=None, image=None):
        params = {"url": url} if url else {"image": image}
        return self._get("/paid/baidu-ocr-table", **params)

    def ocr_idcard(self, url=None, image=None, side="front"):
        params = {"url": url, "side": side} if url else {"image": image, "side": side}
        return self._get("/paid/baidu-idcard", **params)

    def ocr_handwriting(self, url=None, image=None):
        params = {"url": url} if url else {"image": image}
        return self._get("/paid/baidu-ocr-handwriting", **params)

    # ── Translation ──

    def translate(self, text, to="en", frm="auto"):
        return self._get("/paid/baidu-translate", text=text, frm=frm, to=to)

    # ── LLM ──

    def chat(self, message, model="ernie-5.1"):
        return self._get("/paid/baidu-llm-chat", message=message, model=model)

    def deepthink(self, message, model="deepseek-r1-250528"):
        return self._get("/paid/baidu-deepthink", message=message, model=model)

    def vision_chat(self, image, message="Describe this image", model="ernie-4.5-turbo-vl"):
        return self._get("/paid/baidu-vision-chat", image=image, message=message, model=model)

    # ── Speech ──

    def tts(self, text, per="0"):
        """Text-to-speech. Returns audio bytes."""
        r = requests.get(
            f"{self.base}/paid/baidu-tts",
            params={"text": text, "per": per},
            headers=self._headers(),
            timeout=30,
        )
        return r.content

    # ── NLP ──

    def sentiment(self, text):
        return self._get("/paid/baidu-sentiment", text=text)

    def summary(self, text):
        return self._get("/paid/baidu-summary", text=text)

    def keywords(self, text, num=5):
        return self._get("/paid/baidu-keyword-extraction", text=text, num=num)

    def text_correct(self, text):
        return self._get("/paid/baidu-text-corrector", text=text)

    # ── Vision ──

    def recognize_plant(self, url=None, image=None, baike="true"):
        params = {"baike": baike}
        if url:
            params["url"] = url
        if image:
            params["image"] = image
        return self._get("/paid/baidu-plant", **params)

    def recognize_animal(self, url=None, image=None, baike="true"):
        params = {"baike": baike}
        if url:
            params["url"] = url
        if image:
            params["image"] = image
        return self._get("/paid/baidu-animal", **params)

    def recognize_dish(self, url=None, image=None, baike="true"):
        params = {"baike": baike}
        if url:
            params["url"] = url
        if image:
            params["image"] = image
        return self._get("/paid/baidu-dish", **params)

    def face_detect(self, url=None, image=None):
        params = {"url": url} if url else {"image": image}
        return self._get("/paid/baidu-face-detect", **params)

    def face_compare(self, url1=None, url2=None, image1=None, image2=None):
        params = {}
        if url1:
            params["url1"] = url1
        if url2:
            params["url2"] = url2
        if image1:
            params["image1"] = image1
        if image2:
            params["image2"] = image2
        return self._get("/paid/baidu-face-compare", **params)

    # ── Embedding & Reranker ──

    def embedding(self, text, model="embedding-v1"):
        return self._get("/paid/baidu-embedding", text=text, model=model)

    def reranker(self, query, documents, model="bce-reranker-base"):
        """documents: list of strings or string separated by ||"""
        if isinstance(documents, list):
            documents = "||".join(documents)
        return self._get("/paid/baidu-reranker", query=query, documents=documents, model=model)

    # ── Content Moderation ──

    def text_review(self, text):
        return self._get("/paid/baidu-text-review", text=text)

    def image_review(self, url=None, image=None):
        params = {"url": url} if url else {"image": image}
        return self._get("/paid/baidu-image-review", **params)

    # ── Image Generation ──

    def image_gen(self, prompt, model="qwen-image", n=1):
        return self._get("/paid/baidu-image-gen", prompt=prompt, model=model, n=n)

    # ── OpenAI-compatible ──

    def openai_chat(self, messages, model="deepseek-chat"):
        """OpenAI-compatible chat completions."""
        return self._post("/v1/chat/completions", {"model": model, "messages": messages})


def main():
    print("=" * 50)
    print("🫘 GoldBean API — Python Quick Start")
    print("=" * 50)

    # Step 1: Try free endpoints (no API key needed)
    print("\n1️⃣  Free endpoints (no registration needed):")

    weather = GoldBean().weather("Beijing")
    print(f"   Weather in Beijing: {weather.get('temperature', '?')}°C, {weather.get('desc', '?')}")

    btc = GoldBean().btc_price()
    print(f"   BTC price: ${btc.get('price', '?')}")

    # Step 2: Register for free credits
    print("\n2️⃣  Registering for free credits...")
    email = input("   Enter your email (or press Enter to skip): ").strip()
    if not email:
        email = "demo@example.com"
        print(f"   Using demo email: {email}")

    gb = GoldBean()
    result = gb.register(email)
    if result.get("success"):
        api_key = result["apiKey"]
        print(f"   ✅ API Key: {api_key}")
        print(f"   ✅ Free credits: {result.get('freeCredits', 20)}")
        gb = GoldBean(api_key)
    else:
        print(f"   ⚠️  Registration result: {result}")
        api_key = input("   Enter your existing API key (GB_xxxx): ").strip()
        if api_key:
            gb = GoldBean(api_key)
        else:
            print("   Continuing with free tier only (5 calls/day per IP)")

    # Step 3: Use Baidu AI
    print("\n3️⃣  Baidu AI examples:")

    # OCR
    print("\n   📝 OCR (text extraction):")
    ocr = gb.ocr(url="https://goldbean-api.xyz/og-image.png")
    if "words_result" in ocr:
        text = " ".join([w["words"] for w in ocr["words_result"][:3]])
        print(f"   Extracted: {text[:80]}...")
    else:
        print(f"   Result: {json.dumps(ocr, ensure_ascii=False)[:100]}")

    # Translation
    print("\n   🌐 Translation:")
    trans = gb.translate("Hello World", to="zh")
    if "trans_result" in trans:
        print(f"   'Hello World' → {trans['trans_result'][0]['dst']}")
    else:
        print(f"   Result: {json.dumps(trans, ensure_ascii=False)[:100]}")

    # Check credits
    print("\n   💰 Credits:")
    credits = gb.credits()
    print(f"   {json.dumps(credits, indent=2)}")

    print("\n✅ Done! Explore more at https://goldbean-api.xyz")


if __name__ == "__main__":
    main()
