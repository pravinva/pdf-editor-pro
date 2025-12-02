# Quick Start Guide - PDF Editor Pro

## Getting Started

### 1. Start Development Server
```bash
npm run dev
```
Visit: http://localhost:3000

### 2. View Pages
- **Landing Page:** http://localhost:3000
- **Editor:** http://localhost:3000/editor

### 3. Test File Upload
- Navigate to /editor
- Drag and drop a PDF file
- Or click "Choose File" to browse

---

## Project Structure

```
pdf-editor-pro/
├── app/              # Next.js App Router
│   ├── layout.tsx   # Root layout
│   ├── page.tsx     # Landing page
│   ├── globals.css  # Global styles
│   ├── editor/      # Editor route
│   └── api/upload/  # Upload API
│
├── components/       # React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── FileUpload.tsx
│   ├── LoadingSpinner.tsx
│   └── ErrorBoundary.tsx
│
├── lib/             # Utilities
│   ├── utils.ts     # Helper functions
│   ├── constants.ts # Configuration
│   └── types.ts     # TypeScript types
│
└── public/          # Static assets
```

---

## Key Files

### Landing Page
**File:** `/Users/pravin.varma/Documents/Demo/pdf-editor-pro/app/page.tsx`
- Hero section
- Features showcase
- Call-to-action

### Editor Page
**File:** `/Users/pravin.varma/Documents/Demo/pdf-editor-pro/app/editor/page.tsx`
- File upload interface
- PDF validation
- Loading/error states
- Ready for PDF viewer integration

### File Upload Component
**File:** `/Users/pravin.varma/Documents/Demo/pdf-editor-pro/components/FileUpload.tsx`
- Drag and drop
- File validation
- Error handling

---

## Configuration

### Constants
**File:** `/Users/pravin.varma/Documents/Demo/pdf-editor-pro/lib/constants.ts`

```typescript
// File constraints
FILE_CONSTRAINTS: {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_MIME_TYPES: ['application/pdf'],
}

// PDF viewer settings
PDF_VIEWER: {
  DEFAULT_SCALE: 1.0,
  MIN_SCALE: 0.25,
  MAX_SCALE: 4.0,
}

// Editor tools
EDITOR_TOOLS: {
  SELECT: 'select',
  TEXT: 'text',
  DRAW: 'draw',
  SHAPE: 'shape',
  IMAGE: 'image',
}
```

### Types
**File:** `/Users/pravin.varma/Documents/Demo/pdf-editor-pro/lib/types.ts`

All TypeScript interfaces for:
- PDF documents
- Annotations
- Editor state
- API responses

---

## Styling

### Tailwind CSS
**Config:** `tailwind.config.js`
**Global Styles:** `app/globals.css`

### Custom Classes
```css
.btn           /* Base button */
.btn-primary   /* Blue primary button */
.btn-secondary /* Gray secondary button */
.btn-outline   /* Outlined button */
.input         /* Form input */
.card          /* Card container */
```

### Usage
```tsx
<button className="btn btn-primary">
  Click Me
</button>

<div className="card">
  Content here
</div>
```

---

## Common Tasks

### Add a New Component

1. Create file in `components/`:
```tsx
// components/MyComponent.tsx
export default function MyComponent() {
  return <div>Hello</div>;
}
```

2. Import and use:
```tsx
import MyComponent from '@/components/MyComponent';
```

### Add a New Page

1. Create file in `app/`:
```tsx
// app/about/page.tsx
export default function AboutPage() {
  return <div>About</div>;
}
```

2. Access at: http://localhost:3000/about

### Add an API Route

1. Create route file:
```tsx
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: 'Hello' });
}
```

2. Call from frontend:
```tsx
const response = await fetch('/api/hello');
const data = await response.json();
```

---

## Utilities

### File Size Formatting
```typescript
import { formatFileSize } from '@/lib/utils';

formatFileSize(1024);        // "1 KB"
formatFileSize(1048576);     // "1 MB"
```

### Class Name Merging
```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  'another-class'
)} />
```

### Debounce
```typescript
import { debounce } from '@/lib/utils';

const handleSearch = debounce((query: string) => {
  // Search logic
}, 300);
```

---

## Next Steps: PDF Viewer Integration

### 1. Install PDF.js
```bash
npm install pdfjs-dist
```

### 2. Create PDF Viewer Component
```tsx
// components/PDFViewer.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

export default function PDFViewer({ file }: { file: File }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Implementation here...

  return <canvas ref={canvasRef} />;
}
```

### 3. Integrate in Editor
```tsx
// app/editor/page.tsx
import PDFViewer from '@/components/PDFViewer';

{pdfFile && <PDFViewer file={pdfFile} />}
```

### 4. Add Fabric.js Canvas Overlay
```bash
npm install fabric
```

### 5. Implement Drawing Tools
- Text tool
- Drawing tool
- Shape tools
- Image insertion

### 6. Add Export Functionality
```bash
npm install pdf-lib
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### TypeScript Errors
```bash
# Check types
npx tsc --noEmit

# Clear cache
rm -rf .next
npm run dev
```

### Styling Not Working
```bash
# Rebuild Tailwind
npm run build
npm run dev
```

---

## Environment Variables

Create `.env.local`:
```bash
# Python Backend (optional)
NEXT_PUBLIC_API_URL=http://localhost:8000

# File Upload
NEXT_PUBLIC_MAX_FILE_SIZE=52428800
```

---

## Build for Production

```bash
# Build
npm run build

# Start production server
npm start

# Test production build locally
npm run build && npm start
```

---

## Testing

### Manual Testing Checklist
- [ ] Landing page loads
- [ ] Navigation works
- [ ] Editor page loads
- [ ] File upload drag & drop works
- [ ] File upload click works
- [ ] Invalid file type rejected
- [ ] Large file (>50MB) rejected
- [ ] Loading spinner shows
- [ ] Error messages display
- [ ] Responsive on mobile
- [ ] All links work

---

## Documentation

- **Full Structure:** `NEXTJS_APP_STRUCTURE.md`
- **Visual Guide:** `APP_STRUCTURE_VISUAL.md`
- **This Guide:** `QUICK_START.md`
- **Main README:** `README.md`

---

## Support

For questions:
1. Check type definitions: `lib/types.ts`
2. Check constants: `lib/constants.ts`
3. Review component code
4. Consult Next.js 14 docs

---

**Status:** Production-ready foundation
**Version:** 1.0.0
**Last Updated:** December 2, 2025
