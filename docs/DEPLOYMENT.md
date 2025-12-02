# PDF Editor Pro - Deployment Guide

**Version:** 1.0.0
**Last Updated:** December 2024

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Vercel Deployment](#vercel-deployment)
5. [Python Functions Configuration](#python-functions-configuration)
6. [Environment Variables](#environment-variables)
7. [Post-Deployment Testing](#post-deployment-testing)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Procedures](#rollback-procedures)

---

## Overview

PDF Editor Pro is a hybrid Next.js + Python application deployed on Vercel. The architecture includes:

- **Frontend:** Next.js 14 (React, TypeScript, Tailwind CSS)
- **Backend API:** Python 3.9 (FastAPI, PyMuPDF, Tesseract OCR)
- **Hosting:** Vercel Serverless Functions
- **Storage:** Vercel Blob (temporary file storage)
- **AI OCR:** Databricks AI_Parse (production OCR)

### Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Vercel Edge Network             │
│  (HTTPS, CDN, DDoS Protection)          │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │   Next.js   │
        │  Frontend   │
        └──────┬──────┘
               │
        ┌──────▼───────────────────┐
        │  API Routes              │
        ├──────────────────────────┤
        │  /api/ocr.py             │ ← Python 3.9 (3GB RAM, 300s timeout)
        │  /api/extract_forms.py   │ ← Python 3.9 (1GB RAM, 60s timeout)
        │  /api/fill_forms.py      │ ← Python 3.9 (1GB RAM, 60s timeout)
        │  /api/validate_pdf.py    │ ← Python 3.9 (512MB RAM, 30s timeout)
        └──────┬───────────────────┘
               │
        ┌──────▼──────────┐
        │  External APIs  │
        ├─────────────────┤
        │  Databricks     │
        │  AI_Parse       │
        └─────────────────┘
```

---

## Prerequisites

### Required Accounts
- [x] **GitHub Account** (for source control)
- [x] **Vercel Account** (free tier sufficient for testing)
- [x] **Databricks Workspace** (for production OCR)
- [x] **Domain Name** (optional, for custom domain)

### Required Tools
```bash
# Node.js 18+ and npm 9+
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v9.0.0 or higher

# Git
git --version   # Any recent version

# Vercel CLI (optional, for local deployment testing)
npm install -g vercel
```

### Repository Setup
1. Initialize git repository (if not already done)
```bash
cd pdf-editor-pro
git init
git add .
git commit -m "Initial commit"
```

2. Create GitHub repository
```bash
# Create repository on GitHub, then:
git remote add origin https://github.com/yourusername/pdf-editor-pro.git
git branch -M main
git push -u origin main
```

---

## Environment Setup

### Local Development Environment

1. **Create `.env.local` file:**
```bash
# Copy template
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

2. **Required environment variables:**
```bash
# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Databricks Configuration (Production OCR)
DATABRICKS_HOST=https://your-workspace.databricks.com
DATABRICKS_TOKEN=dapi_your_secret_token_here

# Vercel Blob Storage (Optional for local)
BLOB_READ_WRITE_TOKEN=vercel_blob_token_here

# Security (Optional)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

3. **Install dependencies:**
```bash
# Install Node.js dependencies
npm install

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

4. **Test local development:**
```bash
# Start development server
npm run dev

# Test Python API (in another terminal)
cd api
python test_api.py  # If you have test scripts
```

---

## Vercel Deployment

### Step 1: Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose your `pdf-editor-pro` repository
5. Click **"Import"**

### Step 2: Configure Project Settings

**Framework Preset:** Next.js
**Root Directory:** `./` (leave empty)
**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`

### Step 3: Configure Build Settings

In Vercel project settings:

1. **General → Build & Development Settings:**
   - Framework Preset: `Next.js`
   - Node.js Version: `18.x`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci --legacy-peer-deps`

2. **Functions:**
   - Region: `Washington, D.C., USA (iad1)` (or closest to users)
   - Node.js Version: `18.x`
   - Python Version: `3.9`

### Step 4: Add Environment Variables

Go to **Settings → Environment Variables** and add:

#### Production Variables
```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
DATABRICKS_HOST=https://your-workspace.databricks.com
DATABRICKS_TOKEN=dapi_your_production_token
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_token_xxx
ALLOWED_ORIGINS=https://your-domain.vercel.app
```

#### Development Variables (Optional)
```
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABRICKS_HOST=https://your-workspace.databricks.com
DATABRICKS_TOKEN=dapi_your_dev_token
```

**Security Notes:**
- Never commit `.env.local` or `.env` to git
- Rotate `DATABRICKS_TOKEN` every 90 days
- Use different tokens for dev/staging/production

### Step 5: Deploy

1. **Automatic Deployment:**
   - Push to `main` branch triggers automatic deployment
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. **Manual Deployment (Vercel CLI):**
   ```bash
   # Login to Vercel
   vercel login

   # Deploy to production
   vercel --prod

   # Deploy to preview
   vercel
   ```

3. **Monitor Deployment:**
   - Go to Vercel Dashboard → Deployments
   - Watch build logs for errors
   - Deployment typically takes 2-5 minutes

---

## Python Functions Configuration

### Python Runtime Configuration

Vercel automatically detects Python functions in the `api/` directory. Each `.py` file becomes a serverless function.

**File Structure:**
```
api/
├── ocr.py              # OCR processing (3GB RAM, 300s timeout)
├── extract_forms.py    # Form extraction (1GB RAM, 60s timeout)
├── fill_forms.py       # Form filling (1GB RAM, 60s timeout)
├── validate_pdf.py     # PDF validation (512MB RAM, 30s timeout)
└── requirements.txt    # Python dependencies
```

### Requirements.txt

Ensure `api/requirements.txt` includes:
```txt
PyMuPDF==1.23.8
pytesseract==0.3.10
Pillow==10.1.0
requests==2.31.0
python-multipart==0.0.6
```

### Function Configuration

Each function is configured in `vercel.json`:

```json
{
  "functions": {
    "api/ocr.py": {
      "runtime": "python3.9",
      "memory": 3008,
      "maxDuration": 300
    },
    "api/extract_forms.py": {
      "runtime": "python3.9",
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

**Memory Limits:**
- Free: 1024MB
- Pro: 3008MB
- Enterprise: Custom

**Timeout Limits:**
- Hobby: 10s
- Pro: 60s
- Enterprise: 900s

### Tesseract OCR Setup

Vercel provides Tesseract in the Python runtime. No additional installation needed.

**Test Tesseract availability:**
```python
# In api/ocr.py
import pytesseract
from PIL import Image

# Tesseract is available at /usr/bin/tesseract
pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'
```

---

## Environment Variables

### Complete Environment Variables Reference

| Variable | Required | Environment | Description |
|----------|----------|-------------|-------------|
| `NODE_ENV` | Yes | All | `development` or `production` |
| `NEXT_PUBLIC_APP_URL` | Yes | All | Full URL of app (e.g., `https://app.vercel.app`) |
| `DATABRICKS_HOST` | Yes | Production | Databricks workspace URL |
| `DATABRICKS_TOKEN` | Yes | Production | Databricks personal access token |
| `BLOB_READ_WRITE_TOKEN` | No | All | Vercel Blob storage token (optional) |
| `ALLOWED_ORIGINS` | No | Production | Comma-separated allowed origins for CORS |

### Setting Environment Variables

**Via Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add key-value pairs
3. Select environments (Production, Preview, Development)
4. Click "Save"

**Via Vercel CLI:**
```bash
# Add single variable
vercel env add DATABRICKS_HOST production

# Pull environment variables to local
vercel env pull .env.local
```

**Via vercel.json:**
```json
{
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_APP_URL": "@app-url"
    }
  }
}
```

---

## Post-Deployment Testing

### Automated Testing Checklist

After deployment, test all features:

#### 1. Homepage
- [ ] Visit `https://your-domain.vercel.app`
- [ ] Verify page loads in <3 seconds
- [ ] Check console for errors

#### 2. File Upload
- [ ] Upload valid PDF (< 100MB)
- [ ] Verify upload progress indicator
- [ ] Verify PDF renders in viewer

#### 3. PDF Viewer
- [ ] Navigate between pages
- [ ] Zoom in/out
- [ ] Rotate pages

#### 4. Form Filling
- [ ] Click "Fill Forms" button
- [ ] Enter test data
- [ ] Submit form
- [ ] Download filled PDF
- [ ] Verify fields are populated

#### 5. Digital Signature
- [ ] Click "Sign" button
- [ ] Draw signature
- [ ] Place signature on PDF
- [ ] Download signed PDF

#### 6. OCR (MVP - Tesseract)
- [ ] Upload scanned PDF
- [ ] Click "OCR" button
- [ ] Verify text extraction
- [ ] Check confidence scores
- [ ] Export as TXT/JSON/CSV

#### 7. OCR (Production - AI_Parse)
- [ ] Same as above
- [ ] Verify higher accuracy (95%+)
- [ ] Check processing time (< 30s for 10-page doc)

#### 8. Security
- [ ] Try uploading .exe file renamed to .pdf (should fail)
- [ ] Try uploading 200MB file (should fail)
- [ ] Check HTTPS redirect
- [ ] Verify security headers (use https://securityheaders.com)

#### 9. Rate Limiting
- [ ] Send 70 requests in 1 minute (should get 429 error)

### Performance Testing

**Use Vercel Analytics:**
1. Go to Vercel Dashboard → Analytics
2. Check metrics:
   - Time to First Byte (TTFB): < 200ms
   - First Contentful Paint (FCP): < 1.5s
   - Largest Contentful Paint (LCP): < 2.5s

**Use Lighthouse:**
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.vercel.app --view
```

**Target Scores:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

---

## Monitoring & Maintenance

### Vercel Analytics

**Enable Real User Monitoring:**
1. Go to Project Settings → Analytics
2. Enable Web Analytics
3. Install Vercel Analytics package:
```bash
npm install @vercel/analytics
```

4. Add to `app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Error Monitoring

**Vercel Logs:**
- Real-time function logs in Dashboard
- Filter by severity, function, time range

**Set up Sentry (Optional):**
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Uptime Monitoring

**Use Vercel Monitoring (Pro):**
- Automatic uptime checks
- Alerts via email/Slack

**Or use external service:**
- [UptimeRobot](https://uptimerobot.com) (free)
- [Pingdom](https://www.pingdom.com)
- [StatusCake](https://www.statuscake.com)

### Maintenance Schedule

**Daily:**
- Check error logs
- Monitor API usage

**Weekly:**
- Review analytics
- Check for dependency updates
- Test critical paths

**Monthly:**
- Security audit
- Performance review
- Backup critical data

**Quarterly:**
- Rotate Databricks token
- Update all dependencies
- Penetration testing

---

## Troubleshooting

### Common Deployment Issues

#### 1. Build Fails

**Error:** `npm ERR! code ELIFECYCLE`

**Solution:**
```bash
# Clear cache
rm -rf node_modules .next package-lock.json
npm install
npm run build
```

#### 2. Python Function Timeout

**Error:** `Function execution timed out after 60s`

**Solution:**
- Increase `maxDuration` in `vercel.json`
- Optimize Python code
- Reduce PDF file size
- Upgrade to Vercel Pro for 300s timeout

#### 3. Databricks Connection Failed

**Error:** `Failed to connect to Databricks`

**Solution:**
- Verify `DATABRICKS_HOST` and `DATABRICKS_TOKEN`
- Check token expiration
- Verify network connectivity
- Check Databricks workspace status

#### 4. Rate Limit Errors

**Error:** `429 Too Many Requests`

**Solution:**
- Wait 1 minute and retry
- Increase rate limits in `lib/rateLimit.ts`
- Implement request queuing

#### 5. Security Headers Not Applied

**Error:** Headers missing in production

**Solution:**
- Verify `middleware.ts` is in root directory
- Check `vercel.json` headers configuration
- Clear CDN cache in Vercel Dashboard

### Debugging Production Issues

**View Logs:**
```bash
# Vercel CLI
vercel logs https://your-domain.vercel.app

# Real-time logs
vercel logs https://your-domain.vercel.app --follow
```

**Inspect Function:**
```bash
# Get function details
vercel inspect https://your-domain.vercel.app/api/ocr
```

---

## Rollback Procedures

### Instant Rollback (Vercel)

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Confirm rollback

**Rollback takes ~30 seconds**

### Git Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Revert to specific commit
git revert <commit-hash>
git push origin main

# Force rollback (use with caution)
git reset --hard <commit-hash>
git push --force origin main
```

### Environment Variable Rollback

1. Go to Settings → Environment Variables
2. Find variable history
3. Restore previous value
4. Redeploy

---

## Production Checklist

Before going live, verify:

### Security
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] File upload validation implemented
- [ ] Environment variables secured
- [ ] `.env.local` in `.gitignore`
- [ ] CORS properly configured
- [ ] CSP headers set

### Performance
- [ ] Build size < 5MB
- [ ] Images optimized
- [ ] Code splitting enabled
- [ ] Caching configured
- [ ] CDN enabled

### Functionality
- [ ] All features tested
- [ ] Error handling implemented
- [ ] Loading states present
- [ ] Mobile responsive
- [ ] Browser compatibility tested

### Monitoring
- [ ] Analytics enabled
- [ ] Error tracking configured
- [ ] Uptime monitoring set up
- [ ] Logging enabled

### Documentation
- [ ] README.md complete
- [ ] API documentation written
- [ ] Deployment guide (this doc) reviewed
- [ ] Security policy documented

---

## Support & Resources

**Vercel Documentation:**
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Python on Vercel](https://vercel.com/docs/functions/serverless-functions/runtimes/python)

**Project Resources:**
- GitHub Repository: `https://github.com/yourusername/pdf-editor-pro`
- Documentation: `/docs`
- Security Policy: `/docs/SECURITY.md`

**Contact:**
- Email: support@pdfeditorpro.com
- Issues: GitHub Issues

---

**Deployment Status: READY FOR PRODUCTION**

Last Updated: December 2024
