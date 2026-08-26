import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  PenTool,
  Eraser,
  RotateCcw,
  Trash2,
  Maximize2,
  Minimize2,
  FileText,
  Check,
} from 'lucide-react';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PEN_COLORS = [
  { id: '#1E293B', label: 'Than đen', bgClass: 'bg-slate-800' },
  { id: '#2563EB', label: 'Xanh lam', bgClass: 'bg-blue-600' },
  { id: '#DC2626', label: 'Đỏ tươi', bgClass: 'bg-red-600' },
  { id: '#16A34A', label: 'Xanh lá', bgClass: 'bg-emerald-600' },
  { id: '#D97706', label: 'Cam hổ phách', bgClass: 'bg-amber-600' },
];

const PEN_SIZES = [
  { size: 2, label: 'Mảnh' },
  { size: 4, label: 'Vừa' },
  { size: 8, label: 'Đậm' },
];

const MATH_SYMBOLS = [
  '√', '∛', 'x²', 'x³', 'xⁿ', 'Δ', 'π', '≠', '≤', '≥', '±', '∓',
  'α', 'β', 'γ', 'θ', 'λ', 'x₁', 'x₂', 'y₁', 'y₂',
  'sin', 'cos', 'tan', 'cot', 'log', 'ln', 'lim', '∫', '∑', '∞',
  '∈', '∉', '⊂', '⊃', '∪', '∩', '⊥', '∥', '∠', '△', '≡', '≈', '⇒', '⇔'
];

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'text'>('draw');
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState<string>('#1E293B');
  const [penSize, setPenSize] = useState<number>(3);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [scratchText, setScratchText] = useState<string>(() => {
    return localStorage.getItem('edu10_scratchpad_text') || '';
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const historyRef = useRef<ImageData[]>([]);

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen || activeTab !== 'draw') return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        // Save current contents before resizing if any
        const ctx = canvas.getContext('2d');
        let prevData: ImageData | null = null;
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          try {
            prevData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          } catch (e) {}
        }

        canvas.width = rect.width;
        canvas.height = rect.height;

        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (prevData) {
            ctx.putImageData(prevData, 0, 0);
          } else {
            // Save initial white state
            historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
          }
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab, isFullScreen]);

  // Save text to localStorage
  useEffect(() => {
    localStorage.setItem('edu10_scratchpad_text', scratchText);
  }, [scratchText]);

  // Draw Helpers
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    canvas.setPointerCapture(e.pointerId);

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = penSize * 5;
    } else {
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.closePath();

    // Push state to history (limit 20)
    try {
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current.push(snap);
      if (historyRef.current.length > 20) {
        historyRef.current.shift();
      }
    } catch (e) {}
  };

  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pop the current state
    historyRef.current.pop();
    // Get previous state
    const prevState = historyRef.current[historyRef.current.length - 1];
    if (prevState) {
      ctx.putImageData(prevState, 0, 0);
    }
  }, []);

  const handleClearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    historyRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
  }, []);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in"
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-[2.5rem] w-full flex flex-col shadow-2xl border-2 border-[#5A5A40] dark:border-slate-700 overflow-hidden transition-all duration-300 ${
          isFullScreen
            ? 'h-[96vh] max-w-[98vw]'
            : 'max-w-3xl h-[85vh] max-h-[720px]'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAF9F6] dark:bg-slate-800 border-b border-[#EAE7E0] dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shadow-2xs">
              📝
            </div>
            <div>
              <h3 className="font-extrabold text-[#3D3D2D] dark:text-white text-sm sm:text-base">
                Bảng Nháp Tính Toán & Vẽ Hình
              </h3>
              <p className="text-[11px] text-[#8A8A70] dark:text-slate-400">
                Nháp hình học, giải phương trình và ghi chú công thức tức thì
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Mode Tab Switcher */}
            <div className="flex bg-[#EAE7E0] dark:bg-slate-700 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab('draw')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'draw'
                    ? 'bg-white dark:bg-slate-900 text-[#3D3D2D] dark:text-white shadow-2xs'
                    : 'text-[#6B6B54] dark:text-slate-300 hover:text-[#3D3D2D]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Vẽ tay</span>
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'text'
                    ? 'bg-white dark:bg-slate-900 text-[#3D3D2D] dark:text-white shadow-2xs'
                    : 'text-[#6B6B54] dark:text-slate-300 hover:text-[#3D3D2D]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ký hiệu & Chữ</span>
              </button>
            </div>

            {/* Toggle FullScreen */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-[#8A8A70] hover:text-[#3D3D2D] dark:hover:text-white hover:bg-[#FAF9F6] dark:hover:bg-slate-700 rounded-xl transition cursor-pointer hidden sm:block"
              title={isFullScreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-[#8A8A70] hover:text-[#3D3D2D] dark:hover:text-white hover:bg-[#FAF9F6] dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DRAWING TAB BODY */}
        {activeTab === 'draw' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 space-y-2">
            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-800 p-2 sm:p-3 rounded-2xl border border-[#EAE7E0] dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-2xs">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                {/* Tool toggle: Pen vs Eraser */}
                <div className="flex bg-[#FAF9F6] dark:bg-slate-700 p-1 rounded-xl border border-[#D9D2C5] dark:border-slate-600">
                  <button
                    onClick={() => setTool('pen')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                      tool === 'pen'
                        ? 'bg-[#5A5A40] text-white shadow-2xs'
                        : 'text-[#6B6B54] dark:text-slate-300'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Bút</span>
                  </button>
                  <button
                    onClick={() => setTool('eraser')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                      tool === 'eraser'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-[#6B6B54] dark:text-slate-300'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>Tẩy</span>
                  </button>
                </div>

                {/* Color picker (only when pen active) */}
                {tool === 'pen' && (
                  <div className="flex items-center space-x-1.5 pl-1 sm:pl-2 border-l border-[#EAE7E0] dark:border-slate-700">
                    {PEN_COLORS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setPenColor(c.id)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center ${c.bgClass} ${
                          penColor === c.id ? 'scale-125 ring-2 ring-offset-2 ring-blue-500 shadow-xs' : 'hover:scale-110 opacity-80 hover:opacity-100'
                        }`}
                        title={c.label}
                      >
                        {penColor === c.id && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Pen Size */}
                <div className="flex items-center space-x-1 pl-1 sm:pl-2 border-l border-[#EAE7E0] dark:border-slate-700 text-xs">
                  {PEN_SIZES.map((s) => (
                    <button
                      key={s.size}
                      onClick={() => setPenSize(s.size)}
                      className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                        penSize === s.size
                          ? 'bg-[#EAE7E0] dark:bg-slate-700 text-[#3D3D2D] dark:text-white font-extrabold'
                          : 'text-[#8A8A70] hover:text-[#3D3D2D] dark:hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons: Undo & Clear */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleUndo}
                  className="px-2.5 py-1.5 bg-[#FAF9F6] dark:bg-slate-700 hover:bg-[#EAE7E0] text-[#5A5A40] dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 border border-[#D9D2C5] dark:border-slate-600"
                  title="Hoàn tác nét vẽ trước"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hoàn tác</span>
                </button>
                <button
                  onClick={handleClearCanvas}
                  className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 border border-rose-200 dark:border-rose-800"
                  title="Xóa toàn bộ bản vẽ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hết</span>
                </button>
              </div>
            </div>

            {/* Canvas Surface */}
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-[#D9D2C5] dark:border-slate-700 shadow-inner bg-white touch-none">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-full cursor-crosshair block"
              />
            </div>
          </div>
        )}

        {/* TEXT & MATH SYMBOLS TAB BODY */}
        {activeTab === 'text' && (
          <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 space-y-3.5 overflow-y-auto">
            {/* Math Symbols Toolbar */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#5A5A40] dark:text-slate-300 block">
                Ký hiệu Toán học chèn nhanh:
              </label>
              <div className="flex flex-wrap gap-1.5 bg-[#FAF9F6] dark:bg-slate-800 p-2.5 rounded-2xl border border-[#D9D2C5] dark:border-slate-700 text-xs font-mono max-h-32 overflow-y-auto">
                {MATH_SYMBOLS.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setScratchText((prev) => prev + sym + ' ')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-amber-50 dark:hover:bg-slate-600 border border-[#D9D2C5] dark:border-slate-600 rounded-lg text-xs font-bold text-[#3D3D2D] dark:text-slate-100 transition cursor-pointer active:scale-95 shadow-2xs"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 flex flex-col min-h-0 space-y-1">
              <label className="text-xs font-bold text-[#5A5A40] dark:text-slate-300">
                Ghi chú lời giải & Nháp văn bản:
              </label>
              <textarea
                value={scratchText}
                onChange={(e) => setScratchText(e.target.value)}
                placeholder="Gõ nháp lời giải chi tiết, phép tính biến đổi, hoặc lưu từ mới tại đây... (Tự động lưu)"
                className="w-full flex-1 min-h-[160px] p-4 bg-[#FAF9F6] dark:bg-slate-800 border border-[#D9D2C5] dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-mono text-[#3D3D2D] dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-amber-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-[#F5F2ED] dark:border-slate-700">
              <button
                onClick={() => setScratchText('')}
                className="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold cursor-pointer"
              >
                Xóa sạch văn bản
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
              >
                Đóng bảng nháp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
