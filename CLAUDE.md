# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PDF Editor Pro** is a superior PDF editor with 95%+ OCR accuracy, designed to compete with PDFfiller.

**Tech Stack:**
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Python 3.9 (FastAPI), Node.js 18
- **PDF Processing:** PyMuPDF (fitz), pdf-lib, pdfjs-dist
- **OCR:** Tesseract OCR (MVP), Databricks AI_Parse (Production)
- **Storage:** Vercel Blob (temporary)
- **Deployment:** Vercel Serverless Functions

---

## Project Structure

```
pdf-editor-pro/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   ├── editor/
│   │   └── page.tsx              # PDF Editor (main app)
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── FileUpload.tsx            # Drag & drop file upload
│   ├── PDFViewer.tsx             # PDF rendering (PDF.js)
│   ├── Toolbar.tsx               # Editor toolbar
│   ├── SignatureCanvas.tsx       # Digital signature drawing
│   ├── FormFiller.tsx            # Form field filling
│   ├── PageNavigator.tsx         # Page thumbnails
│   ├── LoadingSpinner.tsx        # Loading indicator
│   └── OCRPanel.tsx              # OCR results display
│
├── lib/                          # Shared libraries
│   ├── api-client.ts             # API client functions
│   ├── pdf-utils.ts              # PDF manipulation (pdf-lib)
│   ├── validate.ts               # Input validation & sanitization
│   └── rateLimit.ts              # Rate limiting logic
│
├── api/                          # Python API endpoints
│   ├── ocr.py                    # OCR processing (Tesseract + AI_Parse)
│   ├── extract_forms.py          # Extract form fields
│   ├── fill_forms.py             # Fill form fields
│   ├── validate_pdf.py           # PDF validation & security checks
│   ├── requirements.txt          # Python dependencies
│   └── __init__.py
│
├── docs/                         # Documentation
│   ├── DEPLOYMENT.md             # Deployment guide
│   └── SECURITY.md               # Security documentation
│
├── middleware.ts                 # Next.js middleware (security headers, rate limiting)
├── vercel.json                   # Vercel deployment config
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Node.js dependencies
├── README.md                     # Project README
└── CLAUDE.md                     # This file
```

---

## Development Commands

### Setup

```bash
# Install Node.js dependencies
npm install

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r api/requirements.txt

# Create environment variables file
cp .env.example .env.local
# Edit .env.local with your Databricks credentials
```

### Development

```bash
# Start Next.js dev server (port 3000)
npm run dev

# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Run tests (if available)
npm test
```

### Testing Python API Locally

```bash
# Activate virtual environment
source venv/bin/activate

# Run Python scripts directly
cd api
python ocr.py  # Test OCR functionality
```

### Build & Deploy

```bash
# Build for production
npm run build

# Test production build locally
npm start

# Deploy to Vercel (if Vercel CLI installed)
vercel --prod
```

---

## Key Features & Implementation

### 1. File Upload (components/FileUpload.tsx)

**Features:**
- Drag & drop interface
- File type validation (PDF only)
- File size validation (max 100MB)
- Magic number check (first 4 bytes must be `%PDF`)
- Progress indicator

**Usage:**
```tsx
<FileUpload
  onFileSelect={handleFileSelect}
  accept=".pdf"
  maxSize={100 * 1024 * 1024}
/>
```

---

### 2. PDF Viewer (components/PDFViewer.tsx)

**Features:**
- Render PDF using PDF.js
- Page navigation (next/prev)
- Zoom in/out
- Rotate pages
- Canvas rendering

**Usage:**
```tsx
<PDFViewer
  fileUrl={pdfUrl}
  onPageChange={handlePageChange}
  onLoadComplete={handleLoadComplete}
/>
```

---

### 3. Digital Signature (components/SignatureCanvas.tsx)

**Features:**
- Draw signature with mouse/touch
- Clear and redraw
- Save as PNG data URL
- Embed in PDF using pdf-lib

**Implementation:**
```typescript
// Draw signature
const signature = await drawSignature();

// Embed in PDF
const modifiedPdf = await embedSignatureInPDF(
  originalPdf,
  signature,
  pageIndex,
  { x: 200, y: 400 },
  { width: 200, height: 100 }
);
```

---

### 4. Form Filling (components/FormFiller.tsx)

**Features:**
- Extract form fields from PDF (PyMuPDF)
- Display form fields with labels
- Fill fields programmatically
- Generate filled PDF

