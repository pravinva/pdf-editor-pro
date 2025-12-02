'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface PDFViewerProps {
  fileUrl: string;
  onPageChange?: (page: number, totalPages: number) => void;
  onLoadComplete?: (numPages: number) => void;
  onLoadError?: (error: Error) => void;
  className?: string;
}

export default function PDFViewer({
  fileUrl,
  onPageChange,
  onLoadComplete,
  onLoadError,
  className = ''
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  // Load PDF document
  useEffect(() => {
    let mounted = true;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdfDoc = await loadingTask.promise;

        if (!mounted) return;

        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setLoading(false);

        if (onLoadComplete) {
          onLoadComplete(pdfDoc.numPages);
        }
      } catch (err) {
        if (!mounted) return;

        const error = err instanceof Error ? err : new Error('Failed to load PDF');
        console.error('Error loading PDF:', error);
        setError(error.message);
        setLoading(false);

        if (onLoadError) {
          onLoadError(error);
        }
      }
    };

    loadPDF();

    return () => {
      mounted = false;
    };
  }, [fileUrl, onLoadComplete, onLoadError]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current || rendering) return;

    try {
      setRendering(true);

      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale, rotation });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', {
        willReadFrequently: false // Optimize for Safari
      });

      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Set canvas dimensions
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      // Clean up
      page.cleanup();

      if (onPageChange) {
        onPageChange(currentPage, numPages);
      }
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render page');
    } finally {
      setRendering(false);
    }
  }, [pdf, currentPage, scale, rotation, numPages, onPageChange, rendering]);

  // Re-render when page, scale, or rotation changes
  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch(e.key) {
        case 'ArrowLeft':
          goToPreviousPage();
          break;
        case 'ArrowRight':
          goToNextPage();
          break;
        case '=':
        case '+':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
        case 'r':
          rotateClockwise();
          break;
        case 'Home':
          goToPage(1);
          break;
        case 'End':
          goToPage(numPages);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, numPages, scale]);

  // Navigation functions
  const goToPreviousPage = () => {
    setCurrentPage(p => Math.max(1, p - 1));
  };

  const goToNextPage = () => {
    setCurrentPage(p => Math.min(numPages, p + 1));
  };

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(numPages, page));
    setCurrentPage(newPage);
  };

  // Zoom functions
  const zoomIn = () => {
    setScale(s => Math.min(s + 0.25, 3.0));
  };

  const zoomOut = () => {
    setScale(s => Math.max(s - 0.25, 0.5));
  };

  const resetZoom = () => {
    setScale(1.5);
  };

  const setZoomLevel = (level: number) => {
    setScale(level);
  };

  // Rotation functions
  const rotateClockwise = () => {
    setRotation(r => (r + 90) % 360);
  };

  const rotateCounterClockwise = () => {
    setRotation(r => (r - 90 + 360) % 360);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full bg-slate-100 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading PDF...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-slate-100 ${className}`}>
        <div className="card max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠</div>
          <h3 className="text-xl font-semibold mb-2 text-slate-900">Error Loading PDF</h3>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  // Main viewer
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4"
      >
        <canvas
          ref={canvasRef}
          className="shadow-2xl bg-white"
          style={{
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>

      {/* Controls Bar */}
      <div className="bg-white border-t border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1 || rendering}
              className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page (Left Arrow)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={numPages}
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="w-16 px-2 py-1 text-center border border-slate-300 rounded text-sm"
              />
              <span className="text-sm text-slate-600">of {numPages}</span>
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPage === numPages || rendering}
              className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page (Right Arrow)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5 || rendering}
              className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom out (-)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            <select
              value={scale}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="px-3 py-1 border border-slate-300 rounded text-sm bg-white"
              disabled={rendering}
            >
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1.0">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2.0">200%</option>
              <option value="2.5">250%</option>
              <option value="3.0">300%</option>
            </select>

            <button
              onClick={zoomIn}
              disabled={scale >= 3.0 || rendering}
              className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom in (+)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Rotation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={rotateCounterClockwise}
              disabled={rendering}
              className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rotate counterclockwise"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>

            <button
              onClick={rotateClockwise}
              disabled={rendering}
              className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rotate clockwise (R)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="mt-2 pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">
            <strong>Shortcuts:</strong> Arrow keys (navigate) | +/- (zoom) | R (rotate) | 0 (reset zoom) | Home/End (first/last page)
          </p>
        </div>
      </div>
    </div>
  );
}
