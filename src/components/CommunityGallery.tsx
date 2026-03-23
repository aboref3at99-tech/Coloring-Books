import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, User, Calendar, BookOpen, Heart } from 'lucide-react';
import { SavedBook } from '../types';

interface CommunityGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  books: SavedBook[];
  onViewBook: (book: SavedBook) => void;
}

export const CommunityGallery: React.FC<CommunityGalleryProps> = ({
  isOpen,
  onClose,
  books,
  onViewBook
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-[#f5f5f0] rounded-[40px] p-8 max-w-5xl w-full h-[85vh] shadow-2xl overflow-hidden flex flex-col"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-emerald-100 p-3 rounded-2xl">
                <Globe className="text-emerald-600" size={32} />
              </div>
              <div>
                <h3 className="text-3xl font-serif font-medium">معرض المبدعين</h3>
                <p className="text-black/40 text-sm">استلهم من إبداعات الأطفال الآخرين حول العالم</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {books.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-black/20 space-y-4">
                  <BookOpen size={64} />
                  <p className="text-xl font-serif">لا توجد كتب عامة بعد. كن أول من يشارك!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {books.map((book) => (
                    <motion.div
                      key={book.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-3xl overflow-hidden border border-black/5 shadow-sm group cursor-pointer"
                      onClick={() => onViewBook(book)}
                    >
                      <div className="aspect-square relative overflow-hidden bg-gray-100">
                        <img 
                          src={book.thumbnailUrl || (book.pages?.[0]?.imageUrl)} 
                          alt={book.theme}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                          <button className="w-full bg-white text-black py-3 rounded-2xl font-bold text-sm shadow-lg">
                            تصفح الكتاب
                          </button>
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif font-medium text-lg truncate flex-1">{book.theme}</h4>
                          <div className="flex items-center gap-1 text-red-500">
                            <Heart size={14} fill="currentColor" />
                            <span className="text-xs font-bold">12</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-black/40 font-medium">
                          <div className="flex items-center gap-1">
                            <User size={12} />
                            <span>{book.childName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{new Date(book.createdAt?.seconds * 1000).toLocaleDateString('ar-EG')}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
