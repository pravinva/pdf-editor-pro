# PDF Editor Pro - Quick Start Guide

## Run the Application

```bash
# Start development server
npm run dev

# Open in browser
open http://localhost:3000/editor
```

## Test the Features

### 1. Upload & View PDF
- Go to http://localhost:3000/editor
- Drag & drop a PDF or click to upload
- Use controls to zoom, rotate, navigate pages

### 2. Add Signature
- Click "Add Signature" in toolbar
- Draw your signature with mouse/trackpad
- Adjust pen width and color
- Click "Save Signature"
- Signature embeds automatically

### 3. Fill Forms (Backend Required)
- Click "Fill Forms" in toolbar
- Fill in the detected fields
- Click "Fill PDF Fields"
- Form data embeds in PDF

### 4. OCR (Backend Required)
- Click "OCR" in toolbar
- Wait for text extraction
- View results in side panel

### 5. Download
- Click "Download" in toolbar
- Edited PDF downloads automatically

## Components Overview

| Component | Location | Purpose |
|-----------|----------|---------|
| **PDFViewer** | `components/PDFViewer.tsx` | Render & navigate PDF |
| **SignatureCanvas** | `components/SignatureCanvas.tsx` | Draw & save signature |
| **FormFiller** | `components/FormFiller.tsx` | Fill form fields |
| **Toolbar** | `components/Toolbar.tsx` | Tool & action buttons |
| **PageNavigator** | `components/PageNavigator.tsx` | Page thumbnails |

## Utilities Overview

| Utility | Location | Purpose |
|---------|----------|---------|
| **pdf-utils.ts** | `lib/pdf-utils.ts` | PDF.js & pdf-lib helpers |
| **api-client.ts** | `lib/api-client.ts` | Backend API wrapper |

## Key Keyboard Shortcuts

- **Arrow Keys:** Navigate pages
- **+/-:** Zoom in/out
- **R:** Rotate clockwise
- **0:** Reset zoom
- **Home/End:** First/last page

## Backend Integration

When Python backend is ready, these API calls will work:

```typescript
import {
  extractFormFields,
  fillFormFields,
  performSmartOCR,
  addSignatureToPDF
} from '@/lib/api-client';

// Extract form fields
const result = await extractFormFields(pdfFile);

// Fill form
await fillFormFields(pdfFile, { name: 'John', email: 'john@example.com' });

// OCR
await performSmartOCR(pdfFile);

// Add signature
await addSignatureToPDF(pdfFile, signatureImage, options);
```

## Build for Production

```bash
npm run build
npm start
```

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api/python
```

## Troubleshooting

**PDF not rendering?**
- Check PDF.js worker URL in console
- Verify file is valid PDF
- Check browser console for errors

**Signature not drawing?**
- Ensure Fabric.js loaded correctly
- Check canvas ref is initialized
- Try different browser

**Forms not detected?**
- PDF may not have form fields
- Backend API required
- Check network tab

## Next Steps

1. Test with various PDFs
2. Connect Python backend
3. Deploy to Vercel
4. Add more features (text, highlight, draw)

## Documentation

- Full details: `FRONTEND_BUILD_SUMMARY.md`
- Dev spec: `dev_spec_md.txt`
- API docs: `lib/api-client.ts`
- PDF utils: `lib/pdf-utils.ts`
