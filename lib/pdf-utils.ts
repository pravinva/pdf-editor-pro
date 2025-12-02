import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

/**
 * Load PDF document from URL or File
 */
export async function loadPDFDocument(source: string | File): Promise<any> {
  try {
    let loadingTask;

    if (typeof source === 'string') {
      loadingTask = pdfjsLib.getDocument(source);
    } else {
      const arrayBuffer = await source.arrayBuffer();
      loadingTask = pdfjsLib.getDocument(new Uint8Array(arrayBuffer));
    }

    const pdf = await loadingTask.promise;
    return pdf;
  } catch (error) {
    console.error('Error loading PDF:', error);
    throw new Error('Failed to load PDF document');
  }
}

/**
 * Get page count from PDF
 */
export async function getPDFPageCount(source: string | File): Promise<number> {
  const pdf = await loadPDFDocument(source);
  const pageCount = pdf.numPages;
  pdf.destroy();
  return pageCount;
}

/**
 * Extract text from PDF page
 */
export async function extractTextFromPage(
  pdf: any,
  pageNumber: number
): Promise<string> {
  try {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    page.cleanup();
    return text;
  } catch (error) {
    console.error(`Error extracting text from page ${pageNumber}:`, error);
    return '';
  }
}

/**
 * Extract text from all pages
 */
export async function extractAllText(pdf: any): Promise<string[]> {
  const texts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const text = await extractTextFromPage(pdf, i);
    texts.push(text);
  }

  return texts;
}

/**
 * Render PDF page to canvas
 */
export async function renderPageToCanvas(
  pdf: any,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5,
  rotation: number = 0
): Promise<void> {
  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale, rotation });

    const context = canvas.getContext('2d', {
      willReadFrequently: false
    });

    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    page.cleanup();
  } catch (error) {
    console.error(`Error rendering page ${pageNumber}:`, error);
    throw error;
  }
}

/**
 * Generate thumbnail for a page
 */
export async function generatePageThumbnail(
  pdf: any,
  pageNumber: number,
  scale: number = 0.3
): Promise<string> {
  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    page.cleanup();

    return dataUrl;
  } catch (error) {
    console.error(`Error generating thumbnail for page ${pageNumber}:`, error);
    throw error;
  }
}

/**
 * Convert File to ArrayBuffer
 */
export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert File to Base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Embed signature into PDF using pdf-lib
 */
export async function embedSignatureInPDF(
  pdfFile: File,
  signatureDataUrl: string,
  pageNumber: number,
  position: { x: number; y: number },
  size: { width: number; height: number }
): Promise<Uint8Array> {
  try {
    // Load PDF
    const pdfBytes = await fileToArrayBuffer(pdfFile);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Get page
    const pages = pdfDoc.getPages();
    if (pageNumber < 0 || pageNumber >= pages.length) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }
    const page = pages[pageNumber];

    // Embed signature image
    const signatureBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
    const signatureImage = await pdfDoc.embedPng(signatureBytes);

    // Get page dimensions
    const { height: pageHeight } = page.getSize();

    // Draw signature (convert y coordinate from top to bottom)
    page.drawImage(signatureImage, {
      x: position.x,
      y: pageHeight - position.y - size.height,
      width: size.width,
      height: size.height
    });

    // Save modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  } catch (error) {
    console.error('Error embedding signature:', error);
    throw error;
  }
}

/**
 * Add text to PDF using pdf-lib
 */
export async function addTextToPDF(
  pdfFile: File,
  text: string,
  pageNumber: number,
  position: { x: number; y: number },
  options: {
    size?: number;
    color?: { r: number; g: number; b: number };
    font?: string;
  } = {}
): Promise<Uint8Array> {
  try {
    const pdfBytes = await fileToArrayBuffer(pdfFile);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    if (pageNumber < 0 || pageNumber >= pages.length) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }
    const page = pages[pageNumber];

    const { height: pageHeight } = page.getSize();
    const fontSize = options.size || 12;
    const color = options.color || { r: 0, g: 0, b: 0 };

    page.drawText(text, {
      x: position.x,
      y: pageHeight - position.y,
      size: fontSize,
      color: rgb(color.r, color.g, color.b)
    });

    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  } catch (error) {
    console.error('Error adding text to PDF:', error);
    throw error;
  }
}

/**
 * Download PDF bytes as file
 */
export function downloadPDF(pdfBytes: Uint8Array, filename: string = 'document.pdf') {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Validate PDF file
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'File must be a PDF' };
  }

  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 50MB' };
  }

  // Check file name
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'File must have .pdf extension' };
  }

  return { valid: true };
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(pdf: any): Promise<{
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}> {
  try {
    const metadata = await pdf.getMetadata();
    return metadata.info || {};
  } catch (error) {
    console.error('Error getting PDF metadata:', error);
    return {};
  }
}

/**
 * Search text in PDF
 */
export async function searchTextInPDF(
  pdf: any,
  searchTerm: string
): Promise<Array<{ page: number; text: string; position: number }>> {
  const results: Array<{ page: number; text: string; position: number }> = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const text = await extractTextFromPage(pdf, i);
    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();

    let position = lowerText.indexOf(lowerSearch);
    while (position !== -1) {
      results.push({
        page: i,
        text: text.substring(Math.max(0, position - 20), position + searchTerm.length + 20),
        position
      });
      position = lowerText.indexOf(lowerSearch, position + 1);
    }
  }

  return results;
}

/**
 * Merge multiple PDFs
 */
export async function mergePDFs(pdfFiles: File[]): Promise<Uint8Array> {
  try {
    const mergedPdf = await PDFDocument.create();

    for (const file of pdfFiles) {
      const arrayBuffer = await fileToArrayBuffer(file);
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    return mergedPdfBytes;
  } catch (error) {
    console.error('Error merging PDFs:', error);
    throw error;
  }
}

/**
 * Extract pages from PDF
 */
export async function extractPages(
  pdfFile: File,
  pageNumbers: number[]
): Promise<Uint8Array> {
  try {
    const arrayBuffer = await fileToArrayBuffer(pdfFile);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const pages = await newPdf.copyPages(pdfDoc, pageNumbers);
    pages.forEach((page) => newPdf.addPage(page));

    const newPdfBytes = await newPdf.save();
    return newPdfBytes;
  } catch (error) {
    console.error('Error extracting pages:', error);
    throw error;
  }
}
