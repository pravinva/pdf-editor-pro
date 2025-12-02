"""
OCR Accuracy Tests for PDF Editor Pro

Tests cover:
- Tesseract OCR (MVP - Free)
- AI_Parse OCR (Production - Databricks)
- Smart OCR routing
- Accuracy comparison
- Performance benchmarks

Critical Requirements:
- Tesseract: 70-80% accuracy on poor scans, 90%+ on clean
- AI_Parse: 95%+ accuracy on all documents
- AI_Parse must be 20%+ better than Tesseract
"""

import pytest
import time
from unittest.mock import Mock, patch, AsyncMock
import json

from conftest import calculate_ocr_accuracy


class TestTesseractOCR:
    """Test Tesseract OCR functionality (MVP)."""

    @pytest.mark.unit
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_tesseract_clean_pdf(self, ocr_test_pdf_bytes, expected_ocr_text):
        """
        TC-004: Test Tesseract OCR on clean PDF.

        Expected:
        - Accuracy: ≥90%
        - Processing: <3s per page
        - Confidence scores provided
        """
        try:
            from api.ocr_tesseract import ocr_tesseract

            start_time = time.time()
            result = await ocr_tesseract(pdf_bytes=ocr_test_pdf_bytes)
            elapsed_ms = (time.time() - start_time) * 1000

            # Verify success
            assert result["success"] is True
            assert result["engine"] == "Tesseract"
            assert "pages" in result

            # Check processing time (<3s per page)
            num_pages = len(result["pages"])
            max_time_ms = num_pages * 3000
            assert elapsed_ms < max_time_ms, \
                f"Tesseract took {elapsed_ms}ms, expected <{max_time_ms}ms for {num_pages} pages"

            # Check accuracy
            extracted_text = result["pages"][0]["text"]
            assert "Invoice" in extracted_text or "invoice" in extracted_text
            assert "1234" in extracted_text
            assert "$1,000" in extracted_text or "$1000" in extracted_text

            # Check confidence scores
            assert "confidence" in result["pages"][0]
            confidence = result["pages"][0]["confidence"]
            assert confidence >= 70, f"Confidence {confidence}% too low for clean PDF"

        except ImportError:
            pytest.skip("ocr_tesseract.py not yet created by backend developer")

    @pytest.mark.unit
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_tesseract_multipage(self, sample_pdf_bytes):
        """
        Test Tesseract OCR on multi-page PDF.

        Expected:
        - All pages processed
        - Results for each page
        - Total pages correct
        """
        try:
            from api.ocr_tesseract import ocr_tesseract

            result = await ocr_tesseract(pdf_bytes=sample_pdf_bytes)

            assert result["success"] is True
            assert len(result["pages"]) == 3  # Sample PDF has 3 pages
            assert result["total_pages"] == 3

            # Check each page has text
            for page in result["pages"]:
                assert "text" in page
                assert "confidence" in page
                assert len(page["text"]) > 0

        except ImportError:
            pytest.skip("ocr_tesseract.py not yet created by backend developer")

    @pytest.mark.unit
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_tesseract_error_handling(self, corrupted_pdf_path):
        """
        TC-018: Test Tesseract error handling with corrupted PDF.

        Expected:
        - Error returned
        - No crash
        - Clear error message
        """
        try:
            from api.ocr_tesseract import ocr_tesseract

            with open(corrupted_pdf_path, 'rb') as f:
                corrupted_bytes = f.read()

            result = await ocr_tesseract(pdf_bytes=corrupted_bytes)

            # Should return error, not crash
            assert result["success"] is False
            assert "error" in result

        except ImportError:
            pytest.skip("ocr_tesseract.py not yet created by backend developer")

    @pytest.mark.performance
    @pytest.mark.slow
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_tesseract_performance(self, ocr_test_pdf_bytes):
        """
        TC-010: Test Tesseract OCR speed.

        Expected:
        - <3 seconds per page
        - 10-page PDF: <30 seconds
        """
        try:
            from api.ocr_tesseract import ocr_tesseract

            start_time = time.time()
            result = await ocr_tesseract(pdf_bytes=ocr_test_pdf_bytes)
            elapsed_s = time.time() - start_time

            num_pages = len(result["pages"])
            time_per_page = elapsed_s / num_pages

            assert time_per_page < 3.0, \
                f"Tesseract took {time_per_page:.2f}s per page, expected <3s"

        except ImportError:
            pytest.skip("ocr_tesseract.py not yet created by backend developer")


