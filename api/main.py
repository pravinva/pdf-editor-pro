# api/main.py
"""
PDF Editor Pro - Main FastAPI Application
Combines all API routes for PDF operations and OCR
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Import route handlers
from .pdf_handler import app as pdf_app
from .ocr_tesseract import app as tesseract_app
from .ocr_aiparse import app as aiparse_app
from .ocr_smart import app as smart_app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create main FastAPI app
app = FastAPI(
    title="PDF Editor Pro API",
    description="Professional PDF editing and OCR API with PyMuPDF and Databricks AI_Parse",
    version="1.0.0",
    docs_url="/api/python/docs",
    redoc_url="/api/python/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "http://localhost:3001",
        "https://*.vercel.app",   # Vercel preview deployments
        "https://*.vercel.com"    # Vercel production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "PDF Editor Pro API",
        "version": "1.0.0",
        "endpoints": {
            "pdf": [
                "/api/python/pdf/add-signature",
                "/api/python/pdf/extract-text",
                "/api/python/pdf/extract-forms",
                "/api/python/pdf/fill-form"
            ],
            "ocr": [
                "/api/python/ocr/tesseract",
                "/api/python/ocr/aiparse",
                "/api/python/ocr/smart"
            ]
        }
    }


# Mount PDF handler routes
@app.post("/api/python/pdf/add-signature")
async def add_signature_route(
    pdf_file=None,
    signature_image=None,
    page=0,
    x=100,
    y=100,
    width=200,
    height=100
):
    """Add signature to PDF"""
    from .pdf_handler import add_signature
    return await add_signature(pdf_file, signature_image, page, x, y, width, height)


@app.post("/api/python/pdf/extract-text")
async def extract_text_route(pdf_file=None):
    """Extract text from PDF"""
    from .pdf_handler import extract_text
    return await extract_text(pdf_file)


@app.post("/api/python/pdf/extract-forms")
async def extract_forms_route(pdf_file=None):
    """Extract form fields from PDF"""
    from .pdf_handler import extract_forms
    return await extract_forms(pdf_file)


@app.post("/api/python/pdf/fill-form")
async def fill_form_route(pdf_file=None, field_data="{}"):
    """Fill PDF form fields"""
    from .pdf_handler import fill_form
    return await fill_form(pdf_file, field_data)


# Mount OCR routes
@app.post("/api/python/ocr/tesseract")
async def tesseract_route(pdf_file=None):
    """OCR using Tesseract (MVP - Free)"""
    from .ocr_tesseract import ocr_tesseract
    return await ocr_tesseract(pdf_file)


@app.post("/api/python/ocr/aiparse")
async def aiparse_route(pdf_file=None):
    """OCR using Databricks AI_Parse (Production)"""
    from .ocr_aiparse import ocr_aiparse
    return await ocr_aiparse(pdf_file)


@app.post("/api/python/ocr/smart")
async def smart_route(pdf_file=None):
    """Smart OCR with automatic fallback"""
    from .ocr_smart import ocr_smart
    return await ocr_smart(pdf_file)


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors"""
    return {
        "error": "Endpoint not found",
        "path": str(request.url.path),
        "available_endpoints": {
            "pdf": [
                "/api/python/pdf/add-signature",
                "/api/python/pdf/extract-text",
                "/api/python/pdf/extract-forms",
                "/api/python/pdf/fill-form"
            ],
            "ocr": [
                "/api/python/ocr/tesseract",
                "/api/python/ocr/aiparse",
                "/api/python/ocr/smart"
            ]
        }
    }


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(exc)}")
    return {
        "error": "Internal server error",
        "message": "An unexpected error occurred. Please try again or contact support."
    }


# Log startup
@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    logger.info("PDF Editor Pro API starting up")
    logger.info("Available endpoints:")
    logger.info("  PDF Operations: /api/python/pdf/*")
    logger.info("  OCR Operations: /api/python/ocr/*")

    # Check environment
    import os
    if os.getenv("DATABRICKS_HOST") and os.getenv("DATABRICKS_TOKEN"):
        logger.info("  AI_Parse: CONFIGURED (Production OCR available)")
    else:
        logger.warning("  AI_Parse: NOT CONFIGURED (Using Tesseract fallback)")


@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown"""
    logger.info("PDF Editor Pro API shutting down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
