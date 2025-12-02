'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, AlertCircle, CheckCircle, Loader2, Copy, Eye, EyeOff } from 'lucide-react';

interface OCRPage {
  page: number;
  text: string;
  confidence?: number;
  wordCount?: number;
}

interface OCRResults {
  engine: string;
  pages: OCRPage[];
  confidence?: number;
  processingTime?: number;
  totalWords?: number;
}

interface OCRPanelProps {
  results: OCRResults | null;
  loading: boolean;
  onClose: () => void;
  onRetry?: () => void;
  pdfFileName?: string;
}

type ExportFormat = 'txt' | 'json' | 'csv';

/**
 * OCRPanel Component
 *
 * Displays OCR results with:
 * - Engine selector (Tesseract MVP / AI_Parse Production)
 * - Progress indicator
 * - Extracted text with confidence scores
 * - Export options (TXT, JSON, CSV)
 * - Comparison view
 * - Accuracy highlighting
 */
export default function OCRPanel({
  results,
  loading,
  onClose,
  onRetry,
  pdfFileName = 'document.pdf'
}: OCRPanelProps) {
  const [selectedPage, setSelectedPage] = useState<number>(0);
  const [showComparison, setShowComparison] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set([0]));

  // Reset selected page when results change
  useEffect(() => {
    if (results && results.pages.length > 0) {
      setSelectedPage(0);
      setExpandedPages(new Set([0]));
    }
  }, [results]);

  // Copy to clipboard
  const handleCopy = async () => {
    if (!results) return;

    const allText = results.pages
      .map(page => `--- Page ${page.page + 1} ---\n${page.text}`)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(allText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Export results in different formats
  const handleExport = (format: ExportFormat) => {
    if (!results) return;

    let content = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    switch (format) {
      case 'txt':
        content = results.pages
          .map(page => `--- Page ${page.page + 1} ---\n${page.text}`)
          .join('\n\n');
        mimeType = 'text/plain';
        extension = 'txt';
        break;

      case 'json':
        content = JSON.stringify(results, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;

      case 'csv':
        // CSV format: Page, Text, Confidence, WordCount
        const csvRows = [
          ['Page', 'Text', 'Confidence', 'Word Count'],
          ...results.pages.map(page => [
            (page.page + 1).toString(),
            `"${page.text.replace(/"/g, '""')}"`, // Escape quotes
            page.confidence ? (page.confidence * 100).toFixed(1) + '%' : 'N/A',
            page.wordCount?.toString() || 'N/A'
          ])
        ];
        content = csvRows.map(row => row.join(',")).join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
        break;
    }

    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const baseFileName = pdfFileName.replace('.pdf', '');
    link.download = `${baseFileName}-ocr.${extension}`;

    link.click();
    URL.revokeObjectURL(url);
  };

  // Toggle page expansion
  const togglePageExpansion = (pageNumber: number) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageNumber)) {
      newExpanded.delete(pageNumber);
    } else {
      newExpanded.add(pageNumber);
    }
    setExpandedPages(newExpanded);
  };

  // Calculate overall statistics
  const getStatistics = () => {
    if (!results || results.pages.length === 0) {
      return {
        totalPages: 0,
        totalWords: 0,
        avgConfidence: 0,
        lowConfidencePages: 0
      };
    }

    const totalWords = results.pages.reduce((sum, page) => {
      const words = page.text.trim().split(/\s+/).filter(w => w.length > 0).length;
      return sum + words;
    }, 0);

    const avgConfidence = results.pages.reduce((sum, page) =>
      sum + (page.confidence || 0), 0
    ) / results.pages.length;

    const lowConfidencePages = results.pages.filter(
      page => (page.confidence || 1) < 0.7
    ).length;

    return {
      totalPages: results.pages.length,
      totalWords,
      avgConfidence,
      lowConfidencePages
    };
  };

  const stats = getStatistics();

  // Get confidence badge color
  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return { color: 'bg-gray-100 text-gray-700', label: 'N/A' };

    const percent = confidence * 100;
    if (percent >= 90) return { color: 'bg-green-100 text-green-700', label: 'Excellent' };
    if (percent >= 75) return { color: 'bg-blue-100 text-blue-700', label: 'Good' };
    if (percent >= 60) return { color: 'bg-yellow-100 text-yellow-700', label: 'Fair' };
    return { color: 'bg-red-100 text-red-700', label: 'Poor' };
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">OCR Results</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
          title="Close panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-700 font-medium mb-2">Processing OCR...</p>
          <p className="text-sm text-slate-500 text-center">
            This may take a few moments depending on the document size
          </p>
        </div>
      )}

      {/* Error State (No Results) */}
      {!loading && !results && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-slate-700 font-medium mb-2">No OCR Results</p>
          <p className="text-sm text-slate-500 text-center mb-4">
            Unable to extract text from the document
          </p>
          {onRetry && (
            <button onClick={onRetry} className="btn btn-primary">
              Retry OCR
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <>
          {/* Statistics Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-600">Engine:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {results.engine === 'tesseract' ? 'Tesseract (MVP)' : 'AI_Parse (Production)'}
                </span>
              </div>
              <div>
                <span className="text-slate-600">Pages:</span>
                <span className="ml-2 font-medium text-slate-900">{stats.totalPages}</span>
              </div>
              <div>
                <span className="text-slate-600">Total Words:</span>
                <span className="ml-2 font-medium text-slate-900">{stats.totalWords.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-600">Avg Confidence:</span>
                <span className="ml-2 font-medium text-slate-900">
                  {(stats.avgConfidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {stats.lowConfidencePages > 0 && (
              <div className="mt-3 flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span className="text-yellow-800">
                  {stats.lowConfidencePages} page(s) have low confidence scores. Review results carefully.
                </span>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="p-3 border-b border-slate-200 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              title="Copy all text"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>

            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              title="Toggle comparison view"
            >
              {showComparison ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showComparison ? 'Hide' : 'Show'} Comparison
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleExport('txt')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                title="Export as TXT"
              >
                <Download className="w-4 h-4" />
                TXT
              </button>
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                title="Export as JSON"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                title="Export as CSV"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          {/* Pages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {results.pages.map((page, idx) => {
              const badge = getConfidenceBadge(page.confidence);
              const isExpanded = expandedPages.has(idx);
              const wordCount = page.text.trim().split(/\s+/).filter(w => w.length > 0).length;

              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-lg overflow-hidden"
                >
                  {/* Page Header */}
                  <button
                    onClick={() => togglePageExpansion(idx)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">
                        Page {page.page + 1}
                      </span>
                      <span className="text-xs text-slate-600">
                        {wordCount} words
                      </span>
                      {page.confidence !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                          {badge.label} ({(page.confidence * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Page Content */}
                  {isExpanded && (
                    <div className="p-3 bg-white">
                      {page.text.trim().length > 0 ? (
                        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                          {page.text}
                        </pre>
                      ) : (
                        <p className="text-sm text-slate-500 italic">
                          No text extracted from this page
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Processing Time (if available) */}
          {results.processingTime && (
            <div className="p-3 border-t border-slate-200 text-xs text-slate-600 text-center">
              Processing time: {results.processingTime.toFixed(2)}s
            </div>
          )}
        </>
      )}
    </div>
  );
}
