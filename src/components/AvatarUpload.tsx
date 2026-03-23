import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, User, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { generateAvatar } from '../services/geminiService';

interface AvatarUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarGenerated: (avatarUrl: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  isOpen,
  onClose,
  onAvatarGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 5 ميجابايت.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!previewUrl) return;
    setIsGenerating(true);
    setError(null);
    try {
      const avatarUrl = await generateAvatar(previewUrl);
      onAvatarGenerated(avatarUrl);
      onClose();
    } catch (err: any) {
      console.error("Avatar generation error:", err);
      setError("فشل تحويل الصورة إلى شخصية كرتونية. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsGenerating(false);
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
            className="relative bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors"
              disabled={isGenerating}
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 p-2 rounded-xl">
                <User className="text-purple-600" size={24} />
              </div>
              <h3 className="text-2xl font-serif font-medium">شخصية الطفل</h3>
            </div>

            <div className="space-y-6">
              <p className="text-sm text-black/60">ارفع صورة لطفلك وسنقوم بتحويلها إلى شخصية كرتونية تظهر في صفحات الكتاب!</p>
              
              <div 
                className={`aspect-square w-full rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 overflow-hidden relative group ${
                  previewUrl ? 'border-emerald-500 bg-emerald-50' : 'border-black/10 hover:border-black/20 bg-gray-50'
                }`}
                onClick={() => !isGenerating && fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white font-bold text-sm">تغيير الصورة</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-full shadow-sm">
                      <Upload className="text-black/40" size={32} />
                    </div>
                    <p className="text-sm font-bold text-black/40">انقر لرفع صورة</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isGenerating}
                  className="flex-1 bg-gray-100 text-black rounded-2xl py-4 font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !previewUrl}
                  className="flex-[2] bg-black text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 hover:bg-black/80 transition-all disabled:opacity-50 shadow-lg active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      جاري التحويل...
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} />
                      تحويل للشخصية
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
