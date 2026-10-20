import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import {
  CatalogItem,
  getDefaultSelectedFormat,
  getEffectivePrice,
  getPhysicalFormatLabel,
  IGNOU_DEGREE_OPTIONS,
  IGNOU_YEAR_OPTIONS,
  IgnouDegree,
  IgnouMaterialType,
  IgnouYear,
  isBookLikeCategory,
  useCatalog,
} from '../context/CatalogContext';
import { useTheme } from '../context/ThemeContext';
import LekhixLogo from '../components/LekhixLogo';
import ProductImage6x9 from '../components/ProductImage6x9';
import EditorialDetailView from '../components/EditorialDetailView';
import CheckoutModal from '../components/CheckoutModal';
import MyOrdersModal from '../components/MyOrdersModal';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '../context/ToastContext';
import { triggerDemoPdfDownload } from '../utils/ebookDownload';
import { haptic } from '../utils/haptics';

type SortOption = 'default' | 'price-asc' | 'price-desc';

const IGNOU_DEGREES: ('All' | IgnouDegree)[] = [
  'All',
  ...IGNOU_DEGREE_OPTIONS,
];

const IGNOU_YEARS: ('All' | IgnouYear)[] = ['All', ...IGNOU_YEAR_OPTIONS];

const IGNOU_TYPES: ('All' | IgnouMaterialType)[] = [
  'All',
  'Assignment',
  'Project',
];

