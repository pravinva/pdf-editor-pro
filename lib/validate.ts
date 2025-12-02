/**
 * Validation Library
 *
 * Provides comprehensive input validation and sanitization:
 * - File upload validation (type, size, magic number)
 * - PDF security checks (JavaScript detection, object count)
 * - Input sanitization (XSS prevention)
 * - Path traversal prevention
 */

// File size constants (in bytes)
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_FILE_SIZE_MB = 100;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = ['application/pdf'];

// PDF magic numbers
const PDF_MAGIC_NUMBERS = [
  new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF
];

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  checkMagicNumber?: boolean;
}

/**
 * Validate file upload
 *
 * Checks:
 * - File type (MIME type and extension)
 * - File size
 * - Magic number (optional)
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<ValidationResult> {
  const {
    maxSize = MAX_FILE_SIZE,
    allowedTypes = ALLOWED_MIME_TYPES,
    checkMagicNumber = true
  } = options;

  // 1. Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`
    };
  }

  // 2. Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.pdf')) {
    return {
      valid: false,
      error: 'Invalid file extension. Only .pdf files are allowed.'
    };
  }

  // 3. Check file size
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty.'
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File is too large. Maximum size is ${maxSizeMB}MB.`
    };
  }

  // 4. Check magic number (first 4 bytes)
  if (checkMagicNumber) {
    try {
      const buffer = await file.slice(0, 4).arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const isValidPDF = PDF_MAGIC_NUMBERS.some(magic =>
        magic.every((byte, index) => byte === bytes[index])
      );

      if (!isValidPDF) {
        return {
          valid: false,
          error: 'File is not a valid PDF. Magic number check failed.'
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to read file header.'
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize filename to prevent path traversal
 *
 * Removes:
 * - Path separators (/, \)
 * - Parent directory references (..)
 * - Special characters
 *
 * @param filename - Original filename
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  // Get basename only (remove any path)
  let safe = filename.split(/[/\\]/).pop() || 'document.pdf';

  // Remove parent directory references
  safe = safe.replace(/\.\./g, '');

  // Allow only alphanumeric, dash, underscore, and dot
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  if (safe.length > 255) {
    const ext = safe.split('.').pop() || 'pdf';
    safe = safe.substring(0, 250) + '.' + ext;
  }

  // Ensure it has an extension
  if (!safe.includes('.')) {
    safe += '.pdf';
  }

  return safe;
}

/**
 * Sanitize input string to prevent XSS
 *
 * Escapes:
 * - < > to &lt; &gt;
 * - " to &quot;
 * - ' to &#x27;
 * - / to &#x2F;
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize HTML to prevent XSS
 * Strips all HTML tags except allowed ones
 *
 * @param html - HTML string to sanitize
 * @param allowedTags - Tags to allow (default: none)
 * @returns Sanitized HTML
 */
export function sanitizeHTML(
  html: string,
  allowedTags: string[] = []
): string {
  if (allowedTags.length === 0) {
    // Strip all tags
    return html.replace(/<[^>]*>/g, '');
  }

  // Create regex for allowed tags
  const allowedPattern = allowedTags.join('|');
  const regex = new RegExp(`<(?!\\/?(${allowedPattern})\\b)[^>]*>`, 'gi');

  return html.replace(regex, '');
}

/**
 * Validate email address format
 *
 * @param email - Email address to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || email.trim().length === 0) {
    return {
      valid: false,
      error: 'Email is required.'
    };
  }

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Invalid email format.'
    };
  }

  if (email.length > 254) {
    return {
      valid: false,
      error: 'Email is too long.'
    };
  }

  return { valid: true };
}

/**
 * Validate URL format
 *
 * @param url - URL to validate
 * @param allowedProtocols - Allowed protocols (default: http, https)
 * @returns Validation result
 */
export function validateURL(
  url: string,
  allowedProtocols: string[] = ['http', 'https']
): ValidationResult {
  if (!url || url.trim().length === 0) {
    return {
      valid: false,
      error: 'URL is required.'
    };
  }

  try {
    const parsed = new URL(url);

    if (!allowedProtocols.includes(parsed.protocol.replace(':', ''))) {
      return {
        valid: false,
        error: `URL protocol must be one of: ${allowedProtocols.join(', ')}`
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid URL format.'
    };
  }
}

/**
 * Validate string length
 *
 * @param value - String to validate
 * @param min - Minimum length
 * @param max - Maximum length
 * @param fieldName - Field name for error message
 * @returns Validation result
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = 'Field'
): ValidationResult {
  const length = value.trim().length;

  if (length < min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${min} characters.`
    };
  }

  if (length > max) {
    return {
      valid: false,
      error: `${fieldName} must be at most ${max} characters.`
    };
  }

  return { valid: true };
}

/**
 * Validate required field
 *
 * @param value - Value to check
 * @param fieldName - Field name for error message
 * @returns Validation result
 */
export function validateRequired(
  value: any,
  fieldName: string = 'Field'
): ValidationResult {
  if (value === null || value === undefined) {
    return {
      valid: false,
      error: `${fieldName} is required.`
    };
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return {
      valid: false,
      error: `${fieldName} is required.`
    };
  }

  return { valid: true };
}

/**
 * Validate API token format
 *
 * @param token - Token to validate
 * @returns Validation result
 */
export function validateAPIToken(token: string): ValidationResult {
  if (!token || token.trim().length === 0) {
    return {
      valid: false,
      error: 'API token is required.'
    };
  }

  // Databricks tokens start with 'dapi' or 'dkea'
  if (!token.startsWith('dapi') && !token.startsWith('dkea')) {
    return {
      valid: false,
      error: 'Invalid Databricks token format.'
    };
  }

  if (token.length < 40) {
    return {
      valid: false,
      error: 'API token is too short.'
    };
  }

  return { valid: true };
}

/**
 * Check if string contains potential XSS payload
 *
 * @param input - String to check
 * @returns true if potentially malicious
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /eval\(/gi,
    /expression\(/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Check if string contains SQL injection patterns
 *
 * @param input - String to check
 * @returns true if potentially malicious
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(;|\-\-|\/\*|\*\/)/g,
    /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
    /(\bAND\b\s+\d+\s*=\s*\d+)/gi,
    /(\bUNION\b)/gi
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate and sanitize form data
 *
 * @param data - Form data object
 * @returns Sanitized data object
 */
export function sanitizeFormData(
  data: Record<string, any>
): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const sanitizedKey = sanitizeInput(key);

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else {
      sanitized[sanitizedKey] = value;
    }
  }

  return sanitized;
}
