'use client';

import { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface PageNavigatorProps {
  fileUrl: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function PageNavigator({
  fileUrl,
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}: PageNavigatorProps) {
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const thumbnailRefs = useRef<Record<number, HTMLDivElement>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate thumbnails
  useEffect(() => {
    let mounted = true;

    const generateThumbnails = async () => {
      try {
        setLoading(true);
        const loadingTask = pdfjsLib.getDocument(fileUrl);
        const pdf = await loadingTask.promise;

        const newThumbnails: Record<number, string> = {};

        // Generate thumbnails for all pages (limit to first 50 for performance)
        const pagesToRender = Math.min(totalPages, 50);

        for (let i = 1; i <= pagesToRender; i++) {
          if (!mounted) break;

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.3 }); // Small scale for thumbnails

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          newThumbnails[i] = canvas.toDataURL('image/jpeg', 0.7);
          page.cleanup();

          // Update thumbnails incrementally
          if (mounted) {
            setThumbnails(prev => ({ ...prev, [i]: newThumbnails[i] }));
          }
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error generating thumbnails:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    generateThumbnails();

    return () => {
      mounted = false;
    };
  }, [fileUrl, totalPages]);

  // Scroll to current page thumbnail
  useEffect(() => {
    const currentThumbnail = thumbnailRefs.current[currentPage];
    if (currentThumbnail && containerRef.current) {
      currentThumbnail.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentPage]);

  return (
    <div className={`bg-white border-r border-slate-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-3 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          {isCollapsed ? 'Pages' : 'Page Navigator'}
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Thumbnails */}
      {!isCollapsed && (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-2"
        >
          {loading && Object.keys(thumbnails).length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                <p className="text-xs text-slate-600">Loading pages...</p>
              </div>
            </div>
          ) : (
            <>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <div
                  key={pageNum}
                  ref={(el) => {
                    if (el) thumbnailRefs.current[pageNum] = el;
                  }}
                  onClick={() => onPageChange(pageNum)}
                  className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                    currentPage === pageNum
                      ? 'border-blue-600 shadow-lg ring-2 ring-blue-200'
                      : 'border-slate-200 hover:border-slate-400 hover:shadow-md'
                  }`}
                >
                  {/* Thumbnail Image */}
                  <div className="relative bg-slate-100">
                    {thumbnails[pageNum] ? (
                      <img
                        src={thumbnails[pageNum]}
                        alt={`Page ${pageNum}`}
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="w-full aspect-[8.5/11] flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mx-auto mb-1" />
                          <p className="text-xs text-slate-500">Loading...</p>
                        </div>
                      </div>
                    )}

                    {/* Current Page Indicator */}
                    {currentPage === pageNum && (
                      <div className="absolute inset-0 bg-blue-600 bg-opacity-10 flex items-center justify-center">
                        <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                          Current
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Page Number */}
                  <div className={`px-2 py-1 text-center text-xs font-medium ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 text-slate-700'
                  }`}>
                    Page {pageNum}
                  </div>
                </div>
              ))}

              {totalPages > 50 && (
                <div className="px-2 py-4 text-center">
                  <p className="text-xs text-slate-500">
                    Showing first 50 pages
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Page Counter (when collapsed) */}
      {isCollapsed && (
        <div className="flex-1 flex items-center justify-center px-2">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{currentPage}</div>
            <div className="text-xs text-slate-600">of {totalPages}</div>
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="mt-2 p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="mt-1 p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
        <div className="text-xs text-slate-600 text-center">
          {!isCollapsed && `${totalPages} page${totalPages !== 1 ? 's' : ''} total`}
        </div>
      </div>
    </div>
  );
}
