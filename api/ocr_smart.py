# api/ocr_smart.py
"""
Smart OCR Router - Intelligent OCR engine selection
Tries AI_Parse first, falls back to Tesseract if unavailable
"""

from fastapi import FastAPI, UploadFile, File
import logging
import os
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


@app.post("/smart")
async def ocr_smart(pdf_file: UploadFile = File(...)):
    """
    Smart OCR: Try AI_Parse first, fallback to Tesseract

    This gives best of both worlds:
    - Use AI_Parse when available (95%+ accuracy)
    - Fallback to Tesseract if unavailable (70-80% accuracy, free)

    Decision Logic:
    1. Check if Databricks credentials are configured
    2. If yes, try AI_Parse
    3. If AI_Parse fails or credentials missing, use Tesseract
    4. Log which engine was used

    Args:
        pdf_file: PDF document to OCR

    Returns:
        JSON with OCR results from whichever engine was used
    """

    # Read PDF bytes once (we'll need to reset the file pointer if we fallback)
    pdf_bytes = await pdf_file.read()

    # Check if AI_Parse is available
    databricks_host = os.getenv("DATABRICKS_HOST")
    databricks_token = os.getenv("DATABRICKS_TOKEN")

    if databricks_host and databricks_token:
        logger.info("Attempting AI_Parse OCR (production engine)")

        try:
            # Import AI_Parse module
            from .ocr_aiparse import ocr_aiparse

            # Create a new UploadFile object with the bytes
            from fastapi import UploadFile
            pdf_file_copy = UploadFile(
                filename=pdf_file.filename,
                file=io.BytesIO(pdf_bytes)
            )

            # Try AI_Parse
            result = await ocr_aiparse(pdf_file_copy)

            if result.get("success"):
                logger.info("AI_Parse OCR completed successfully")
                result["routing"] = {
                    "engine_used": "AI_Parse",
                    "reason": "Production engine available and successful"
                }
                return result
            else:
                logger.warning(f"AI_Parse failed: {result.get('error')}, falling back to Tesseract")

        except Exception as e:
            logger.warning(f"AI_Parse exception: {str(e)}, falling back to Tesseract")

    else:
        logger.info("AI_Parse credentials not configured, using Tesseract")

    # Fallback to Tesseract
    logger.info("Using Tesseract OCR (fallback engine)")

    try:
        from .ocr_tesseract import ocr_tesseract

        # Create a new UploadFile object with the bytes
        from fastapi import UploadFile
        pdf_file_copy = UploadFile(
            filename=pdf_file.filename,
            file=io.BytesIO(pdf_bytes)
        )

        result = await ocr_tesseract(pdf_file_copy)

        # Add routing information
        result["routing"] = {
            "engine_used": "Tesseract",
            "reason": "AI_Parse unavailable or failed" if (databricks_host and databricks_token)
                     else "AI_Parse credentials not configured"
        }

        logger.info("Tesseract OCR completed")
        return result

    except Exception as e:
        logger.error(f"Both OCR engines failed: {str(e)}")
        return {
            "success": False,
            "error": f"All OCR engines failed: {str(e)}",
            "routing": {
                "engine_used": "None",
                "reason": "Both AI_Parse and Tesseract failed"
            }
        }
