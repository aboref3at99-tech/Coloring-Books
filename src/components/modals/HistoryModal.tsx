import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, Trash2, BookOpen } from 'lucide-react';
import { SavedBook } from '../../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedBooks: SavedBook[];
  onLoadBook: (book: SavedBook) => void;
  onDeleteBook: (bookId: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  savedBooks,
  onLoadBook,
  onDeleteBook
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="relative bg-white/90 backdrop-blur-2xl rounded-[48px] p-8 max-w-2xl w-full h-[80vh] shadow-3d border border-white flex flex-col overflow-hidden"
          >
            {/* Background Accents */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" />

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-3 hover:bg-stone-100 rounded-2xl transition-all text-stone-400 hover:text-stone-600 z-20"
            >
              <X size={24} />
            </button>
            <h3 className="relative z-10 text-2xl font-serif font-bold mb-8 flex items-center gap-4 text-stone-800">
              <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-3 rounded-2xl shadow-3d">
                <History className="text-white" size={24} />
              </div>
              <div>
                <span>كتبي المحفوظة</span>
                <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mt-1">My Magic Library</p>
              </div>
            </h3>
            <div className="relative z-10 flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {savedBooks.length === 0 ? (
                <div className="text-center py-24 text-stone-400">
                  <div className="bg-gradient-to-br from-pink-50 to-purple-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <History size={48} className="text-pink-200" />
                  </div>
                  <p className="text-lg font-medium">لا توجد كتب محفوظة بعد.</p>
                  <p className="text-sm mt-2">ابدأ مغامرتك الأولى الآن!</p>
                </div>
              ) : (
                savedBooks.map((book) => (
                  <div key={book.id} className="bg-white/50 backdrop-blur-sm p-6 rounded-[32px] border border-white hover:border-pink-200 transition-all group relative overflow-hidden shadow-sm hover:shadow-md">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50/30 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-xl text-stone-800">{book.theme}</h4>
                        <div className="flex items-center gap-2 text-stone-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                          <p className="text-sm font-medium">للبطل: {book.childName}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onDeleteBook(book.id)}
                          className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100"
                          title="حذف الكتاب"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => onLoadBook(book)}
                          className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:from-pink-700 hover:to-purple-700 transition-all shadow-3d flex items-center gap-2"
                        >
                          <BookOpen size={18} />
                          فتح الكتاب
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                      {book.thumbnailUrl && (
                        <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-sm group-hover:shadow-md transition-shadow">
                          <img src={book.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {book.pages && book.pages.slice(0, 4).map((p, i) => (
                        <div key={i} className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-sm group-hover:shadow-md transition-shadow">
                          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {book.pages && book.pages.length > 4 && (
                        <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-stone-200 flex items-center justify-center text-xs font-bold text-stone-500 border-2 border-white shadow-sm">
                          +{book.pages.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
