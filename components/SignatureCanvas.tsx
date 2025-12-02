'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  initialSignature?: string;
  className?: string;
}

export default function SignatureCanvas({
  onSave,
  onCancel,
  initialSignature,
  className = ''
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [penWidth, setPenWidth] = useState(2);
  const [penColor, setPenColor] = useState('#000000');
  const [isEmpty, setIsEmpty] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: 600,
      height: 300,
      backgroundColor: '#ffffff'
    });

    // Configure drawing brush
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = penWidth;
      canvas.freeDrawingBrush.color = penColor;
    }

    // Track drawing
    canvas.on('path:created', () => {
      setIsEmpty(false);
      saveToHistory(canvas);
    });

    // Load initial signature if provided
    if (initialSignature) {
      fabric.Image.fromURL(initialSignature, (img) => {
        if (img.width && img.height) {
          const scale = Math.min(
            canvas.width! / img.width,
            canvas.height! / img.height
          );
          img.scale(scale * 0.8);
          img.center();
          canvas.add(img);
          canvas.renderAll();
          setIsEmpty(false);
          saveToHistory(canvas);
        }
      });
    }

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update brush settings
  useEffect(() => {
    if (!fabricCanvas || !fabricCanvas.freeDrawingBrush) return;
    fabricCanvas.freeDrawingBrush.width = penWidth;
    fabricCanvas.freeDrawingBrush.color = penColor;
  }, [fabricCanvas, penWidth, penColor]);

  // Save canvas state to history
  const saveToHistory = (canvas: fabric.Canvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      newHistory.push(json);
      return newHistory;
    });
    setHistoryStep(prev => prev + 1);
  };

  // Clear canvas
  const clear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    setIsEmpty(true);
    setHistory([]);
    setHistoryStep(-1);
  };

  // Undo
  const undo = () => {
    if (!fabricCanvas || historyStep <= 0) return;

    const newStep = historyStep - 1;
    setHistoryStep(newStep);

    if (newStep === -1) {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#ffffff';
      fabricCanvas.renderAll();
      setIsEmpty(true);
    } else {
      const state = JSON.parse(history[newStep]);
      fabricCanvas.loadFromJSON(state, () => {
        fabricCanvas.renderAll();
        setIsEmpty(false);
      });
    }
  };

  // Redo
  const redo = () => {
    if (!fabricCanvas || historyStep >= history.length - 1) return;

    const newStep = historyStep + 1;
    setHistoryStep(newStep);

    const state = JSON.parse(history[newStep]);
    fabricCanvas.loadFromJSON(state, () => {
      fabricCanvas.renderAll();
      setIsEmpty(false);
    });
  };

  // Save signature
  const save = () => {
    if (!fabricCanvas || isEmpty) return;

    // Export as high-resolution PNG
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 2, // 2x resolution for clarity
      enableRetinaScaling: true
    });

    onSave(dataUrl);
  };

  // Download signature
  const download = () => {
    if (!fabricCanvas || isEmpty) return;

    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1.0,
      multiplier: 2
    });

    const link = document.createElement('a');
    link.download = `signature-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">Create Your Signature</h2>
          <p className="text-sm text-slate-600 mt-1">
            Draw your signature using your mouse, trackpad, or touchscreen
          </p>
        </div>

        {/* Canvas */}
        <div className="p-6">
          <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white shadow-inner">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Pen Width */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                <span>Pen Width</span>
                <span className="text-slate-500">{penWidth}px</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={penWidth}
                onChange={(e) => setPenWidth(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Thin</span>
                <span>Thick</span>
              </div>
            </div>

            {/* Pen Color */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Pen Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="h-10 w-20 rounded border border-slate-300 cursor-pointer"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setPenColor('#000000')}
                    className={`w-8 h-8 rounded border-2 ${penColor === '#000000' ? 'border-blue-600' : 'border-slate-300'}`}
                    style={{ backgroundColor: '#000000' }}
                    title="Black"
                  />
                  <button
                    onClick={() => setPenColor('#1e40af')}
                    className={`w-8 h-8 rounded border-2 ${penColor === '#1e40af' ? 'border-blue-600' : 'border-slate-300'}`}
                    style={{ backgroundColor: '#1e40af' }}
                    title="Blue"
                  />
                  <button
                    onClick={() => setPenColor('#dc2626')}
                    className={`w-8 h-8 rounded border-2 ${penColor === '#dc2626' ? 'border-blue-600' : 'border-slate-300'}`}
                    style={{ backgroundColor: '#dc2626' }}
                    title="Red"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tool Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Undo
            </button>

            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Redo (Ctrl+Y)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
              Redo
            </button>

            <button
              onClick={clear}
              disabled={isEmpty}
              className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title="Clear canvas"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>

            <button
              onClick={download}
              disabled={isEmpty}
              className="btn btn-outline text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
              title="Download signature"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center gap-3">
          <button
            onClick={onCancel}
            className="btn btn-outline"
          >
            Cancel
          </button>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={isEmpty}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Signature
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="px-6 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Tips:</strong> Use a smooth, continuous motion for best results.
              You can adjust pen width and color before drawing.
              The signature will be saved at high resolution for clarity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
