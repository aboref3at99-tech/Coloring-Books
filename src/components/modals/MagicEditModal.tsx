import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wand2, Sparkles, Loader2 } from 'lucide-react';
import { Selection } from '../../services/geminiService';

interface MagicEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  editPrompt: string;
  setEditPrompt: (p: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  selection: Selection | null;
  setSelection: (s: Selection | null) => void;
  isSelecting: boolean;
  setIsSelecting: (s: boolean) => void;
  isThinking: boolean;
  setIsThinking: (t: boolean) => void;
}

export const MagicEditModal: React.FC<MagicEditModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  editPrompt,
  setEditPrompt,
  isEditing,
  onEdit,
  selection,
  setSelection,
  isSelecting,
  setIsSelecting,
  isThinking,
  setIsThinking
}) => {
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);

  const handleSelectionMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || isEditing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSelectionStart({ x, y });
    setSelection({ x, y, w: 0, h: 0 });
  };

  const handleSelectionMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !selectionStart || !selection || isEditing) return;
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white/90 backdrop-blur-2xl rounded-[48px] p-8 max-w-lg w-full shadow-3d border border-white overflow-y-auto max-h-[90vh] overflow-hidden"
          >
            {/* Background Accents */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" />

            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-3 hover:bg-stone-100 rounded-2xl text-stone-400 transition-all z-20"
              disabled={isEditing}
            >
              <X size={24} />
            </button>
            
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-3 rounded-2xl shadow-3d">
                  <Wand2 className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-stone-800">التعديل السحري</h3>
                  <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">Disney Magic Editor</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between bg-stone-50/50 p-4 rounded-3xl border border-stone-100 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isThinking ? 'bg-purple-100 text-purple-600' : 'bg-stone-200 text-stone-500'}`}>
                    <Sparkles size={18} className={isThinking ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800">وضع التفكير العميق</p>
                    <p className="text-[10px] text-stone-400 font-medium">استخدام نماذج أكثر ذكاءً للتعديلات المعقدة</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsThinking(!isThinking)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    isThinking ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isThinking ? '-translate-x-6' : '-translate-x-1'
                    }`}
                  />
                </button>
              </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsSelecting(!isSelecting);
                      if (!isSelecting) setSelection(null);
                    }}
                    disabled={isEditing}
                    className={`flex-1 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border flex items-center justify-center gap-2 ${
                      isSelecting 
                        ? 'bg-pink-600 border-pink-600 text-white shadow-md' 
                        : 'bg-white border-black/10 text-black/60 hover:bg-gray-50'
                    }`}
                  >
                    <Wand2 size={16} />
                    {isSelecting ? 'جاري التحديد...' : 'تحديد منطقة'}
                  </button>
                  {selection && (
                    <button
                      onClick={() => setSelection(null)}
                      disabled={isEditing}
                      className="px-4 py-2.5 rounded-2xl text-sm font-bold bg-white border border-black/10 text-black/60 hover:bg-gray-50 transition-all"
                    >
                      إعادة ضبط
                    </button>
                  )}
                </div>

                <div 
                  className={`relative aspect-square w-full max-w-[320px] mx-auto bg-stone-50/50 rounded-[32px] overflow-hidden border-2 transition-all ${
                    isSelecting ? 'border-pink-500 cursor-crosshair ring-4 ring-pink-500/10' : 'border-stone-100'
                  }`}
                  onMouseDown={handleSelectionMouseDown}
                  onMouseMove={handleSelectionMouseMove}
                  onMouseUp={handleSelectionMouseUp}
                  onMouseLeave={handleSelectionMouseUp}
                >
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-contain pointer-events-none select-none p-4" />
                  
                  {/* Selection Overlay */}
                  {selection && (
                    <div 
                      className="absolute border-2 border-pink-500 bg-pink-500/20 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]"
                      style={{
                        left: `${selection.x}%`,
                        top: `${selection.y}%`,
                        width: `${selection.w}%`,
                        height: `${selection.h}%`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-pink-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">
                        المنطقة المستهدفة
                      </div>
                    </div>
                  )}

                {isSelecting && !selection && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                    <p className="text-xs font-bold text-white bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm shadow-lg">
                      انقر واسحب للتحديد
                    </p>
                  </div>
                )}
              </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 px-1">
                    {selection ? "ماذا تريد أن تغير في المنطقة المحددة؟" : "ماذا تريد أن تغير؟"}
                  </label>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="مثال: أضف تاجاً ذهبياً لريبونزل..."
                    className="w-full bg-stone-50/50 border border-stone-100 rounded-3xl px-6 py-5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all min-h-[120px] resize-none text-stone-800 placeholder:text-stone-300 shadow-inner"
                    disabled={isEditing}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={onClose}
                    disabled={isEditing}
                    className="flex-1 bg-stone-100 text-stone-600 rounded-3xl py-5 font-bold hover:bg-stone-200 transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={onEdit}
                    disabled={isEditing || !editPrompt.trim()}
                    className="flex-[2] bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-3xl py-5 font-bold flex items-center justify-center gap-2 hover:from-pink-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-3d active:scale-95 text-xs uppercase tracking-widest"
                  >
                    {isEditing ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        جاري السحر...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        تطبيق التعديل
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
