import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { CatalogItem, useCatalog } from '../context/CatalogContext';
import LekhixLogo from '../components/LekhixLogo';
import ProductImage6x9 from '../components/ProductImage6x9';
import EditorialDetailView from '../components/EditorialDetailView';
import CheckoutModal from '../components/CheckoutModal';
import GlobalSearch from '../components/GlobalSearch';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '../context/ToastContext';
import { haptic } from '../utils/haptics';

type CategoryFilter = 'All' | 'Books' | 'Stationery';
type SortOption = 'default' | 'price-asc' | 'price-desc';

export default function LandingPage() {
  const {
    catalog,
    cartCount,
    isCartOpen,
    setIsCartOpen,
  } = useCatalog();
  const { showToast } = useToast();

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null);
  const [directBuyItem, setDirectBuyItem] = useState<CatalogItem | null>(null);
  const [directBuyFormat, setDirectBuyFormat] = useState<'physical' | 'ebook'>('physical');

  // Minimal footer inquiry state (saves to Firestore contactSubmissions; zero hardcoded links)
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', message: '' });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  const featuredItems = useMemo(() => {
    const list = catalog.filter((i) => i.featured);
    return list.length > 0 ? list : catalog.slice(0, 4);
  }, [catalog]);

  const currentHero = featuredItems[heroIndex % featuredItems.length] || catalog[0];

  const filteredProducts = useMemo(() => {
    const base =
      activeCategory === 'All'
        ? catalog
        : catalog.filter((item) => item.category === activeCategory);

    if (sortBy === 'price-asc') {
      return [...base].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return [...base].sort((a, b) => b.price - a.price);
    }
    return base;
  }, [catalog, activeCategory, sortBy]);

  const handleOpenProduct = (item: CatalogItem) => {
    haptic.selection();
    setSelectedProduct(item);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleDirectBuy = (
    item: CatalogItem,
    format?: 'physical' | 'ebook'
  ) => {
    haptic.medium();
    const resolvedFormat =
      format ||
      (item.category === 'Books' && item.bookFormat === 'ebook'
        ? 'ebook'
        : 'physical');
    setDirectBuyItem(item);
    setDirectBuyFormat(resolvedFormat);
    setIsCartOpen(true);
  };

  const handleCategoryNav = (cat: CategoryFilter) => {
    haptic.selection();
    setActiveCategory(cat);
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

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0C] text-[#111111] dark:text-[#F5F5F7] flex flex-col justify-between">
      {/* Top Bar — Strict 3-Zone Contract with Original Framed LEKHIX Logo */}
      <header className="sticky top-0 z-[100] bg-[#FAFAFA]/95 dark:bg-[#0A0A0C]/95 backdrop-blur-sm border-b border-[#ECECE7] dark:border-[#1E1E24]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-20 flex items-center justify-between gap-8">
          {/* Zone 1: Framed LEKHIX Brand Mark (Single Element, No Subtitle) */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setSelectedProduct(null);
              setActiveCategory('All');
              window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
            }}
            className="cursor-pointer whitespace-nowrap shrink-0 focus:outline-none"
            aria-label="LEKHIX Home"
          >
            <LekhixLogo size="sm" />
          </button>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            <button
              type="button"
              onClick={() => handleCategoryNav('All')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'All' && !selectedProduct
                  ? 'text-[#111111] dark:text-white underline underline-offset-8 decoration-1'
                  : 'hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              All Products
            </button>
            <button
              type="button"
              onClick={() => handleCategoryNav('Books')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'Books' && !selectedProduct
                  ? 'text-[#111111] dark:text-white underline underline-offset-8 decoration-1'
                  : 'hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              Books
            </button>
            <button
              type="button"
              onClick={() => handleCategoryNav('Stationery')}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'Stationery' && !selectedProduct
                  ? 'text-[#111111] dark:text-white underline underline-offset-8 decoration-1'
                  : 'hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              Stationery
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentHero) handleOpenProduct(currentHero);
              }}
              className={`py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedProduct
                  ? 'text-[#111111] dark:text-white underline underline-offset-8 decoration-1'
                  : 'hover:text-[#111111] dark:hover:text-white'
              }`}
            >
              Bookshelf
            </button>
          </nav>

          {/* Zone 3: Primary Action & Utility Controls */}
          <div className="flex items-center gap-4 shrink-0">
            <GlobalSearch onSelectProduct={handleOpenProduct} />
            <ThemeToggle />
            <Link
              to="/admin"
              className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Admin
            </Link>
            <button
              type="button"
              onClick={() => {
                haptic.light();
                setDirectBuyItem(null);
                setIsCartOpen(true);
              }}
              className="px-4 py-2 border border-[#111111]/20 dark:border-white/25 text-xs font-bold uppercase tracking-[0.16em] text-[#111111] dark:text-[#F5F5F7] hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
            >
              Cart ({cartCount})
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Conditional Gestalten Editorial Detail View when a Book/Stationery item is selected */}
        {selectedProduct ? (
          <EditorialDetailView
            item={selectedProduct}
            onSelectItem={(nextItem) => setSelectedProduct(nextItem)}
            onBack={() => setSelectedProduct(null)}
            onBuyNow={handleDirectBuy}
          />
        ) : (
          /* Alpine-Inspired Featured Editorial Hero Showcase */
          currentHero && (
            <section className="w-full bg-[#F3F3F0] dark:bg-[#111115] border-b border-[#E5E5E0] dark:border-[#1E1E24]">
              <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-12 md:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                  {/* Left Editorial Column (Alpine Reference) */}
                  <div className="lg:col-span-5 space-y-6">
                    <h1
                      className="font-editorial text-3xl sm:text-4xl md:text-5xl font-semibold text-[#111111] dark:text-[#F5F5F7] leading-[1.1] tracking-tight"
                      style={{ textWrap: 'balance' }}
                    >
                      / {currentHero.title}
                    </h1>

                    <p className="text-xs sm:text-sm leading-[1.8] text-zinc-600 dark:text-zinc-400 max-w-md line-clamp-4">
                      {currentHero.description}
                    </p>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleDirectBuy(currentHero)}
                        className="px-8 py-3.5 border border-[#1E3A5F] dark:border-white text-[11px] font-bold tracking-[0.2em] uppercase text-[#111111] dark:text-white hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer tabular-nums whitespace-nowrap"
                      >
                        BUY ₹{currentHero.price.toLocaleString('en-IN')}
                      </button>
                    </div>
                  </div>

                  {/* Right 6x9 Inch Studio Preview Column */}
                  <div className="lg:col-span-7 flex justify-center lg:justify-end">
                    <div
                      onClick={() => handleOpenProduct(currentHero)}
                      className="w-56 sm:w-64 md:w-72 aspect-[2/3] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.28)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] cursor-pointer transition-transform duration-150 hover:-translate-y-1"
                    >
                      <ProductImage6x9
                        src={currentHero.image}
                        title={currentHero.title}
                        author={currentHero.specs.author}
                        category={currentHero.category}
                      />
                    </div>
                  </div>
                </div>

                {/* Hero Bottom Controls: "∨ Product details" left & "01 —— 04 ->" right */}
                <div className="mt-12 pt-6 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenProduct(currentHero)}
                    className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-[#111111] dark:text-zinc-200 hover:opacity-65 transition-opacity cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Product details</span>
                  </button>

                  <div className="flex items-center gap-4 text-[11px] font-bold tabular-nums text-[#111111] dark:text-zinc-200">
                    <span>{formattedSlideIndex((heroIndex % featuredItems.length) + 1)}</span>
                    <span className="w-12 h-[1px] bg-[#111111]/30 dark:bg-white/30" />
                    <span className="text-zinc-400">
                      {formattedSlideIndex(featuredItems.length)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.light();
                        setHeroIndex((prev) => (prev + 1) % featuredItems.length);
                      }}
                      className="p-1 text-[#1E3A5F] dark:text-white hover:translate-x-0.5 transition-transform cursor-pointer"
                      aria-label="Next featured edition"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )
        )}

        {/* Storefront Category Filter Bar & 3-Column 6x9 Product Grid (Hikone + Alpine Reference) */}
        <section
          id="collection-grid"
          className="max-w-[1440px] mx-auto px-6 md:px-16 py-14 md:py-20"
        >
          {/* Filter & Sorting Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-10">
            <div className="flex items-center gap-7 text-xs font-semibold tracking-[0.14em] uppercase">
              {(['All', 'Books', 'Stationery'] as const).map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setActiveCategory(cat);
                    }}
                    className={`transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'text-[#111111] dark:text-white font-bold'
                        : 'text-zinc-400 hover:text-[#111111] dark:hover:text-zinc-200'
                    }`}
                  >
                    {cat === 'All' ? 'All Products' : cat}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort products"
                className="bg-transparent text-xs font-medium text-zinc-600 dark:text-zinc-300 border-none outline-none cursor-pointer pr-2"
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

          {/* 4-Column Desktop / 2-Column Mobile Product Grid — Shadowed 6x9 Box on Pedestal Card */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-7 gap-y-8 sm:gap-y-12">
            {filteredProducts.map((item) => (
              <article
                key={item.id}
                onClick={() => handleOpenProduct(item)}
                className="group cursor-pointer flex flex-col"
              >
                {/* Pedestal Card with Uniform Padding & Exact 6x9 Shadowed Box (No bottom strip) */}
                <div className="w-full bg-[#F2F2EE] dark:bg-[#141417] p-4 sm:p-6 md:p-7 flex items-center justify-center transition-colors duration-150 group-hover:bg-[#EAEAE4] dark:group-hover:bg-[#19191E]">
                  <div className="w-full aspect-[2/3] shadow-[0_16px_32px_-8px_rgba(0,0,0,0.28)] dark:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.75)] transition-transform duration-150 group-hover:-translate-y-1 overflow-hidden">
                    <ProductImage6x9
                      src={item.image}
                      title={item.title}
                      author={item.specs.author}
                      category={item.category}
                    />
                  </div>
                </div>

                {/* Subtitle-Free Metadata Row: Only Title and Price */}
                <div className="pt-3.5 flex items-baseline justify-between gap-3">
                  <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.06em] text-[#111111] dark:text-[#F5F5F7] truncate">
                    {item.title}
                  </h2>

                  <div className="flex items-baseline gap-2 shrink-0 tabular-nums text-[11px] sm:text-xs">
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-zinc-400 line-through hidden sm:inline">
                        ₹{item.originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="font-bold text-[#111111] dark:text-[#F5F5F7] underline underline-offset-4 decoration-zinc-400/60">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Hikone-Inspired Minimalist Footer — Zero Hardcoded External Links */}
      <footer className="border-t border-[#E5E5E0] dark:border-[#1E1E24] bg-[#F6F6F3] dark:bg-[#0D0D10]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Statement */}
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#111111] dark:text-white leading-tight">
                DON&apos;T BE SHY,
                <br />
                JUST SAY HI!
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm">
                Inquire about collector 6×9 hardcover editions, institutional book orders, or bespoke stationery sets.
              </p>
              <div className="pt-2">
                <LekhixLogo size="sm" />
              </div>
            </div>

            {/* Right Direct Inquiry Form (No hardcoded external links or social placeholders) */}
            <form
              onSubmit={handleInquirySubmit}
              className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">
                  YOUR NAME
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={inquiryForm.name}
                  onChange={(e) =>
                    setInquiryForm({ ...inquiryForm, name: e.target.value })
                  }
                  placeholder="Full name"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#282830] focus:border-[#111111] dark:focus:border-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">
                  CONTACT (PHONE OR EMAIL)
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={inquiryForm.phone}
                  onChange={(e) =>
                    setInquiryForm({ ...inquiryForm, phone: e.target.value })
                  }
                  placeholder="Phone or email"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#282830] focus:border-[#111111] dark:focus:border-white outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 mb-2">
                  MESSAGE
                </label>
                <textarea
                  rows={2}
                  required
                  maxLength={5000}
                  value={inquiryForm.message}
                  onChange={(e) =>
                    setInquiryForm({ ...inquiryForm, message: e.target.value })
                  }
                  placeholder="Tell us which book or stationery edition you are looking for..."
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#282830] focus:border-[#111111] dark:focus:border-white outline-none resize-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="px-7 py-3 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[11px] font-bold uppercase tracking-[0.2em] hover:opacity-85 transition-opacity cursor-pointer"
                >
                  {submittingInquiry ? 'SENDING...' : 'SEND MESSAGE'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-16 pt-8 border-t border-[#E5E5E0] dark:border-[#1E1E24] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-400">
            <span>LEKHIX — BOOKS &amp; ARCHITECTURAL STATIONERY</span>
            <div className="flex items-center gap-6">
              <span>ALL EDITIONS FORMATTED TO 6 × 9 IN</span>
              <Link
                to="/admin"
                className="font-bold uppercase tracking-[0.16em] text-[#111111] dark:text-zinc-200 hover:opacity-70 transition-opacity"
              >
                Admin Console
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Shopping Bag & Checkout Drawer */}
      <CheckoutModal
        isOpen={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          setDirectBuyItem(null);
        }}
        directItem={directBuyItem}
        directFormat={directBuyFormat}
      />
    </div>
  );
}