**API Flow:**
```
1. POST /api/extract-forms → Get form fields
2. User fills fields in UI
3. POST /api/fill-forms → Generate filled PDF
4. Download filled PDF
```

---

### 5. OCR (components/OCRPanel.tsx + api/ocr.py)

**Two Engines:**

#### Tesseract OCR (MVP - Free)
- Accuracy: 80-85%
- Speed: Slow (10-30s per page)
- Cost: Free
- Use: Development, basic documents

#### Databricks AI_Parse (Production)
- Accuracy: 95%+
- Speed: Fast (2-5s per page)
- Cost: Pay per use
- Use: Production, complex documents

**API Request:**
```bash
curl -X POST /api/ocr \
  -F "file=@document.pdf" \
  -F "engine=ai_parse"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "engine": "ai_parse",
    "pages": [
      {
        "page": 0,
        "text": "Extracted text...",
        "confidence": 0.98
      }
    ],
    "confidence": 0.98,
    "processingTime": 2.5
  }
}
```

---

### 6. Security Features

#### File Validation (lib/validate.ts)

**Client-Side:**
- File type check (`application/pdf`)
- File extension check (`.pdf`)
- File size check (max 100MB)
- Magic number check (`%PDF`)

**Server-Side (api/validate_pdf.py):**
- Magic number validation
- PyMuPDF parsing test
- JavaScript detection (security risk)
- Object count limit (prevent ZIP bombs)

#### Rate Limiting (lib/rateLimit.ts)

**Default Limits:**
- Global: 60 req/min
- Upload: 10 req/min
- OCR: 5 req/min
- API: 30 req/min

**Implementation:**
```typescript
const result = checkRateLimit(clientIp, {
  maxRequests: 60,
  windowMs: 60000
});

if (!result.allowed) {
  return { error: 'Too many requests', status: 429 };
}
```

#### Security Headers (middleware.ts)

**Headers Applied:**
- `Content-Security-Policy`: Prevent XSS
- `X-Frame-Options: DENY`: Prevent clickjacking
- `X-Content-Type-Options: nosniff`: Prevent MIME sniffing
- `Strict-Transport-Security`: Force HTTPS
- `Referrer-Policy`: Control referrer
- `Permissions-Policy`: Disable unnecessary features

---

## API Endpoints

### POST /api/ocr

**Description:** Extract text from PDF using OCR

**Request:**
- `file`: PDF file (multipart/form-data)
- `engine`: `tesseract` or `ai_parse` (optional, default: `tesseract`)

**Response:**
```json
{
  "success": true,
  "data": {
    "engine": "ai_parse",
    "pages": [
      { "page": 0, "text": "...", "confidence": 0.98 }
    ],
    "confidence": 0.98
  }
}
```

---

### POST /api/extract-forms

**Description:** Extract form fields from PDF

**Request:**
- `file`: PDF file (multipart/form-data)

**Response:**
```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "name": "firstName",
        "type": "text",
        "value": "",
        "required": true
      }
    ]
  }
}
```

---

### POST /api/fill-forms

**Description:** Fill form fields in PDF

**Request:**
- `file`: PDF file (multipart/form-data)
- `fields`: JSON object with field values

**Response:**
- Filled PDF file (application/pdf)

---

### POST /api/validate-pdf

**Description:** Validate PDF security (internal use)

**Request:**
- `file`: PDF file (multipart/form-data)

**Response:**
```json
{
  "valid": true,
  "message": "Valid PDF",
  "hasJavaScript": false,
  "objectCount": 1234
}
```

---

## Environment Variables

Create `.env.local` with the following:

```bash
# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Databricks Configuration (Production OCR)
DATABRICKS_HOST=https://your-workspace.databricks.com
DATABRICKS_TOKEN=dapi_your_secret_token_here

# Vercel Blob Storage (Optional)
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here

# Security (Optional)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**Important:**
- Never commit `.env.local` to git
- Add `.env.local` to `.gitignore`
- Rotate `DATABRICKS_TOKEN` every 90 days

---

## Common Tasks

### Add New Component

```bash
# Create component file
touch components/MyComponent.tsx

# Add TypeScript interface
interface MyComponentProps {
  prop1: string;
  prop2: number;
}

# Export component
export default function MyComponent({ prop1, prop2 }: MyComponentProps) {
  return <div>{prop1}</div>;
}
```

### Add New API Endpoint

```bash
# Create Python file
touch api/my_endpoint.py

# Add to vercel.json
{
  "functions": {
    "api/my_endpoint.py": {
      "runtime": "python3.9",
      "memory": 1024,
      "maxDuration": 60
    }
  }
}

