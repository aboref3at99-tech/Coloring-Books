import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { generateColoringImage, editColoringImage, generateBookScenes, BookScene, generateVideoFromImage, suggestColorPalette, translateToArabic } from './services/geminiService';
import { ChatBot } from './components/ChatBot';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, getDocFromServer, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Page, SavedBook, ImageSize, Selection } from './types';
import { ApiError, parseApiError } from './services/geminiService';
import { ApiErrorModal } from './components/modals/ApiErrorModal';

// Components
import { Header } from './components/Header';
import { BookControls } from './components/BookControls';
import { BookPreview } from './components/BookPreview';
import { ErrorBoundary } from './components/ErrorBoundary';

// Modals
import { SettingsModal } from './components/modals/SettingsModal';
import { ApiKeyModal } from './components/modals/ApiKeyModal';
import { VideoModal } from './components/modals/VideoModal';
import { HistoryModal } from './components/modals/HistoryModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { MagicEditModal } from './components/modals/MagicEditModal';
import { QuickPreviewModal } from './components/modals/QuickPreviewModal';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: (auth.currentUser as any)?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { CommunityGallery } from './components/CommunityGallery';
import { AvatarUpload } from './components/AvatarUpload';
import { ColoringCanvas } from './components/ColoringCanvas';

