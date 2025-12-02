"""
Pytest configuration and fixtures for PDF Editor Pro tests.
"""

import os
import sys
import io
import base64
from pathlib import Path
import pytest
from PIL import Image
import fitz  # PyMuPDF

# Add api directory to Python path
API_DIR = Path(__file__).parent.parent / "api"
sys.path.insert(0, str(API_DIR))

# Test fixtures directory
FIXTURES_DIR = Path(__file__).parent / "fixtures"
FIXTURES_DIR.mkdir(exist_ok=True)


@pytest.fixture
def sample_pdf_path():
    """
    Create a simple test PDF file.
    Returns path to the PDF.
    """
    pdf_path = FIXTURES_DIR / "sample.pdf"

    if not pdf_path.exists():
        # Create a simple PDF with PyMuPDF
        doc = fitz.open()
        page = doc.new_page(width=612, height=792)  # Letter size

        # Add some text
        text = """
        Test PDF Document

        This is a sample PDF for testing purposes.
        It contains multiple lines of text.

        Page 1 of 3
        """
        page.insert_text((72, 72), text, fontsize=12)

        # Add another page
        page2 = doc.new_page(width=612, height=792)
        page2.insert_text((72, 72), "Page 2 of 3\n\nMore test content here.", fontsize=12)

        # Add third page
        page3 = doc.new_page(width=612, height=792)
        page3.insert_text((72, 72), "Page 3 of 3\n\nFinal page content.", fontsize=12)

        doc.save(str(pdf_path))
        doc.close()

    return str(pdf_path)


@pytest.fixture
def sample_pdf_bytes(sample_pdf_path):
    """Returns bytes of the sample PDF."""
    with open(sample_pdf_path, 'rb') as f:
        return f.read()


@pytest.fixture
def form_pdf_path():
    """
    Create a PDF with form fields for testing.
    Returns path to the form PDF.
    """
    pdf_path = FIXTURES_DIR / "form.pdf"

    if not pdf_path.exists():
        doc = fitz.open()
        page = doc.new_page(width=612, height=792)

        # Add title
        page.insert_text((72, 72), "Test Form", fontsize=16)

        # Add form fields using PyMuPDF
        # Text field for name
        widget_name = page.add_textfield(
            rect=fitz.Rect(100, 150, 400, 180),
            field_name="name",
            field_value="",
            max_len=100
        )
        page.insert_text((72, 165), "Name:", fontsize=12)

        # Text field for email
        widget_email = page.add_textfield(
            rect=fitz.Rect(100, 200, 400, 230),
            field_name="email",
            field_value="",
            max_len=100
        )
        page.insert_text((72, 215), "Email:", fontsize=12)

        # Checkbox
        widget_check = page.add_checkbox(
            rect=fitz.Rect(100, 250, 120, 270),
            field_name="agree"
        )
        page.insert_text((130, 265), "I agree to terms", fontsize=12)

        doc.save(str(pdf_path))
        doc.close()

    return str(pdf_path)


@pytest.fixture
def form_pdf_bytes(form_pdf_path):
    """Returns bytes of the form PDF."""
    with open(form_pdf_path, 'rb') as f:
        return f.read()


@pytest.fixture
def signature_image_path():
    """
    Create a sample signature image for testing.
    Returns path to the signature PNG.
    """
    sig_path = FIXTURES_DIR / "signature.png"

    if not sig_path.exists():
        # Create a simple signature image with PIL
        img = Image.new('RGBA', (400, 150), (255, 255, 255, 0))
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)

        # Draw a simple signature-like curve
        draw.line([(50, 100), (100, 50), (150, 80), (200, 40), (250, 70), (300, 50), (350, 80)],
                  fill=(0, 0, 0, 255), width=3)

        img.save(str(sig_path))

    return str(sig_path)


@pytest.fixture
def signature_image_bytes(signature_image_path):
    """Returns bytes of the signature image."""
    with open(signature_image_path, 'rb') as f:
        return f.read()


@pytest.fixture
def signature_base64(signature_image_bytes):
    """Returns base64 encoded signature image."""
    return base64.b64encode(signature_image_bytes).decode('utf-8')


@pytest.fixture
def ocr_test_pdf_path():
    """
    Create a PDF with text for OCR testing.
    Returns path to the OCR test PDF.
    """
    pdf_path = FIXTURES_DIR / "ocr_test.pdf"

    if not pdf_path.exists():
        doc = fitz.open()
        page = doc.new_page(width=612, height=792)

        # Add well-formatted text for OCR
        test_text = """
        Invoice #1234
        Date: 12/01/2024
        Amount: $1,000.00

        Customer: John Doe
        Address: 123 Main St
        City: San Francisco
        State: CA
        Zip: 94102

        Description: Professional Services
        Quantity: 10
        Unit Price: $100.00
        Total: $1,000.00
        """

        page.insert_text((72, 72), test_text, fontsize=12)

        doc.save(str(pdf_path))
        doc.close()

    return str(pdf_path)


