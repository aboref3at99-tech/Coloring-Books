import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  kimiApiKey: string;
  setKimiApiKey: (key: string) => void;
  useKimi: boolean;
  setUseKimi: (enabled: boolean) => void;
  onSave: (key: string, enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  kimiApiKey,
  setKimiApiKey,
  useKimi,
  setUseKimi,
  onSave
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-serif font-medium flex items-center gap-2">
                <Settings className="text-pink-600" />
                إعدادات API
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="p-6 bg-pink-50 rounded-[32px] border border-pink-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-pink-900">استخدام Kimi API</span>
                  </div>
                  <button
                    onClick={() => setUseKimi(!useKimi)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      useKimi ? 'bg-pink-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        useKimi ? '-translate-x-6' : '-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-pink-800/60 uppercase tracking-widest px-1">
                    مفتاح Kimi API
                  </label>
                  <input
                    type="password"
                    value={kimiApiKey}
                    onChange={(e) => setKimiApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-white border border-pink-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-pink-700/60 leading-relaxed px-1">
                    سيتم استخدام Kimi لتوليد النصوص والمحادثات بدلاً من Gemini عند تفعيل هذا الخيار.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSave(kimiApiKey, useKimi)}
                className="w-full bg-black text-white rounded-2xl py-4 font-bold hover:bg-black/80 transition-all shadow-lg shadow-black/20"
              >
                حفظ الإعدادات
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
