import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Undo, Redo, Trash2, Check, X, Layers, Download, Loader2 } from 'lucide-react';
import { ConfirmModal } from './modals/ConfirmModal';

interface ColoringCanvasProps {
  imageUrl: string;
  originalImageUrl: string;
  onSave: (coloredImageUrl: string) => void;
  onClose: () => void;
}

export const ColoringCanvas: React.FC<ColoringCanvasProps> = ({ imageUrl, originalImageUrl, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number, y: number } | null>(null);
  const [color, setColor] = useState('#db2777'); // Default to pink-600
  const [brushSize, setBrushSize] = useState(12);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [useTexture, setUseTexture] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', 
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#d946ef', '#f43f5e', '#78350f', '#71717a', '#4ade80'
  ];

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      // Small delay to show the saving state
      await new Promise(resolve => setTimeout(resolve, 600));
      onSave(canvasRef.current.toDataURL('image/png'));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveToHistory();
    };
  }, [imageUrl]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPos.current = null;
      saveToHistory();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    // Scale coordinates to canvas resolution
    x = (x / rect.width) * canvas.width;
    y = (y / rect.height) * canvas.height;

    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (!lastPos.current) {
      ctx.moveTo(x, y);
    } else {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
    }
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPos.current = { x, y };
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      loadFromHistory(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      loadFromHistory(newIndex);
    }
  };

  const loadFromHistory = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = history[index];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = originalImageUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveToHistory();
      setShowResetConfirm(false);
    };
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `coloring-page-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-stone-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-5xl bg-white rounded-[48px] overflow-hidden flex flex-col h-full shadow-2xl border border-stone-200/60"
      >
        {/* Toolbar */}
        <div className="px-8 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-5">
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-stone-200 rounded-2xl transition-all text-stone-500 hover:text-stone-800"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col">
              <h3 className="font-serif font-bold text-xl text-stone-800 leading-none">استوديو التلوين</h3>
              <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest mt-1">Creative Studio</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/60">
              <button 
                onClick={undo} 
                disabled={historyIndex <= 0} 
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl disabled:opacity-30 transition-all text-stone-600"
                title="تراجع"
              >
                <Undo size={20} />
              </button>
              <button 
                onClick={redo} 
                disabled={historyIndex >= history.length - 1} 
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl disabled:opacity-30 transition-all text-stone-600"
                title="إعادة"
              >
                <Redo size={20} />
              </button>
            </div>

            <div className="h-8 w-[1px] bg-stone-200 mx-2" />

            <div className="flex items-center gap-1 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/60">
              <button 
                onClick={() => setUseTexture(!useTexture)} 
                className={`p-2.5 rounded-xl transition-all ${useTexture ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'hover:bg-white text-stone-500'}`}
                title="ملمس الورق"
              >
                <Layers size={20} />
              </button>
              <button 
                onClick={downloadImage}
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-stone-600 transition-all"
                title="تحميل الصورة"
              >
                <Download size={20} />
              </button>
              <button 
                onClick={() => setShowResetConfirm(true)} 
                className="p-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl text-stone-400 transition-all" 
                title="إعادة تعيين للأصل"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="h-8 w-[1px] bg-stone-200 mx-2" />

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-pink-500 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-pink-600 transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
              {isSaving ? "جاري الحفظ..." : "حفظ العمل"}
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-stone-100 flex items-center justify-center overflow-hidden p-8">
          <div className="relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] rounded-[32px] overflow-hidden bg-white group/canvas">
            <canvas
              ref={canvasRef}
              width={1024}
              height={1024}
              className="max-w-full max-h-[calc(90vh-300px)] bg-white cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {useTexture && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
                style={{
                  backgroundImage: `url('https://www.transparenttextures.com/patterns/natural-paper.png')`,
                  backgroundRepeat: 'repeat'
                }}
              />
            )}
            
            {/* Canvas Hint */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover/canvas:opacity-100 transition-opacity">
              <div className="bg-stone-900/40 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-sm font-bold border border-white/20">
                استخدم الفأرة أو اللمس للتلوين
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="p-8 bg-white border-t border-stone-100 space-y-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {colors.map(c => (
              <motion.button
                key={c}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setColor(c)}
                className={`w-12 h-12 rounded-2xl border-4 transition-all shadow-sm ${color === c ? 'scale-110 border-pink-500 shadow-lg shadow-pink-500/10' : 'border-white hover:border-stone-100'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <div className="relative group">
              <input 
                type="color" 
                value={color} 
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-2xl overflow-hidden border-4 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
              />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-stone-800 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                اختر لوناً مخصصاً
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8 max-w-2xl mx-auto bg-stone-50 px-8 py-4 rounded-3xl border border-stone-200/60">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">حجم الفرشاة</span>
              <span className="text-xl font-mono font-bold text-stone-800 w-12">{brushSize}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="flex-1 accent-pink-500 h-2 bg-stone-200 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <div 
                className="rounded-full bg-stone-800 shadow-inner"
                style={{ width: Math.max(4, brushSize / 2), height: Math.max(4, brushSize / 2) }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={clearCanvas}
        title="إعادة تعيين الصفحة"
        message="هل أنت متأكد أنك تريد مسح كل التلوين والبدء من جديد؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="نعم، ابدأ من جديد"
        type="danger"
      />
    </div>
  );
};
