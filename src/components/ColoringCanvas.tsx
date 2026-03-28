import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Undo, Redo, Trash2, Check, X, Layers, Download, Loader2, Wand2, Sparkles, 
  Paintbrush, Eraser, PaintBucket, Grid, Maximize2, Droplets
} from 'lucide-react';
import { ConfirmModal } from './modals/ConfirmModal';
import { MagicWandModal } from './modals/MagicWandModal';
import { magicColorImage } from '../services/geminiService';
import { Selection } from '../services/geminiService';

interface ColoringCanvasProps {
  imageUrl: string;
  originalImageUrl: string;
  onSave: (coloredImageUrl: string) => void;
  onClose: () => void;
}

type Tool = 'brush' | 'eraser' | 'fill' | 'gradient' | 'pattern';

export const ColoringCanvas: React.FC<ColoringCanvasProps> = ({ imageUrl, originalImageUrl, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number, y: number } | null>(null);
  const [color, setColor] = useState('#db2777'); // Default to pink-600
  const [gradientColor2, setGradientColor2] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(12);
  const [tool, setTool] = useState<Tool>('brush');
  const [eraserOpacity, setEraserOpacity] = useState(100);
  const [patternType, setPatternType] = useState<'dots' | 'stripes' | 'grid'>('dots');
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [useTexture, setUseTexture] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMagicWand, setShowMagicWand] = useState(false);
  const [isMagicColoring, setIsMagicColoring] = useState(false);

  const colors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', 
    '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
    '#d946ef', '#f43f5e', '#78350f', '#71717a', '#4ade80'
  ];

  const patterns = [
    { id: 'dots', icon: Grid, label: 'نقاط' },
    { id: 'stripes', icon: Layers, label: 'خطوط' },
    { id: 'grid', icon: Maximize2, label: 'شبكة' },
  ];

  const handleMagicColor = async (prompt: string, selection: Selection | null) => {
    if (!canvasRef.current) return;
    setIsMagicColoring(true);
    try {
      const currentImage = canvasRef.current.toDataURL('image/png');
      const coloredUrl = await magicColorImage(currentImage, prompt, selection);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.src = coloredUrl;
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          saveToHistory();
          setShowMagicWand(false);
        };
      }
    } catch (err) {
      console.error("Magic coloring error:", err);
    } finally {
      setIsMagicColoring(false);
    }
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
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
    let newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    
    if (newHistory.length > 20) {
      newHistory = newHistory.slice(newHistory.length - 20);
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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

    if (tool === 'fill' || tool === 'gradient' || tool === 'pattern') {
      handleFill(x, y);
    } else {
      setIsDrawing(true);
      draw(e);
    }
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

    x = (x / rect.width) * canvas.width;
    y = (y / rect.height) * canvas.height;

    ctx.save();
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = eraserOpacity / 100;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = color;
    }

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
    ctx.restore();

    lastPos.current = { x, y };
  };

  const handleFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const x = Math.floor(startX);
    const y = Math.floor(startY);
    const startPos = (y * width + x) * 4;
    
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    // Don't fill if clicking on a line (dark pixels)
    if (startR < 60 && startG < 60 && startB < 60 && startA > 200) return;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;
    const maskData = maskCtx.createImageData(width, height);
    const mData = maskData.data;

    const stack: [number, number][] = [[x, y]];
    const visited = new Uint8Array(width * height);

    while (stack.length > 0) {
      const [currX, currY] = stack.pop()!;
      if (currX < 0 || currX >= width || currY < 0 || currY >= height) continue;
      
      const idx = currY * width + currX;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const pos = idx * 4;
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];
      const a = data[pos + 3];

      const dist = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) + Math.abs(a - startA);
      
      if (dist < 50 && (r > 60 || g > 60 || b > 60)) {
        mData[pos] = 255;
        mData[pos + 1] = 255;
        mData[pos + 2] = 255;
        mData[pos + 3] = 255;

        stack.push([currX + 1, currY]);
        stack.push([currX - 1, currY]);
        stack.push([currX, currY + 1]);
        stack.push([currX, currY - 1]);
      }
    }

    maskCtx.putImageData(maskData, 0, 0);

    ctx.save();
    const fillCanvas = document.createElement('canvas');
    fillCanvas.width = width;
    fillCanvas.height = height;
    const fillCtx = fillCanvas.getContext('2d');
    if (!fillCtx) return;

    if (tool === 'gradient') {
      const grad = fillCtx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, color);
      grad.addColorStop(1, gradientColor2);
      fillCtx.fillStyle = grad;
    } else if (tool === 'pattern') {
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = 40;
      patternCanvas.height = 40;
      const pCtx = patternCanvas.getContext('2d');
      if (pCtx) {
        pCtx.fillStyle = 'white';
        pCtx.fillRect(0, 0, 40, 40);
        pCtx.strokeStyle = color;
        pCtx.lineWidth = 2;
        if (patternType === 'dots') {
          pCtx.fillStyle = color;
          pCtx.beginPath();
          pCtx.arc(20, 20, 5, 0, Math.PI * 2);
          pCtx.fill();
        } else if (patternType === 'stripes') {
          pCtx.beginPath();
          pCtx.moveTo(0, 0);
          pCtx.lineTo(40, 40);
          pCtx.stroke();
        } else if (patternType === 'grid') {
          pCtx.strokeRect(5, 5, 30, 30);
        }
        const pattern = fillCtx.createPattern(patternCanvas, 'repeat');
        if (pattern) fillCtx.fillStyle = pattern;
      }
    } else {
      fillCtx.fillStyle = color;
    }
    
    fillCtx.fillRect(0, 0, width, height);
    fillCtx.globalCompositeOperation = 'destination-in';
    fillCtx.drawImage(maskCanvas, 0, 0);

    ctx.drawImage(fillCanvas, 0, 0);
    ctx.restore();
    
    saveToHistory();
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
    <div className="fixed inset-0 z-[150] bg-purple-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-6xl bg-white rounded-[48px] overflow-hidden flex flex-col h-full shadow-[0_32px_64px_-16px_rgba(109,40,217,0.4)] border-4 border-yellow-400/30"
      >
        {/* Toolbar */}
        <div className="px-8 py-5 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-5">
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-purple-100 rounded-2xl transition-all text-purple-400 hover:text-purple-800"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col">
              <h3 className="font-serif font-bold text-2xl text-purple-900 leading-none">استوديو ريبونزل السحري</h3>
              <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-[0.3em] mt-1">Rapunzel's Creative Studio</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tool Selector */}
            <div className="flex items-center gap-1 bg-purple-50 p-1.5 rounded-2xl border border-purple-100 shadow-inner mr-4">
              {[
                { id: 'brush', icon: Paintbrush, label: 'فرشاة' },
                { id: 'eraser', icon: Eraser, label: 'ممحاة' },
                { id: 'fill', icon: PaintBucket, label: 'تعبئة' },
                { id: 'gradient', icon: Droplets, label: 'تدرج' },
                { id: 'pattern', icon: Grid, label: 'نمط' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id as Tool)}
                  className={`p-2.5 rounded-xl transition-all flex items-center gap-2 px-3 ${
                    tool === t.id 
                      ? 'bg-purple-600 text-white shadow-lg' 
                      : 'hover:bg-white text-purple-400'
                  }`}
                  title={t.label}
                >
                  <t.icon size={20} />
                  {tool === t.id && <span className="text-xs font-bold">{t.label}</span>}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-purple-50 p-1.5 rounded-2xl border border-purple-100 shadow-inner">
              <button 
                onClick={undo} 
                disabled={historyIndex <= 0} 
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl disabled:opacity-30 transition-all text-purple-600"
                title="تراجع"
              >
                <Undo size={20} />
              </button>
              <button 
                onClick={redo} 
                disabled={historyIndex >= history.length - 1} 
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl disabled:opacity-30 transition-all text-purple-600"
                title="إعادة"
              >
                <Redo size={20} />
              </button>
            </div>

            <div className="h-8 w-[1px] bg-purple-100 mx-2" />

            <div className="flex items-center gap-1 bg-purple-50 p-1.5 rounded-2xl border border-purple-100 shadow-inner">
              <button 
                onClick={() => setShowMagicWand(true)}
                className="p-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 text-purple-900 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 px-4"
                title="العصا السحرية"
              >
                <Wand2 size={20} />
                <span className="text-xs font-bold">تلوين سحري</span>
              </button>
              
              <div className="h-6 w-[1px] bg-purple-200 mx-1" />

              <button 
                onClick={() => setUseTexture(!useTexture)} 
                className={`p-2.5 rounded-xl transition-all ${useTexture ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'hover:bg-white text-purple-400'}`}
                title="ملمس الورق"
              >
                <Layers size={20} />
              </button>
              <button 
                onClick={downloadImage}
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-purple-600 transition-all"
                title="تحميل الصورة"
              >
                <Download size={20} />
              </button>
              <button 
                onClick={() => setShowResetConfirm(true)} 
                className="p-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl text-purple-300 transition-all" 
                title="إعادة تعيين للأصل"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="h-8 w-[1px] bg-purple-100 mx-2" />

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 active:scale-95"
            >
              {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
              {isSaving ? "جاري الحفظ..." : "حفظ العمل"}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar for Tool Settings */}
          <div className="w-72 border-r border-purple-100 bg-purple-50/30 p-6 space-y-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              {tool === 'eraser' && (
                <motion.div
                  key="eraser-settings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h4 className="font-bold text-purple-900 flex items-center gap-2">
                    <Eraser size={18} />
                    إعدادات الممحاة
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-bold text-purple-400 uppercase tracking-widest">
                      <span>الشفافية</span>
                      <span>{eraserOpacity}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={eraserOpacity} 
                      onChange={(e) => setEraserOpacity(parseInt(e.target.value))}
                      className="w-full accent-purple-600 h-2 bg-purple-200 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </motion.div>
              )}

              {tool === 'gradient' && (
                <motion.div
                  key="gradient-settings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h4 className="font-bold text-purple-900 flex items-center gap-2">
                    <Droplets size={18} />
                    ألوان التدرج
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-purple-400 uppercase">اللون الأول</span>
                      <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-purple-400 uppercase">اللون الثاني</span>
                      <input 
                        type="color" 
                        value={gradientColor2} 
                        onChange={(e) => setGradientColor2(e.target.value)}
                        className="w-full h-12 rounded-xl cursor-pointer border-2 border-white shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="h-20 rounded-2xl shadow-inner border border-purple-100" style={{ background: `linear-gradient(to right, ${color}, ${gradientColor2})` }} />
                </motion.div>
              )}

              {tool === 'pattern' && (
                <motion.div
                  key="pattern-settings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h4 className="font-bold text-purple-900 flex items-center gap-2">
                    <Grid size={18} />
                    اختيار النمط
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {patterns.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPatternType(p.id as any)}
                        className={`flex items-center gap-3 p-4 rounded-2xl transition-all border-2 ${
                          patternType === p.id 
                            ? 'bg-white border-purple-600 shadow-md text-purple-900' 
                            : 'bg-white/50 border-transparent text-purple-400 hover:bg-white'
                        }`}
                      >
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <p.icon size={20} />
                        </div>
                        <span className="font-bold text-sm">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {(tool === 'brush' || tool === 'eraser') && (
                <motion.div
                  key="brush-settings"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h4 className="font-bold text-purple-900 flex items-center gap-2">
                    <Paintbrush size={18} />
                    حجم الفرشاة
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-bold text-purple-400 uppercase tracking-widest">
                      <span>الحجم</span>
                      <span>{brushSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="100" 
                      value={brushSize} 
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-full accent-purple-600 h-2 bg-purple-200 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex items-center justify-center p-4 bg-white rounded-2xl border border-purple-100 shadow-inner">
                      <div 
                        className="rounded-full bg-purple-900 shadow-lg"
                        style={{ width: Math.max(4, brushSize / 2), height: Math.max(4, brushSize / 2) }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-6 border-t border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-purple-900 text-sm">الألوان</h4>
                <div className="relative group">
                  <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer border-2 border-white shadow-sm overflow-hidden"
                    title="اختر لوناً مخصصاً"
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-purple-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    لون مخصص
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all ${
                      color === c ? 'border-purple-600 scale-110 shadow-md' : 'border-white hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative bg-purple-50/50 flex items-center justify-center overflow-hidden p-8">
            <div className="relative shadow-[0_32px_64px_-16px_rgba(109,40,217,0.2)] rounded-[32px] overflow-hidden bg-white group/canvas border-8 border-white">
              <canvas
                ref={canvasRef}
                width={1024}
                height={1024}
                className="max-w-full max-h-[calc(90vh-200px)] bg-white cursor-crosshair touch-none"
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
              
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 group-hover/canvas:opacity-100 transition-opacity">
                <div className="bg-purple-900/40 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-sm font-bold border border-white/20 flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  {tool === 'brush' || tool === 'eraser' ? 'استخدم الفأرة أو اللمس للتلوين' : 'انقر لتعبئة المنطقة'}
                </div>
              </div>
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

      <MagicWandModal
        isOpen={showMagicWand}
        onClose={() => setShowMagicWand(false)}
        imageUrl={canvasRef.current?.toDataURL('image/png') || imageUrl}
        isMagicColoring={isMagicColoring}
        onMagicColor={handleMagicColor}
      />
    </div>
  );
};
