/**
 * Application-wide constants
 */

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_MIME_TYPES: ['application/pdf'],
  ALLOWED_EXTENSIONS: ['.pdf'],
} as const;

// PDF viewer settings
export const PDF_VIEWER = {
  DEFAULT_SCALE: 1.0,
  MIN_SCALE: 0.25,
  MAX_SCALE: 4.0,
  SCALE_STEP: 0.25,
  DEFAULT_PAGE: 1,
} as const;

// Canvas settings for PDF rendering
export const CANVAS_SETTINGS = {
  DEFAULT_DPI: 96,
  PRINT_DPI: 300,
  MAX_CANVAS_SIZE: 16777216, // Max pixels (4096 x 4096)
} as const;

// Editor tool types
export const EDITOR_TOOLS = {
  SELECT: 'select',
  TEXT: 'text',
  DRAW: 'draw',
  SHAPE: 'shape',
  IMAGE: 'image',
  ERASER: 'eraser',
  PAN: 'pan',
} as const;

// Drawing tool settings
export const DRAWING_SETTINGS = {
  DEFAULT_STROKE_WIDTH: 2,
  MIN_STROKE_WIDTH: 1,
  MAX_STROKE_WIDTH: 20,
  DEFAULT_COLOR: '#000000',
  DEFAULT_FILL: 'transparent',
} as const;

// Text tool settings
export const TEXT_SETTINGS = {
  DEFAULT_FONT_SIZE: 16,
  MIN_FONT_SIZE: 8,
  MAX_FONT_SIZE: 72,
  DEFAULT_FONT_FAMILY: 'Arial',
  AVAILABLE_FONTS: [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
  ],
} as const;

// Color palette
export const COLORS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  RED: '#EF4444',
  BLUE: '#3B82F6',
  GREEN: '#10B981',
  YELLOW: '#F59E0B',
  PURPLE: '#8B5CF6',
  PINK: '#EC4899',
  GRAY: '#6B7280',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  PROCESS: '/api/process',
  DOWNLOAD: '/api/download',
} as const;

// Python backend API (if using separate backend)
export const BACKEND_API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    UPLOAD: '/upload',
    EXTRACT_TEXT: '/extract-text',
    ADD_ANNOTATIONS: '/add-annotations',
    EXPORT: '/export',
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  RECENT_FILES: 'pdf_editor_recent_files',
  USER_PREFERENCES: 'pdf_editor_preferences',
  EDITOR_STATE: 'pdf_editor_state',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 50MB',
  INVALID_FILE_TYPE: 'Only PDF files are supported',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  PROCESSING_FAILED: 'Failed to process PDF. Please try again.',
  DOWNLOAD_FAILED: 'Failed to download file. Please try again.',
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully',
  CHANGES_SAVED: 'Changes saved successfully',
  FILE_DOWNLOADED: 'File downloaded successfully',
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  SAVE: 'ctrl+s',
  UNDO: 'ctrl+z',
  REDO: 'ctrl+y',
  DELETE: 'delete',
  SELECT_ALL: 'ctrl+a',
  ZOOM_IN: 'ctrl+=',
  ZOOM_OUT: 'ctrl+-',
  ZOOM_RESET: 'ctrl+0',
} as const;

// Feature flags
export const FEATURES = {
  TEXT_EDITING: true,
  DRAWING: true,
  SHAPES: true,
  IMAGE_INSERT: true,
  ANNOTATIONS: true,
  EXPORT_PDF: true,
  EXPORT_IMAGE: false, // Coming soon
  OCR: false, // Coming soon
  COLLABORATION: false, // Coming soon
} as const;