export default function LandingPage() {
  const {
    catalog,
    categories,
    cartCount,
    isCartOpen,
    setIsCartOpen,
    userOrders,
    isOrdersOpen,
    setIsOrdersOpen,
  } = useCatalog();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [ignouDegreeFilter, setIgnouDegreeFilter] = useState<'All' | IgnouDegree>('All');
  const [ignouYearFilter, setIgnouYearFilter] = useState<'All' | IgnouYear>('All');
  const [ignouProgramFilter, setIgnouProgramFilter] = useState<string>('All');
  const [ignouTypeFilter, setIgnouTypeFilter] = useState<'All' | IgnouMaterialType>('All');
  const [ignouCourseFilter, setIgnouCourseFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);
  const [directBuyItem, setDirectBuyItem] = useState<CatalogItem | null>(null);
  const [directBuyFormat, setDirectBuyFormat] = useState<'physical' | 'ebook'>('physical');

  // Minimal footer inquiry state (saves to Firestore contactSubmissions; zero hardcoded links)
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', message: '' });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Trigger the exact same scroll/composite pass on theme change that opening a product triggers
  useEffect(() => {
    const y = window.scrollY;
    window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
  }, [theme]);

  const featuredItems = useMemo(() => {
    const list = catalog.filter((i) => i.featured);
    return list.length > 0 ? list : catalog.slice(0, 4);
  }, [catalog]);

  const currentHero = featuredItems[heroIndex % Math.max(1, featuredItems.length)] || catalog[0];

  // Auto-advance Hero products every 3 seconds when viewing the Home Screen
  useEffect(() => {
    if (selectedProduct || isCartOpen || isOrdersOpen || featuredItems.length <= 1) return;
    const intervalId = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % featuredItems.length);
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [selectedProduct, isCartOpen, isOrdersOpen, featuredItems.length, heroIndex]);

  // Dynamic IGNOU Programs available under selected Degree (Step 2)
  const availableIgnouPrograms = useMemo(() => {
    const ignouItems = catalog.filter(
      (i) =>
        i.category === 'IGNOU' &&
        (ignouDegreeFilter === 'All' || i.ignouDegree === ignouDegreeFilter)
    );
    const map = new Map<string, string>();
    for (const item of ignouItems) {
      const code = (item.ignouProgramCode || '').trim().toUpperCase();
      if (code && !map.has(code)) {
        map.set(code, (item.ignouProgramName || '').trim());
      }
    }
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [catalog, ignouDegreeFilter]);

  // Dynamic IGNOU Course Codes available under selected Degree + Program + Year (+ Material Type if chosen)
  const availableIgnouCourses = useMemo(() => {
    const ignouItems = catalog.filter(
      (i) =>
        i.category === 'IGNOU' &&
        (ignouDegreeFilter === 'All' || i.ignouDegree === ignouDegreeFilter) &&
        (ignouProgramFilter === 'All' ||
          (i.ignouProgramCode || '').trim().toUpperCase() === ignouProgramFilter) &&
        (ignouYearFilter === 'All' || i.ignouYear === ignouYearFilter) &&
        (ignouTypeFilter === 'All' || i.ignouMaterialType === ignouTypeFilter)
    );
    const set = new Set<string>();
    for (const item of ignouItems) {
      const code = (item.ignouCourseCode || '').trim().toUpperCase();
      if (code) set.add(code);
    }
    return Array.from(set);
  }, [
    catalog,
    ignouDegreeFilter,
    ignouProgramFilter,
    ignouYearFilter,
    ignouTypeFilter,
  ]);

  const filteredProducts = useMemo(() => {
    let base =
      activeCategory === 'All'
        ? catalog
        : catalog.filter((item) => item.category === activeCategory);

    if (activeCategory === 'IGNOU') {
      if (ignouDegreeFilter !== 'All') {
        base = base.filter((item) => item.ignouDegree === ignouDegreeFilter);
      }
      if (ignouProgramFilter !== 'All') {
        base = base.filter(
          (item) =>
            (item.ignouProgramCode || '').trim().toUpperCase() === ignouProgramFilter
        );
      }
      if (ignouYearFilter !== 'All') {
        base = base.filter((item) => item.ignouYear === ignouYearFilter);
      }
      if (ignouCourseFilter !== 'All') {
        base = base.filter(
          (item) =>
            (item.ignouCourseCode || '').trim().toUpperCase() === ignouCourseFilter
        );
      }
      if (ignouTypeFilter !== 'All') {
        base = base.filter((item) => item.ignouMaterialType === ignouTypeFilter);
      }
    }

    if (sortBy === 'price-asc') {
      return [...base].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return [...base].sort((a, b) => b.price - a.price);
    }
    return base;
  }, [
    catalog,
    activeCategory,
    ignouDegreeFilter,
    ignouProgramFilter,
    ignouYearFilter,
    ignouCourseFilter,
    ignouTypeFilter,
    sortBy,
  ]);

  const handleOpenProduct = (item: CatalogItem) => {
    haptic.selection();
    setSelectedProduct(item);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleDirectBuy = (
    item: CatalogItem,
    format?: 'physical' | 'ebook'
  ) => {
    if (item.soldOut) return;
    haptic.medium();
    const resolvedFormat = format || getDefaultSelectedFormat(item);
    setDirectBuyItem(item);
    setDirectBuyFormat(resolvedFormat);
    setIsCartOpen(true);
  };

  const resetIgnouFilters = () => {
    setIgnouDegreeFilter('All');
    setIgnouYearFilter('All');
    setIgnouProgramFilter('All');
    setIgnouTypeFilter('All');
    setIgnouCourseFilter('All');
  };

  const handleCategoryNav = (cat: string) => {
    haptic.selection();
    setActiveCategory(cat);
    if (cat !== 'IGNOU') {
      resetIgnouFilters();
    }
    setSelectedProduct(null);
    const gridEl = document.getElementById('collection-grid');
    if (gridEl && !selectedProduct) {
      gridEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name.trim() || !inquiryForm.phone.trim() || !inquiryForm.message.trim()) {
      return;
    }
    setSubmittingInquiry(true);
    const path = 'contactSubmissions';
    try {
      await addDoc(collection(db, path), {
        name: inquiryForm.name.trim().slice(0, 150),
        phone: inquiryForm.phone.trim().slice(0, 50),
        message: inquiryForm.message.trim().slice(0, 5000),
        timestamp: serverTimestamp(),
      });
      setInquiryForm({ name: '', phone: '', message: '' });
      showToast({
        message: 'Message received. Thank you for writing to LEKHIX.',
        type: 'success',
        duration: 3500,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const formattedSlideIndex = (n: number) => String(n).padStart(2, '0');

  const getHeroEditionTag = (item: CatalogItem) => {
    if (item.soldOut) return 'SOLD OUT · ARCHIVE EDITION';
    if (item.category === 'IGNOU') {
      const fmt = item.bookFormat || 'ebook';
      const physLabel = getPhysicalFormatLabel(item);
      const fmtTag =
        fmt === 'ebook'
          ? 'PDF'
          : fmt === 'physical'
          ? physLabel
          : `${physLabel} + PDF`;
      const parts = [
        'IGNOU',
        item.ignouDegree,
        item.ignouYear,
        item.ignouProgramCode,
        item.ignouMaterialType,
        item.ignouCourseCode,
        fmtTag,
      ].filter(Boolean);
      return parts.join(' · ').toUpperCase();
    }
    if (!isBookLikeCategory(item.category)) return 'STATIONERY · 6 × 9 IN';
    const fmt = item.bookFormat || 'ebook';
    if (fmt === 'ebook') return `${item.category.toUpperCase()} · EBOOK PDF`;
    if (fmt === 'physical') return `${item.category.toUpperCase()} · 6 × 9 IN`;
    return 'HARDCOVER + EBOOK PDF';
  };

  const heroDefaultFormat = currentHero
    ? getDefaultSelectedFormat(currentHero)
    : 'physical';
  const heroDisplayPrice = currentHero
    ? getEffectivePrice(currentHero, heroDefaultFormat)
    : 0;

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#FAFAFA] dark:bg-[#0A0A0C] text-[#111111] dark:text-[#F5F5F7] flex flex-col justify-between">
      {/* Top Bar — Pure Tailwind classes matching EditorialDetailView */}
      <header
        key={`header-${theme}`}
        className="sticky top-0 z-[100] pt-[env(safe-area-inset-top)] bg-[#FAFAFA] dark:bg-[#0A0A0C] border-b border-[#ECECE7] dark:border-[#1E1E24]"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 h-15 sm:h-20 flex items-center justify-between gap-3 sm:gap-6 md:gap-8">
          {/* Zone 1: Framed LEKHIX Brand Mark */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setSelectedProduct(null);
              setActiveCategory('All');
              resetIgnouFilters();
              window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
            }}
            className="cursor-pointer whitespace-nowrap shrink-0 focus:outline-none"
            aria-label="LEKHIX Home"
          >
            <LekhixLogo size="sm" />
          </button>

          {/* Zone 2: Clean Single-Line Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 overflow-x-auto hide-scrollbar">
            <button
              type="button"
              onClick={() => handleCategoryNav('All')}
              className={`py-1 cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'All' && !selectedProduct
                  ? 'text-[#111111] dark:text-white underline underline-offset-8 decoration-1'
                  : 'hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryNav(cat)}
                className={`py-1 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeCategory === cat && !selectedProduct
                    ? 'text-[#111111] dark:text-white underline underline-offset-8 decoration-1'
                    : 'hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Zone 3: Primary Action & Utility Controls (Admin hidden on mobile; My Orders to the left of Cart on both mobile & desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <GlobalSearch onSelectProduct={handleOpenProduct} />
            <ThemeToggle />
            <Link
              to="/admin"
              className="hidden md:inline-block px-2 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white whitespace-nowrap shrink-0"
            >
              Admin
            </Link>
            <button
              type="button"
              onClick={() => {
                haptic.light();
                setIsOrdersOpen(true);
              }}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 border border-[#111111]/30 dark:border-white/30 text-[10px] sm:text-xs font-bold uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#111111] dark:text-[#F5F5F7] hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
            >
              My Orders{userOrders.length > 0 ? ` (${userOrders.length})` : ''}
            </button>
            <button
              type="button"
              onClick={() => {
                haptic.light();
                setDirectBuyItem(null);
                setIsCartOpen(true);
              }}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 border border-[#111111]/30 dark:border-white/30 text-[10px] sm:text-xs font-bold uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#111111] dark:text-[#F5F5F7] hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
            >
              Cart ({cartCount})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main key={`main-${theme}`} className="flex-1 w-full">
        {selectedProduct ? (
          <EditorialDetailView
            item={selectedProduct}
            onBack={() => setSelectedProduct(null)}
            onBuyNow={handleDirectBuy}
          />
        ) : (
          /* Editorial Hero Showcase */
          currentHero && (
            <section className="w-full bg-[#FFFFFF] dark:bg-[#0E0E11] border-b border-[#E5E5E0] dark:border-[#222227]">
              {/* Top Sub-Bar matching EditorialDetailView */}
              <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-16 h-12 sm:h-13 flex items-center justify-between border-b border-[#ECECE7] dark:border-[#222227] text-xs">
                <button
                  type="button"
                  onClick={() => handleOpenProduct(currentHero)}
                  className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-[#111111] dark:text-[#F5F5F7] hover:opacity-70 cursor-pointer whitespace-nowrap"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Product details</span>
                </button>

                <div className="flex items-center gap-2.5 sm:gap-3.5 text-[10px] sm:text-[11px] font-bold tabular-nums text-[#111111] dark:text-[#F5F5F7]">
                  <button
                    type="button"
                    onClick={() => {
                      haptic.light();
                      setHeroIndex(
                        (prev) =>
                          (prev - 1 + featuredItems.length) % featuredItems.length
                      );
                    }}
                    className="p-1 text-zinc-500 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                    aria-label="Previous featured edition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span>{formattedSlideIndex((heroIndex % featuredItems.length) + 1)}</span>
                  <span className="w-6 sm:w-10 h-[1px] bg-[#111111]/30 dark:bg-white/30" />
                  <span className="text-zinc-400">
                    {formattedSlideIndex(featuredItems.length)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      haptic.light();
                      setHeroIndex((prev) => (prev + 1) % featuredItems.length);
                    }}
                    className="p-1 text-[#111111] dark:text-white hover:translate-x-0.5 transition-transform cursor-pointer"
                    aria-label="Next featured edition"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Hero Main Split Content */}
              <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-16 py-6 sm:py-10 md:py-16">
                <div className="grid grid-cols-12 gap-4 sm:gap-8 lg:gap-12 items-center">
                  {/* Cover Pedestal Column: Left on Mobile (5 cols), Right on Desktop (6 cols) */}
                  <div className="col-span-5 sm:col-span-4 lg:col-span-6 lg:order-2 flex justify-center lg:justify-end">
                    <div
                      onClick={() => handleOpenProduct(currentHero)}
                      className="relative w-full max-w-[138px] sm:max-w-[196px] md:max-w-[244px] lg:max-w-[284px] bg-[#F2F2EE] dark:bg-[#141417] px-3 pt-7 pb-3 sm:px-5 sm:pt-8 sm:pb-5 lg:px-6 lg:pt-9 lg:pb-6 cursor-pointer group"
                    >
                      <div className="relative w-full aspect-[2/3] transition-transform duration-150 group-hover:-translate-y-0.5">
                        {currentHero.soldOut && (
                          <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-20 px-2.5 py-0.5 bg-[#8B1A1A] text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.18em] whitespace-nowrap shadow-sm">
                            SOLD OUT
                          </span>
                        )}
                        <div className="w-full h-full shadow-[0_16px_32px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_16px_32px_-10px_rgba(0,0,0,0.85)] overflow-hidden">
                          <ProductImage6x9
                            src={currentHero.image}
                            title={currentHero.title}
                            author={currentHero.specs?.author}
                            category={currentHero.category}
                            courseCode={currentHero.ignouCourseCode}
                            programCode={currentHero.ignouProgramCode}
                            year={currentHero.ignouYear}
                            releaseDate={currentHero.specs?.releaseDate}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Editorial Typography & Purchase Column: Right on Mobile (7 cols), Left on Desktop (6 cols) */}
                  <div className="col-span-7 sm:col-span-8 lg:col-span-6 lg:order-1 flex flex-col justify-center min-w-0">
                    <p
                      className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] truncate mb-2 sm:mb-3 ${
                        currentHero.soldOut
                          ? 'text-[#8B1A1A] dark:text-red-400'
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {getHeroEditionTag(currentHero)}
                    </p>

                    <h1
                      onClick={() => handleOpenProduct(currentHero)}
                      className="font-editorial text-[22px] sm:text-3xl md:text-5xl font-semibold text-[#111111] dark:text-[#F5F5F7] leading-[1.12] tracking-tight cursor-pointer line-clamp-2 lg:line-clamp-none"
                      style={{ textWrap: 'balance' }}
                    >
                      {currentHero.title}
                    </h1>

                    {currentHero.category === 'IGNOU' &&
                      currentHero.ignouProgramName && (
                        <p className="mt-1.5 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300 truncate">
                          {currentHero.ignouProgramCode
                            ? `${currentHero.ignouProgramCode} — ${currentHero.ignouProgramName}`
                            : currentHero.ignouProgramName}
                        </p>
                      )}

                    <p className="hidden sm:block mt-4 text-xs md:text-sm leading-[1.75] text-zinc-600 dark:text-zinc-400 max-w-md line-clamp-3">
                      {currentHero.description}
                    </p>

                    <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
                      {currentHero.soldOut ? (
                        <button
                          type="button"
                          onClick={() => handleOpenProduct(currentHero)}
                          className="px-4.5 py-2.5 sm:px-7 sm:py-3.5 bg-[#8B1A1A] text-white text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase cursor-pointer tabular-nums whitespace-nowrap"
                        >
                          SOLD OUT · ₹{heroDisplayPrice.toLocaleString('en-IN')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDirectBuy(currentHero)}
                          className="px-4.5 py-2.5 sm:px-7 sm:py-3.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase hover:opacity-85 cursor-pointer tabular-nums whitespace-nowrap"
                        >
                          BUY · ₹{heroDisplayPrice.toLocaleString('en-IN')}
                        </button>
                      )}

                      {currentHero.synopsisDemoPdfUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            haptic.light();
                            triggerDemoPdfDownload(currentHero, 'synopsis');
                          }}
                          className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 border border-[#111111]/30 dark:border-white/30 text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-[#111111] dark:text-[#F5F5F7] hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] cursor-pointer whitespace-nowrap"
                        >
                          SYNOPSIS DEMO
                        </button>
                      )}

                      {currentHero.demoPdfUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            haptic.light();
                            triggerDemoPdfDownload(currentHero, 'main');
                          }}
                          className="px-3.5 py-2.5 sm:px-5 sm:py-3.5 border border-[#111111]/30 dark:border-white/30 text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-[#111111] dark:text-[#F5F5F7] hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] cursor-pointer whitespace-nowrap"
                        >
                          {currentHero.category === 'IGNOU' &&
                          currentHero.ignouMaterialType === 'Project'
                            ? 'PROJECT DEMO'
                            : 'DEMO PDF'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
        )}

        {/* Storefront Category Filter Bar & 4-Column Desktop / 2-Column Mobile 6x9 Product Grid */}
        <section
          id="collection-grid"
          className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-16 py-7 sm:py-14 md:py-20"
        >
          {/* Filter & Sorting Header */}
          <div className="flex flex-row items-center justify-between gap-2 pb-6 sm:pb-8">
            <div className="flex items-center gap-3.5 sm:gap-7 text-[11px] sm:text-xs font-semibold tracking-[0.1em] sm:tracking-[0.14em] uppercase overflow-x-auto hide-scrollbar">
              {['All', ...categories].map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setActiveCategory(cat);
                      if (cat !== 'IGNOU') {
                        resetIgnouFilters();
                      }
                    }}
                    className={`py-1 cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'text-[#111111] dark:text-white font-bold underline underline-offset-8 decoration-1'
                        : 'text-zinc-400 hover:text-[#111111] dark:hover:text-zinc-200'
                    }`}
                  >
                    {cat === 'All' ? (
                      <>
                        <span className="sm:hidden">All</span>
                        <span className="hidden sm:inline">All Products</span>
                      </>
                    ) : (
                      cat
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort products"
                className="bg-transparent text-[11px] sm:text-xs font-medium text-zinc-600 dark:text-zinc-300 border-none outline-none cursor-pointer pr-1"
              >
                <option value="default" className="bg-white dark:bg-[#141418]">
                  Default sorting
                </option>
                <option value="price-asc" className="bg-white dark:bg-[#141418]">
                  Price: Low to High
                </option>
                <option value="price-desc" className="bg-white dark:bg-[#141418]">
                  Price: High to Low
                </option>
              </select>
            </div>
          </div>

          {/* IGNOU Progressive Hierarchical Filter Bar (1. Degree -> 2. Program Code -> 3. Year -> 4. Course Code -> 5. Material) */}
          {activeCategory === 'IGNOU' && (
            <div className="mb-7 p-4 sm:p-5 bg-[#FFFFFF] dark:bg-[#121216] border border-[#E5E5E0] dark:border-[#222227] space-y-3.5">
              {/* Step 1: Select Degree Programme (Always visible first) */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mr-1">
                  1. Degree:
                </span>
                {IGNOU_DEGREES.map((deg) => {
                  const active = ignouDegreeFilter === deg;
                  return (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setIgnouDegreeFilter(deg);
                        setIgnouProgramFilter('All');
                        setIgnouYearFilter('All');
                        setIgnouCourseFilter('All');
                        setIgnouTypeFilter('All');
                      }}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                          : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                      }`}
                    >
                      {deg === 'All' ? 'All Degrees' : deg}
                    </button>
                  );
                })}
              </div>

              {/* Step 2: Select Program Code (Appears ONLY after a specific Degree is selected) */}
              {ignouDegreeFilter !== 'All' && (
                <div className="pt-3 border-t border-[#ECECE7] dark:border-[#222227] flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mr-1">
                    2. Program Code:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setIgnouProgramFilter('All');
                      setIgnouYearFilter('All');
                      setIgnouCourseFilter('All');
                      setIgnouTypeFilter('All');
                    }}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap ${
                      ignouProgramFilter === 'All'
                        ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                        : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                    }`}
                  >
                    All Programs
                  </button>
                  {availableIgnouPrograms.length > 0 ? (
                    availableIgnouPrograms.map((prog) => {
                      const active = ignouProgramFilter === prog.code;
                      return (
                        <button
                          key={prog.code}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setIgnouProgramFilter(prog.code);
                            setIgnouYearFilter('All');
                            setIgnouCourseFilter('All');
                            setIgnouTypeFilter('All');
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                              : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                          }`}
                        >
                          {prog.name ? `${prog.code} (${prog.name})` : prog.code}
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                      No Program Codes Uploaded Yet
                    </span>
                  )}
                </div>
              )}

              {/* Step 3: Select Year (Appears ONLY after a specific Program Code is selected) */}
              {ignouDegreeFilter !== 'All' && ignouProgramFilter !== 'All' && (
                <div className="pt-3 border-t border-[#ECECE7] dark:border-[#222227] flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mr-1">
                    3. Year:
                  </span>
                  {IGNOU_YEARS.map((yr) => {
                    const active = ignouYearFilter === yr;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setIgnouYearFilter(yr);
                          setIgnouCourseFilter('All');
                          setIgnouTypeFilter('All');
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                          active
                            ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                            : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                        }`}
                      >
                        {yr === 'All' ? 'All Years' : yr}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 4: Course Code (Appears ONLY after a specific Year is selected) */}
              {ignouDegreeFilter !== 'All' &&
                ignouProgramFilter !== 'All' &&
                ignouYearFilter !== 'All' && (
                  <div className="pt-3 border-t border-[#ECECE7] dark:border-[#222227] flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mr-1">
                      4. Course Code:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setIgnouCourseFilter('All');
                      }}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap ${
                        ignouCourseFilter === 'All'
                          ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                          : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                      }`}
                    >
                      All Courses
                    </button>
                    {availableIgnouCourses.length > 0 ? (
                      availableIgnouCourses.map((courseCode) => {
                        const active = ignouCourseFilter === courseCode;
                        return (
                          <button
                            key={courseCode}
                            type="button"
                            onClick={() => {
                              haptic.selection();
                              setIgnouCourseFilter(courseCode);
                            }}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap ${
                              active
                                ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                                : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                            }`}
                          >
                            {courseCode}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                        No Course Codes In This Year Yet
                      </span>
                    )}
                  </div>
                )}

              {/* Step 5: Select Material Type (Appears after Year is selected so user can filter by Assignment or Project) */}
              {ignouDegreeFilter !== 'All' &&
                ignouProgramFilter !== 'All' &&
                ignouYearFilter !== 'All' && (
                  <div className="pt-3 border-t border-[#ECECE7] dark:border-[#222227] flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mr-1">
                      5. Material:
                    </span>
                    {IGNOU_TYPES.map((type) => {
                      const active = ignouTypeFilter === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            haptic.selection();
                            setIgnouTypeFilter(type);
                            setIgnouCourseFilter('All');
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                              : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                          }`}
                        >
                          {type === 'All'
                            ? 'All Types'
                            : type === 'Assignment'
                            ? 'Solved Assignment'
                            : 'Project / Synopsis'}
                        </button>
                      );
                    })}
                  </div>
                )}
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="py-16 px-6 bg-[#FFFFFF] dark:bg-[#121216] border border-[#E5E5E0] dark:border-[#222227] text-center max-w-xl mx-auto space-y-4">
              <p className="font-editorial text-2xl sm:text-3xl font-semibold text-[#111111] dark:text-white">
                No Editions Published Yet
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Open the Admin Console to add your books, IGNOU Assignments &amp; Projects, downloadable PDF eBooks, or stationery products.
              </p>
              <div className="pt-2">
                <Link
                  to="/admin"
                  className="inline-block px-7 py-3 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[11px] font-bold uppercase tracking-[0.2em] hover:opacity-85"
                >
                  OPEN ADMIN CONSOLE
                </Link>
              </div>
            </div>
          ) : (
            /* 4-Column Desktop / 2-Column Mobile Product Grid — Shadowed 6x9 Box on Pedestal Card */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3.5 sm:gap-x-7 gap-y-7 sm:gap-y-12">
              {filteredProducts.map((item) => {
                const displayFormat = getDefaultSelectedFormat(item);
                const displayPrice = getEffectivePrice(item, displayFormat);
                return (
                  <article
                    key={item.id}
                    onClick={() => handleOpenProduct(item)}
                    className="group cursor-pointer flex flex-col min-w-0"
                  >
                    {/* Pedestal Card with Top Centered Dark Red SOLD OUT Box Above Product / LEKHIX Mark */}
                    <div className="relative w-full bg-[#F2F2EE] dark:bg-[#141417] px-3.5 pt-7 pb-3.5 sm:px-6 sm:pt-9 sm:pb-6 md:px-7 md:pt-10 md:pb-7 flex items-center justify-center group-hover:bg-[#EAEAE4] dark:group-hover:bg-[#19191E]">
                      <div className="relative w-full aspect-[2/3] transition-transform duration-150 group-hover:-translate-y-1">
                        {item.soldOut && (
                          <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-20 px-2.5 sm:px-3 py-0.5 bg-[#8B1A1A] text-white text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.18em] whitespace-nowrap shadow-sm">
                            SOLD OUT
                          </span>
                        )}
                        <div className="w-full h-full shadow-[0_14px_28px_-8px_rgba(0,0,0,0.28)] dark:shadow-[0_14px_28px_-8px_rgba(0,0,0,0.75)] overflow-hidden">
                          <ProductImage6x9
                            src={item.image}
                            title={item.title}
                            author={item.specs?.author}
                            category={item.category}
                            courseCode={item.ignouCourseCode}
                            programCode={item.ignouProgramCode}
                            year={item.ignouYear}
                            releaseDate={item.specs?.releaseDate}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Metadata Row: Title and Price / Sold Out */}
                    <div className="pt-3 flex flex-col gap-1 min-w-0">
                      {item.category === 'IGNOU' && (
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 truncate">
                          {[
                            item.ignouDegree,
                            item.ignouProgramCode,
                            item.ignouYear,
                            item.ignouCourseCode,
                            item.ignouMaterialType,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                      <div className="flex items-baseline justify-between gap-2 min-w-0">
                        <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.05em] text-[#111111] dark:text-[#F5F5F7] truncate">
                          {item.title}
                        </h2>

                        <div className="flex items-baseline gap-1.5 shrink-0 tabular-nums text-[11px] sm:text-xs">
                          {item.soldOut ? (
                            <span className="font-bold uppercase tracking-wider text-[#8B1A1A] dark:text-red-400">
                              SOLD OUT
                            </span>
                          ) : (
                            <>
                              {item.originalPrice && item.originalPrice > displayPrice && (
                                <span className="text-zinc-400 line-through hidden sm:inline">
                                  ₹{item.originalPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                              <span className="font-bold text-[#111111] dark:text-[#F5F5F7] underline underline-offset-4 decoration-zinc-400/60">
                                ₹{displayPrice.toLocaleString('en-IN')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Refined Architectural Footer — Clean Inside-Box Capital Placeholders & Full-Width Mobile CTA */}
      <footer className="border-t border-[#E5E5E0] dark:border-[#1E1E24] bg-[#F6F6F3] dark:bg-[#0D0D10]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-16 py-12 sm:py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#111111] dark:text-white leading-[1.1]">
                DON&apos;T BE SHY,
                <br />
                JUST SAY HI!
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                Inquire about books, IGNOU Solved Assignments &amp; Projects, instant PDF eBooks, or bespoke stationery sets.
              </p>
              <div className="pt-1">
                <LekhixLogo size="sm" />
              </div>
            </div>

            <form
              onSubmit={handleInquirySubmit}
              className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5"
            >
              <div>
                <input
                  type="text"
                  required
                  maxLength={150}
                  aria-label="Your Name"
                  value={inquiryForm.name}
                  onChange={(e) =>
                    setInquiryForm({ ...inquiryForm, name: e.target.value })
                  }
                  placeholder="YOUR NAME"
                  className="w-full px-4 py-3 text-xs text-[#111111] dark:text-[#F5F5F7] bg-[#FFFFFF] dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#282830] focus:border-[#111111] dark:focus:border-white outline-none transition-colors placeholder:text-[10px] placeholder:font-semibold placeholder:uppercase placeholder:tracking-[0.16em] placeholder:text-zinc-400/75 dark:placeholder:text-zinc-500"
                />
              </div>

              <div>
                <input
                  type="text"
                  required
                  maxLength={100}
                  aria-label="Contact (Phone or Email)"
                  value={inquiryForm.phone}
                  onChange={(e) =>
                    setInquiryForm({ ...inquiryForm, phone: e.target.value })
                  }
                  placeholder="CONTACT (PHONE OR EMAIL)"
                  className="w-full px-4 py-3 text-xs text-[#111111] dark:text-[#F5F5F7] bg-[#FFFFFF] dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#282830] focus:border-[#111111] dark:focus:border-white outline-none transition-colors placeholder:text-[10px] placeholder:font-semibold placeholder:uppercase placeholder:tracking-[0.16em] placeholder:text-zinc-400/75 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="sm:col-span-2">
                <textarea
                  rows={3}
                  required
                  maxLength={5000}
                  aria-label="Message"
                  value={inquiryForm.message}
                  onChange={(e) =>
                    setInquiryForm({ ...inquiryForm, message: e.target.value })
                  }
                  placeholder="MESSAGE — BOOK, IGNOU COURSE CODE, OR INQUIRY..."
                  className="w-full px-4 py-3 text-xs text-[#111111] dark:text-[#F5F5F7] bg-[#FFFFFF] dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#282830] focus:border-[#111111] dark:focus:border-white outline-none transition-colors resize-none placeholder:text-[10px] placeholder:font-semibold placeholder:uppercase placeholder:tracking-[0.16em] placeholder:text-zinc-400/75 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="sm:col-span-2 flex sm:justify-end pt-0.5">
                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[11px] font-bold uppercase tracking-[0.2em] hover:opacity-85 transition-opacity cursor-pointer text-center"
                >
                  {submittingInquiry ? 'SENDING...' : 'SEND MESSAGE'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-10 sm:mt-14 pt-6 border-t border-[#E5E5E0] dark:border-[#1E1E24] flex flex-row items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            <span className="truncate">
              LEKHIX — BOOKS, IGNOU &amp; STATIONERY
            </span>
            <Link
              to="/admin"
              className="font-bold uppercase tracking-[0.18em] text-[#111111] dark:text-zinc-200 hover:opacity-70 transition-opacity whitespace-nowrap shrink-0"
            >
              ADMIN CONSOLE
            </Link>
          </div>
        </div>
      </footer>

      {/* Full-Screen Shopping Bag & Checkout Page */}
      <CheckoutModal
        isOpen={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          setDirectBuyItem(null);
        }}
        directItem={directBuyItem}
        directFormat={directBuyFormat}
      />

      {/* Full-Screen My Orders & eBook Re-Download Page */}
      <MyOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />
    </div>
  );
}