@pytest.fixture
def ocr_test_pdf_bytes(ocr_test_pdf_path):
    """Returns bytes of the OCR test PDF."""
    with open(ocr_test_pdf_path, 'rb') as f:
        return f.read()


@pytest.fixture
def corrupted_pdf_path():
    """
    Create a corrupted PDF for error handling tests.
    """
    pdf_path = FIXTURES_DIR / "corrupted.pdf"

    # Create a file with invalid PDF content
    with open(pdf_path, 'wb') as f:
        f.write(b"This is not a valid PDF file")

    return str(pdf_path)


@pytest.fixture
def large_pdf_path():
    """
    Create a larger PDF for performance testing (100 pages).
    """
    pdf_path = FIXTURES_DIR / "large.pdf"

    if not pdf_path.exists():
        doc = fitz.open()

        for i in range(100):
            page = doc.new_page(width=612, height=792)
            page.insert_text((72, 72), f"Page {i + 1} of 100\n\nTest content for page {i + 1}", fontsize=12)

        doc.save(str(pdf_path))
        doc.close()

    return str(pdf_path)


@pytest.fixture
def mock_databricks_response():
    """
    Mock response from Databricks AI_Parse API.
    """
    return {
        "success": True,
        "pages": [
            {
                "page": 0,
                "text": "Invoice #1234\nDate: 12/01/2024\nAmount: $1,000.00",
                "confidence": 0.98
            }
        ],
        "tables": [
            {
                "page": 0,
                "rows": [
                    ["Description", "Quantity", "Unit Price", "Total"],
                    ["Professional Services", "10", "$100.00", "$1,000.00"]
                ]
            }
        ],
        "forms": [],
        "confidence": 0.98,
        "detected_language": "en",
        "processing_time_ms": 1250
    }


@pytest.fixture
def mock_env_vars(monkeypatch):
    """
    Set up mock environment variables for testing.
    """
    monkeypatch.setenv("DATABRICKS_HOST", "https://test.databricks.net")
    monkeypatch.setenv("DATABRICKS_TOKEN", "test_token_123")


@pytest.fixture
def expected_ocr_text():
    """
    Expected text output from OCR test PDF.
    Used to verify OCR accuracy.
    """
    return {
        "invoice_number": "1234",
        "date": "12/01/2024",
        "amount": "$1,000.00",
        "customer": "John Doe",
        "total": "$1,000.00"
    }


@pytest.fixture
def performance_thresholds():
    """
    Performance thresholds for testing.
    Based on requirements from dev_spec_md.txt
    """
    return {
        "pdf_load_time_ms": 2000,  # <2s for 10MB PDF
        "ocr_per_page_ms": 3000,   # <3s for Tesseract, <2s for AI_Parse
        "memory_limit_mb": 500,     # <500MB for 100-page PDF
        "ui_frame_rate_fps": 60
    }


# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "performance: marks tests as performance tests"
    )
    config.addinivalue_line(
        "markers", "ocr: marks tests that require OCR functionality"
    )


# Helper functions for tests
def calculate_ocr_accuracy(expected: str, actual: str) -> float:
    """
    Calculate OCR accuracy as percentage of correct characters.

    Args:
        expected: Expected text
        actual: Actual OCR output

    Returns:
        Accuracy as float between 0 and 1
    """
    if not expected or not actual:
        return 0.0

    expected = expected.lower().strip()
    actual = actual.lower().strip()

    # Simple character-by-character comparison
    min_len = min(len(expected), len(actual))
    matches = sum(1 for i in range(min_len) if expected[i] == actual[i])

    accuracy = matches / max(len(expected), len(actual))
    return accuracy


def assert_pdf_valid(pdf_bytes: bytes) -> bool:
    """
    Check if PDF bytes represent a valid PDF.

    Args:
        pdf_bytes: PDF file bytes

    Returns:
        True if valid PDF

    Raises:
        AssertionError if invalid
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        assert len(doc) > 0, "PDF has no pages"
        doc.close()
        return True
    except Exception as e:
        raise AssertionError(f"Invalid PDF: {e}")


def assert_signature_in_pdf(pdf_bytes: bytes, page: int = 0) -> bool:
    """
    Check if a signature (image) exists in the PDF.

    Args:
        pdf_bytes: PDF file bytes
        page: Page number to check (0-indexed)

    Returns:
        True if signature found
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pdf_page = doc[page]
    images = pdf_page.get_images()
    doc.close()

    assert len(images) > 0, f"No images found on page {page}"
    return True


def assert_form_filled(pdf_bytes: bytes, expected_values: dict) -> bool:
    """
    Check if form fields are filled with expected values.

    Args:
        pdf_bytes: PDF file bytes
        expected_values: Dict of field_name: expected_value

    Returns:
        True if all fields match
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    for page in doc:
        for widget in page.widgets():
            field_name = widget.field_name
            if field_name in expected_values:
                actual_value = widget.field_value or ""
                expected_value = str(expected_values[field_name])
                assert actual_value == expected_value, \
                    f"Field '{field_name}': expected '{expected_value}', got '{actual_value}'"

    doc.close()
    return True
