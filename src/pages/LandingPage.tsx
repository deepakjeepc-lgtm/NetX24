import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Printer, Copy, Scan, FileImage, Wifi, FileText, Landmark, FileEdit, 
  ArrowUpRight, Phone, Star, Layers, CreditCard, Ticket, Zap, Smartphone, CheckCircle2, ChevronDown, Download, ShoppingCart,
  Home, BookOpen, LayoutGrid, HelpCircle, Loader2
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useServicesData } from '../context/ServicesDataContext';
import { CheckoutItem } from '../components/CheckoutModal';
import GlobalSearch from '../components/GlobalSearch';
import FooterIndicator from '../components/FooterIndicator';
import { haptic } from '../utils/haptics';

// Lazy loaded heavy components & modals for optimal mobile data load time
const ToolsDashboard = lazy(() => import('../components/ToolsDashboard'));
const IgnouNotesSection = lazy(() => import('../components/IgnouNotesSection'));
const ContactForm = lazy(() => import('../components/ContactForm'));
const CheckoutModal = lazy(() => import('../components/CheckoutModal'));
const ContactModal = lazy(() => import('../components/ContactModal'));
const ComingSoonModal = lazy(() => import('../components/ComingSoonModal'));
const QuickDownloadsModal = lazy(() => import('../components/QuickDownloadsModal'));

