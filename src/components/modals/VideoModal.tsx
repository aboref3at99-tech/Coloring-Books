import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface VideoModalProps {
  videoUrl: string | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ videoUrl, onClose }) => {
  return (
    <AnimatePresence>
      {videoUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white rounded-[40px] p-8 max-w-4xl w-full shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-serif font-medium mb-6">تحريك Veo</h3>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner">
              <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
            </div>
            <p className="mt-6 text-sm text-black/60 italic text-center">
              لقد دبت الحياة في صفحة التلوين الخاصة بك!
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
