"""
GoldBean OCR Example — Extract Text from Chinese Documents
===========================================================

This example demonstrates how to use GoldBean's OCR API to extract text
from Chinese document images, receipts, and invoices.

Features:
- General OCR for printed Chinese text
- High-precision OCR for blurry/low-quality images
- Receipt/invoice extraction
- Support for both URL and base64-encoded images

Installation:
    pip install requests

Usage:
    python ocr_chinese_document.py

Free Tier:
    50 free calls/day per IP — no registration needed!
    Register for 100 free credits: https://goldbean-api.xyz

API Documentation:
    https://goldbean-api.xyz/openapi.json
"""

import requests
import json
import sys
from pathlib import Path


class GoldBeanOCR:
    """GoldBean OCR client for extracting text from images."""

    def __init__(self, api_key=None):
        """
        Initialize the OCR client.
        
        Args:
            api_key: Optional API key for authenticated requests
                     Get one at https://goldbean-api.xyz
        """
        self.api_base = "https://goldbean-api.xyz"
        self.api_key = api_key
        self.timeout = 30

    def _headers(self):
        """Construct request headers."""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["x-user-id"] = self.api_key
        return headers

    def ocr_general(self, url=None, image_base64=None):
        """
        Extract text from an image using general OCR.
        
        Best for:
        - Printed text in multiple languages
        - Mixed Chinese and English documents
        - Books, newspapers, websites
        
        Args:
            url: Direct URL to the image
            image_base64: Base64-encoded image data
            
        Returns:
            dict: OCR result with extracted text
        """
        payload = {}
        if url:
            payload["url"] = url
        elif image_base64:
            payload["image"] = image_base64
        else:
            raise ValueError("Either 'url' or 'image_base64' must be provided")

        response = requests.post(
            f"{self.api_base}/paid/baidu-ocr",
            json=payload,
            headers=self._headers(),
            timeout=self.timeout,
        )
        return response.json()

    def ocr_accurate(self, url=None, image_base64=None):
        """
        Extract text using high-precision OCR.
        
        Best for:
        - Blurry or low-quality images
        - Handwritten Chinese text with printed
        - Complex layouts
        - Difficult-to-read documents
        
        Args:
            url: Direct URL to the image
            image_base64: Base64-encoded image data
            
        Returns:
            dict: High-precision OCR result
        """
        payload = {}
        if url:
            payload["url"] = url
        elif image_base64:
            payload["image"] = image_base64
        else:
            raise ValueError("Either 'url' or 'image_base64' must be provided")

        response = requests.post(
            f"{self.api_base}/paid/baidu-ocr-accurate",
            json=payload,
            headers=self._headers(),
            timeout=self.timeout,
        )
        return response.json()

    def ocr_table(self, url=None, image_base64=None):
        """
        Extract structured table data from images.
        
        Best for:
        - Excel/spreadsheet screenshots
        - Business reports with tables
        - Data tables in documents
        
        Args:
            url: Direct URL to the image
            image_base64: Base64-encoded image data
            
        Returns:
            dict: Table extraction result with structure
        """
        payload = {}
        if url:
            payload["url"] = url
        elif image_base64:
            payload["image"] = image_base64
        else:
            raise ValueError("Either 'url' or 'image_base64' must be provided")

        response = requests.post(
            f"{self.api_base}/paid/baidu-ocr-table",
            json=payload,
            headers=self._headers(),
            timeout=self.timeout,
        )
        return response.json()

    def ocr_receipt(self, url=None, image_base64=None):
        """
        Extract structured data from receipts and invoices.
        
        Best for:
        - Receipt scanning
        - Invoice processing
        - Expense management
        
        Returns:
            dict: Receipt data with structured fields
        """
        payload = {}
        if url:
            payload["url"] = url
        elif image_base64:
            payload["image"] = image_base64
        else:
            raise ValueError("Either 'url' or 'image_base64' must be provided")

        response = requests.post(
            f"{self.api_base}/paid/baidu-ocr-receipt",
            json=payload,
            headers=self._headers(),
            timeout=self.timeout,
        )
        return response.json()

    def ocr_idcard(self, url=None, image_base64=None, side="front"):
        """
        Extract text from Chinese ID cards.
        
        Best for:
        - ID verification
        - Document processing
        
        Args:
            url: Direct URL to the image
            image_base64: Base64-encoded image data
            side: "front" or "back" of the ID card
            
        Returns:
            dict: ID card data with extracted fields
        """
        payload = {"side": side}
        if url:
            payload["url"] = url
        elif image_base64:
            payload["image"] = image_base64
        else:
            raise ValueError("Either 'url' or 'image_base64' must be provided")

        response = requests.post(
            f"{self.api_base}/paid/baidu-ocr-idcard",
            json=payload,
            headers=self._headers(),
            timeout=self.timeout,
        )
        return response.json()

    @staticmethod
    def image_to_base64(image_path):
        """
        Convert a local image file to base64 encoding.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            str: Base64-encoded image string
        """
        import base64

        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")


