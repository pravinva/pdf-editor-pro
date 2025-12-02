'use client';

import { useState } from 'react';
import Link from 'next/link';
import FileUpload from '@/components/FileUpload';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditorPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      setPdfFile(file);

      // TODO: Initialize PDF viewer here
      // This will be implemented when integrating PDF.js viewer

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF');
      console.error('Error loading PDF:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setPdfFile(null);
    setError(null);
  };

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
              <button
                className="btn btn-primary text-sm"
                disabled={loading}
              >
                Download PDF
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Editor Area */}
      <main className="flex-1 overflow-hidden bg-slate-100">
        {loading && (
          <div className="h-full flex items-center justify-center">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="h-full flex items-center justify-center">
            <div className="card max-w-md text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
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
          <div className="h-full flex items-center justify-center p-4">
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

        {pdfFile && !loading && !error && (
          <div className="h-full flex items-center justify-center p-8">
            <div className="card max-w-2xl text-center">
              <div className="text-blue-600 text-6xl mb-4">📄</div>
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                PDF Loaded Successfully
              </h2>
              <p className="text-slate-600 mb-2">
                <strong>File:</strong> {pdfFile.name}
              </p>
              <p className="text-slate-600 mb-6">
                <strong>Size:</strong> {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-md">
                <strong>Note:</strong> PDF viewer and editing tools will be integrated in the next phase.
                This screen confirms the file upload and validation is working correctly.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
