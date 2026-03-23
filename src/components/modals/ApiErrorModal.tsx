import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, RefreshCcw, Settings } from 'lucide-react';
import { ApiError } from '../../services/geminiService';

interface ApiErrorModalProps {
  error: ApiError | null;
  onClose: () => void;
  onRetry?: () => void;
  onOpenSettings?: () => void;
}

export const ApiErrorModal: React.FC<ApiErrorModalProps> = ({
  error,
  onClose,
  onRetry,
  onOpenSettings
}) => {
  if (!error) return null;

  const getIcon = () => {
    switch (error.type) {
      case 'QUOTA': return <RefreshCcw className="text-amber-500 animate-spin-slow" size={40} />;
      case 'PERMISSION': return <Settings className="text-red-500" size={40} />;
      default: return <AlertCircle className="text-red-500" size={40} />;
    }
  };

  return (
    <AnimatePresence>
      {error && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-md" 
            onClick={onClose} 
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-[48px] p-10 max-w-md w-full shadow-2xl text-center border border-stone-200/60"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2.5 hover:bg-stone-100 rounded-2xl transition-all text-stone-400 hover:text-stone-600"
            >
              <X size={22} />
            </button>

            <div className="flex flex-col items-center gap-6 mb-8">
              <div className="bg-stone-50 p-6 rounded-[32px] shadow-inner border border-stone-100">
                {getIcon()}
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-serif font-bold text-stone-800">
                  {error.message}
                </h3>
                <p className="text-stone-500 leading-relaxed font-medium">
                  {error.actionableMessage}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {onRetry && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onRetry}
                  className="w-full bg-pink-500 text-white py-4 rounded-2xl font-bold hover:bg-pink-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-pink-500/20"
                >
                  <RefreshCcw size={20} />
                  إعادة المحاولة
                </motion.button>
              )}
              
              {error.type === 'PERMISSION' && onOpenSettings && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenSettings}
                  className="w-full bg-stone-100 text-stone-800 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all flex items-center justify-center gap-3 border border-stone-200"
                >
                  <Settings size={20} />
                  فتح الإعدادات
                </motion.button>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 text-stone-400 font-bold hover:text-stone-600 transition-colors text-sm"
              >
                إغلاق النافذة
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 pt-6 border-t border-stone-100 text-left">
                <p className="text-[10px] font-mono text-stone-400 break-all bg-stone-50 p-3 rounded-xl border border-stone-100">
                  Debug: {error.originalError?.message || JSON.stringify(error.originalError)}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