export default function App() {
  const [theme, setTheme] = useState('');
  const [childName, setChildName] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize>("1K");
  const [quality, setQuality] = useState<'standard' | 'high'>('standard');
  const [pageCount, setPageCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pages, setPages] = useState<Page[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [selection, setSelection] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isAnimating, setIsAnimating] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [palettes, setPalettes] = useState<Record<number, { name: string, hex: string, reason: string }[]>>({});
  const [loadingPalette, setLoadingPalette] = useState<number | null>(null);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isBilingual, setIsBilingual] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isColoring, setIsColoring] = useState<number | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [publicBooks, setPublicBooks] = useState<SavedBook[]>([]);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);

  const handleApiError = (err: any, retryAction?: () => void) => {
    const parsed = err instanceof ApiError ? err : parseApiError(err);
    setApiError(parsed);
    if (retryAction) setLastAction(() => retryAction);
    console.error("API Error:", parsed);
  };

  const [kimiApiKey, setKimiApiKey] = useState(localStorage.getItem('KIMI_API_KEY') || '');
  const [useKimi, setUseKimi] = useState(localStorage.getItem('USE_KIMI') === 'true');

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (childName && /[a-zA-Z]/.test(childName)) {
        try {
          setIsTranslating(true);
          const translated = await translateToArabic(childName);
          if (translated && translated !== childName) setChildName(translated);
        } catch (err) {
          handleApiError(err, () => {
            // No-op or retry if needed, but translation is usually non-critical
          });
        } finally {
          setIsTranslating(false);
        }
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [childName]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (theme && /[a-zA-Z]/.test(theme)) {
        try {
          setIsTranslating(true);
          const translated = await translateToArabic(theme);
          if (translated && translated !== theme) setTheme(translated);
        } catch (err) {
          handleApiError(err, () => {
            // Translation is non-critical
          });
        } finally {
          setIsTranslating(false);
        }
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchSavedBooks(user.uid);
      }
    });
    fetchPublicBooks();
    return () => unsubscribe();
  }, []);

  const fetchPublicBooks = async () => {
    const path = 'books';
    try {
      const q = query(
        collection(db, path),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const books: SavedBook[] = [];
      querySnapshot.forEach((doc) => {
        books.push({ id: doc.id, ...doc.data() } as SavedBook);
      });
      setPublicBooks(books);
    } catch (err) {
      console.error("Error fetching public books:", err);
    }
  };

  const fetchSavedBooks = async (uid: string) => {
    const path = 'books';
    try {
      const q = query(
        collection(db, path),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const books: SavedBook[] = [];
      querySnapshot.forEach((doc) => {
        books.push({ id: doc.id, ...doc.data() } as SavedBook);
      });
      setSavedBooks(books);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  };

  const fetchBookPages = async (bookId: string): Promise<Page[]> => {
    const path = `books/${bookId}/pages`;
    try {
      const q = query(collection(db, path), orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const pages: Page[] = [];
      querySnapshot.forEach((doc) => {
        pages.push(doc.data() as Page);
      });
      return pages;
    } catch (err) {
      console.error("Error fetching book pages:", err);
      return [];
    }
  };

  const handleLoadBook = async (book: SavedBook) => {
    setIsGenerating(true);
    const pages = await fetchBookPages(book.id);
    setPages(pages);
    setTheme(book.theme);
    setChildName(book.childName);
    setCurrentBookId(book.id);
    setAvatarUrl(book.avatarUrl || null);
    setIsGenerating(false);
    setShowHistory(false);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!user) return;
    const path = 'books';
    try {
      await deleteDoc(doc(db, path, bookId));
      fetchSavedBooks(user.uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleViewPublicBook = async (book: SavedBook) => {
    setIsGenerating(true);
    const pages = await fetchBookPages(book.id);
    setPages(pages);
    setTheme(book.theme);
    setChildName(book.childName);
    setAvatarUrl(book.avatarUrl || null);
    setCurrentBookId(null);
    setIsGenerating(false);
    setShowGallery(false);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setPages([]);
      setSavedBooks([]);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSaveClick = () => {
    if (currentBookId) {
      setShowSaveConfirm(true);
    } else {
      saveBook(pages);
    }
  };

  const confirmSave = () => {
    setShowSaveConfirm(false);
    saveBook(pages);
  };

  const resizeImage = (base64Str: string, maxWidth: number, maxHeight: number, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64Str); // Fallback to original if error
    });
  };

  const saveBook = async (pagesToSave: Page[]) => {
    if (!user) return;
    const path = 'books';
    setIsSaving(true);
    try {
      const { writeBatch } = await import('firebase/firestore');
      
      let bookId = currentBookId;
      
      // Resize large images to stay under Firestore 1MB limit
      const resizedAvatar = avatarUrl ? await resizeImage(avatarUrl, 512, 512) : null;
      const resizedThumbnail = pagesToSave[0]?.imageUrl ? await resizeImage(pagesToSave[0].imageUrl, 400, 400) : null;

      if (bookId) {
        // Update existing book metadata
        const bookData = {
          userId: user.uid,
          theme,
          childName,
          isPublic: true,
          avatarUrl: resizedAvatar,
          thumbnailUrl: resizedThumbnail
        };
        const bookRef = doc(db, path, bookId);
        await setDoc(bookRef, bookData, { merge: true });
      } else {
        // Create new book metadata
        const bookData = {
          userId: user.uid,
          theme,
          childName,
          createdAt: Timestamp.now(),
          isPublic: true,
          avatarUrl: resizedAvatar,
          thumbnailUrl: resizedThumbnail
        };
        const docRef = await addDoc(collection(db, path), bookData);
        bookId = docRef.id;
        setCurrentBookId(bookId);
      }

      // Save pages in subcollection using a batch
      const batch = writeBatch(db);
      const pagesCollection = collection(db, path, bookId, 'pages');
      
      for (let index = 0; index < pagesToSave.length; index++) {
        const page = pagesToSave[index];
        const pageRef = doc(pagesCollection, index.toString());
        
        // Ensure page image is also under 1MB by converting to JPEG if needed
        const optimizedPageImage = await resizeImage(page.imageUrl, 1024, 1024, 0.9);
        
        batch.set(pageRef, {
          ...page,
          imageUrl: optimizedPageImage,
          order: index
        });
      }

      await batch.commit();
      fetchSavedBooks(user.uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    const checkApiKey = async () => {
      if (typeof window.aistudio !== 'undefined') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setShowApiKeyModal(true);
        }
      }
    };
    checkApiKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if (typeof window.aistudio !== 'undefined') {
      await window.aistudio.openSelectKey();
      setShowApiKeyModal(false);
    }
  };

  const handleGenerateClick = (retryStandard = false) => {
    if (currentBookId && pages.length > 0) {
      setShowGenerateConfirm(true);
    } else {
      generateBook(retryStandard);
    }
  };

  const confirmGenerate = () => {
    setShowGenerateConfirm(false);
    generateBook();
  };

  const saveKimiSettings = (key: string, enabled: boolean) => {
    setKimiApiKey(key);
    setUseKimi(enabled);
    localStorage.setItem('KIMI_API_KEY', key);
    localStorage.setItem('USE_KIMI', enabled.toString());
    setShowSettings(false);
  };

  const generateBook = async (forceStandard = false) => {
    if (!theme || !childName) return;
    
    setIsGenerating(true);
    setPages([]);
    setCurrentCarouselIndex(0);
    setProgress(0);
    setError(null);

    const currentQuality = forceStandard ? 'standard' : quality;

    try {
      // First, generate the scenes (prompts and captions)
      const scenes = await generateBookScenes(theme, pageCount, isThinking, useKimi ? kimiApiKey : undefined, isBilingual, childName);
      
      const newPages: Page[] = [];
      
      for (let i = 0; i < scenes.length; i++) {
        // Add a small delay between pages to avoid hitting RPM limits on free tier
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        try {
          const imageUrl = await generateColoringImage({
            prompt: scenes[i].imagePrompt,
            imageSize: imageSize,
            model: currentQuality === 'standard' ? 'gemini-2.5-flash-image' : 'gemini-3.1-flash-image-preview',
            avatarUrl: avatarUrl || undefined
          });
          newPages.push({
            imageUrl,
            caption: scenes[i].caption,
            captionEn: scenes[i].captionEn
          });
          setPages([...newPages]);
          setCurrentCarouselIndex(i);
          setProgress(((i + 1) / scenes.length) * 100);
        } catch (innerErr: any) {
          console.error(`Page ${i+1} generation error:`, innerErr);
          throw innerErr;
        }
      }
      if (user) {
        saveBook(newPages);
      }
    } catch (err: any) {
      handleApiError(err, () => generateBook(forceStandard));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditPage = async () => {
    if (editingIndex === null || !editPrompt.trim()) return;

    setIsEditing(true);
    setError(null);
    try {
      const editedUrl = await editColoringImage(pages[editingIndex].imageUrl, editPrompt, selection, isThinking, avatarUrl || undefined);
      const newPages = [...pages];
      newPages[editingIndex] = { ...newPages[editingIndex], imageUrl: editedUrl };
      setPages(newPages);
      setEditingIndex(null);
      setEditPrompt('');
      setSelection(null);
    } catch (err: any) {
      handleApiError(err, handleEditPage);
    } finally {
      setIsEditing(false);
    }
  };

  const generatePdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Cover Page (Coloring Page)
    if (pages.length > 0) {
      const coverPage = pages[0];
      doc.addImage(coverPage.imageUrl, 'PNG', 20, 40, pageWidth - 40, pageWidth - 40);
      
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(36);
      doc.text(coverPage.caption, pageWidth / 2, 30, { align: 'center' });
      
      if (coverPage.captionEn) {
        doc.setFontSize(18);
        doc.text(coverPage.captionEn, pageWidth / 2, 220, { align: 'center' });
      }
    } else {
      // Fallback if no pages
      doc.setFillColor(245, 245, 240);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(40);
      doc.text("كتاب التلوين الخاص بي", pageWidth / 2, 60, { align: 'center' });
      doc.setFontSize(24);
      doc.text(`تم إنشاؤه لـ ${childName}`, pageWidth / 2, 80, { align: 'center' });
    }

    // Add a simple border to cover
    doc.setLineWidth(1);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Coloring Pages (Skip the first one as it's the cover)
    pages.slice(1).forEach((page, index) => {
      doc.addPage();
      // Calculate dimensions to fit A4 while maintaining aspect ratio (1:1 from Gemini)
      const margin = 20;
      const imgSize = pageWidth - (margin * 2);
      const x = margin;
      const y = 30; // Start higher to leave room for caption
      
      doc.addImage(page.imageUrl, 'PNG', x, y, imgSize, imgSize);
      
      // Caption
      doc.setFontSize(16);
      doc.setFont("helvetica", "italic");
      doc.text(page.caption, pageWidth / 2, y + imgSize + 15, { align: 'center', maxWidth: pageWidth - 40 });

      // Page number
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`صفحة ${index + 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    });

    return doc;
  };

  const downloadPdf = () => {
    const doc = generatePdf();
    doc.save(`${childName.replace(/\s+/g, '_')}_Coloring_Book.pdf`);
  };

  const printPdf = () => {
    const doc = generatePdf();
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      iframe.contentWindow?.print();
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
  };

  const handleSelectionMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSelectionStart({ x, y });
    setSelection({ x, y, w: 0, h: 0 });
  };

  const handleSelectionMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting || !selectionStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setSelection({
      x: Math.min(x, selectionStart.x),
      y: Math.min(y, selectionStart.y),
      w: Math.abs(x - selectionStart.x),
      h: Math.abs(y - selectionStart.y),
    });
  };

  const handleSelectionMouseUp = () => {
    setSelectionStart(null);
    if (selection && (selection.w < 1 || selection.h < 1)) {
      setSelection(null);
    }
  };

  const handleCloseModal = () => {
    if (!isEditing) {
      setEditingIndex(null);
      setSelection(null);
      setIsSelecting(false);
    }
  };

  const reset = () => {
    setPages([]);
    setProgress(0);
    setTheme('');
    setChildName('');
    setError(null);
    setSelection(null);
    setIsSelecting(false);
    setVideoUrl(null);
    setPalettes({});
    setCurrentBookId(null);
    setIsThinking(false);
  };

  const handleAnimate = async (index: number) => {
    if (isAnimating !== null) return;
    
    // Check for API key selection for Veo
    if (typeof window.aistudio !== 'undefined') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setShowApiKeyModal(true);
        return;
      }
    }

    setIsAnimating(index);
    setVideoUrl(null);
    try {
      const url = await generateVideoFromImage(pages[index].imageUrl, `A coloring book page of ${pages[index].caption} coming to life with vibrant colors and movement.`);
      setVideoUrl(url);
    } catch (err: any) {
      handleApiError(err, () => handleAnimate(index));
    } finally {
      setIsAnimating(null);
    }
  };

  const handleSuggestColors = async (index: number) => {
    if (loadingPalette !== null) return;
    setLoadingPalette(index);
    try {
      const palette = await suggestColorPalette(pages[index].caption, theme, useKimi ? kimiApiKey : undefined);
      setPalettes(prev => ({ ...prev, [index]: palette }));
    } catch (err: any) {
      handleApiError(err, () => handleSuggestColors(index));
    } finally {
      setLoadingPalette(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-arabic selection:bg-pink-100 selection:text-pink-900 relative overflow-hidden" dir="rtl">
      {/* 3D Background & Character Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Character Floating Elements */}
        <div className="absolute top-[15%] left-[2%] w-40 h-40 floating opacity-40 hover:opacity-100 transition-opacity">
          <img 
            src="https://picsum.photos/seed/rapunzel-disney/400/400" 
            alt="Rapunzel" 
            className="w-full h-full object-contain rounded-full border-4 border-pink-200/50 shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute bottom-[20%] left-[5%] w-32 h-32 floating-delayed opacity-30 hover:opacity-100 transition-opacity">
          <img 
            src="https://picsum.photos/seed/mickey-mouse/400/400" 
            alt="Mickey" 
            className="w-full h-full object-contain rounded-full border-4 border-blue-200/50 shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute top-[10%] right-[2%] w-36 h-36 floating-fast opacity-40 hover:opacity-100 transition-opacity">
          <img 
            src="https://picsum.photos/seed/minnie-mouse/400/400" 
            alt="Minnie" 
            className="w-full h-full object-contain rounded-full border-4 border-red-200/50 shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* 3D Background Elements */}
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-pink-200/20 rounded-full blur-3xl floating" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-blue-200/20 rounded-full blur-3xl floating-delayed" />
        <div className="absolute top-[40%] right-[15%] w-48 h-48 bg-amber-200/20 rounded-full blur-3xl floating-fast" />
        
        {/* Decorative 3D-like shapes */}
        <div className="absolute top-20 left-1/4 w-12 h-12 bg-pink-400/10 rounded-xl rotate-12 floating" />
        <div className="absolute bottom-40 right-1/4 w-16 h-16 bg-blue-400/10 rounded-full floating-delayed" />
        <div className="absolute top-1/2 left-10 w-8 h-8 bg-amber-400/10 rounded-lg -rotate-12 floating-fast" />
        
        {/* Extra Disney Magic Elements */}
        <div className="absolute top-[30%] left-[80%] w-20 h-20 bg-gradient-to-br from-yellow-200 to-amber-400 opacity-20 blur-2xl floating" />
        <div className="absolute top-[70%] left-[15%] w-24 h-24 bg-gradient-to-br from-pink-200 to-red-400 opacity-20 blur-2xl floating-delayed" />
        <div className="absolute top-[20%] left-[40%] w-16 h-16 bg-gradient-to-br from-blue-200 to-indigo-400 opacity-20 blur-2xl floating-fast" />
      </div>

      <div className="relative z-10">
        <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onShowHistory={() => setShowHistory(true)}
        onShowSettings={() => setShowSettings(true)}
        onShowQuickPreview={() => setShowQuickPreview(true)}
        onSaveBook={() => saveBook(pages)}
        onReset={reset}
        isSaving={isSaving}
        hasPages={pages.length > 0}
        isGenerating={isGenerating}
        currentBookId={currentBookId}
      />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 sticky top-28 space-y-8">
            <BookControls
              childName={childName}
              setChildName={setChildName}
              theme={theme}
              setTheme={setTheme}
              quality={quality}
              setQuality={setQuality}
              imageSize={imageSize}
              setImageSize={setImageSize}
              pageCount={pageCount}
              setPageCount={setPageCount}
              isThinking={isThinking}
              setIsThinking={setIsThinking}
              isBilingual={isBilingual}
              setIsBilingual={setIsBilingual}
              isTranslating={isTranslating}
              isGenerating={isGenerating}
              onGenerate={handleGenerateClick}
              error={error}
              progress={progress}
              pages={pages}
              onDownloadPdf={downloadPdf}
              onPrintPdf={printPdf}
              onSaveClick={handleSaveClick}
              isSaving={isSaving}
              user={user}
              currentBookId={currentBookId}
              onShowAvatarUpload={() => setShowAvatarUpload(true)}
              onShowGallery={() => setShowGallery(true)}
              avatarUrl={avatarUrl}
            />
          </div>

          <div className="lg:col-span-8">
            <BookPreview
              pages={pages}
              isGenerating={isGenerating}
              pageCount={pageCount}
              currentCarouselIndex={currentCarouselIndex}
              setCurrentCarouselIndex={setCurrentCarouselIndex}
              onSuggestColors={() => handleSuggestColors(currentCarouselIndex)}
              loadingPalette={loadingPalette !== null}
              onAnimate={() => handleAnimate(currentCarouselIndex)}
              isAnimating={isAnimating !== null}
              onEditPage={setEditingIndex}
              palettes={palettes}
              setPalettes={setPalettes}
              onStartColoring={(index) => setIsColoring(index)}
            />
          </div>
        </div>
      </main>

      </div>

      <MagicEditModal
        isOpen={editingIndex !== null}
        onClose={handleCloseModal}
        imageUrl={editingIndex !== null ? pages[editingIndex].imageUrl : ''}
        onEdit={handleEditPage}
        isEditing={isEditing}
        editPrompt={editPrompt}
        setEditPrompt={setEditPrompt}
        selection={selection}
        setSelection={setSelection}
        isSelecting={isSelecting}
        setIsSelecting={setIsSelecting}
        isThinking={isThinking}
        setIsThinking={setIsThinking}
      />

      <ApiErrorModal 
        error={apiError} 
        onClose={() => setApiError(null)} 
        onRetry={lastAction || undefined}
        onOpenSettings={() => {
          setApiError(null);
          setShowSettings(true);
        }}
      />

      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onTryStandard={() => {
          setShowApiKeyModal(false);
          generateBook(true);
        }}
        onOpenSelectKey={handleOpenSelectKey}
      />

      <VideoModal
        videoUrl={videoUrl}
        onClose={() => setVideoUrl(null)}
      />

      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        savedBooks={savedBooks}
        onLoadBook={handleLoadBook}
        onDeleteBook={handleDeleteBook}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        kimiApiKey={kimiApiKey}
        setKimiApiKey={setKimiApiKey}
        useKimi={useKimi}
        setUseKimi={setUseKimi}
        onSave={saveKimiSettings}
      />

      <QuickPreviewModal
        isOpen={showQuickPreview}
        onClose={() => setShowQuickPreview(false)}
        pages={pages}
      />

      <ConfirmModal
        isOpen={showGenerateConfirm}
        onClose={() => setShowGenerateConfirm(false)}
        onConfirm={confirmGenerate}
        title="بدء كتاب جديد؟"
        message="لديك كتاب مفتوح حالياً. هل أنت متأكد أنك تريد البدء من جديد؟ سيؤدي هذا إلى مسح الصفحات الحالية واستبدال الكتاب المحفوظ."
        confirmText="نعم، ابدأ من جديد"
        type="danger"
      />

      <ConfirmModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={confirmSave}
        title="تأكيد الحفظ"
        message="هل أنت متأكد أنك تريد حفظ التغييرات؟ سيؤدي هذا إلى استبدال النسخة القديمة من الكتاب في السجل."
        confirmText="نعم، احفظ التغييرات"
        type="warning"
      />

      <CommunityGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        books={publicBooks}
        onViewBook={handleViewPublicBook}
      />

      <AvatarUpload
        isOpen={showAvatarUpload}
        onClose={() => setShowAvatarUpload(false)}
        onAvatarGenerated={(url) => setAvatarUrl(url)}
      />

      {isColoring !== null && (
        <ColoringCanvas
          imageUrl={pages[isColoring].coloredImageUrl || pages[isColoring].imageUrl}
          originalImageUrl={pages[isColoring].imageUrl}
          onSave={async (coloredUrl) => {
            const newPages = [...pages];
            newPages[isColoring] = { ...newPages[isColoring], coloredImageUrl: coloredUrl };
            setPages(newPages);
            setIsColoring(null);
            
            // Automatically save to archive if book exists
            if (currentBookId && user) {
              const path = `books/${currentBookId}/pages`;
              try {
                const pageRef = doc(db, path, isColoring.toString());
                await setDoc(pageRef, { coloredImageUrl: coloredUrl }, { merge: true });
                // Also update the book's updatedAt or similar if needed
                await setDoc(doc(db, 'books', currentBookId), { updatedAt: Timestamp.now() }, { merge: true });
              } catch (err) {
                console.error("Error auto-saving coloring:", err);
              }
            }
          }}
          onClose={() => setIsColoring(null)}
        />
      )}

      <ChatBot kimiKey={useKimi ? kimiApiKey : undefined} />
    </div>
  );
}
