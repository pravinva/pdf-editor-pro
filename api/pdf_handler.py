# api/pdf_handler.py
"""
PDF Handler - Core PDF operations using PyMuPDF
Provides endpoints for signature addition, text extraction, and form manipulation
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
import fitz  # PyMuPDF
import io
import json
import logging
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()


@app.post("/add-signature")
async def add_signature(
    pdf_file: UploadFile = File(...),
    signature_image: UploadFile = File(...),
    page: int = Form(0),
    x: int = Form(100),
    y: int = Form(100),
    width: int = Form(200),
    height: int = Form(100)
):
    """
    Add signature image to PDF at specified coordinates

    Args:
        pdf_file: PDF document
        signature_image: PNG signature image
        page: Page number (0-indexed)
        x, y: Position coordinates
        width, height: Signature dimensions

    Returns:
        StreamingResponse: Modified PDF with signature embedded
    """
    try:
        logger.info(f"Adding signature to page {page} at position ({x}, {y})")

        # Load PDF
        pdf_bytes = await pdf_file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        # Load signature image
        sig_bytes = await signature_image.read()

        # Validate page number
        if page >= len(doc):
            doc.close()
            raise HTTPException(
                status_code=400,
                detail=f"Page {page} does not exist. PDF has {len(doc)} pages."
            )

        # Get page and add signature
        page_obj = doc[page]
        rect = fitz.Rect(x, y, x + width, y + height)
        page_obj.insert_image(rect, stream=sig_bytes)

        # Save to bytes
        output = io.BytesIO()
        doc.save(output)
        doc.close()
        output.seek(0)

        logger.info("Signature added successfully")

        return StreamingResponse(
            output,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=signed.pdf"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding signature: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract-text")
async def extract_text(pdf_file: UploadFile = File(...)):
    """
    Extract text from all pages of a PDF

    Args:
        pdf_file: PDF document

    Returns:
        JSON with text content from each page
    """
    try:
        logger.info("Extracting text from PDF")

        pdf_bytes = await pdf_file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        pages = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            pages.append({
                "page": page_num,
                "text": text,
                "word_count": len(text.split())
            })

        doc.close()

        logger.info(f"Extracted text from {len(pages)} pages")

        return {
            "success": True,
            "pages": pages,
            "total_pages": len(pages)
        }

    except Exception as e:
        logger.error(f"Error extracting text: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/extract-forms")
async def extract_forms(pdf_file: UploadFile = File(...)):
    """
    Extract form fields from PDF

    Args:
        pdf_file: PDF document with form fields

    Returns:
        JSON with all form fields and their properties
    """
    try:
        logger.info("Extracting form fields from PDF")

        pdf_bytes = await pdf_file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        fields = []
        for page in doc:
            for widget in page.widgets():
                fields.append({
                    "name": widget.field_name,
                    "type": widget.field_type_string,
                    "value": widget.field_value,
                    "page": page.number,
                    "rect": {
                        "x0": widget.rect.x0,
                        "y0": widget.rect.y0,
                        "x1": widget.rect.x1,
                        "y1": widget.rect.y1
                    }
                })

        doc.close()

        logger.info(f"Extracted {len(fields)} form fields")

        return {
            "success": True,
            "fields": fields,
            "total_fields": len(fields)
        }

    except Exception as e:
        logger.error(f"Error extracting forms: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/fill-form")
async def fill_form(
    pdf_file: UploadFile = File(...),
    field_data: str = Form(...)  # JSON string of field name -> value mappings
):
    """
    Fill form fields with provided data

    Args:
        pdf_file: PDF document with form fields
        field_data: JSON string mapping field names to values

    Returns:
        StreamingResponse: Modified PDF with filled form fields
    """
    try:
        logger.info("Filling form fields")

        pdf_bytes = await pdf_file.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        # Parse field data
        try:
            data = json.loads(field_data)
        except json.JSONDecodeError as e:
            doc.close()
            raise HTTPException(
                status_code=400,
                detail=f"Invalid JSON in field_data: {str(e)}"
            )

        # Fill fields
        filled_count = 0
        for page in doc:
            for widget in page.widgets():
                field_name = widget.field_name
                if field_name in data:
                    widget.field_value = data[field_name]
                    widget.update()
                    filled_count += 1

        logger.info(f"Filled {filled_count} form fields")

        # Save to bytes
        output = io.BytesIO()
        doc.save(output)
        doc.close()
        output.seek(0)

        return StreamingResponse(
            output,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=filled.pdf"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error filling form: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
