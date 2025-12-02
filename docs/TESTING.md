# PDF Editor Pro - Test Suite Documentation

Comprehensive test suite for the PDF Editor Pro Python API backend.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Prerequisites](#prerequisites)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing New Tests](#writing-new-tests)
- [Troubleshooting](#troubleshooting)

---

## Overview

This test suite provides comprehensive testing for the PDF Editor Pro backend API, including:

- **Unit Tests**: Individual function/method testing
- **Integration Tests**: End-to-end workflow testing
- **OCR Tests**: Accuracy and performance testing for Tesseract and AI_Parse
- **Performance Tests**: Speed and memory benchmarks
- **Error Handling Tests**: Edge cases and failure scenarios

### Test Statistics

| Category | Test Files | Test Cases | Status |
|----------|------------|------------|--------|
| Unit Tests | 2 | 35+ | ✓ Ready |
| Integration Tests | 1 | 15+ | ✓ Ready |
| OCR Tests | 1 | 20+ | ✓ Ready |
| **Total** | **4** | **70+** | **✓ Ready** |

---

## Test Structure

```
tests/
├── conftest.py                 # Pytest configuration & fixtures
├── fixtures/                   # Test data (auto-generated)
│   ├── sample.pdf             # 3-page test PDF
│   ├── form.pdf               # PDF with form fields
│   ├── ocr_test.pdf           # PDF for OCR testing
│   ├── large.pdf              # 100-page PDF for performance
│   ├── corrupted.pdf          # Invalid PDF for error testing
│   └── signature.png          # Sample signature image
│
├── api/                        # API-specific tests
│   ├── test_pdf_handler.py    # PDF operations tests
│   └── test_ocr.py            # OCR accuracy tests
│
├── integration/                # End-to-end tests
│   └── test_integration.py    # Workflow tests
│
└── README.md                   # This file
```

---

## Prerequisites

### 1. Python Dependencies

Install all required packages:

```bash
cd /Users/pravin.varma/Documents/Demo/pdf-editor-pro
source venv/bin/activate
pip install -r api/requirements.txt
```

Required packages:
- `pytest==7.4.3` - Test framework
- `pytest-asyncio==0.21.1` - Async test support
- `pytest-cov==4.1.0` - Coverage reports
- `pytest-mock==3.12.0` - Mocking utilities
- `httpx==0.25.2` - HTTP testing
- `faker==21.0.0` - Fake data generation

### 2. System Dependencies

**Tesseract OCR** (for OCR tests):

```bash
# macOS
brew install tesseract

# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# Windows
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

Verify installation:
```bash
tesseract --version
```

### 3. Backend API Files

The tests expect these API files to exist:

- `api/pdf_handler.py` - PDF operations (signatures, forms, text extraction)
- `api/ocr_tesseract.py` - Tesseract OCR implementation
- `api/ocr_aiparse.py` - AI_Parse OCR implementation

**Note**: Tests will skip gracefully if API files don't exist yet, showing:
```
SKIPPED [1] test_file.py:42: pdf_handler.py not yet created by backend developer
```

### 4. Environment Variables

Create `.env.local` with:

```bash
# Databricks (for AI_Parse OCR)
DATABRICKS_HOST=https://your-workspace.azuredatabricks.net
DATABRICKS_TOKEN=dapi1234567890abcdef

# Feature flags
NEXT_PUBLIC_USE_AIPARSE=false  # Set true for AI_Parse tests
```

---

## Running Tests

### Quick Start

Run all tests:
```bash
./run_tests.sh
```

### Test Categories

Run specific test categories:

```bash
# Unit tests only
./run_tests.sh unit

# Integration tests only
./run_tests.sh integration

# OCR tests only
./run_tests.sh ocr

# Performance tests only
./run_tests.sh performance

# Fast tests (exclude slow ones)
./run_tests.sh fast

# With coverage report
./run_tests.sh coverage
```

### Manual pytest Commands

Run tests manually with pytest:

```bash
# All tests
pytest tests/ -v

# Specific test file
pytest tests/api/test_pdf_handler.py -v

# Specific test function
pytest tests/api/test_pdf_handler.py::TestPDFHandlerSignature::test_add_signature_success -v

# Tests matching pattern
pytest tests/ -k "signature" -v

# With markers
pytest tests/ -m "unit" -v
pytest tests/ -m "integration and not slow" -v

# Stop on first failure
pytest tests/ -x

# Show print statements
pytest tests/ -v -s

# Parallel execution (requires pytest-xdist)
pytest tests/ -n auto
```

### Coverage Report

Generate coverage report:

```bash
./run_tests.sh coverage
```

View HTML report:
```bash
open htmlcov/index.html
```

---

## Test Coverage

### Current Coverage

| Module | Coverage | Lines | Status |
|--------|----------|-------|--------|
| `api/pdf_handler.py` | Pending | - | ⏳ Awaiting implementation |
| `api/ocr_tesseract.py` | Pending | - | ⏳ Awaiting implementation |
| `api/ocr_aiparse.py` | Pending | - | ⏳ Awaiting implementation |

### Target Coverage

- **Minimum**: 80% code coverage
- **Target**: 90%+ code coverage
- **Critical paths**: 100% coverage (signatures, OCR, form filling)

---

## Test Details

### Unit Tests (test_pdf_handler.py)

**35+ test cases covering:**

#### Signature Operations
- ✓ Add signature to single page
- ✓ Add signatures to multiple pages
- ✓ Handle invalid page numbers
- ✓ Handle invalid coordinates
- ✓ Very large signature images
- ✓ Signature positioning accuracy

#### Text Extraction
- ✓ Extract text from all pages
- ✓ Handle empty PDFs
- ✓ Handle corrupted PDFs
- ✓ Performance on large PDFs (100 pages)

#### Form Operations
- ✓ Detect all form fields
- ✓ Identify field types (text, checkbox, etc.)
- ✓ Fill forms with complete data
- ✓ Fill forms with partial data
- ✓ Handle invalid field names
- ✓ Special characters in form data

#### Performance Benchmarks
- ✓ Signature addition: <1 second
- ✓ Text extraction: <10 seconds for 100 pages
- ✓ Memory usage: <500MB

### OCR Tests (test_ocr.py)

**20+ test cases covering:**

#### Tesseract OCR
- ✓ Clean PDF: ≥90% accuracy, <3s per page
- ✓ Multi-page processing
- ✓ Confidence scores
- ✓ Error handling

#### AI_Parse OCR
- ✓ Clean PDF: ≥98% accuracy, <2s per page
- ✓ Poor quality scans: ≥95% accuracy
- ✓ Table structure preservation
- ✓ No credentials handling
- ✓ API failure fallback

#### Smart OCR Routing
- ✓ Try AI_Parse first
- ✓ Fallback to Tesseract if unavailable
- ✓ Performance comparison

#### Accuracy Comparison
- ✓ **Critical**: AI_Parse ≥20% better than Tesseract
- ✓ Speed comparison
- ✓ Edge cases (empty, images, multilingual)

### Integration Tests (test_integration.py)

**15+ test cases covering:**

#### Complete Workflows
- ✓ Upload → Sign → Download
- ✓ Upload → Fill Form → Download
- ✓ Upload → OCR → Export
- ✓ Upload → Fill → Sign → Download (complex)

#### Error Workflows
- ✓ Corrupted PDF upload
- ✓ Oversized file handling
- ✓ Network failure during OCR

#### Performance Workflows
- ✓ Small PDF: <5 seconds
- ✓ Large PDF: <10 seconds for 100 pages
- ✓ Batch OCR: <15 minutes for 100 pages

#### Data Integrity
- ✓ Multiple edits preserved
- ✓ Special characters handled
- ✓ Concurrent processing

---

## Test Markers

Tests are organized with pytest markers:

| Marker | Description | Example |
|--------|-------------|---------|
| `unit` | Unit tests | `pytest -m unit` |
| `integration` | Integration tests | `pytest -m integration` |
| `ocr` | OCR-related tests | `pytest -m ocr` |
| `performance` | Performance tests | `pytest -m performance` |
| `slow` | Slow tests (>5 seconds) | `pytest -m "not slow"` |

Combine markers:
```bash
# OCR unit tests only
pytest -m "ocr and unit"

# Fast integration tests
pytest -m "integration and not slow"
```

---

## Writing New Tests

### Test Template

```python
import pytest
from conftest import assert_pdf_valid

class TestNewFeature:
    """Test description."""

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_feature_success(self, sample_pdf_bytes):
        """
        Test successful operation.

        Expected:
        - Operation succeeds
        - Result is valid
        """
        try:
            from api.module_name import function_name

            result = await function_name(sample_pdf_bytes)

            assert result is not None
            assert_pdf_valid(result)

        except ImportError:
            pytest.skip("module_name.py not yet created")
```

### Using Fixtures

Available fixtures (see `conftest.py`):

```python
def test_example(
    sample_pdf_bytes,           # 3-page PDF bytes
    form_pdf_bytes,             # Form PDF bytes
    signature_image_bytes,      # Signature image bytes
    ocr_test_pdf_bytes,        # OCR test PDF bytes
    corrupted_pdf_path,        # Corrupted PDF path
    large_pdf_path,            # 100-page PDF path
    mock_env_vars,             # Mock environment variables
    expected_ocr_text,         # Expected OCR output
    performance_thresholds     # Performance limits
):
    pass
```

### Assertion Helpers

```python
from conftest import (
    assert_pdf_valid,          # Verify PDF is valid
    assert_signature_in_pdf,   # Verify signature exists
    assert_form_filled,        # Verify form fields filled
    calculate_ocr_accuracy     # Calculate OCR accuracy %
)
```

---

## Continuous Integration

### GitHub Actions (Recommended)

Create `.github/workflows/tests.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install Tesseract
      run: sudo apt-get install -y tesseract-ocr

    - name: Install dependencies
      run: |
        pip install -r api/requirements.txt

    - name: Run tests
      run: |
        pytest tests/ -v --cov=api --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Skip with "module not yet created"

**Cause**: Backend API files not created yet.

**Solution**: This is expected. Tests will run once backend developer creates API files.

#### 2. Import Error: "No module named 'api'"

**Cause**: Python path not set correctly.

**Solution**:
```bash
export PYTHONPATH="${PWD}/api:${PWD}:${PYTHONPATH}"
pytest tests/ -v
```

Or use the provided script:
```bash
./run_tests.sh
```

#### 3. Tesseract Not Found

**Cause**: Tesseract OCR not installed.

**Solution**:
```bash
# macOS
brew install tesseract

# Ubuntu
sudo apt-get install tesseract-ocr
```

#### 4. Fixture Generation Fails

**Cause**: Insufficient permissions or disk space.

**Solution**:
```bash
mkdir -p tests/fixtures
chmod 755 tests/fixtures
```

#### 5. Slow Tests Take Too Long

**Solution**: Run fast tests only:
```bash
./run_tests.sh fast
```

#### 6. Coverage Report Not Generated

**Solution**:
```bash
pip install pytest-cov
pytest tests/ --cov=api --cov-report=html
```

---

## Performance Benchmarks

### Expected Performance

| Operation | Target | Measured | Status |
|-----------|--------|----------|--------|
| Add Signature | <1s | TBD | ⏳ |
| Extract Text (10 pages) | <3s | TBD | ⏳ |
| Extract Text (100 pages) | <10s | TBD | ⏳ |
| OCR Tesseract (per page) | <3s | TBD | ⏳ |
| OCR AI_Parse (per page) | <2s | TBD | ⏳ |
| Form Detection | <3s | TBD | ⏳ |
| Form Filling | <1s | TBD | ⏳ |

Run performance tests:
```bash
./run_tests.sh performance
```

---

## Contact & Support

**QA Lead**: [Your Name]
**Email**: qa@pdfeditorpro.com
**Slack**: #qa-testing
**Project**: PDF Editor Pro

---

## Next Steps

### For Backend Developers

1. Create API files:
   - `api/pdf_handler.py`
   - `api/ocr_tesseract.py`
   - `api/ocr_aiparse.py`

2. Run tests:
   ```bash
   ./run_tests.sh
   ```

3. Fix failing tests

4. Achieve 80%+ coverage

### For QA Engineers

1. Review test cases

2. Add new test scenarios

3. Update test data as needed

4. Monitor test results

5. Report bugs found

---

**Happy Testing!** Find those bugs before users do!
