/**
 * Type definitions for the PDF Editor application
 */

// File and Upload Types
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  url?: string;
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  file?: {
    id: string;
    name: string;
    size: number;
    type: string;
  };
  error?: string;
}

// PDF Types
export interface PDFDocument {
  id: string;
  name: string;
  numPages: number;
  currentPage: number;
  scale: number;
  rotation: number;
  file: File;
}

export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  canvas?: HTMLCanvasElement;
}

// Editor Tool Types
export type EditorTool =
  | 'select'
  | 'text'
  | 'draw'
  | 'shape'
  | 'image'
  | 'eraser'
  | 'pan';

export type ShapeType =
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'triangle';

// Drawing Types
export interface DrawingOptions {
  strokeWidth: number;
  strokeColor: string;
  fillColor?: string;
  opacity: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawingPath {
  id: string;
  tool: EditorTool;
  points: Point[];
  options: DrawingOptions;
  pageNumber: number;
}

// Text Types
export interface TextOptions {
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: 'left' | 'center' | 'right';
}

export interface TextAnnotation {
  id: string;
  content: string;
  position: Point;
  options: TextOptions;
  pageNumber: number;
}

// Shape Types
export interface ShapeAnnotation {
  id: string;
  type: ShapeType;
  position: Point;
  dimensions: {
    width: number;
    height: number;
  };
  options: DrawingOptions;
  pageNumber: number;
}

// Image Types
export interface ImageAnnotation {
  id: string;
  src: string;
  position: Point;
  dimensions: {
    width: number;
    height: number;
  };
  rotation: number;
  opacity: number;
  pageNumber: number;
}

// Annotation Types (Union)
export type Annotation =
  | TextAnnotation
  | DrawingPath
  | ShapeAnnotation
  | ImageAnnotation;

// Editor State
export interface EditorState {
  tool: EditorTool;
  drawingOptions: DrawingOptions;
  textOptions: TextOptions;
  selectedAnnotation: string | null;
  annotations: Annotation[];
  history: HistoryState;
}

// History/Undo-Redo
export interface HistoryState {
  past: Annotation[][];
  present: Annotation[];
  future: Annotation[][];
}

// UI State
export interface UIState {
  loading: boolean;
  error: string | null;
  success: string | null;
  sidebarOpen: boolean;
  toolbarVisible: boolean;
  propertiesPanelOpen: boolean;
}

// User Preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  defaultTool: EditorTool;
  autoSave: boolean;
  gridVisible: boolean;
  snapToGrid: boolean;
  rulerVisible: boolean;
}

// Export Options
export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg';
  quality?: number;
  scale?: number;
  includeAnnotations: boolean;
  pages?: number[] | 'all';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProcessPDFRequest {
  fileId: string;
  annotations: Annotation[];
  options?: ExportOptions;
}

export interface ProcessPDFResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}

// Component Props Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export interface ToolbarButtonProps {
  tool: EditorTool;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

// Error Types
export class PDFEditorError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'PDFEditorError';
    this.code = code;
    this.details = details;
  }
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];
