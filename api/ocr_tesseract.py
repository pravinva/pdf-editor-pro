# api/ocr_tesseract.py
"""
Tesseract OCR - MVP OCR Engine
Free OCR with 70-80% accuracy for clean scans
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
import pytesseract
from PIL import Image
import fitz  # PyMuPDF
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


@app.post("/tesseract")
async def ocr_tesseract(pdf_file: UploadFile = File(...)):
    """
    OCR using Tesseract (MVP - Free)

    Accuracy: 70-80% on clean scans, lower on poor quality
    Speed: ~2-3 seconds per page
    Cost: $0

    Args:
        pdf_file: PDF document to OCR

    Returns:
        JSON with OCR text, confidence scores, and metadata
    """
    try:
        logger.info("Starting Tesseract OCR processing")

        pdf_bytes = await pdf_file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        results = []

        for page_num in range(len(doc)):
            logger.info(f"Processing page {page_num + 1}/{len(doc)}")
            page = doc[page_num]

            # Render page to image at 300 DPI for better OCR accuracy
            pix = page.get_pixmap(dpi=300)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))

            # Run Tesseract OCR
            text = pytesseract.image_to_string(image)

            # Get detailed confidence scores
            data = pytesseract.image_to_data(
                image,
                output_type=pytesseract.Output.DICT
            )

            # Calculate average confidence (filter out -1 values)
            confidences = [
                int(conf) for conf in data['conf']
                if conf != '-1'
            ]
            avg_confidence = (
                sum(confidences) / len(confidences)
                if confidences else 0
            )

            results.append({
                "page": page_num,
                "text": text,
                "confidence": round(avg_confidence, 2),
                "word_count": len(text.split()),
                "char_count": len(text)
            })

        doc.close()

        # Get Tesseract version
        try:
            version = pytesseract.get_tesseract_version()
            version_str = str(version)
        except Exception:
            version_str = "unknown"

        logger.info(f"OCR completed for {len(results)} pages")

        return {
            "success": True,
            "engine": "Tesseract",
            "version": version_str,
            "pages": results,
            "total_pages": len(results),
            "total_words": sum(r["word_count"] for r in results),
            "average_confidence": round(
                sum(r["confidence"] for r in results) / len(results),
                2
            ) if results else 0,
            "note": "MVP OCR - For production use, consider AI_Parse for 95%+ accuracy"
        }

    except Exception as e:
        logger.error(f"Tesseract OCR error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "engine": "Tesseract"
        }
