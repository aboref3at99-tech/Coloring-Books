import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Sparkles, Image as ImageIcon, Palette, Wand2, Loader2, AlertCircle, Download, Printer, Cloud, Globe } from 'lucide-react';
import { User } from 'firebase/auth';
import { ImageSize, Page } from '../types';

interface BookControlsProps {
  childName: string;
  setChildName: (n: string) => void;
  theme: string;
  setTheme: (t: string) => void;
  quality: 'standard' | 'high';
  setQuality: (q: 'standard' | 'high') => void;
  imageSize: ImageSize;
  setImageSize: (s: ImageSize) => void;
  pageCount: number;
  setPageCount: (c: number) => void;
  isThinking: boolean;
  setIsThinking: (t: boolean) => void;
  isBilingual: boolean;
  setIsBilingual: (b: boolean) => void;
  isTranslating: boolean;
  isGenerating: boolean;
  onGenerate: (retryStandard?: boolean) => void;
  error: string | null;
  progress: number;
  pages: Page[];
  onDownloadPdf: () => void;
  onPrintPdf: () => void;
  onSaveClick: () => void;
  isSaving: boolean;
  user: User | null;
  currentBookId: string | null;
  onShowAvatarUpload: () => void;
  onShowGallery: () => void;
  avatarUrl: string | null;
}

