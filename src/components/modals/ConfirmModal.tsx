import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  type?: 'danger' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = 'إلغاء',
  type = 'warning'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white rounded-[40px] p-8 max-md w-full shadow-2xl text-center"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
              type === 'danger' ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <AlertCircle className={type === 'danger' ? 'text-red-600' : 'text-amber-600'} size={32} />
            </div>
            <h3 className="text-2xl font-serif font-medium mb-4">{title}</h3>
            <p className="text-black/60 mb-8 leading-relaxed">
              {message}
            </p>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-black rounded-2xl py-4 font-semibold hover:bg-gray-200 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 text-white rounded-2xl py-4 font-semibold transition-all shadow-lg ${
                  type === 'danger' 
                    ? 'bg-black hover:bg-black/80 shadow-black/20' 
                    : 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/20'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