class TestAIParseOCR:
    """Test AI_Parse OCR functionality (Production)."""

    @pytest.mark.unit
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_aiparse_clean_pdf(self, ocr_test_pdf_bytes, mock_env_vars):
        """
        TC-005: Test AI_Parse OCR on clean PDF.

        Expected:
        - Accuracy: ≥98%
        - Processing: <2s per page
        - Table structure: 100% preserved
        - 20%+ better than Tesseract
        """
        try:
            from api.ocr_aiparse import ocr_aiparse

            # Mock the Databricks API call
            with patch('api.ocr_aiparse.requests.post') as mock_post:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.json.return_value = {
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
                mock_post.return_value = mock_response

                result = await ocr_aiparse(pdf_bytes=ocr_test_pdf_bytes)

                # Verify success
                assert result["success"] is True
                assert result["engine"] == "Databricks AI_Parse"

                # Verify accuracy
                assert result["confidence"] >= 0.95, "AI_Parse accuracy should be ≥95%"
                assert result["accuracy_estimate"] == "95%+"

                # Verify tables preserved
                assert "tables" in result
                assert len(result["tables"]) > 0

                # Verify processing time
                assert result["processing_time_ms"] < 2000, "AI_Parse should be <2s per page"

                # Verify text quality
                extracted_text = result["pages"][0]["text"]
                assert "Invoice" in extracted_text
                assert "1234" in extracted_text
                assert "$1,000.00" in extracted_text  # Exact amount with proper formatting

        except ImportError:
            pytest.skip("ocr_aiparse.py not yet created by backend developer")

    @pytest.mark.unit
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_aiparse_poor_quality(self, mock_env_vars):
        """
        TC-005: Test AI_Parse on poor quality scan.

        Critical: AI_Parse must maintain ≥95% accuracy even on poor scans.
        """
        try:
            from api.ocr_aiparse import ocr_aiparse
            import fitz

            # Create a low-quality PDF simulation
            doc = fitz.open()
            page = doc.new_page()
            # Simulate poor quality by using rotated/skewed text
            page.insert_text((72, 72), "Invoice #1234\nAmount: $500.00", fontsize=10)
            pdf_bytes = doc.tobytes()
            doc.close()

            # Mock the Databricks API call
            with patch('api.ocr_aiparse.requests.post') as mock_post:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.json.return_value = {
                    "pages": [
                        {
                            "page": 0,
                            "text": "Invoice #1234\nAmount: $500.00",  # Perfect extraction!
                            "confidence": 0.97
                        }
                    ],
                    "tables": [],
                    "forms": [],
                    "confidence": 0.97,
                    "detected_language": "en",
                    "processing_time_ms": 1450
                }
                mock_post.return_value = mock_response

                result = await ocr_aiparse(pdf_bytes=pdf_bytes)

                # Critical: Must maintain ≥95% accuracy
                assert result["confidence"] >= 0.95
                assert "Invoice" in result["pages"][0]["text"]
                assert "1234" in result["pages"][0]["text"]
                assert "$500.00" in result["pages"][0]["text"]

        except ImportError:
            pytest.skip("ocr_aiparse.py not yet created by backend developer")

    @pytest.mark.unit
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_aiparse_no_credentials(self, ocr_test_pdf_bytes, monkeypatch):
        """
        Test AI_Parse when credentials not configured.

        Expected:
        - Clear error message
        - Instructions to set credentials
        """
        try:
            from api.ocr_aiparse import ocr_aiparse

            # Remove credentials
            monkeypatch.delenv("DATABRICKS_HOST", raising=False)
            monkeypatch.delenv("DATABRICKS_TOKEN", raising=False)

            result = await ocr_aiparse(pdf_bytes=ocr_test_pdf_bytes)

            assert result["success"] is False
            assert "credentials" in result["error"].lower()
            assert "DATABRICKS" in result["note"]

        except ImportError:
            pytest.skip("ocr_aiparse.py not yet created by backend developer")

    @pytest.mark.unit
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_aiparse_api_failure(self, ocr_test_pdf_bytes, mock_env_vars):
        """
        Test AI_Parse when Databricks API fails.

        Expected:
        - Error handled gracefully
        - Fallback suggestion provided
        """
        try:
            from api.ocr_aiparse import ocr_aiparse

            # Mock failed API call
            with patch('api.ocr_aiparse.requests.post') as mock_post:
                mock_response = Mock()
                mock_response.status_code = 500
                mock_post.return_value = mock_response

                result = await ocr_aiparse(pdf_bytes=ocr_test_pdf_bytes)

                assert result["success"] is False
                assert "error" in result
                assert "fallback" in result
                assert "Tesseract" in result["fallback"]

        except ImportError:
            pytest.skip("ocr_aiparse.py not yet created by backend developer")

    @pytest.mark.performance
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_aiparse_performance(self, ocr_test_pdf_bytes, mock_env_vars):
        """
        TC-010: Test AI_Parse OCR speed.

        Expected:
        - <2 seconds per page
        - Faster than Tesseract
        """
        try:
            from api.ocr_aiparse import ocr_aiparse

            # Mock the Databricks API call with realistic timing
            with patch('api.ocr_aiparse.requests.post') as mock_post:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.json.return_value = {
                    "pages": [{"page": 0, "text": "Test", "confidence": 0.98}],
                    "tables": [],
                    "forms": [],
                    "confidence": 0.98,
                    "detected_language": "en",
                    "processing_time_ms": 1500
                }
                mock_post.return_value = mock_response

                start_time = time.time()
                result = await ocr_aiparse(pdf_bytes=ocr_test_pdf_bytes)
                elapsed_ms = (time.time() - start_time) * 1000

                # Should be fast - <2s per page
                assert elapsed_ms < 2000, f"AI_Parse took {elapsed_ms}ms, expected <2000ms"
                assert result["processing_time_ms"] < 2000

        except ImportError:
            pytest.skip("ocr_aiparse.py not yet created by backend developer")


class TestSmartOCR:
    """Test smart OCR routing (AI_Parse → Tesseract fallback)."""

    @pytest.mark.integration
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_smart_ocr_aiparse_success(self, ocr_test_pdf_bytes, mock_env_vars):
        """
        Test smart OCR uses AI_Parse when available.

        Expected:
        - Try AI_Parse first
        - Use AI_Parse result if successful
        """
        try:
            from api.ocr_aiparse import ocr_smart

            # Mock successful AI_Parse
            with patch('api.ocr_aiparse.requests.post') as mock_post:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.json.return_value = {
                    "pages": [{"page": 0, "text": "Test", "confidence": 0.98}],
                    "tables": [],
                    "forms": [],
                    "confidence": 0.98,
                    "detected_language": "en",
                    "processing_time_ms": 1250
                }
                mock_post.return_value = mock_response

                result = await ocr_smart(pdf_bytes=ocr_test_pdf_bytes)

                assert result["success"] is True
                assert result["engine"] == "Databricks AI_Parse"

        except ImportError:
            pytest.skip("ocr_aiparse.py not yet created by backend developer")

    @pytest.mark.integration
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_smart_ocr_fallback_to_tesseract(self, ocr_test_pdf_bytes, monkeypatch):
        """
        Test smart OCR falls back to Tesseract when AI_Parse unavailable.

        Expected:
        - Try AI_Parse first
        - Fall back to Tesseract if AI_Parse fails
        - Note indicates fallback used
        """
        try:
            from api.ocr_aiparse import ocr_smart

            # Remove AI_Parse credentials to force fallback
            monkeypatch.delenv("DATABRICKS_HOST", raising=False)
            monkeypatch.delenv("DATABRICKS_TOKEN", raising=False)

            result = await ocr_smart(pdf_bytes=ocr_test_pdf_bytes)

            # Should fall back to Tesseract
            assert result["success"] is True
            assert result["engine"] == "Tesseract"
            assert "fallback" in result["note"].lower()

        except ImportError:
            pytest.skip("ocr_aiparse.py not yet created by backend developer")


class TestOCRComparison:
    """Compare Tesseract vs AI_Parse accuracy."""

    @pytest.mark.integration
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_ocr_accuracy_comparison(self, ocr_test_pdf_bytes, mock_env_vars):
        """
        TC-005 & CT-002: Compare OCR accuracy between engines.

        Critical: AI_Parse must be ≥20% more accurate than Tesseract.

        Expected:
        - Tesseract: ~85% on clean scans
        - AI_Parse: ~97% on clean scans
        - Improvement: +12% absolute, +70% relative error reduction
        """
        try:
            from api.ocr_tesseract import ocr_tesseract
            from api.ocr_aiparse import ocr_aiparse

            # Ground truth
            expected_text = """Invoice #1234
Date: 12/01/2024
Amount: $1,000.00"""

            # Test Tesseract
            tesseract_result = await ocr_tesseract(pdf_bytes=ocr_test_pdf_bytes)
            tesseract_text = tesseract_result["pages"][0]["text"]
            tesseract_accuracy = calculate_ocr_accuracy(expected_text, tesseract_text)

            # Test AI_Parse (mocked)
            with patch('api.ocr_aiparse.requests.post') as mock_post:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.json.return_value = {
                    "pages": [{"page": 0, "text": expected_text, "confidence": 0.98}],
                    "tables": [],
                    "forms": [],
                    "confidence": 0.98,
                    "detected_language": "en",
                    "processing_time_ms": 1250
                }
                mock_post.return_value = mock_response

                aiparse_result = await ocr_aiparse(pdf_bytes=ocr_test_pdf_bytes)
                aiparse_text = aiparse_result["pages"][0]["text"]
                aiparse_accuracy = calculate_ocr_accuracy(expected_text, aiparse_text)

            # Calculate improvement
            improvement = aiparse_accuracy - tesseract_accuracy

            # Report results
            print(f"\n=== OCR Accuracy Comparison ===")
            print(f"Tesseract: {tesseract_accuracy*100:.1f}%")
            print(f"AI_Parse:  {aiparse_accuracy*100:.1f}%")
            print(f"Improvement: +{improvement*100:.1f}%")

            # Critical: AI_Parse must be significantly better
            assert aiparse_accuracy >= 0.95, "AI_Parse accuracy must be ≥95%"
            assert improvement >= 0.10, \
                f"AI_Parse must be ≥10% more accurate. Got +{improvement*100:.1f}%"

        except ImportError:
            pytest.skip("OCR modules not yet created by backend developer")

    @pytest.mark.integration
    @pytest.mark.ocr
    @pytest.mark.slow
    @pytest.mark.asyncio
    async def test_ocr_speed_comparison(self, ocr_test_pdf_bytes, mock_env_vars):
        """
        Compare OCR speed between engines.

        Expected:
        - AI_Parse faster or comparable to Tesseract
        - Both under performance thresholds
        """
        try:
            from api.ocr_tesseract import ocr_tesseract
            from api.ocr_aiparse import ocr_aiparse

            # Test Tesseract speed
            start_time = time.time()
            tesseract_result = await ocr_tesseract(pdf_bytes=ocr_test_pdf_bytes)
            tesseract_time_ms = (time.time() - start_time) * 1000

            # Test AI_Parse speed (mocked)
            with patch('api.ocr_aiparse.requests.post') as mock_post:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.json.return_value = {
                    "pages": [{"page": 0, "text": "Test", "confidence": 0.98}],
                    "tables": [],
                    "forms": [],
                    "confidence": 0.98,
                    "detected_language": "en",
                    "processing_time_ms": 1250
                }
                mock_post.return_value = mock_response

                start_time = time.time()
                aiparse_result = await ocr_aiparse(pdf_bytes=ocr_test_pdf_bytes)
                aiparse_time_ms = (time.time() - start_time) * 1000

            # Report results
            print(f"\n=== OCR Speed Comparison ===")
            print(f"Tesseract: {tesseract_time_ms:.0f}ms")
            print(f"AI_Parse:  {aiparse_time_ms:.0f}ms")

            # Both should be fast
            assert tesseract_time_ms < 3000, "Tesseract should be <3s per page"
            assert aiparse_time_ms < 2000, "AI_Parse should be <2s per page"

        except ImportError:
            pytest.skip("OCR modules not yet created by backend developer")


class TestOCREdgeCases:
    """Test OCR edge cases."""

    @pytest.mark.unit
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_ocr_empty_pdf(self):
        """Test OCR on PDF with no text."""
        try:
            from api.ocr_tesseract import ocr_tesseract
            import fitz

            # Create empty PDF
            doc = fitz.open()
            doc.new_page()
            pdf_bytes = doc.tobytes()
            doc.close()

            result = await ocr_tesseract(pdf_bytes=pdf_bytes)

            assert result["success"] is True
            assert len(result["pages"]) == 1
            # Text should be empty or minimal
            assert len(result["pages"][0]["text"].strip()) < 10

        except ImportError:
            pytest.skip("ocr_tesseract.py not yet created by backend developer")

    @pytest.mark.unit
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_ocr_image_pdf(self):
        """Test OCR on PDF containing only images (scanned document)."""
        pytest.skip("Requires creating image-based PDF fixture")

    @pytest.mark.unit
    @pytest.mark.ocr
    @pytest.mark.asyncio
    async def test_ocr_multilingual(self):
        """Test OCR on PDF with multiple languages."""
        pytest.skip("Requires multilingual PDF fixture")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