export default function LandingPage() {
  const [toolsUsedCount, setToolsUsedCount] = useState<number>(0);
  const { services, loading: servicesLoading } = useServicesData();
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [showIgnouNotes, setShowIgnouNotes] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isQuickDownloadsOpen, setIsQuickDownloadsOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);
  const [isCartRequested, setIsCartRequested] = useState<boolean>(false);
  const [isMobileHeaderVisible, setIsMobileHeaderVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 20) {
        setIsMobileHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsMobileHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsMobileHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleInteraction = (e: Event) => {
      // Don't hide if interacting with the navigation itself
      if (e.target && (e.target as HTMLElement).closest('.floating-nav-container')) {
        setIsNavVisible(true);
        clearTimeout(timeoutId);
        if (window.scrollY >= 100) {
           timeoutId = setTimeout(() => setIsNavVisible(false), 3000);
        }
        return;
      }
      
      if (window.scrollY >= 100) {
        setIsNavVisible(false);
      }
    };

    const handleScroll = () => {
      const atTop = window.scrollY < 100;
      setIsNavVisible(true);
      
      clearTimeout(timeoutId);
      if (!atTop) {
        timeoutId = setTimeout(() => {
          setIsNavVisible(false);
        }, 1500);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });
    window.addEventListener('mousedown', handleInteraction, { passive: true });

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('mousedown', handleInteraction);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    setIsMobileHeaderVisible(true);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeSection, isCartRequested]);

  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRef = doc(db, 'stats', 'toolsUsed');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout fetching data')), 2000)
        );
        const snap = await Promise.race([getDoc(statsRef), timeoutPromise]) as any;
        
        if (snap.exists()) {
          setToolsUsedCount(snap.data().count || 0);
        }
      } catch (e: any) {
        if (e instanceof Error && e.message === 'Timeout fetching data') {
          console.log("Using cached stats (offline)");
        } else if (e?.code === 'permission-denied') {
          console.warn("Firebase permission missing for stats data, defaulting count to 0");
        } else {
          console.warn("Note on stats fetch:", e?.message || e);
        }
      }
    };
    fetchStats();
  }, []);

  const iconMap: Record<string, React.ComponentType<any>> = {
    Printer, Copy, Scan, FileImage, Wifi, FileText, Landmark, FileEdit,
    Layers, CreditCard, Ticket, Zap, Smartphone, HelpCircle, BookOpen, ShoppingCart, Home, LayoutGrid
  };

  const IconComponent = ({ name, ...props }: { name: string, [key: string]: any }) => {
    const Icon = iconMap[name] || HelpCircle;
    return <Icon {...props} />;
  };

  const rateCardServices = [
    { icon: <Printer className="w-5 h-5" strokeWidth={1.5} />, title: "Printing (B&W)", subtitle: "A4 Size", price: "2.5", unit: "/ pg", isDeliverable: true },
    { icon: <Printer className="w-5 h-5" strokeWidth={1.5} />, title: "Printing (Colour)", subtitle: "High Quality", price: "5", unit: "/ pg", isDeliverable: true },
    { icon: <Copy className="w-5 h-5" strokeWidth={1.5} />, title: "Photocopy / Xerox", subtitle: "Black & White", price: "2", unit: "/ pg", isDeliverable: true },
    { icon: <Scan className="w-5 h-5" strokeWidth={1.5} />, title: "Scanning", subtitle: "Document / Photo", price: "10", unit: "/ pg" },
    { icon: <Layers className="w-5 h-5" strokeWidth={1.5} />, title: "Lamination", subtitle: "ID Size", price: "10", unit: "", isDeliverable: true },
    { icon: <Layers className="w-5 h-5" strokeWidth={1.5} />, title: "Lamination", subtitle: "A4 Size", price: "20", unit: "", isDeliverable: true },
    { icon: <FileImage className="w-5 h-5" strokeWidth={1.5} />, title: "Passport Photo", subtitle: "Set of 4-6", price: "20", unit: "", isDeliverable: true },
    { icon: <FileImage className="w-5 h-5" strokeWidth={1.5} />, title: "Photo Print", subtitle: "Postcard Size", price: "15", unit: "", isDeliverable: true },
    { icon: <Wifi className="w-5 h-5" strokeWidth={1.5} />, title: "Internet Browsing", subtitle: "High Speed", price: "20", unit: "/ hr" },
    { icon: <FileEdit className="w-5 h-5" strokeWidth={1.5} />, title: "Resume / CV Making", subtitle: "Custom Design", price: "50–100", unit: "" },
    { icon: <FileText className="w-5 h-5" strokeWidth={1.5} />, title: "PDF Services", subtitle: "Conversion & Editing", price: "20–30", unit: "" },
    { icon: <Landmark className="w-5 h-5" strokeWidth={1.5} />, title: "Jaati Praman Patra", subtitle: "Caste Certificate", price: "50", unit: "", isDeliverable: true },
    { icon: <Landmark className="w-5 h-5" strokeWidth={1.5} />, title: "Avashi Praman Patra", subtitle: "Domicile Certificate", price: "50", unit: "", isDeliverable: true },
    { icon: <Landmark className="w-5 h-5" strokeWidth={1.5} />, title: "Aay Praman Patra", subtitle: "Income Certificate", price: "50", unit: "", isDeliverable: true },
    { icon: <Landmark className="w-5 h-5" strokeWidth={1.5} />, title: "NCL / OBC Certificate", subtitle: "Govt Form", price: "100", unit: "", isDeliverable: true },
    { icon: <CreditCard className="w-5 h-5" strokeWidth={1.5} />, title: "Aadhar Card", subtitle: "Update / Correction", price: "50", unit: "" },
    { icon: <CreditCard className="w-5 h-5" strokeWidth={1.5} />, title: "PAN Card Apply", subtitle: "New / Update", price: "100", unit: "", isDeliverable: true },
    { icon: <FileText className="w-5 h-5" strokeWidth={1.5} />, title: "Exam Form Filling", subtitle: "Online Application", price: "50", unit: "" },
    { icon: <Ticket className="w-5 h-5" strokeWidth={1.5} />, title: "Ticket Booking", subtitle: "Railway/Bus", price: "30", unit: "" },
    { icon: <Zap className="w-5 h-5" strokeWidth={1.5} />, title: "Bijli Bill Payment", subtitle: "Convenience Fee", price: "10", unit: "" },
    { icon: <Smartphone className="w-5 h-5" strokeWidth={1.5} />, title: "Other Bill Payments", subtitle: "Mobile, DTH", price: "5–10", unit: "" },
  ];

  return (
    <div className="relative min-h-screen bg-slate-100 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500/20 w-full">
      
      {/* Mobile Top Header (< md) - Sticky Auto-Hide Strip */}
      <div 
        className={`md:hidden sticky top-0 left-0 right-0 z-[100] bg-slate-100 dark:bg-[#0b0f19] transition-transform duration-300 ease-in-out px-4 py-3.5 flex items-center justify-between text-slate-900 dark:text-white ${
          isMobileHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <button 
          onClick={() => { 
            haptic.selection();
            setActiveSection('home'); 
            setIsCartRequested(false); 
            setIsMobileHeaderVisible(true);
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); 
          }} 
          className="font-display font-black text-2xl text-slate-900 dark:text-white tracking-tight cursor-pointer"
        >
          NetX<span className="text-red-500">24</span>
        </button>

        <div className="flex items-center gap-2.5">
          <GlobalSearch />
          <ThemeToggle />
          <button 
            onClick={() => {
              haptic.light();
              setIsQuickDownloadsOpen(true);
            }}
            className="p-1 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-red-500 transition-colors cursor-pointer"
            title="Quick Downloads"
            aria-label="Quick Downloads"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Floating Navigation (>= md) */}
      <div className={`hidden md:block fixed top-6 left-0 w-full z-[100] px-4 transition-all duration-500 ease-in-out transform floating-nav-container ${
        isNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="w-full max-w-5xl mx-auto pointer-events-auto">
          <div className="bg-white/65 dark:bg-[#121316]/65 backdrop-blur-2xl rounded-full px-6 py-4 flex items-center justify-between shadow-[0_10px_35px_-5px_rgba(0,0,0,0.1),0_0_20px_0_rgba(99,102,241,0.12)] dark:shadow-[0_10px_35px_-5px_rgba(0,0,0,0.7),0_0_25px_0_rgba(239,68,68,0.15)] border border-white/80 dark:border-white/20 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 relative overflow-hidden">
             <div className="flex items-center gap-3">
               <button onClick={() => { haptic.selection(); setActiveSection('home'); setIsCartRequested(false); setIsMobileHeaderVisible(true); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }} className="font-display font-bold text-xl text-[#1C1D20] dark:text-white tracking-tight cursor-pointer">NetX<span className="text-transparent bg-clip-text bg-gradient-to-br from-red-800 to-red-500">24</span></button>
             </div>
             
             <div className="flex items-center justify-start gap-1 bg-slate-900/10 dark:bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-slate-900/10 dark:border-white/10 shadow-inner">
               <button onClick={() => { haptic.selection(); setActiveSection('home'); setIsCartRequested(false); setIsMobileHeaderVisible(true); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }} className={`px-5 py-1.5 rounded-full text-[14px] font-semibold transition-all duration-300 ${activeSection === 'home' && !isCartRequested ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5'}`}>
                 Home
               </button>
               <button onClick={() => { haptic.selection(); setActiveSection('ignou-notes-section'); setShowIgnouNotes(true); setIsCartRequested(false); setIsMobileHeaderVisible(true); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }} className={`px-5 py-1.5 rounded-full text-[14px] font-semibold transition-all duration-300 ${activeSection === 'ignou-notes-section' && !isCartRequested ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5'}`}>
                 IGNOU
               </button>
               <button onClick={() => { haptic.selection(); setActiveSection('tools'); setIsCartRequested(false); setIsMobileHeaderVisible(true); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }} className={`px-5 py-1.5 rounded-full text-[14px] font-semibold transition-all duration-300 ${activeSection === 'tools' && !isCartRequested ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5'}`}>
                 Tools
               </button>
             </div>
             
             <div className="flex items-center gap-4">
               <GlobalSearch />
               <ThemeToggle />
               <button 
                 onClick={() => {
                   haptic.light();
                   setIsQuickDownloadsOpen(true);
                 }}
                 className="p-1 flex items-center justify-center text-slate-800 dark:text-slate-200 hover:text-red-500 transition-colors cursor-pointer"
                 title="Quick Downloads"
                 aria-label="Quick Downloads"
               >
                 <Download className="w-5 h-5" />
               </button>
               <button onClick={() => { haptic.medium(); setIsContactModalOpen(true); }} className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-7 py-3 rounded-full text-[14px] font-bold transition-all shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-0.5 flex items-center gap-2 border border-red-500/50">
                 <Phone className="w-4 h-4" /> Call
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Floating Navigation Bar (< md) */}
      <div className={`md:hidden fixed bottom-5 left-0 right-0 z-[100] px-4 transition-all duration-300 ease-in-out pointer-events-none ${
        isMobileHeaderVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}>
        <div className={`max-w-[290px] mx-auto transition-all duration-300 ${
          isMobileHeaderVisible ? 'pointer-events-auto' : 'pointer-events-none'
        }`}>
          <div className="bg-white/80 dark:bg-[#0f1422]/85 backdrop-blur-2xl border border-slate-200/80 dark:border-white/15 rounded-full px-6 py-3.5 flex items-center justify-between shadow-xl shadow-slate-900/10 dark:shadow-black/70 relative transition-colors duration-300">
            
            {/* 1. Home */}
            <button 
              onClick={() => {
                haptic.selection();
                setActiveSection('home');
                setIsCartRequested(false);
                setIsMobileHeaderVisible(true);
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className={`p-1.5 transition-all duration-300 relative rounded-full flex items-center justify-center cursor-pointer ${
                activeSection === 'home' && !isCartRequested
                  ? 'text-slate-900 dark:text-white opacity-100 scale-110' 
                  : 'text-slate-500 dark:text-slate-400 opacity-40 hover:opacity-80 scale-100'
              }`}
              title="Home"
              aria-label="Home"
            >
              <Home className="w-[28px] h-[28px]" strokeWidth={2.2} />
            </button>

            {/* 2. IGNOU */}
            <button 
              onClick={() => {
                haptic.selection();
                setActiveSection('ignou-notes-section');
                setShowIgnouNotes(true);
                setIsCartRequested(false);
                setIsMobileHeaderVisible(true);
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className={`p-1.5 transition-all duration-300 relative rounded-full flex items-center justify-center cursor-pointer ${
                activeSection === 'ignou-notes-section' && !isCartRequested
                  ? 'text-slate-900 dark:text-white opacity-100 scale-110' 
                  : 'text-slate-500 dark:text-slate-400 opacity-40 hover:opacity-80 scale-100'
              }`}
              title="IGNOU"
              aria-label="IGNOU"
            >
              <BookOpen className="w-[28px] h-[28px]" strokeWidth={2.2} />
            </button>

            {/* 3. Tools */}
            <button 
              onClick={() => {
                haptic.selection();
                setActiveSection('tools');
                setIsCartRequested(false);
                setIsMobileHeaderVisible(true);
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className={`p-1.5 transition-all duration-300 relative rounded-full flex items-center justify-center cursor-pointer ${
                activeSection === 'tools' && !isCartRequested
                  ? 'text-slate-900 dark:text-white opacity-100 scale-110' 
                  : 'text-slate-500 dark:text-slate-400 opacity-40 hover:opacity-80 scale-100'
              }`}
              title="Tools"
              aria-label="Tools"
            >
              <LayoutGrid className="w-[28px] h-[28px]" strokeWidth={2.2} />
            </button>

            {/* 4. My Cart */}
            <button 
              onClick={() => {
                haptic.selection();
                setActiveSection('ignou-notes-section');
                setShowIgnouNotes(true);
                setIsCartRequested(true);
                setIsMobileHeaderVisible(true);
                window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              }}
              className={`p-1.5 transition-all duration-300 relative rounded-full flex items-center justify-center cursor-pointer ${
                isCartRequested
                  ? 'text-slate-900 dark:text-white opacity-100 scale-110' 
                  : 'text-slate-500 dark:text-slate-400 opacity-40 hover:opacity-80 scale-100'
              }`}
              title="My Cart"
              aria-label="My Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-[28px] h-[28px]" strokeWidth={2.2} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-extrabold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-sm animate-pulse">
                    {cartCount}
                  </span>
                )}
              </div>
            </button>

          </div>
        </div>
      </div>

      {activeSection === 'home' && (
      <>
      {/* Hero Section */}
      <div id="home" className="relative w-full min-h-screen flex flex-col overflow-x-hidden">
        {/* Premium Background Orbs (Hidden on mobile to keep status bar and top header crisp) */}
        <div className="hidden sm:block absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
          <div className="absolute top-[10%] right-[-10%] w-[40%] h-[60%] bg-red-500/10 dark:bg-red-500/15 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
          <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-blue-500/10 dark:bg-blue-500/15 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-lighten" />
          
          {/* Subtle grid pattern for texture */}
          <div 
             className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] mix-blend-multiply dark:mix-blend-screen" 
             style={{ backgroundImage: 'linear-gradient(#1C1D20 1px, transparent 1px), linear-gradient(90deg, #1C1D20 1px, transparent 1px)', backgroundSize: '64px 64px' }}
          ></div>
        </div>
        
        {/* Floating Navigation */}
        <div className="hidden"></div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 flex-grow flex flex-col justify-center items-center text-center pb-12 pt-8 md:pt-12">
          <h1 className="text-[2.5rem] md:text-[3.5rem] lg:text-[4.5rem] font-display font-extrabold text-[#1C1D20] dark:text-white leading-[1.05] tracking-tight mb-6">
            <span className="text-[3.5rem] sm:text-[4.5rem] md:text-[6rem] lg:text-[7.5rem] leading-[1.1]">NetX<span className="text-transparent bg-clip-text bg-gradient-to-br from-red-800 to-red-500">24</span></span> <br/> Your All in One Space
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Frustrated with slow or unreliable results? We offer fast, high-quality document and digital services tailored to your needs.
          </p>
        </div>
      </div>

              </>
      )}

      {activeSection === 'services' && (
        <div className="pt-8 sm:pt-12 md:pt-16 pb-16">
        {/* Services Section */}
      <div id="services" className="scroll-mt-16 w-full max-w-full sm:max-w-[95%] 2xl:max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 relative">
        <div className="rounded-2xl sm:rounded-[3rem] p-0 sm:p-[1.5px] bg-transparent sm:bg-gradient-to-br sm:from-indigo-300 sm:via-white sm:to-orange-300 sm:dark:from-indigo-500/50 sm:dark:via-[#121316] sm:dark:to-orange-500/50 shadow-none sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] sm:dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
          <div className="bg-transparent sm:bg-white/90 sm:dark:bg-[#121316]/90 sm:backdrop-blur-3xl rounded-none sm:rounded-[calc(3rem-1.5px)] p-1 sm:p-8 md:p-12 lg:p-16 relative overflow-hidden">
            <div className="hidden sm:block absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[calc(3rem-1.5px)] z-0">
              <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[150px] mix-blend-multiply dark:mix-blend-lighten rounded-full" />
            </div>
            
            <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-12 md:mb-16 relative z-10 px-1">
              <h2 className="text-2xl sm:text-4xl md:text-[3.5rem] font-display font-extrabold text-[#1C1D20] dark:text-white leading-[1.15] md:leading-[1.1] tracking-tight mb-2 sm:mb-4">
                Services & Pricing
              </h2>
              <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Premium quality digital services delivered with speed and precision. Transparent pricing for all your needs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 relative z-10">
              {servicesLoading ? (
                <div className="col-span-full text-center py-12 text-slate-500">
                  Loading services...
                </div>
              ) : services.map((svc, i) => (
              <motion.div 
                  key={svc.id || i} 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.35, delay: i * 0.03 }}
                  className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-200/70 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800/90 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group flex items-center gap-2.5 sm:gap-4 relative overflow-hidden shadow-xs"
              >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 blur-2xl rounded-full group-hover:scale-150 transition-transform duration-700 z-0" />
                  
                  <div className="w-9 h-9 sm:w-12 sm:h-12 shrink-0 rounded-lg sm:rounded-xl bg-indigo-50/70 dark:bg-indigo-900/30 border border-indigo-100/80 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white dark:group-hover:text-white transition-all duration-300 shadow-xs relative z-10">
                    <IconComponent name={svc.iconName} className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                  </div>
                  
                  <div className="flex-grow min-w-0 relative z-10">
                    <h4 className="font-display font-bold text-[#1C1D20] dark:text-white text-xs sm:text-base leading-snug tracking-tight truncate">{svc.title}</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5 truncate">{svc.subtitle}</p>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 relative z-10 pl-2 sm:pl-3 border-l border-slate-200/60 dark:border-slate-700">
                    <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Price</span>
                    <div className="font-bold text-[#1C1D20] dark:text-white text-sm sm:text-lg flex items-baseline gap-0.5 leading-none">
                      {svc.price !== 'Varies' ? '₹' : ''}{svc.price}
                      <span className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium ml-0.5">{svc.unit}</span>
                    </div>
                  </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      </div>

        </div>
      )}

      <Suspense fallback={
        <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-wider">Loading...</span>
        </div>
      }>
        <AnimatePresence>
          {activeSection === 'ignou-notes-section' && showIgnouNotes && (
            <div className="pt-4 sm:pt-8 md:pt-12 pb-12 min-h-[500px] overflow-hidden">
              <IgnouNotesSection 
                openCart={isCartRequested} 
                onCartCountChange={setCartCount} 
                onCloseCart={() => {
                  setIsCartRequested(false);
                  setIsMobileHeaderVisible(true);
                  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                }}
              />
            </div>
          )}
        </AnimatePresence>

        {activeSection === 'tools' && (
          <div className="pt-4 sm:pt-8 md:pt-12 pb-12">
          {/* Tools Section */}
        <div id="tools" className="scroll-mt-16 w-full max-w-full sm:max-w-[95%] 2xl:max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 relative">
          <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-indigo-50/50 dark:bg-indigo-900/10 blur-3xl -z-10 rounded-full" />
          
          <div className="rounded-2xl sm:rounded-[3rem] p-0 sm:p-[1.5px] bg-transparent sm:bg-gradient-to-br sm:from-indigo-300 sm:via-white sm:to-orange-300 sm:dark:from-indigo-500/50 sm:dark:via-[#121316] sm:dark:to-orange-500/50 shadow-none sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] sm:dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
            <div className="bg-transparent sm:bg-white/90 sm:dark:bg-[#121316]/90 sm:backdrop-blur-3xl rounded-none sm:rounded-[calc(3rem-1.5px)] p-1 sm:p-8 md:p-12 lg:p-16 relative overflow-hidden">
              
              <div className="hidden sm:block absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none rounded-[calc(3rem-1.5px)] z-0">
                <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[150px] mix-blend-multiply dark:mix-blend-lighten rounded-full" />
              </div>

              <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-40 dark:opacity-30 pointer-events-none blur-[120px] bg-gradient-to-br from-indigo-200 via-transparent to-transparent rounded-full -translate-y-1/2"></div>

             <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 sm:mb-12 md:mb-16 relative z-10 gap-3 sm:gap-6 md:gap-8 px-1 sm:px-0">
               <div className="max-w-xl">
                 <h2 className="text-3xl sm:text-4xl md:text-[4rem] font-display font-extrabold text-[#1C1D20] dark:text-white leading-[1.15] md:leading-[1.1] tracking-tight mb-2 md:mb-4">
                   Local Tools
                 </h2>
                 <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                   Process your files securely on your own device. No uploads, complete privacy.
                 </p>
               </div>
               {toolsUsedCount > 0 && (
                  <div className="flex items-center gap-3 md:flex-col md:items-end bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 sm:px-6 sm:py-4 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-700">
                     <div className="text-xl sm:text-3xl md:text-4xl font-display font-extrabold text-[#1C1D20] dark:text-white">{toolsUsedCount}</div>
                     <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Files Processed</div>
                  </div>
               )}
             </div>

             <ToolsDashboard setToolsUsedCount={setToolsUsedCount} />
            </div>
          </div>
        </div>

          </div>
        )}

        {activeSection === 'home' && (
          <>
        {/* Contact Section */}
        <div id="contact" className="scroll-mt-16 w-full max-w-full sm:max-w-[95%] 2xl:max-w-[1600px] mx-auto px-2 sm:px-4 md:px-8 mt-12 sm:mt-20 md:mt-28 mb-16 sm:mb-28">
          <div className="bg-[#1C1D20] dark:bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-12 lg:p-16 text-white relative overflow-hidden shadow-2xl grid lg:grid-cols-2 gap-8 lg:gap-16 dark:border dark:border-slate-800">
             <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-gradient-to-br from-indigo-500/10 to-orange-500/10 opacity-50 pointer-events-none -translate-y-1/4"></div>
             
             <div className="relative z-10 h-full flex flex-col justify-center">
               <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight mb-6">
                 Ready to get started?
               </h2>
               <p className="text-base md:text-lg text-slate-400 font-medium leading-relaxed max-w-md">
                 Reach out for bulk printing, specialized document processing, or any query. We are here to help.
               </p>
             </div>
             
             <div className="relative z-10 flex flex-col justify-center"><h3 className="text-[2.5rem] font-display font-bold text-white mb-8 tracking-tight">Send a message</h3><ContactForm /></div>
          </div>
        </div>

          </>
        )}

        <FooterIndicator />
        {/* Footer */}
        <footer className="w-full py-8 text-center text-slate-500 dark:text-slate-400 text-sm font-medium border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
             <p>© {new Date().getFullYear()} NetX24 Cyber Cafe. All rights reserved.</p>
             <a href="/admin" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Admin Panel
             </a>
          </div>
        </footer>

        <CheckoutModal 
          isOpen={isCheckoutOpen} 
          onClose={() => setIsCheckoutOpen(false)} 
          item={checkoutItem} 
        />
        
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
        />
        
        <ComingSoonModal
          isOpen={isComingSoonOpen}
          onClose={() => setIsComingSoonOpen(false)}
        />
        
        <QuickDownloadsModal
          isOpen={isQuickDownloadsOpen}
          onClose={() => setIsQuickDownloadsOpen(false)}
        />
      </Suspense>
    </div>
  );
}
