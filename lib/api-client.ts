/**
 * API Client for PDF Editor Pro
 * Handles all communication with the Python backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/python';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Upload PDF file
 */
export async function uploadPDF(file: File): Promise<APIResponse<{ url: string; id: string }>> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Add signature to PDF
 */
export async function addSignatureToPDF(
  pdfFile: File,
  signatureImage: string | Blob,
  options: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }
): Promise<APIResponse<Blob>> {
  try {
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);

    // Convert base64 to blob if necessary
    if (typeof signatureImage === 'string') {
      const blob = await fetch(signatureImage).then(r => r.blob());
      formData.append('signature_image', blob, 'signature.png');
    } else {
      formData.append('signature_image', signatureImage, 'signature.png');
    }

    formData.append('page', options.page.toString());
    formData.append('x', options.x.toString());
    formData.append('y', options.y.toString());
    formData.append('width', options.width.toString());
    formData.append('height', options.height.toString());

    const response = await fetch(`${API_BASE_URL}/pdf/add-signature`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to add signature: ${response.statusText}`);
    }

    const blob = await response.blob();
    return { success: true, data: blob };
  } catch (error) {
    console.error('Add signature error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add signature'
    };
  }
}

/**
 * Extract form fields from PDF
 */
export async function extractFormFields(
  pdfFile: File
): Promise<APIResponse<{
  fields: Array<{
    name: string;
    type: string;
    value: string;
    page: number;
    rect: { x0: number; y0: number; x1: number; y1: number };
  }>;
  total_fields: number;
}>> {
  try {
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);

    const response = await fetch(`${API_BASE_URL}/pdf/extract-forms`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to extract forms: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Extract forms error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract forms'
    };
  }
}

/**
 * Fill form fields in PDF
 */
export async function fillFormFields(
  pdfFile: File,
  fieldData: Record<string, string>
): Promise<APIResponse<Blob>> {
  try {
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);
    formData.append('field_data', JSON.stringify(fieldData));

    const response = await fetch(`${API_BASE_URL}/pdf/fill-form`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to fill form: ${response.statusText}`);
    }

    const blob = await response.blob();
    return { success: true, data: blob };
  } catch (error) {
    console.error('Fill form error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fill form'
    };
  }
}

/**
 * Extract text from PDF (native extraction)
 */
export async function extractTextFromPDF(
  pdfFile: File
): Promise<APIResponse<{
  pages: Array<{ page: number; text: string }>;
  total_pages: number;
}>> {
  try {
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);

    const response = await fetch(`${API_BASE_URL}/pdf/extract-text`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to extract text: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Extract text error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract text'
    };
  }
}

/**
 * Perform OCR on PDF using Tesseract (MVP)
 */
export async function performOCRTesseract(
  pdfFile: File
): Promise<APIResponse<{
  engine: string;
  pages: Array<{
    page: number;
    text: string;
    confidence: number;
    word_count: number;
  }>;
  total_pages: number;
}>> {
  try {
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);

    const response = await fetch(`${API_BASE_URL}/ocr/tesseract`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`OCR failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('OCR error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OCR failed'
    };
  }
}

/**
 * Perform OCR on PDF using AI_Parse (Production)
 */
export async function performOCRAIParse(
  pdfFile: File
): Promise<APIResponse<{
  engine: string;
  pages: Array<any>;
  tables?: Array<any>;
  forms?: Array<any>;
  confidence: number;
  language: string;
  processing_time_ms: number;
  total_pages: number;
}>> {
  try {
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);

    const response = await fetch(`${API_BASE_URL}/ocr/aiparse`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`AI_Parse OCR failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('AI_Parse OCR error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI_Parse OCR failed'
    };
  }
}

/**
 * Perform smart OCR (tries AI_Parse first, falls back to Tesseract)
 */
export async function performSmartOCR(
  pdfFile: File
): Promise<APIResponse<any>> {
  try {
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);

    const response = await fetch(`${API_BASE_URL}/ocr/smart`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Smart OCR failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Smart OCR error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Smart OCR failed'
    };
  }
}

/**
 * Add text to PDF
 */
export async function addTextToPDF(
  pdfFile: File,
  options: {
    text: string;
    page: number;
    x: number;
    y: number;
    fontSize?: number;
    color?: string;
  }
): Promise<APIResponse<Blob>> {
  try {
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);
    formData.append('text', options.text);
    formData.append('page', options.page.toString());
    formData.append('x', options.x.toString());
    formData.append('y', options.y.toString());

    if (options.fontSize) {
      formData.append('font_size', options.fontSize.toString());
    }
    if (options.color) {
      formData.append('color', options.color);
    }

    const response = await fetch(`${API_BASE_URL}/pdf/add-text`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to add text: ${response.statusText}`);
    }

    const blob = await response.blob();
    return { success: true, data: blob };
  } catch (error) {
    console.error('Add text error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add text'
    };
  }
}

/**
 * Compress/optimize PDF
 */
export async function optimizePDF(
  pdfFile: File,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<APIResponse<Blob>> {
  try {
    const formData = new FormData();
    formData.append('pdf_file', pdfFile);
    formData.append('quality', quality);

    const response = await fetch(`${API_BASE_URL}/pdf/optimize`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to optimize PDF: ${response.statusText}`);
    }

    const blob = await response.blob();
    return { success: true, data: blob };
  } catch (error) {
    console.error('Optimize PDF error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to optimize PDF'
    };
  }
}

/**
 * Helper: Convert Blob to File
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Helper: Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Helper: Check if backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET'
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}
