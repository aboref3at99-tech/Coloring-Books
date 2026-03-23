import React from 'react';
import { motion } from 'motion/react';
import { Palette } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryStandard: () => void;
  onOpenSelectKey: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onTryStandard,
  onOpenSelectKey
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center"
      >
        <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
          <Palette className="text-pink-600" size={40} />
        </div>
        <h3 className="text-3xl font-serif font-medium mb-4">
          مفتاح <span className="font-sans font-bold">API</span> مطلوب
        </h3>
        <p className="text-black/60 mb-8 leading-relaxed">
          لإنشاء صفحات تلوين عالية الجودة، يجب عليك اختيار مفتاح <span className="font-sans font-bold text-black/80">API</span> من <strong>مشروع Google Cloud مدفوع</strong>.
          المفاتيح المجانية لا تملك صلاحية إنشاء صور عالية الدقة.
        </p>
        <div className="space-y-4">
          <button
            onClick={onTryStandard}
            className="w-full bg-black text-white rounded-2xl py-4 font-bold hover:bg-black/80 transition-all shadow-lg shadow-black/10"
          >
            تجربة الجودة العادية
          </button>
          <button
            onClick={onOpenSelectKey}
            className="w-full bg-pink-500 text-white rounded-2xl py-4 font-bold hover:bg-pink-600 transition-all shadow-lg shadow-pink-500/20"
          >
            اختيار مفتاح <span className="font-sans">API</span> مدفوع
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-sm text-pink-600 font-medium hover:underline"
          >
            تعرف على الفواتير ومفاتيح <span className="font-sans">API</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
};
