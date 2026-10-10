import React, { useState, useRef } from 'react';
import { FileText, ArrowLeft, Check, ShoppingCart, ChevronRight, X, Trash2, Plus, Eye, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, Subject } from '../data/ignouData';
import { useIgnouData } from '../context/IgnouDataContext';
import CheckoutModal, { CheckoutItem } from './CheckoutModal';
import { haptic } from '../utils/haptics';
import { addRecentDownload } from '../utils/recentDownloads';

type NoteType = 'pdf' | 'handwritten';
type CartItem = Subject & { id: string; type: NoteType; price: number };

interface IgnouNotesSectionProps {
  openCart?: boolean;
  onCartCountChange?: (count: number) => void;
  onCloseCart?: () => void;
}

export default function IgnouNotesSection({ openCart, onCartCountChange, onCloseCart }: IgnouNotesSectionProps = {}) {
  const { assignmentsData, projectsData, loading } = useIgnouData();
  const [activeCategory, setActiveCategory] = useState<'assignment' | 'project'>('assignment');
  const ignouData = activeCategory === 'assignment' ? assignmentsData : projectsData;
  const [activeLevelId, setActiveLevelId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeYearName, setActiveYearName] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [cartItems, setCartItems] = useState<{ [id: string]: CartItem }>({});
  
  React.useEffect(() => {
    if (openCart) {
      setIsCartOpen(true);
    }
  }, [openCart]);

  React.useEffect(() => {
    if (onCartCountChange) {
      onCartCountChange(Object.keys(cartItems).length);
    }
  }, [cartItems, onCartCountChange]);
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const cartContainerRef = useRef<HTMLDivElement>(null);

  // Automatically reset scroll to top whenever Cart opens
  React.useEffect(() => {
    if (isCartOpen) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      if (cartContainerRef.current) {
        cartContainerRef.current.scrollTop = 0;
      }
    }
  }, [isCartOpen]);

  // Setup initial level id when data loads
  React.useEffect(() => {
    if (ignouData && ignouData.length > 0 && !activeLevelId) {
      setActiveLevelId(ignouData[0].id);
    }
  }, [ignouData, activeLevelId]);

  React.useEffect(() => {
    if (ignouData && ignouData.length > 0) {
      setActiveLevelId(ignouData[0].id);
      setSelectedCourse(null);
    }
  }, [activeCategory]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12 min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!ignouData || ignouData.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12 min-h-[400px] flex items-center justify-center">
        <p className="text-slate-500">No {activeCategory} data found. Please add data from the admin panel.</p>
      </div>
    );
  }

  const activeLevel = ignouData.find(l => l.id === activeLevelId) || ignouData[0];
  
  const toggleCartItem = (subject: Subject, type: NoteType, price: number) => {
    haptic.medium();
    const id = `${subject.code}-${type}`;
    setCartItems(prev => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { ...subject, id, type, price };
        showToast(`Added ${subject.code} ${type === 'pdf' ? 'PDF' : 'Handwritten'} to cart`);
      }
      return next;
    });
  };

  const addAllForYear = (type: NoteType, price: number) => {
    if (!selectedCourse || !activeYearName) return;
    const yearData = selectedCourse.years.find(y => y.name === activeYearName);
    if (!yearData) return;

    haptic.success();
    setCartItems(prev => {
      const next = { ...prev };
      let addedCount = 0;
      yearData.subjects.forEach(subject => {
        const id = `${subject.code}-${type}`;
        if (!next[id]) {
          next[id] = { ...subject, id, type, price };
          addedCount++;
        }
      });
      
      if (addedCount > 0) {
        showToast(`Added ${addedCount} ${type === 'pdf' ? 'PDF' : 'Handwritten'} notes to cart`);
      }
      
      return next;
    });
  };

  const selectedCount = Object.keys(cartItems).length;
  const totalPrice = Object.values(cartItems).reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    if (selectedCount === 0) return;
    
    // Create a combined item for checkout
    let title = `${selectedCount} IGNOU Notes (${Object.values(cartItems).map(i => i.code).join(', ')})`;
    if (title.length > 50) title = title.substring(0, 47) + '...';
    
    const downloads = Object.values(cartItems).map(i => ({
      name: `${i.code} (${i.type === 'pdf' ? 'PDF' : 'Handwritten'})`,
      url: i.pdfLink || ''
    })).filter(d => d.url !== '');
    
    setCheckoutItem({
      title: title,
      price: totalPrice,
      type: 'IGNOU Notes',
      downloads: downloads.length > 0 ? downloads : undefined
    });
    setIsCheckoutOpen(true);
  };

  const handleCourseSelect = (course: Course | null) => {
    setSelectedCourse(course);
    if (course) {
      setActiveYearName(course.years[0]?.name || '');
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  return (
    <div id="ignou-notes-section" className="scroll-mt-16 w-full max-w-full sm:max-w-[1600px] mx-auto px-2 sm:px-4">
      <div 
        className="rounded-2xl sm:rounded-3xl md:rounded-[3rem] p-0 sm:p-[1.5px] bg-transparent sm:bg-gradient-to-br sm:from-indigo-300 sm:via-white sm:to-orange-300 sm:dark:from-indigo-500/50 sm:dark:via-[#121316] sm:dark:to-orange-500/50 shadow-none sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] sm:dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
      >
        <div className="bg-transparent sm:bg-white/90 sm:dark:bg-[#121316]/90 sm:backdrop-blur-2xl rounded-none sm:rounded-3xl md:rounded-[calc(3rem-1.5px)] p-1 sm:p-6 md:p-12 lg:p-16 relative overflow-hidden min-h-[500px]">
          {/* Decorative Orbs */}
          <div className="hidden sm:block absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[calc(3rem-1.5px)] z-0">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
            <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-orange-500/10 dark:bg-orange-500/15 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
            <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-blue-500/10 dark:bg-blue-500/15 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
          </div>

        {isCartOpen ? (
          <div 
            className="relative z-10 flex flex-col h-full min-h-[500px]"
          >
            <div className="grid grid-cols-[3rem_1fr_3rem] items-center mb-6 sm:mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
              <button 
                onClick={() => {
                  setIsCartOpen(false);
                  if (onCloseCart) onCloseCart();
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-display font-bold text-[#1C1D20] dark:text-white text-center truncate">Your Cart</h3>
              <div />
            </div>
            
            <div className="relative flex-1">
              <div 
                ref={cartContainerRef}
                className="h-full overflow-y-auto max-h-[50vh] hide-scrollbar pb-12 pt-6 rounded-2xl"
                style={{
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 32px, black calc(100% - 32px), transparent)',
                  maskImage: 'linear-gradient(to bottom, transparent, black 32px, black calc(100% - 32px), transparent)'
                }}
              >
                {Object.values(cartItems).map(item => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 mb-3 rounded-2xl hover:bg-white dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-[#1C1D20] dark:text-white text-base sm:text-lg">{item.code}</div>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.type === 'pdf' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'}`}>
                          {item.type === 'pdf' ? 'PDF' : 'HW'}
                        </div>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium line-clamp-1">{item.name}</div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <div className="font-display font-bold text-lg sm:text-xl text-[#1C1D20] dark:text-white whitespace-nowrap">₹{item.price}</div>
                      <button 
                        onClick={() => toggleCartItem(item, item.type, item.price)}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {selectedCount === 0 && (
                  <div className="text-center py-12 px-4 text-slate-500 flex flex-col items-center justify-center relative z-20">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900 shadow-xs">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                    <p className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 mb-1">Your cart is empty</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6 font-medium">Add IGNOU notes or assignments to your cart to proceed with order.</p>
                    <button 
                      onClick={() => {
                        setIsCartOpen(false);
                        if (onCloseCart) onCloseCart();
                        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                      }}
                      className="px-6 py-2.5 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
                    >
                      Browse IGNOU Notes
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-medium text-slate-600 dark:text-slate-400">Total Price</span>
                <span className="text-3xl font-display font-bold text-[#1C1D20] dark:text-white">₹{totalPrice}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={selectedCount === 0}
                className="w-full bg-[#1C1D20] dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold text-lg hover:bg-black dark:hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                Place Order <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : !selectedCourse ? (
          <div 
            className="relative z-10 flex flex-col"
          >
            <div className="flex justify-center mb-6 sm:mb-8 md:mb-12 pt-1 md:pt-4">
              <div className="flex items-center gap-1.5 p-1 sm:p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
                <button
                  onClick={() => setActiveCategory('assignment')}
                  className={`w-[125px] sm:w-[150px] py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all text-center cursor-pointer ${
                    activeCategory === 'assignment'
                      ? 'bg-white dark:bg-slate-900 text-[#1C1D20] dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  Assignment
                </button>
                <button
                  onClick={() => setActiveCategory('project')}
                  className={`w-[125px] sm:w-[150px] py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all text-center cursor-pointer ${
                    activeCategory === 'project'
                      ? 'bg-white dark:bg-slate-900 text-[#1C1D20] dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  Project
                </button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-6 sm:mb-12">
              {ignouData.map(level => (
                <button
                  key={level.id}
                  onClick={() => setActiveLevelId(level.id)}
                  className={`px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full font-bold text-sm sm:text-base transition-all cursor-pointer ${
                    activeLevelId === level.id 
                      ? 'bg-[#1C1D20] dark:bg-white text-white dark:text-slate-900 shadow-md sm:shadow-lg shadow-black/20 dark:shadow-white/10 scale-105 ring-1 ring-slate-900/5 dark:ring-white/10' 
                      : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:-translate-y-0.5'
                  }`}
                >
                  {level.name}
                </button>
              ))}
            </div>

            {activeCategory === 'project' ? (
              <div className="w-full py-16 sm:py-20 text-center flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 dark:text-slate-600 mb-4 opacity-50" />
                <h3 className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">Projects Coming Soon</h3>
                <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400">We are currently preparing high-quality project materials. Check back later!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
              {activeLevel.courses.map((course, index) => (
                <motion.button 
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  onClick={() => handleCourseSelect(course)}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs sm:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-lg dark:hover:shadow-indigo-500/10 hover:bg-white dark:hover:bg-slate-800/90 hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-1 transition-all duration-300 text-left flex flex-col justify-between group relative overflow-hidden active:scale-[0.98] cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 blur-2xl rounded-full group-hover:scale-150 transition-transform " />
                  
                  <div>
                    <div className="w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-50/80 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 sm:mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all ring-1 ring-indigo-500/10 dark:ring-indigo-500/20 shadow-xs relative z-10">
                      <FileText className="w-4.5 h-4.5 sm:w-7 sm:h-7" />
                    </div>
                    
                    <h4 className="font-display font-black text-[#1C1D20] dark:text-white text-lg sm:text-2xl mb-1 relative z-10 tracking-tight leading-snug">{course.name}</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-semibold text-xs sm:text-xs mb-3 sm:mb-6 line-clamp-2 leading-tight sm:leading-relaxed relative z-10">{course.fullName}</p>
                  </div>
                  
                  <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-bold opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all transform translate-y-0 sm:translate-y-2 group-hover:translate-y-0 relative z-10 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <span>Subjects</span> <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </motion.button>
              ))}
            </div>
            )}
          </div>
        ) : (
          <div className="relative z-10 flex flex-col">
            <button 
              onClick={() => handleCourseSelect(null)}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold mb-4 sm:mb-8 w-fit transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" /> Back to Programs
            </button>

            <div className="mb-6 sm:mb-8 pr-4">
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#1C1D20] dark:text-white mb-1 tracking-tight">{selectedCourse.name}</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{selectedCourse.fullName} • All Sessions</p>
            </div>

            {/* Single-row equal-width segmented year selector */}
            <div className="grid grid-flow-col auto-cols-fr gap-1 sm:gap-1.5 mb-5 sm:mb-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs w-full sm:w-fit max-w-full">
              {selectedCourse.years.map(year => (
                <button
                  key={year.name}
                  onClick={() => setActiveYearName(year.name)}
                  className={`py-2.5 sm:py-2.5 px-3 sm:px-6 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all text-center cursor-pointer ${
                    activeYearName === year.name 
                      ? 'bg-white dark:bg-slate-800 text-[#1C1D20] dark:text-white shadow-xs border border-slate-200/50 dark:border-slate-700/50' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {year.name}
                </button>
              ))}
            </div>

            {/* Side-by-side compact batch buttons */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8 w-full">
              <button 
                onClick={() => addAllForYear('pdf', 20)}
                className="bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">All {activeYearName} PDF</span>
              </button>
              <button 
                onClick={() => addAllForYear('handwritten', 200)}
                className="bg-orange-50/80 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60 hover:bg-orange-100 dark:hover:bg-orange-900/50 px-3 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">All {activeYearName} HW</span>
              </button>
            </div>

            {/* Subject cards grid */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 pb-24 md:pb-32">
              {selectedCourse.years.find(y => y.name === activeYearName)?.subjects.map((subject, index) => {
                const pdfId = `${subject.code}-pdf`;
                const hwId = `${subject.code}-handwritten`;
                const hasPdf = !!cartItems[pdfId];
                const hasHw = !!cartItems[hwId];

                return (
                  <motion.div 
                    key={`${subject.code}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                    className={`relative p-3.5 sm:p-5 rounded-2xl border transition-all ${
                      (hasPdf || hasHw) 
                        ? 'border-[#1C1D20] dark:border-white bg-slate-50/90 dark:bg-slate-800/90 shadow-md ring-1 ring-slate-900/5 dark:ring-white/10' 
                        : 'border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-display font-black text-[#1C1D20] dark:text-white text-lg sm:text-xl tracking-tight">{subject.code}</span>
                      <div className="flex gap-1">
                        {hasPdf && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase">PDF</span>}
                        {hasHw && <span className="text-[10px] bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded font-bold uppercase">HW</span>}
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold leading-snug line-clamp-2 min-h-[36px] mb-3">
                      {subject.name}
                    </p>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2 sm:gap-2.5">
                      {/* PDF Option */}
                      <div className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${hasPdf ? 'bg-indigo-50/60 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/60' : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60'}`}>
                         <div>
                           <div className="font-bold text-xs sm:text-sm text-[#1C1D20] dark:text-white">Notes PDF</div>
                           <div className="text-xs sm:text-[11px] font-bold text-indigo-600 dark:text-indigo-300">₹{subject.price || 20}</div>
                         </div>
                         <div className="flex items-center gap-1.5">
                           {subject.demoLink && (
                             <button onClick={(e) => { e.stopPropagation(); addRecentDownload({ title: `${subject.code} Notes Demo`, category: 'IGNOU Notes', url: subject.demoLink }); window.open(subject.demoLink, '_blank'); }} className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer">
                               <Eye className="w-3 h-3" /> Demo
                             </button>
                           )}
                           <button onClick={(e) => { e.stopPropagation(); toggleCartItem(subject, 'pdf', subject.price || 20) }} className={`w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer ${hasPdf ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-600 hover:bg-indigo-50'}`}>
                             {hasPdf ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                           </button>
                         </div>
                      </div>

                      {/* HW Option */}
                      <div className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all ${hasHw ? 'bg-orange-50/60 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800/60' : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60'}`}>
                         <div>
                           <div className="font-bold text-xs sm:text-sm text-[#1C1D20] dark:text-white leading-tight">Handwritten</div>
                           <div className="text-xs sm:text-[11px] font-bold text-orange-600 dark:text-orange-300">₹200</div>
                         </div>
                         <div className="flex items-center gap-1.5">
                           {subject.handwrittenDemoLink && (
                             <button onClick={(e) => { e.stopPropagation(); addRecentDownload({ title: `${subject.code} HW Demo`, category: 'IGNOU Notes', url: subject.handwrittenDemoLink }); window.open(subject.handwrittenDemoLink, '_blank'); }} className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer">
                               <Eye className="w-3 h-3" /> Demo
                             </button>
                           )}
                           <button onClick={(e) => { e.stopPropagation(); toggleCartItem(subject, 'handwritten', 200) }} className={`w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-pointer ${hasHw ? 'bg-orange-600 text-white shadow-xs' : 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 border border-slate-200 dark:border-slate-600 hover:bg-orange-50'}`}>
                             {hasHw ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                           </button>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
        
        </div>
      </div>
      
      {/* Floating Cart Checkout */}
      <AnimatePresence>
        {!isCartOpen && selectedCount > 0 && (
          <div 
            className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-max max-w-[95%] bg-[#1C1D20]/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl sm:rounded-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)] p-2 sm:p-3 pr-2 sm:pr-3 flex items-center justify-between gap-4 sm:gap-8 z-50 border border-white/10"
          >
            <div className="flex items-center gap-3 sm:gap-4 text-white pl-2 sm:pl-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center relative cursor-pointer hover:bg-white/20 transition-colors" onClick={() => setIsCartOpen(true)}>
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs font-bold w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full shadow-md border-2 border-[#1C1D20] dark:border-slate-900">
                  {selectedCount}
                </span>
              </div>
              <div className="cursor-pointer flex flex-col justify-center py-1" onClick={() => setIsCartOpen(true)}>
                <div className="text-[10px] sm:text-xs font-medium text-white/70 leading-tight mb-0.5">{selectedCount} Item{selectedCount > 1 ? 's' : ''}</div>
                <div className="text-sm sm:text-lg font-bold leading-tight">Total: ₹{totalPrice}</div>
              </div>
            </div>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-white dark:bg-indigo-500 text-slate-900 dark:text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-full font-bold text-sm sm:text-base flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-indigo-400 transition-transform active:scale-95 shrink-0 shadow-lg shadow-white/5 cursor-pointer"
            >
              View Cart
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 z-[9999] bg-indigo-600 text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl border border-indigo-500/50"
          >
            <Check className="w-4 h-4 text-white" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => {
          setIsCheckoutOpen(false);
          setCartItems({}); // Clear cart on close/success
          setIsCartOpen(false);
        }} 
        item={checkoutItem} 
      />
    </div>
  );
}