def print_result(result, title="OCR Result"):
    """Pretty print the OCR result."""
    print(f"\n{'=' * 60}")
    print(f"  {title}")
    print(f"{'=' * 60}")
    
    if "error_code" in result and result["error_code"] != 0:
        print(f"❌ Error: {result.get('error_msg', 'Unknown error')}")
        print(f"   Code: {result.get('error_code')}")
        return
    
    # General OCR result
    if "words_result" in result:
        print(f"✅ Text extracted ({len(result['words_result'])} lines):\n")
        for i, line in enumerate(result["words_result"][:10], 1):
            text = line.get("words", "")
            confidence = line.get("probability", {}).get("average", 0)
            print(f"  {i}. {text} (confidence: {confidence:.2%})")
        
        if len(result["words_result"]) > 10:
            print(f"  ... and {len(result['words_result']) - 10} more lines")
    
    # Receipt/Invoice result
    elif "words_result" in result or "data" in result:
        print(f"✅ Structured data extracted:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    
    # Print full response for debugging
    else:
        print("Full response:")
        print(json.dumps(result, indent=2, ensure_ascii=False))


def main():
    print("\n" + "=" * 60)
    print("  🫘 GoldBean OCR — Chinese Document Text Extraction")
    print("=" * 60)
    
    # Initialize OCR client
    # Get API key at https://goldbean-api.xyz/paid/user/register
    api_key = None  # Leave empty for free tier (50 calls/day)
    ocr_client = GoldBeanOCR(api_key=api_key)
    
    print("\n💡 Examples of supported OCR types:")
    print("   • baidu_ocr — General printed text OCR")
    print("   • baidu_ocr_accurate — High-precision for blurry images")
    print("   • baidu_ocr_table — Table extraction")
    print("   • baidu_ocr_receipt — Receipt/invoice processing")
    print("   • baidu_ocr_idcard — Chinese ID card extraction")
    
    # Example 1: General OCR from URL
    print("\n" + "-" * 60)
    print("Example 1: General OCR from URL")
    print("-" * 60)
    print("Extracting text from a public image URL...")
    
    # Using a simple public image URL for demonstration
    test_image_url = "https://www.baidu.com/img/flexible/logo/pc/result.png"
    
    try:
        result = ocr_client.ocr_general(url=test_image_url)
        print_result(result, "General OCR Result")
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        print("   Tip: Make sure you have internet connection")
    
    # Example 2: Accurate OCR
    print("\n" + "-" * 60)
    print("Example 2: High-Precision OCR")
    print("-" * 60)
    print("Use ocr_accurate() for blurry or complex documents:")
    print("\n```python")
    print("result = ocr_client.ocr_accurate(url='https://your-image.jpg')")
    print("```")
    
    # Example 3: Local image processing
    print("\n" + "-" * 60)
    print("Example 3: Process Local Image Files")
    print("-" * 60)
    print("Convert local images to base64 and send:\n")
    print("```python")
    print("# Convert image to base64")
    print("image_b64 = ocr_client.image_to_base64('document.png')")
    print("\n# Send for OCR")
    print("result = ocr_client.ocr_general(image_base64=image_b64)")
    print("```")
    
    # Example 4: Table extraction
    print("\n" + "-" * 60)
    print("Example 4: Extract Tables from Documents")
    print("-" * 60)
    print("```python")
    print("result = ocr_client.ocr_table(url='https://your-table.jpg')")
    print("# Returns structured table data")
    print("```")
    
    # Example 5: Receipt processing
    print("\n" + "-" * 60)
    print("Example 5: Process Receipts & Invoices")
    print("-" * 60)
    print("```python")
    print("result = ocr_client.ocr_receipt(url='https://your-receipt.jpg')")
    print("# Returns: merchant, date, total, items, etc.")
    print("```")
    
    # Print usage tips
    print("\n" + "=" * 60)
    print("  📚 Usage Tips")
    print("=" * 60)
    print("""
✅ Best Practices:
   • Use URLs when possible (faster, more reliable)
   • For base64, keep images under 4MB
   • High-quality images = better accuracy
   • Free tier: 50 calls/day per IP
   
💰 Pricing:
   • OCR: $0.005 per call
   • Register for 100 free credits: https://goldbean-api.xyz
   
📖 Documentation:
   • API Reference: https://goldbean-api.xyz/openapi.json
   • Examples: https://github.com/wuzenghai616-lang/goldbean/tree/main/examples
   
🚀 Next Steps:
   1. Replace 'api_key=None' with your actual API key
   2. Update image URLs to your document images
   3. Run: python ocr_chinese_document.py
   4. Check results and adjust for your use case
    """)
    
    print("=" * 60)
    print("✅ OCR example complete!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
