import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wand2, Sparkles, Loader2, Palette } from 'lucide-react';
import { Selection } from '../../services/geminiService';

interface MagicWandModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  isMagicColoring: boolean;
  onMagicColor: (prompt: string, selection: Selection | null) => void;
}

export const MagicWandModal: React.FC<MagicWandModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  isMagicColoring,
  onMagicColor
}) => {
  const [prompt, setPrompt] = useState('');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);

  const handleSelectionMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || isMagicColoring) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSelectionStart({ x, y });
    setSelection({ x, y, w: 0, h: 0 });
  };

  const handleSelectionMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !selectionStart || !selection || isMagicColoring) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setSelection({
      x: Math.min(x, selectionStart.x),
      y: Math.min(y, selectionStart.y),
      w: Math.abs(x - selectionStart.x),
      h: Math.abs(y - selectionStart.y),
    });
  };

  const handleSelectionMouseUp = () => {
    setSelectionStart(null);
    if (selection && (selection.w < 1 || selection.h < 1)) {
      setSelection(null);
    }
  };

  const suggestedPrompts = [
    "لون شعر ريبونزل باللون الذهبي اللامع",
    "لون فستان ريبونزل باللون الأرجواني الملكي",
    "لون الخلفية بألوان غروب الشمس الدافئة",
    "لون البرج بألوان حجرية واقعية",
    "تلوين سحري كامل للصورة بألوان ديزني"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-purple-900/60 backdrop-blur-md" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="relative bg-white rounded-[48px] p-8 max-w-2xl w-full shadow-[0_32px_64px_-16px_rgba(109,40,217,0.3)] border-4 border-yellow-400 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Rapunzel Theme Accents */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-purple-500 to-yellow-400" />
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-200/40 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-200/40 rounded-full blur-3xl" />

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-purple-50 rounded-full text-purple-400 transition-all z-20"
              disabled={isMagicColoring}
            >
              <X size={24} />
            </button>
            
            <div className="relative z-10 flex items-center gap-4 mb-8">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-3xl shadow-lg transform -rotate-3">
                <Wand2 className="text-white" size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-serif font-bold text-purple-900 leading-tight">عصا ريبونزل السحرية</h3>
                <p className="text-xs font-bold text-yellow-600 uppercase tracking-[0.3em]">Magic Coloring Wand</p>
              </div>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Preview & Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">معاينة التحديد</span>
                    <button
                      onClick={() => {
                        setIsSelecting(!isSelecting);
                        if (!isSelecting) setSelection(null);
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                        isSelecting 
                          ? 'bg-yellow-400 border-yellow-400 text-purple-900 shadow-lg' 
                          : 'bg-purple-50 border-purple-100 text-purple-600 hover:bg-purple-100'
                      }`}
                    >
                      {isSelecting ? 'جاري التحديد...' : 'تحديد منطقة'}
                    </button>
                  </div>
                  
                  <div 
                    className={`relative aspect-square w-full bg-stone-50 rounded-[32px] overflow-hidden border-4 transition-all shadow-inner ${
                      isSelecting ? 'border-yellow-400 cursor-crosshair ring-8 ring-yellow-400/10' : 'border-purple-50'
                    }`}
                    onMouseDown={handleSelectionMouseDown}
                    onMouseMove={handleSelectionMouseMove}
                    onMouseUp={handleSelectionMouseUp}
                    onMouseLeave={handleSelectionMouseUp}
                  >
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain pointer-events-none select-none p-4" />
                    
                    {selection && (
                      <div 
                        className="absolute border-4 border-yellow-400 bg-yellow-400/20 pointer-events-none shadow-[0_0_0_9999px_rgba(109,40,217,0.4)]"
                        style={{
                          left: `${selection.x}%`,
                          top: `${selection.y}%`,
                          width: `${selection.w}%`,
                          height: `${selection.h}%`,
                        }}
                      >
                        <div className="absolute -top-8 left-0 bg-yellow-400 text-purple-900 text-[10px] px-2 py-1 rounded-lg font-bold uppercase shadow-lg">
                          منطقة السحر
                        </div>
                      </div>
                    )}

                    {isSelecting && !selection && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-purple-900/80 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl border border-white/20">
                          ارسم مربعاً حول ما تريد تلوينه
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={14} />
                      ماذا تريد أن تلون؟
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="مثال: لون شعر ريبونزل باللون الذهبي اللامع مع بريق سحري..."
                      className="w-full bg-purple-50 border-2 border-purple-100 rounded-[24px] px-6 py-4 focus:ring-4 focus:ring-yellow-400/20 focus:border-yellow-400 outline-none transition-all min-h-[120px] resize-none text-purple-900 placeholder:text-purple-200 text-sm shadow-inner"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                      <Palette size={14} />
                      اقتراحات سريعة
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {suggestedPrompts.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => setPrompt(p)}
                          className="text-[10px] font-bold bg-white border border-purple-100 text-purple-600 px-3 py-2 rounded-xl hover:bg-yellow-400 hover:border-yellow-400 hover:text-purple-900 transition-all shadow-sm"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={onClose}
                  disabled={isMagicColoring}
                  className="flex-1 bg-purple-50 text-purple-600 rounded-[24px] py-5 font-bold hover:bg-purple-100 transition-all disabled:opacity-50 text-sm shadow-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => onMagicColor(prompt, selection)}
                  disabled={isMagicColoring || !prompt.trim()}
                  className="flex-[2] bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 rounded-[24px] py-5 font-bold flex items-center justify-center gap-3 hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 shadow-[0_12px_24px_-8px_rgba(234,179,8,0.5)] active:scale-95 text-sm"
                >
                  {isMagicColoring ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      جاري إلقاء السحر...
                    </>
                  ) : (
                    <>
                      <Wand2 size={24} />
                      تلوين سحري الآن
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
