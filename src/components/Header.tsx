import React from 'react';
import { Palette, History, Settings, Download, Loader2, LogOut, User as UserIcon, RotateCcw, LayoutGrid, Camera } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onShowHistory: () => void;
  onShowSettings: () => void;
  onShowQuickPreview: () => void;
  onShowVision: () => void;
  onSaveBook: () => void;
  onReset: () => void;
  isSaving: boolean;
  hasPages: boolean;
  isGenerating: boolean;
  currentBookId: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  onShowHistory,
  onShowSettings,
  onShowQuickPreview,
  onShowVision,
  onSaveBook,
  onReset,
  isSaving,
  hasPages,
  isGenerating,
  currentBookId
}) => {
  return (
    <header className="border-b-4 border-yellow-400/30 bg-white/80 backdrop-blur-xl sticky top-0 z-40 shadow-[0_8px_32px_-8px_rgba(109,40,217,0.1)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={onReset}>
          <div className="bg-gradient-to-br from-yellow-400 via-purple-500 to-pink-500 p-2.5 rounded-2xl shadow-[0_8px_16px_-4px_rgba(109,40,217,0.3)] group-hover:scale-110 transition-transform border-2 border-white/50">
            <Palette className="text-white" size={24} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif font-bold text-purple-900 tracking-tight leading-none">استوديو ريبونزل</h1>
            <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-[0.3em] mt-1">Rapunzel's Magic Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onShowVision}
            className="p-2.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            title="تحليل الصور"
          >
            <Camera size={20} />
            <span className="hidden sm:inline text-xs font-bold">تحليل الصور</span>
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 mr-2">
                <button
                  onClick={onShowHistory}
                  className="p-2.5 text-stone-500 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                  title="كتبي المحفوظة"
                >
                  <History size={20} />
                </button>
                <button
                  onClick={onShowSettings}
                  className="p-2.5 text-stone-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                  title="الإعدادات"
                >
                  <Settings size={20} />
                </button>
                {hasPages && (
                  <>
                    <button
                      onClick={onShowQuickPreview}
                      className="p-2.5 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all shadow-sm hover:shadow-md"
                      title="معاينة سريعة"
                    >
                      <LayoutGrid size={20} />
                    </button>
                    <button
                      onClick={onSaveBook}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-3d text-sm font-bold"
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      {currentBookId ? "حفظ التغييرات" : "حفظ الكتاب"}
                    </button>
                  </>
                )}
              </div>

              <div className="h-10 w-[1px] bg-stone-200 mx-2 hidden md:block" />

              <div className="flex items-center gap-3 pl-1 pr-4 py-1.5 bg-stone-50 rounded-2xl border border-stone-200/60">
                <div className="relative">
                  <img 
                    src={user.photoURL || ''} 
                    alt={user.displayName || ''} 
                    className="w-8 h-8 rounded-xl border border-white shadow-sm" 
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold text-stone-800 leading-none">{user.displayName}</span>
                  <button
                    onClick={onLogout}
                    className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors text-right mt-1"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="bg-emerald-500 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <UserIcon size={18} />
              تسجيل الدخول
            </button>
          )}

          {hasPages && !isGenerating && (
            <button
              onClick={onReset}
              className="p-2.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-all"
              title="البدء من جديد"
            >
              <RotateCcw size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