export const BookControls: React.FC<BookControlsProps> = ({
  childName,
  setChildName,
  theme,
  setTheme,
  quality,
  setQuality,
  imageSize,
  setImageSize,
  pageCount,
  setPageCount,
  isThinking,
  setIsThinking,
  isBilingual,
  setIsBilingual,
  isTranslating,
  isGenerating,
  onGenerate,
  error,
  progress,
  pages,
  onDownloadPdf,
  onPrintPdf,
  onSaveClick,
  isSaving,
  user,
  currentBookId,
  onShowAvatarUpload,
  onShowGallery,
  avatarUrl
}) => {
  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="flex gap-3">
        <button 
          onClick={onShowGallery}
          className="flex-1 bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
            <Cloud className="text-emerald-600" size={20} />
          </div>
          <span className="text-xs font-bold text-black/60 uppercase tracking-wider">المعرض</span>
        </button>
        <button 
          onClick={onShowAvatarUpload}
          className="flex-1 bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex flex-col items-center justify-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="text-purple-600" size={20} />
            )}
          </div>
          <span className="text-xs font-bold text-black/60 uppercase tracking-wider">البطل</span>
        </button>
      </div>

      <section className="bg-white/80 backdrop-blur-xl p-8 rounded-[40px] shadow-3d border border-white/40 relative overflow-hidden preserve-3d">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif font-bold text-stone-800">استوديو الإبداع</h2>
            {isTranslating && (
              <div className="flex items-center gap-2 px-3 py-1 bg-pink-50 rounded-full text-pink-600 text-[10px] font-bold uppercase tracking-widest animate-pulse shadow-sm">
                <Loader2 className="animate-spin" size={12} />
                ترجمة...
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2 px-1">
                <UserIcon size={12} /> اسم البطل الصغير
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="مثال: ليو الشجاع"
                className="w-full bg-stone-50/50 border border-stone-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all text-stone-800 placeholder:text-stone-300 shadow-inner"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2 px-1">
                <Sparkles size={12} /> عالم المغامرة
              </label>
              <textarea
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="مثال: رحلة إلى كوكب الحلويات الملونة..."
                className="w-full bg-stone-50/50 border border-stone-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all min-h-[120px] resize-none text-stone-800 placeholder:text-stone-300 leading-relaxed shadow-inner"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2 px-1">
                <ImageIcon size={12} /> دقة الرسم
              </label>
              <div className="p-1 bg-stone-50 rounded-2xl border border-stone-100 flex gap-1">
                {(["standard", "high"] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                      quality === q 
                        ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' 
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                    disabled={isGenerating}
                  >
                    {q === 'standard' ? 'قياسي' : 'فائق (AI)'}
                  </button>
                ))}
              </div>
              
              <AnimatePresence>
                {quality === 'high' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-3 gap-2 overflow-hidden"
                  >
                    {(["1K", "2K", "4K"] as ImageSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => setImageSize(size)}
                        className={`py-2 rounded-xl text-[10px] font-black border transition-all ${
                          imageSize === size 
                            ? 'bg-stone-800 border-stone-800 text-white' 
                            : 'bg-white border-stone-100 text-stone-400 hover:bg-stone-50'
                        }`}
                        disabled={isGenerating}
                      >
                        {size}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 flex items-center gap-2">
                  <Palette size={12} /> عدد الصفحات
                </label>
                <span className="text-xl font-serif font-bold text-emerald-600">{pageCount}</span>
              </div>
              <div className="relative h-6 flex items-center">
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={pageCount}
                  onChange={(e) => setPageCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-100 rounded-full appearance-none cursor-pointer accent-emerald-600"
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                onClick={() => setIsThinking(!isThinking)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isThinking 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-stone-50 border-stone-100 text-stone-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Wand2 size={18} className={isThinking ? 'text-emerald-600' : 'text-stone-300'} />
                  <span className="text-xs font-bold uppercase tracking-wider">تفكير عميق</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${isThinking ? 'bg-emerald-600' : 'bg-stone-200'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isThinking ? 'right-4.5' : 'right-0.5'}`} />
                </div>
              </button>

              <button
                onClick={() => setIsBilingual(!isBilingual)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isBilingual 
                    ? 'bg-blue-50 border-blue-200 text-blue-900' 
                    : 'bg-stone-50 border-stone-100 text-stone-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe size={18} className={isBilingual ? 'text-blue-600' : 'text-stone-300'} />
                  <span className="text-xs font-bold uppercase tracking-wider">ثنائي اللغة</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${isBilingual ? 'bg-blue-600' : 'bg-stone-200'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isBilingual ? 'right-4.5' : 'right-0.5'}`} />
                </div>
              </button>
            </div>

            <button
              onClick={() => onGenerate()}
              disabled={isGenerating || !theme || !childName}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-2xl py-5 font-bold flex items-center justify-center gap-3 hover:from-pink-700 hover:to-purple-700 shadow-3d-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed group active:scale-[0.98] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className="uppercase tracking-[0.2em] text-xs relative z-10">جاري الرسم...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} className="group-hover:rotate-12 transition-transform text-pink-200 relative z-10" />
                  <span className="uppercase tracking-[0.2em] text-xs relative z-10">ابدأ المغامرة</span>
                </>
              )}
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-4 text-red-600"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-xs uppercase tracking-wider">تنبيه</p>
                    <p className="text-xs opacity-80 leading-relaxed">{error}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onGenerate(false)}
                    className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                  >
                    إعادة المحاولة
                  </button>
                  {(error.includes("Quota") || error.includes("صلاحيات") || quality === 'high') && (
                    <button
                      onClick={() => onGenerate(true)}
                      className="flex-1 bg-white text-red-600 border border-red-200 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                    >
                      الوضع المجاني
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isGenerating && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">سحر الرسم</span>
              <span className="text-sm font-serif font-bold text-emerald-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-stone-50 h-2 rounded-full overflow-hidden border border-stone-100">
              <motion.div 
                className="bg-emerald-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-4 italic text-center font-medium">
              جاري تخيل الصفحة {pages.length + 1} من {pageCount}...
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {pages.length > 0 && !isGenerating && (
        <div className="grid grid-cols-1 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onDownloadPdf}
            className="w-full bg-emerald-600 text-white rounded-2xl py-5 font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/10 active:scale-[0.98]"
          >
            <Download size={20} />
            <span className="uppercase tracking-[0.2em] text-xs">تحميل PDF</span>
          </motion.button>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={onPrintPdf}
              className="bg-white text-stone-600 border border-stone-100 rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-stone-50 transition-all text-xs uppercase tracking-widest"
            >
              <Printer size={18} />
              طباعة
            </motion.button>
            {user && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={onSaveClick}
                disabled={isSaving}
                className="bg-stone-50 text-stone-600 border border-stone-100 rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:bg-stone-100 transition-all text-xs uppercase tracking-widest"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Cloud size={18} />}
                حفظ
              </motion.button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
