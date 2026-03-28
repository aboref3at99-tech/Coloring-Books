import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generateColoringImage, editColoringImage, generateBookScenes, BookScene, generateVideoFromImage, suggestColorPalette, translateToArabic } from './services/geminiService';
import { ChatBot } from './components/ChatBot';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, getDocFromServer, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Page, SavedBook, ImageSize, Selection, AspectRatio } from './types';
import { ApiError, parseApiError } from './services/geminiService';
import { ApiErrorModal } from './components/modals/ApiErrorModal';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

import { VisionModal } from './components/VisionModal';

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
  const [imageSize, setImageSize] = useState<ImageSize>(() => {
    try {
      return (localStorage.getItem('PREF_IMAGE_SIZE') as ImageSize) || "1K";
    } catch {
      return "1K";
    }
  });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => {
    try {
      return (localStorage.getItem('PREF_ASPECT_RATIO') as AspectRatio) || "1:1";
    } catch {
      return "1:1";
    }
  });
  const [quality, setQuality] = useState<'standard' | 'high'>(() => {
    try {
      return (localStorage.getItem('PREF_QUALITY') as 'standard' | 'high') || 'standard';
    } catch {
      return 'standard';
    }
  });
  const [pageCount, setPageCount] = useState(() => {
    try {
      const saved = localStorage.getItem('PREF_PAGE_COUNT');
      return saved ? parseInt(saved) : 5;
    } catch {
      return 5;
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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
  const [isThinking, setIsThinking] = useState(() => {
    try {
      return localStorage.getItem('PREF_THINKING') === 'true';
    } catch {
      return false;
    }
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [isBilingual, setIsBilingual] = useState(() => {
    try {
      return localStorage.getItem('PREF_BILINGUAL') === 'true';
    } catch {
      return false;
    }
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isColoring, setIsColoring] = useState<number | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [publicBooks, setPublicBooks] = useState<SavedBook[]>([]);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showQuickPreview, setShowQuickPreview] = useState(false);
  const [showVision, setShowVision] = useState(false);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [lastAction, setLastAction] = useState<(() => void) | null>(null);
  const [showDraftResumeConfirm, setShowDraftResumeConfirm] = useState(false);

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
        fetchSavedBooks(user.uid).catch(err => {
          console.error("Uncaught error in fetchSavedBooks:", err);
        });
      }
    });
    fetchPublicBooks().catch(err => {
      console.error("Uncaught error in fetchPublicBooks:", err);
    });

    // Load draft from local storage on mount
    try {
      const savedDraft = localStorage.getItem('COLORING_BOOK_DRAFT');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.pages && draft.pages.length > 0) {
          // We found a draft, let's ask the user if they want to resume
          setShowDraftResumeConfirm(true);
        }
      }
    } catch (err) {
      console.error("Error loading draft from local storage:", err);
    }

    return () => unsubscribe();
  }, []);

  // Persist preferences to local storage
  useEffect(() => {
    try {
      localStorage.setItem('PREF_IMAGE_SIZE', imageSize);
      localStorage.setItem('PREF_ASPECT_RATIO', aspectRatio);
      localStorage.setItem('PREF_QUALITY', quality);
      localStorage.setItem('PREF_PAGE_COUNT', pageCount.toString());
      localStorage.setItem('PREF_BILINGUAL', isBilingual.toString());
      localStorage.setItem('PREF_THINKING', isThinking.toString());
    } catch (err) {
      console.warn("Could not save preferences to local storage:", err);
    }
  }, [imageSize, aspectRatio, quality, pageCount, isBilingual, isThinking]);

  // Save draft to local storage whenever relevant state changes
  useEffect(() => {
    if (pages.length > 0 || theme || childName) {
      try {
        const draft = {
          pages,
          theme,
          childName,
          currentBookId,
          avatarUrl,
          isBilingual,
          imageSize,
          aspectRatio,
          quality,
          pageCount,
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem('COLORING_BOOK_DRAFT', JSON.stringify(draft));
      } catch (err) {
        // QuotaExceededError is common with large base64 images
        console.warn("Could not save draft to local storage (likely quota exceeded):", err);
      }
    }
  }, [pages, theme, childName, currentBookId, avatarUrl, isBilingual, imageSize, aspectRatio, quality, pageCount]);

  const resumeDraft = () => {
    const savedDraft = localStorage.getItem('COLORING_BOOK_DRAFT');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setPages(draft.pages || []);
        setTheme(draft.theme || '');
        setChildName(draft.childName || '');
        setCurrentBookId(draft.currentBookId || null);
        setAvatarUrl(draft.avatarUrl || null);
        setIsBilingual(draft.isBilingual || false);
        setImageSize(draft.imageSize || "1K");
        setAspectRatio(draft.aspectRatio || "1:1");
        setQuality(draft.quality || 'standard');
        setPageCount(draft.pageCount || 5);
      } catch (err) {
        console.error("Error resuming draft:", err);
      }
    }
    setShowDraftResumeConfirm(false);
  };

  const clearDraft = () => {
    localStorage.removeItem('COLORING_BOOK_DRAFT');
    setShowDraftResumeConfirm(false);
  };

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
      localStorage.removeItem('COLORING_BOOK_DRAFT');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSaveClick = () => {
    if (currentBookId) {
      setShowSaveConfirm(true);
    } else {
      saveBook(pages).catch(err => {
        console.error("Uncaught error in handleSaveClick:", err);
      });
    }
  };

  const confirmSave = () => {
    setShowSaveConfirm(false);
    saveBook(pages).catch(err => {
      console.error("Uncaught error in confirmSave:", err);
    });
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
    try {
      localStorage.setItem('KIMI_API_KEY', key);
      localStorage.setItem('USE_KIMI', enabled.toString());
    } catch (err) {
      console.warn("Could not save Kimi settings to local storage:", err);
    }
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
            aspectRatio: aspectRatio,
            model: currentQuality === 'standard' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview',
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
        saveBook(newPages).catch(err => {
          console.error("Uncaught error in auto-save after generation:", err);
        });
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

  const generatePdf = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const renderContainer = document.getElementById('pdf-render-container');
      if (!renderContainer) throw new Error("Render container not found");

      // Helper to render a page to canvas and add to PDF
      const addPageToPdf = async (pageData: Page, isFirst: boolean, pageNum?: number) => {
        if (!isFirst) doc.addPage();
        
        // Clear container
        renderContainer.innerHTML = '';
        
        // Create page element
        const pageEl = document.createElement('div');
        pageEl.style.width = '210mm';
        pageEl.style.height = '297mm';
        pageEl.style.padding = '20mm';
        pageEl.style.display = 'flex';
        pageEl.style.flexDirection = 'column';
        pageEl.style.alignItems = 'center';
        pageEl.style.justifyContent = 'center';
        pageEl.style.backgroundColor = 'white';
        pageEl.style.position = 'relative';
        pageEl.style.fontFamily = "'Inter', sans-serif";
        pageEl.dir = 'rtl';

        // Background for cover page
        if (isFirst) {
          pageEl.style.background = 'radial-gradient(circle at 50% 50%, #fff5f8 0%, #ffffff 100%)';
          
          // Disney Magic Studio Branding
          const branding = document.createElement('div');
          branding.style.position = 'absolute';
          branding.style.top = '15mm';
          branding.style.fontSize = '14pt';
          branding.style.fontWeight = 'bold';
          branding.style.color = '#db2777';
          branding.style.fontFamily = "'Fredoka', sans-serif";
          branding.style.letterSpacing = '2px';
          branding.style.textTransform = 'uppercase';
          branding.innerText = '✨ Disney Magic Studio ✨';
          pageEl.appendChild(branding);

          // Theme / Title
          const title = document.createElement('div');
          title.style.marginBottom = '10mm';
          title.style.fontSize = '36pt';
          title.style.fontWeight = '900';
          title.style.textAlign = 'center';
          title.style.color = '#9333ea';
          title.style.width = '170mm';
          title.style.lineHeight = '1.2';
          title.style.fontFamily = "'Cairo', sans-serif";
          title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.1)';
          title.innerText = theme || 'قصة تلوين سحرية';
          pageEl.appendChild(title);

          // Child Name
          const hero = document.createElement('div');
          hero.style.marginBottom = '15mm';
          hero.style.fontSize = '24pt';
          hero.style.fontWeight = 'bold';
          hero.style.color = '#db2777';
          hero.style.fontFamily = "'Cairo', sans-serif";
          hero.innerText = `بطل القصة: ${childName || 'صديقنا الصغير'}`;
          pageEl.appendChild(hero);
        }

        // Image
        const img = document.createElement('img');
        img.src = pageData.coloredImageUrl || pageData.imageUrl;
        img.style.width = isFirst ? '140mm' : '100%';
        img.style.aspectRatio = '1/1';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '16px';
        img.style.border = isFirst ? '4px solid #fdf2f8' : '1px solid #eee';
        img.style.boxShadow = isFirst ? '0 20px 40px rgba(0,0,0,0.1)' : 'none';
        img.crossOrigin = 'anonymous';
        pageEl.appendChild(img);

        // Caption
        if (!isFirst) {
          const caption = document.createElement('div');
          caption.style.marginTop = '10mm';
          caption.style.fontSize = '28pt';
          caption.style.fontWeight = 'bold';
          caption.style.textAlign = 'center';
          caption.style.color = 'white';
          caption.style.width = '170mm';
          caption.style.lineHeight = '1.4';
          caption.style.webkitTextStroke = '1.2px black';
          caption.style.fontFamily = pageEl.dir === 'rtl' ? "'Cairo', sans-serif" : "'Fredoka', sans-serif";
          caption.innerText = pageData.caption;
          pageEl.appendChild(caption);

          if (pageData.captionEn) {
            const captionEn = document.createElement('div');
            captionEn.style.marginTop = '5mm';
            captionEn.style.fontSize = '20pt';
            captionEn.style.fontWeight = 'bold';
            captionEn.style.textAlign = 'center';
            captionEn.style.color = 'white';
            captionEn.style.width = '170mm';
            captionEn.style.lineHeight = '1.3';
            captionEn.style.webkitTextStroke = '0.8px black';
            captionEn.style.fontFamily = "'Fredoka', sans-serif";
            captionEn.innerText = pageData.captionEn;
            pageEl.appendChild(captionEn);
          }
        } else {
          // Footer for cover
          const footer = document.createElement('div');
          footer.style.position = 'absolute';
          footer.style.bottom = '20mm';
          footer.style.fontSize = '12pt';
          footer.style.color = '#999';
          footer.style.fontFamily = "'Cairo', sans-serif";
          footer.innerText = 'صُنع بكل حب في استوديو القصص السحري';
          pageEl.appendChild(footer);
        }

        // Page Number
        if (pageNum !== undefined) {
          const pageNumEl = document.createElement('div');
          pageNumEl.style.position = 'absolute';
          pageNumEl.style.bottom = '10mm';
          pageNumEl.style.left = '0';
          pageNumEl.style.right = '0';
          pageNumEl.style.textAlign = 'center';
          pageNumEl.style.fontSize = '10pt';
          pageNumEl.style.color = '#999';
          pageNumEl.innerText = `صفحة ${pageNum}`;
          pageEl.appendChild(pageNumEl);
        }

        renderContainer.appendChild(pageEl);

        // Wait for image to load
        await new Promise((resolve, reject) => {
          if (img.complete) resolve(null);
          else {
            img.onload = () => resolve(null);
            img.onerror = () => reject(new Error("Failed to load image for PDF"));
          }
          // Timeout after 10s
          setTimeout(() => reject(new Error("Image load timeout")), 10000);
        });

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            // Force standard colors on the cloned document to avoid oklch parsing errors in html2canvas
            // 1. Clean all style tags from problematic modern CSS functions (oklch, color-mix)
            const styleTags = Array.from(clonedDoc.getElementsByTagName('style'));
            styleTags.forEach(tag => {
              try {
                if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('color-mix')) {
                  // Replace oklch(...) and color-mix(...) with safe fallbacks
                  tag.innerHTML = tag.innerHTML
                    .replace(/oklch\([^)]+\)/g, '#000000')
                    .replace(/color-mix\([^)]+\)/g, '#000000');
                }
              } catch (e) {
                console.warn("Failed to clean style tag", e);
              }
            });

            // 2. Remove all link tags that are not fonts to avoid external oklch styles
            const linkTags = Array.from(clonedDoc.getElementsByTagName('link'));
            linkTags.forEach(tag => {
              if (tag.rel === 'stylesheet' && !tag.href.includes('fonts.googleapis.com')) {
                tag.remove();
              }
            });

            // 3. Force clean body and container styles in the clone
            clonedDoc.body.style.backgroundColor = '#ffffff';
            clonedDoc.body.style.color = '#000000';
            clonedDoc.body.style.backgroundImage = 'none';

            const container = clonedDoc.getElementById('pdf-render-container');
            if (container) {
              container.style.opacity = '1';
              container.style.visibility = 'visible';
              container.style.position = 'relative';
              container.style.left = '0';
              container.style.top = '0';
              container.style.zIndex = '1';
            }
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      };

      // Cover Page
      if (pages.length > 0) {
        await addPageToPdf(pages[0], true);
      }

      // Other Pages
      for (let i = 1; i < pages.length; i++) {
        await addPageToPdf(pages[i], false, i);
      }

      return doc;
    } catch (err) {
      console.error("PDF Generation Error:", err);
      throw err;
    }
  };

  const downloadPdf = async () => {
    if (isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      const doc = await generatePdf();
      doc.save(`${(childName || 'Magic').replace(/\s+/g, '_')}_Coloring_Book.pdf`);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const printPdf = async () => {
    if (isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      const doc = await generatePdf();
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
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsGeneratingPdf(false);
    }
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
        onShowVision={() => setShowVision(true)}
        onSaveBook={() => saveBook(pages)}
        onReset={reset}
        isSaving={isSaving}
        hasPages={pages.length > 0}
        isGenerating={isGenerating}
        currentBookId={currentBookId}
      />

      {pages.length === 0 && !isGenerating && (
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-purple-900">
          <div className="absolute inset-0 opacity-40">
            <img 
              src="https://picsum.photos/seed/rapunzel/1920/1080?blur=4" 
              className="w-full h-full object-cover"
              alt="Hero Background"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/60 via-transparent to-purple-900/60" />
          <div className="relative z-10 text-center space-y-8 px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/20 backdrop-blur-md text-yellow-300 rounded-full text-xs font-bold uppercase tracking-[0.2em] border border-yellow-400/30 shadow-lg">
                <Sparkles size={14} />
                سحر ديزني في منزلك
              </div>
              <h2 className="text-6xl md:text-8xl font-serif font-bold text-white leading-tight drop-shadow-2xl">
                استوديو <span className="text-yellow-400">القصص</span> السحري
              </h2>
              <p className="text-xl md:text-2xl text-stone-200 font-medium max-w-2xl mx-auto leading-relaxed">
                حول خيال طفلك لقصص تلوين ممتعة باللهجة المصرية. أنشئ قصصاً مخصصة بلمسة سحرية من الذكاء الاصطناعي.
              </p>
              <div className="flex flex-wrap justify-center gap-6 mt-12">
                <button 
                  onClick={() => document.getElementById('child-name-input')?.focus()}
                  className="px-10 py-5 bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-950 rounded-2xl font-bold text-xl hover:scale-105 transition-all shadow-[0_12px_24px_-8px_rgba(250,204,21,0.5)] border-2 border-white/30"
                >
                  ابدأ مغامرتك الآن
                </button>
                <button 
                  onClick={() => setShowGallery(true)}
                  className="px-10 py-5 bg-white/10 backdrop-blur-xl text-white border-2 border-white/20 rounded-2xl font-bold text-xl hover:bg-white/20 transition-all shadow-xl"
                >
                  تصفح المعرض السحري
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 sticky top-28 space-y-8">
            <div className="bg-white/60 backdrop-blur-2xl rounded-[32px] p-8 shadow-[0_32px_64px_-16px_rgba(109,40,217,0.1)] border-2 border-white/80">
              <BookControls
                childName={childName}
                setChildName={setChildName}
                theme={theme}
                setTheme={setTheme}
                quality={quality}
                setQuality={setQuality}
                imageSize={imageSize}
                setImageSize={setImageSize}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                pageCount={pageCount}
                setPageCount={setPageCount}
                isThinking={isThinking}
                setIsThinking={setIsThinking}
                isBilingual={isBilingual}
                setIsBilingual={setIsBilingual}
                isTranslating={isTranslating}
                isGenerating={isGenerating}
                isGeneratingPdf={isGeneratingPdf}
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
              childName={childName}
              theme={theme}
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
        title="بدء قصة جديدة؟"
        message="لديك قصة مفتوحة حالياً. هل أنت متأكد أنك تريد البدء من جديد؟ سيؤدي هذا إلى مسح الصفحات الحالية واستبدال القصة المحفوظة."
        confirmText="نعم، ابدأ قصة جديدة"
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

      <ConfirmModal
        isOpen={showDraftResumeConfirm}
        onClose={clearDraft}
        onConfirm={resumeDraft}
        title="استئناف القصة؟"
        message="وجدنا مسودة لقصة تلوين كنت تعمل عليها سابقاً. هل تود استئناف العمل عليها أم البدء من جديد؟"
        confirmText="استئناف القصة"
        cancelText="البدء من جديد"
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

      <VisionModal isOpen={showVision} onClose={() => setShowVision(false)} />
      <ChatBot kimiKey={useKimi ? kimiApiKey : undefined} />
      
      {/* Hidden container for PDF rendering to support Arabic fonts via html2canvas */}
      <div 
        id="pdf-render-container" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          opacity: 0, 
          pointerEvents: 'none', 
          zIndex: -100, 
          width: '210mm', 
          backgroundColor: '#ffffff' 
        }} 
      />
    </div>
  );
}
