'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import FileUpload from '@/components/FileUpload';
import LoadingSpinner from '@/components/LoadingSpinner';
import PDFViewer from '@/components/PDFViewer';
import SignatureCanvas from '@/components/SignatureCanvas';
import FormFiller from '@/components/FormFiller';
import OCRPanel from '@/components/OCRPanel';
import Toolbar, { Tool } from '@/components/Toolbar';
import PageNavigator from '@/components/PageNavigator';
import {
  extractFormFields,
  fillFormFields,
  performSmartOCR,
  downloadBlob
} from '@/lib/api-client';
import { embedSignatureInPDF, downloadPDF } from '@/lib/pdf-utils';

export default function EditorPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [showFormFiller, setShowFormFiller] = useState(false);
  const [showOCRPanel, setShowOCRPanel] = useState(false);

  // PDF state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [savedSignatures, setSavedSignatures] = useState<string[]>([]);

  // OCR state
  const [ocrResults, setOcrResults] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      // Validate file
      if (file.type !== 'application/pdf') {
        throw new Error('Please upload a valid PDF file');
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File size must be less than 50MB');
      }

      // Create object URL for PDF.js
      const url = URL.createObjectURL(file);

      setPdfFile(file);
      setPdfUrl(url);

      // Extract form fields automatically
      const formResult = await extractFormFields(file);
      if (formResult.success && formResult.data) {
        setFormFields(formResult.data.fields || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF');
      console.error('Error loading PDF:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle file removal
  const handleRemoveFile = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfFile(null);
    setPdfUrl(null);
    setError(null);
    setFormFields([]);
    setOcrResults(null);
    setCurrentPage(1);
    setTotalPages(0);
  };

  // Handle PDF load complete
  const handlePDFLoadComplete = (numPages: number) => {
    setTotalPages(numPages);
  };

  // Handle page change
  const handlePageChange = (page: number, total: number) => {
    setCurrentPage(page);
    if (total !== totalPages) {
      setTotalPages(total);
    }
  };

  // Handle toolbar actions
  const handleToolbarAction = async (action: 'sign' | 'fill-forms' | 'ocr' | 'download' | 'undo' | 'redo') => {
    switch (action) {
      case 'sign':
        setShowSignatureCanvas(true);
        break;

      case 'fill-forms':
        if (formFields.length === 0) {
          alert('No form fields found in this PDF');
        } else {
          setShowFormFiller(true);
        }
        break;

      case 'ocr':
        await handleOCR();
        break;

      case 'download':
        await handleDownload();
        break;

      case 'undo':
        // TODO: Implement undo functionality
        console.log('Undo action');
        break;

      case 'redo':
        // TODO: Implement redo functionality
        console.log('Redo action');
        break;
    }
  };

  // Handle signature save
  const handleSignatureSave = async (dataUrl: string) => {
    if (!pdfFile) return;

    try {
      setLoading(true);

      // Save signature for reuse
      setSavedSignatures(prev => [...prev, dataUrl]);

      // Embed signature in PDF (center of current page)
      const modifiedPdfBytes = await embedSignatureInPDF(
        pdfFile,
        dataUrl,
        currentPage - 1, // 0-indexed
        { x: 200, y: 400 }, // Default position
        { width: 200, height: 100 } // Default size
      );

      // Create new file from modified bytes
      const blob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const modifiedFile = new File(
        [blob],
        pdfFile.name,
        { type: 'application/pdf' }
      );

      // Update PDF
      const newUrl = URL.createObjectURL(modifiedFile);
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      setPdfFile(modifiedFile);
      setPdfUrl(newUrl);

      setShowSignatureCanvas(false);
      alert('Signature added successfully!');
    } catch (err) {
      console.error('Error adding signature:', err);
      alert('Failed to add signature. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form fill
  const handleFormFill = async (fieldData: Record<string, string>) => {
    if (!pdfFile) return;

    try {
      setLoading(true);

      const result = await fillFormFields(pdfFile, fieldData);

      if (result.success && result.data) {
        // Create new file from filled PDF
        const filledFile = new File(
          [result.data],
          pdfFile.name,
          { type: 'application/pdf' }
        );

        // Update PDF
        const newUrl = URL.createObjectURL(filledFile);
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
        setPdfFile(filledFile);
        setPdfUrl(newUrl);

        setShowFormFiller(false);
        alert('Form fields filled successfully!');
      } else {
        throw new Error(result.error || 'Failed to fill form');
      }
    } catch (err) {
      console.error('Error filling form:', err);
      alert('Failed to fill form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OCR
  const handleOCR = async () => {
    if (!pdfFile) return;

    try {
      setOcrLoading(true);
      setShowOCRPanel(true);

      const result = await performSmartOCR(pdfFile);

      if (result.success && result.data) {
        setOcrResults(result.data);
      } else {
        throw new Error(result.error || 'OCR failed');
      }
    } catch (err) {
      console.error('Error performing OCR:', err);
      alert('OCR failed. Please try again.');
      setShowOCRPanel(false);
    } finally {
      setOcrLoading(false);
    }
  };

  // Handle download
  const handleDownload = () => {
    if (!pdfFile) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `edited-${timestamp}-${pdfFile.name}`;

    const url = URL.createObjectURL(pdfFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <>
      {/* Editor Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            PDF Editor Pro
          </Link>
          {pdfFile && (
            <span className="text-sm text-slate-600 truncate max-w-xs">
              {pdfFile.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {pdfFile && (
            <>
              <button
                onClick={handleRemoveFile}
                className="btn btn-outline text-sm"
              >
                Close File
              </button>
            </>
          )}
        </div>
      </header>

      {/* Toolbar */}
      {pdfFile && !loading && !error && (
        <Toolbar
          currentTool={currentTool}
          onToolChange={setCurrentTool}
          onAction={handleToolbarAction}
          disabled={loading || ocrLoading}
        />
      )}

      {/* Main Editor Area */}
      <main className="flex-1 overflow-hidden bg-slate-100 flex">
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="card max-w-md text-center">
              <div className="text-red-500 text-5xl mb-4">⚠</div>
              <h2 className="text-xl font-semibold mb-2 text-slate-900">Error Loading PDF</h2>
              <p className="text-slate-600 mb-4">{error}</p>
              <button
                onClick={handleRemoveFile}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!pdfFile && !loading && !error && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4 text-slate-900">
                  PDF Editor
                </h1>
                <p className="text-lg text-slate-600">
                  Upload a PDF document to start editing
                </p>
              </div>

              <FileUpload
                onFileSelect={handleFileSelect}
                accept=".pdf"
                maxSize={50 * 1024 * 1024}
              />

              <div className="mt-8 grid md:grid-cols-3 gap-4 text-sm text-slate-600">
                <div className="text-center">
                  <div className="text-blue-600 text-2xl mb-2">📄</div>
                  <p>Supports standard PDF files up to 50MB</p>
                </div>
                <div className="text-center">
                  <div className="text-blue-600 text-2xl mb-2">🔒</div>
                  <p>Files are processed securely and not stored</p>
                </div>
                <div className="text-center">
                  <div className="text-blue-600 text-2xl mb-2">⚡</div>
                  <p>Fast processing with instant preview</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {pdfFile && pdfUrl && !loading && !error && (
          <>
            {/* Page Navigator */}
            <PageNavigator
              fileUrl={pdfUrl}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="w-64"
            />

            {/* PDF Viewer */}
            <PDFViewer
              fileUrl={pdfUrl}
              onPageChange={handlePageChange}
              onLoadComplete={handlePDFLoadComplete}
              className="flex-1"
            />

            {/* OCR Panel */}
            {showOCRPanel && (
              <OCRPanel
                results={ocrResults}
                loading={ocrLoading}
                onClose={() => setShowOCRPanel(false)}
                onRetry={handleOCR}
                pdfFileName={pdfFile?.name}
              />
            )}
          </>
        )}
      </main>

      {/* Signature Canvas Modal */}
      {showSignatureCanvas && (
        <SignatureCanvas
          onSave={handleSignatureSave}
          onCancel={() => setShowSignatureCanvas(false)}
        />
      )}

      {/* Form Filler Modal */}
      {showFormFiller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-3xl w-full max-h-screen overflow-y-auto">
            <FormFiller
              fields={formFields}
              onFill={handleFormFill}
              onCancel={() => setShowFormFiller(false)}
              loading={loading}
            />
          </div>
        </div>
      )}
    </>
  );
}