# Create handler
def handler(request):
    return {
        "success": True,
        "data": {}
    }
```

### Update Styling

```bash
# Global styles
edit app/globals.css

# Tailwind classes
<div className="bg-blue-600 text-white p-4 rounded-lg">

# Custom component styles (use Tailwind, avoid CSS modules)
```

---

## Troubleshooting

### Build Errors

**Error:** `npm ERR! code ELIFECYCLE`

**Solution:**
```bash
rm -rf node_modules .next package-lock.json
npm install
npm run build
```

---

### TypeScript Errors

**Error:** `Cannot find module 'X'`

**Solution:**
```bash
npm install --save-dev @types/X
# or
npm install X
```

---

### Python API Not Working

**Error:** `Module not found`

**Solution:**
```bash
# Activate virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r api/requirements.txt
```

---

### Rate Limiting Too Strict

**Solution:**
```typescript
// Edit lib/rateLimit.ts
export const DEFAULT_RATE_LIMITS = {
  global: { maxRequests: 100, windowMs: 60000 }, // Increase to 100
};
```

---

### CORS Issues

**Solution:**
```typescript
// Edit vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for props and data
- Use `const` instead of `let` when possible
- Use arrow functions for components
- Add JSDoc comments for complex functions

**Example:**
```typescript
/**
 * Process PDF file and extract text
 * @param file - PDF file to process
 * @param options - Processing options
 * @returns Extracted text with metadata
 */
export async function processPDF(
  file: File,
  options: ProcessOptions
): Promise<ProcessResult> {
  // Implementation
}
```

---

### React Components

- Use functional components (not class components)
- Use hooks (`useState`, `useEffect`, etc.)
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use proper prop types with TypeScript

**Example:**
```tsx
'use client';

import { useState } from 'react';

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export default function Button({ onClick, disabled = false, children }: ButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    onClick();
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className="btn btn-primary"
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

---

### Python API

- Use type hints
- Add docstrings to functions
- Handle errors gracefully
- Return consistent JSON structure
- Log errors for debugging

**Example:**
```python
from typing import Dict, Any

def process_pdf(file_bytes: bytes) -> Dict[str, Any]:
    """
    Process PDF file and extract data.

    Args:
        file_bytes: PDF file content as bytes

    Returns:
        Dictionary with success status and extracted data

    Raises:
        ValueError: If file is not a valid PDF
    """
    try:
        # Process PDF
        result = extract_data(file_bytes)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        logger.error(f"Failed to process PDF: {e}")
        return {
            "success": False,
            "error": str(e)
        }
```

---

## Testing

### Unit Tests (Future)

```bash
# Install testing libraries
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

### Integration Tests (Future)

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run E2E tests
npm run test:e2e
```

### Manual Testing Checklist

- [ ] File upload (valid PDF)
- [ ] File upload (invalid file)
- [ ] PDF viewing (all pages)
- [ ] Form extraction
- [ ] Form filling
- [ ] Digital signature
- [ ] OCR (Tesseract)
- [ ] OCR (AI_Parse)
- [ ] Download edited PDF
- [ ] Rate limiting (send 70 requests)
- [ ] Security headers (check with curl)

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment guide.

**Quick Deploy to Vercel:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

---

## Security

See [docs/SECURITY.md](docs/SECURITY.md) for full security documentation.

**Security Checklist:**
- [x] HTTPS enforced
- [x] Security headers configured
- [x] File upload validation (client + server)
- [x] Input sanitization (XSS prevention)
- [x] Rate limiting (60 req/min)
- [x] Environment variables secured
- [x] Error messages don't leak info

---

## Resources

**Documentation:**
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [PyMuPDF Docs](https://pymupdf.readthedocs.io/)
- [pdf-lib Docs](https://pdf-lib.js.org/)
- [Vercel Docs](https://vercel.com/docs)

**Project Docs:**
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Security Documentation](docs/SECURITY.md)

**Support:**
- Email: support@pdfeditorpro.com
- GitHub Issues: [github.com/yourusername/pdf-editor-pro/issues](https://github.com/yourusername/pdf-editor-pro/issues)

---

## Contributing

When adding new features:

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes:**
   - Add code
   - Update documentation
   - Add tests (if applicable)

3. **Test locally:**
   ```bash
   npm run dev
   npm run lint
   npm run build
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "Add feature: description"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/my-feature
   # Create pull request on GitHub
   ```

---

## License

Proprietary - All rights reserved

---

**Last Updated:** December 2024
