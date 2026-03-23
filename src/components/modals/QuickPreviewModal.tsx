import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Page } from '../../types';

interface QuickPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: Page[];
}

export const QuickPreviewModal: React.FC<QuickPreviewModalProps> = ({ isOpen, onClose, pages }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <h2 className="text-2xl font-serif font-bold text-stone-800">معاينة سريعة</h2>
              <button
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-stone-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map((page, index) => (
                  <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex flex-col gap-4">
                    <div className="aspect-square rounded-xl overflow-hidden border border-stone-100 bg-stone-50 relative">
                      {page.imageUrl ? (
                        <img
                          src={page.imageUrl}
                          alt={page.caption}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          جاري التوليد...
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-stone-800 text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                        {index + 1}
                      </div>
                    </div>
                    <p className="text-sm text-stone-600 text-center font-medium line-clamp-2" dir="rtl">
                      {page.caption}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
