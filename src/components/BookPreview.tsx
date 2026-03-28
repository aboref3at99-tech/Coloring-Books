import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Wand2, Play, Loader2, Palette, Paintbrush, Box, Sparkles } from 'lucide-react';
import { Page } from '../types';

interface BookPreviewProps {
  pages: Page[];
  isGenerating: boolean;
  pageCount: number;
  currentCarouselIndex: number;
  setCurrentCarouselIndex: (index: number | ((prev: number) => number)) => void;
  onSuggestColors: () => void;
  loadingPalette: boolean;
  onAnimate: () => void;
  isAnimating: boolean;
  onEditPage: (index: number) => void;
  palettes: Record<number, { name: string, hex: string, reason: string }[]>;
  setPalettes: React.Dispatch<React.SetStateAction<Record<number, { name: string, hex: string, reason: string }[]>>>;
  onStartColoring: (index: number) => void;
  childName: string;
  theme: string;
}

export const BookPreview: React.FC<BookPreviewProps> = ({
  pages,
  isGenerating,
  pageCount,
  currentCarouselIndex,
  setCurrentCarouselIndex,
  onSuggestColors,
  loadingPalette,
  onAnimate,
  isAnimating,
  onEditPage,
  palettes,
  setPalettes,
  onStartColoring,
  childName,
  theme,
}) => {
  const [is3D, setIs3D] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  if (pages.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-8 flex flex-col items-center justify-center min-h-[600px] bg-white rounded-[48px] border border-stone-100 shadow-2xl shadow-stone-200/40 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.03),transparent_70%)]" />
        
        {/* Decorative Curve */}
        <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none opacity-20">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full fill-none stroke-blue-500 stroke-[2]">
            <path d="M0,80 C300,120 600,20 900,80 L1200,60" />
          </svg>
        </div>
        
        <div className="relative z-10 text-center space-y-6 px-6">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 rounded-[40px] shadow-3d inline-block border border-white"
          >
            <Sparkles className="text-pink-500" size={56} />
          </motion.div>
          
          <div className="space-y-2">
            <h3 className="text-3xl font-serif font-bold text-stone-800">عالم ديزني السحري ينتظرك!</h3>
            <p className="text-stone-500 max-w-sm mx-auto text-lg leading-relaxed">
              أدخل اسم بطلك الصغير واختر قصة لريبونزل أو ميكي لنصنع معاً كتاب تلوين ينبض بالحياة.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center gap-6 text-stone-400 text-sm font-bold uppercase tracking-widest">
            <span className="flex items-center gap-2 text-pink-500">
              <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
              ريبونزل
            </span>
            <span className="flex items-center gap-2 text-blue-500">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              ميكي وميني
            </span>
            <span className="flex items-center gap-2 text-purple-500">
              <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
              سحر ديزني
            </span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-pink-100/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl" />
      </motion.div>
    );
  }

  const currentPage = pages[currentCarouselIndex];

  return (
    <div className="lg:col-span-8 space-y-10">
      {/* Main Carousel Section */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative group perspective-1000"
      >
        <motion.div 
          animate={{ 
            rotateY: is3D ? 15 : mousePos.x * 10,
            rotateX: is3D ? 5 : -mousePos.y * 10,
            scale: is3D ? 1.05 : 1,
            z: is3D ? 50 : 0
          }}
          transition={{ type: "spring", stiffness: 100, damping: 30 }}
          className="aspect-[4/3] bg-white rounded-[48px] shadow-3d overflow-hidden border border-stone-200/60 relative group/card preserve-3d"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCarouselIndex}
              initial={{ opacity: 0, scale: 0.9, x: 50, rotateY: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, scale: 1.1, x: -50, rotateY: -20 }}
              transition={{ type: "spring", stiffness: 120, damping: 25 }}
              className="relative w-full h-full flex items-center justify-center bg-stone-50/30 preserve-3d"
            >
              <motion.div
                whileHover={{ 
                  scale: 1.02,
                  y: -8,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                animate={{ 
                  y: [0, -10, 0],
                  rotateZ: [0, 1, 0],
                }}
                transition={{ 
                  y: {
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  },
                  rotateZ: {
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                style={{ 
                  x: mousePos.x * 30,
                  rotateX: -mousePos.y * 15,
                  rotateY: mousePos.x * 15,
                }}
                className="w-full h-full flex flex-col items-center justify-center p-12 relative cursor-pointer"
              >
                {currentCarouselIndex === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                    <div className="mb-auto mt-4 text-pink-500 font-kids font-bold tracking-widest text-sm uppercase">
                      ✨ Disney Magic Studio ✨
                    </div>
                    <div className="mb-4 text-center px-8">
                      <h2 className="text-4xl font-arabic font-black text-purple-600 leading-tight drop-shadow-md">
                        {theme || 'قصة تلوين سحرية'}
                      </h2>
                      <p className="text-xl font-arabic font-bold text-pink-500 mt-2">
                        بطل القصة: {childName || 'صديقنا الصغير'}
                      </p>
                    </div>
                    <div className="mt-auto mb-4 text-stone-400 font-arabic text-xs">
                      صُنع بكل حب في استوديو القصص السحري
                    </div>
                  </div>
                )}

                <img 
                  src={currentPage.coloredImageUrl || currentPage.imageUrl} 
                  alt={`Page ${currentCarouselIndex + 1}`}
                  className={`object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-500 ${
                    currentCarouselIndex === 0 ? 'w-[60%] opacity-80' : 'w-full h-full'
                  }`}
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              
              {/* Caption Overlay */}
              {currentCarouselIndex !== 0 && (
                <div className="absolute bottom-0 left-0 right-0 p-10 pt-24">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-4"
                  >
                    <p className="text-4xl font-bold coloring-text leading-snug drop-shadow-sm">
                      {currentPage.caption}
                    </p>
                    {currentPage.captionEn && (
                      <p className="text-2xl font-kids font-bold coloring-text italic tracking-wide drop-shadow-sm">
                        {currentPage.captionEn}
                      </p>
                    )}
                  </motion.div>
                </div>
              )}

              {/* Quick Actions Floating Bar */}
              <div className="absolute top-8 right-8 flex flex-col gap-3 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-all duration-300 sm:translate-x-4 sm:group-hover/card:translate-x-0">
                {[
                  { icon: Wand2, color: 'text-pink-500', bg: 'hover:bg-pink-50', onClick: () => onEditPage(currentCarouselIndex), label: 'تعديل سحري' },
                  { icon: Paintbrush, color: 'text-purple-500', bg: 'hover:bg-purple-50', onClick: () => onStartColoring(currentCarouselIndex), label: 'تلوين رقمي' },
                  { icon: Play, color: 'text-blue-500', bg: 'hover:bg-blue-50', onClick: onAnimate, label: 'تحويل لفيديو', loading: isAnimating },
                  { icon: Box, color: 'text-orange-500', bg: is3D ? 'bg-orange-50' : 'hover:bg-orange-50', onClick: () => setIs3D(!is3D), label: 'عرض ثلاثي الأبعاد' },
                ].map((action, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={action.onClick}
                    disabled={action.loading}
                    className={`bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-stone-100 transition-all ${action.color} ${action.bg} disabled:opacity-50 relative group/btn`}
                  >
                    {action.loading ? <Loader2 className="animate-spin" size={22} /> : <action.icon size={22} />}
                    <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-stone-800 text-white text-xs rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Navigation Controls */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 pointer-events-none">
          <motion.button 
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentCarouselIndex(prev => Math.max(0, prev - 1))}
            disabled={currentCarouselIndex === 0}
            className="pointer-events-auto bg-white/90 backdrop-blur-md p-5 rounded-full shadow-2xl border border-stone-100 hover:bg-white transition-all disabled:opacity-0 group/nav"
          >
            <ChevronLeft size={28} className="text-stone-600 group-hover/nav:text-pink-500 transition-colors" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1, x: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentCarouselIndex(prev => Math.min(pages.length - 1, prev + 1))}
            disabled={currentCarouselIndex === pages.length - 1}
            className="pointer-events-auto bg-white/90 backdrop-blur-md p-5 rounded-full shadow-2xl border border-stone-100 hover:bg-white transition-all disabled:opacity-0 group/nav"
          >
            <ChevronRight size={28} className="text-stone-600 group-hover/nav:text-pink-500 transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* Pagination Indicators */}
      <div className="flex justify-center gap-4">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentCarouselIndex(i)}
            className={`group relative h-3 rounded-full transition-all duration-500 ${
              i === currentCarouselIndex ? 'w-12 bg-pink-500' : 'w-3 bg-stone-200 hover:bg-stone-300'
            }`}
          >
            {i === currentCarouselIndex && (
              <motion.div 
                layoutId="activeDot"
                className="absolute inset-0 bg-pink-400 rounded-full blur-sm opacity-50"
              />
            )}
          </button>
        ))}
      </div>

      {/* Color Suggestions Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] p-10 border border-stone-200/60 shadow-xl shadow-stone-100/50 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-bl-[100px] -z-10 opacity-50" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h4 className="text-2xl font-serif font-bold flex items-center gap-3 text-stone-800">
              <div className="p-2 bg-pink-100 rounded-xl">
                <Palette size={24} className="text-pink-600" />
              </div>
              لوحة الألوان السحرية
            </h4>
            <p className="text-stone-500 text-sm font-medium mr-12">اقتراحات ذكية لتلوين هذه الصفحة بشكل إبداعي</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSuggestColors}
            disabled={loadingPalette}
            className="px-6 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-2xl border border-stone-200 transition-all disabled:opacity-50 flex items-center gap-2 font-bold text-sm shadow-sm"
          >
            {loadingPalette ? <Loader2 className="animate-spin text-pink-500" size={18} /> : <Wand2 size={18} className="text-pink-500" />}
            تحديث الاقتراحات
          </motion.button>
        </div>

        {palettes[currentCarouselIndex] ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {palettes[currentCarouselIndex].map((color, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group flex items-center gap-5 p-5 rounded-[28px] bg-stone-50/50 border border-stone-100 hover:border-pink-200 hover:bg-white hover:shadow-lg hover:shadow-pink-500/5 transition-all"
              >
                <div className="relative">
                  <div 
                    className="w-16 h-16 rounded-2xl shadow-inner border border-stone-200 relative z-10"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div 
                    className="absolute inset-0 blur-lg opacity-30 rounded-2xl -z-0"
                    style={{ backgroundColor: color.hex }}
                  />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800 text-lg">{color.name}</span>
                    <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2 py-1 rounded-md uppercase tracking-wider">{color.hex}</span>
                  </div>
                  <p className="text-sm text-stone-500 leading-relaxed font-medium">{color.reason}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-stone-50/30 rounded-[32px] border-2 border-dashed border-stone-200">
            <div className="bg-white p-4 rounded-2xl shadow-sm inline-block mb-4">
              <Palette className="text-stone-300" size={32} />
            </div>
            <p className="text-stone-400 font-medium italic">
              انقر على "تحديث الاقتراحات" للحصول على لوحة ألوان سحرية لهذه الصفحة.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
