'use client';

import { useState } from 'react';

export type Tool = 'select' | 'signature' | 'text' | 'highlight' | 'draw' | 'forms' | 'ocr';

interface ToolbarProps {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onAction: (action: 'sign' | 'fill-forms' | 'ocr' | 'download' | 'undo' | 'redo') => void;
  canUndo?: boolean;
  canRedo?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function Toolbar({
  currentTool,
  onToolChange,
  onAction,
  canUndo = false,
  canRedo = false,
  disabled = false,
  className = ''
}: ToolbarProps) {
  const [showSettings, setShowSettings] = useState(false);

  const tools = [
    {
      id: 'select' as Tool,
      name: 'Select',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
      description: 'Select and move objects'
    },
    {
      id: 'signature' as Tool,
      name: 'Sign',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      description: 'Add signature'
    },
    {
      id: 'text' as Tool,
      name: 'Text',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Add text'
    },
    {
      id: 'highlight' as Tool,
      name: 'Highlight',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Highlight text'
    },
    {
      id: 'draw' as Tool,
      name: 'Draw',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      description: 'Free draw'
    }
  ];

  const actions = [
    {
      id: 'sign' as const,
      name: 'Add Signature',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      description: 'Open signature pad'
    },
    {
      id: 'fill-forms' as const,
      name: 'Fill Forms',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Fill form fields'
    },
    {
      id: 'ocr' as const,
      name: 'OCR',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Extract text with OCR'
    }
  ];

  return (
    <div className={`bg-white border-b border-slate-200 ${className}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Tool Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700 mr-2">Tools:</span>
            <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
              {tools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => onToolChange(tool.id)}
                  disabled={disabled}
                  className={`p-2 rounded transition-colors ${
                    currentTool === tool.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={tool.description}
                >
                  {tool.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex gap-1 mr-2">
              <button
                onClick={() => onAction('undo')}
                disabled={disabled || !canUndo}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={() => onAction('redo')}
                disabled={disabled || !canRedo}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>

            {/* Main Actions */}
            {actions.map(action => (
              <button
                key={action.id}
                onClick={() => onAction(action.id)}
                disabled={disabled}
                className="btn btn-outline text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={action.description}
              >
                {action.icon}
                <span className="hidden sm:inline">{action.name}</span>
              </button>
            ))}

            {/* Download Button */}
            <button
              onClick={() => onAction('download')}
              disabled={disabled}
              className="btn btn-primary text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download edited PDF"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                disabled={disabled}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {showSettings && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSettings(false)}
                  />

                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          // Add preferences action
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded"
                      >
                        Preferences
                      </button>
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          // Add help action
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded"
                      >
                        Help & Shortcuts
                      </button>
                      <div className="border-t border-slate-200 my-1" />
                      <button
                        onClick={() => {
                          setShowSettings(false);
                          // Add about action
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded"
                      >
                        About PDF Editor Pro
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tool Info Bar */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Current Tool:</span>
            <span className="px-2 py-1 bg-white border border-slate-200 rounded">
              {tools.find(t => t.id === currentTool)?.name || 'Select'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <span>Ctrl+Z: Undo</span>
            <span>Ctrl+Y: Redo</span>
            <span>Ctrl+S: Save</span>
          </div>
        </div>
      </div>
    </div>
  );
}
