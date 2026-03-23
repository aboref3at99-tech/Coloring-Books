import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Upload, Loader2, Search, Wand2 } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';

interface VisionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisionModal: React.FC<VisionModalProps> = ({ isOpen, onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image || isLoading) return;
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeImage(image, prompt || "ماذا يوجد في هذه الصورة؟ وكيف يمكنني تحويلها إلى صفحة تلوين للأطفال؟");
      setAnalysis(result);
    } catch (error) {
      console.error("Vision error:", error);
      setAnalysis("عذراً، حدث خطأ أثناء تحليل الصورة.");
    } finally {
      setIsLoading(false);
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
            className="relative bg-white rounded-[40px] p-8 max-w-2xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
            dir="rtl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 left-6 p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-blue-100 p-3 rounded-2xl">
                <Camera className="text-blue-600" size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-serif font-medium">تحليل الصور بالذكاء الاصطناعي</h3>
                <p className="text-black/40 text-sm">ارفع صورة وسأخبرك كيف نحولها لقصة تلوين</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar px-2">
              <div className="aspect-video bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center relative overflow-hidden group">
                {image ? (
                  <>
                    <img src={image} className="w-full h-full object-contain" alt="Preview" />
                    <button 
                      onClick={() => setImage(null)}
                      className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-3">
                    <Upload size={48} className="text-gray-300" />
                    <span className="text-gray-400 font-medium">اضغط لرفع صورة</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1">ماذا تريد أن تعرف؟</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="مثال: حلل هذه الصورة واقترح قصة تلوين عنها"
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!image || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 size={20} />}
                {isLoading ? 'جاري التحليل...' : 'بدء التحليل'}
              </button>

              {analysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-50 p-6 rounded-3xl border border-blue-100"
                >
                  <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <Search size={18} />
                    نتائج التحليل:
                  </h4>
                  <p className="text-blue-900 text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
