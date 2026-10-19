import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  CatalogItem,
  getEffectivePrice,
  useCatalog,
} from '../context/CatalogContext';
import ProductImage6x9 from './ProductImage6x9';
import BookPreviewModal from './BookPreviewModal';
import { haptic } from '../utils/haptics';

interface EditorialDetailViewProps {
  item: CatalogItem;
  onSelectItem: (item: CatalogItem) => void;
  onBack: () => void;
  onBuyNow: (item: CatalogItem, format?: 'physical' | 'ebook') => void;
}

/**
 * Editorial Book & Stationery Detail View modeled directly on the uploaded Gestalten reference image:
 * - Top sub-bar: Back to Collection | Book Listing | VIEW CART
 * - Left column: Strict 6×9 cover preview + "CLICK FOR PREVIEW"
 * - Center column: Editorial Serif Title, "by AUTHOR", lead italic intro + body prose,
 *   Physical vs eBook (PDF) format selector for Books, BUY / ADD TO CART actions,
 *   structured 2-column × 3-row specification table, and reviewer quote
 * - Right column: Vertical Bookshelf sidebar ("EXPAND BOOKSHELF") with 6×9 thumbnails
 */
export default function EditorialDetailView({
  item,
  onSelectItem,
  onBack,
  onBuyNow,
}: EditorialDetailViewProps) {
  const { catalog, addToCart, cartCount, setIsCartOpen } = useCatalog();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isShelfExpanded, setIsShelfExpanded] = useState(false);

  const bookFormatMode =
    item.category === 'Books' ? item.bookFormat || 'both' : 'physical';

  const [selectedFormat, setSelectedFormat] = useState<'physical' | 'ebook'>(
    bookFormatMode === 'ebook' ? 'ebook' : 'physical'
  );

  useEffect(() => {
    const mode = item.category === 'Books' ? item.bookFormat || 'both' : 'physical';
    setSelectedFormat(mode === 'ebook' ? 'ebook' : 'physical');
  }, [item]);

  const activePrice = getEffectivePrice(item, selectedFormat);

  // Split description into an italic editorial lead and main body paragraph
  const sentences = item.description.split(/(?<=\.)\s+/);
  const leadParagraph = sentences.slice(0, 2).join(' ');
  const bodyParagraph =
    sentences.slice(2).join(' ') ||
    'Crafted to strict 6 × 9 inch archival standards with acid-free paper and durable studio binding.';

  return (
    <section className="w-full bg-[#FFFFFF] dark:bg-[#0E0E11] border-b border-[#E5E5E0] dark:border-[#222227]">
      {/* Sub-Navigation Bar matching Gestalten top bar */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 h-14 flex items-center justify-between border-b border-[#ECECE7] dark:border-[#222227] text-xs">
        <button
          onClick={() => {
            haptic.light();
            onBack();
          }}
          className="inline-flex items-center gap-2 font-semibold text-[#111111] dark:text-[#F5F5F7] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Collection</span>
        </button>

        <span className="font-editorial text-sm italic text-zinc-500 dark:text-zinc-400 hidden sm:inline">
          {item.category === 'Books' ? 'Book Listing' : 'Stationery Listing'}
        </span>

        <button
          onClick={() => {
            haptic.light();
            setIsCartOpen(true);
          }}
          className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#111111] dark:text-[#F5F5F7] hover:opacity-70 transition-opacity cursor-pointer whitespace-nowrap tabular-nums"
        >
          VIEW CART {cartCount > 0 ? `(${cartCount})` : ''}
        </button>
      </div>

      {/* Main 3-Column Gestalten Layout */}
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[760px]">
        {/* Left Column (Cols 1-5): 6x9 Book Cover + CLICK FOR PREVIEW */}
        <div className="lg:col-span-5 p-8 md:p-14 lg:p-16 flex flex-col items-center justify-center relative">
          <div
            onClick={() => {
              haptic.light();
              setIsPreviewOpen(true);
            }}
            className="relative flex flex-col items-center group cursor-pointer"
          >
            {/* Single-layer 6x9 book cover preview */}
            <div className="w-60 sm:w-72 aspect-[2/3] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.75)] transition-transform duration-150 group-hover:-translate-y-1">
              <ProductImage6x9
                src={item.image}
                title={item.title}
                author={item.specs.author}
                category={item.category}
              />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                haptic.light();
                setIsPreviewOpen(true);
              }}
              className="mt-8 text-[10px] font-bold tracking-[0.22em] uppercase text-zinc-500 dark:text-zinc-400 group-hover:text-[#111111] dark:group-hover:text-white transition-colors cursor-pointer"
            >
              CLICK FOR PREVIEW
            </button>
          </div>
        </div>

        {/* Center Column (Cols 6-10): Editorial Typography, Format Selector, Specs Table & Purchase Module */}
        <div className="lg:col-span-5 p-8 md:p-14 lg:py-16 lg:px-10 flex flex-col justify-center border-t lg:border-t-0 border-[#ECECE7] dark:border-[#222227]">
          <div className="max-w-xl">
            {/* Editorial Serif Title */}
            <h1
              className="font-editorial text-3xl sm:text-4xl md:text-[42px] font-semibold text-[#111111] dark:text-[#F5F5F7] leading-[1.12] tracking-tight mb-3"
              style={{ textWrap: 'balance' }}
            >
              {item.title}
            </h1>

            {/* Author Credit */}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-7">
              by{' '}
              <span className="font-bold uppercase tracking-[0.14em] text-[#111111] dark:text-[#F5F5F7]">
                {item.specs.author}
              </span>
            </p>

            {/* Italic Lead Synopsis */}
            <p className="font-editorial italic text-lg sm:text-[19px] leading-relaxed text-[#27272A] dark:text-zinc-200 mb-5">
              {leadParagraph}
            </p>

            {/* Secondary Body Prose */}
            <p className="text-xs sm:text-[13px] leading-[1.8] text-zinc-600 dark:text-zinc-400 mb-7">
              {bodyParagraph}
            </p>

            {/* Book Format Selector (Physical 6x9 vs eBook PDF) */}
            {item.category === 'Books' && (
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-2.5">
                  SELECT EDITION FORMAT
                </p>
                {bookFormatMode === 'both' ? (
                  <div className="inline-flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setSelectedFormat('physical');
                      }}
                      className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                        selectedFormat === 'physical'
                          ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                          : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36] hover:border-[#111111] dark:hover:border-white'
                      }`}
                    >
                      PHYSICAL (6×9 IN) · ₹{item.price.toLocaleString('en-IN')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setSelectedFormat('ebook');
                      }}
                      className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                        selectedFormat === 'ebook'
                          ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                          : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36] hover:border-[#111111] dark:hover:border-white'
                      }`}
                    >
                      EBOOK (PDF) · ₹
                      {(item.ebookPrice || item.price).toLocaleString('en-IN')}
                    </button>
                  </div>
                ) : bookFormatMode === 'ebook' ? (
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#111111] dark:text-white">
                    EBOOK EDITION · INSTANT PDF DOWNLOAD
                  </div>
                ) : (
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#111111] dark:text-white">
                    PHYSICAL HARDCOVER · 6 × 9 IN
                  </div>
                )}
              </div>
            )}

            {/* Purchase Module (Alpine + Gestalten hybrid) */}
            <div className="flex flex-wrap items-center gap-4 pb-8 mb-8 border-b border-[#ECECE7] dark:border-[#222227]">
              <button
                onClick={() => {
                  haptic.medium();
                  onBuyNow(item, selectedFormat);
                }}
                className="px-7 py-3 border border-[#1E3A5F] dark:border-white text-xs font-bold tracking-[0.18em] uppercase text-[#111111] dark:text-white hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer tabular-nums whitespace-nowrap"
              >
                {selectedFormat === 'ebook' ? 'BUY EBOOK (PDF)' : 'BUY'} ₹
                {activePrice.toLocaleString('en-IN')}
              </button>

              <button
                onClick={() => {
                  haptic.light();
                  addToCart(item, 1, selectedFormat);
                  setIsCartOpen(true);
                }}
                className="px-6 py-3 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold tracking-[0.18em] uppercase hover:opacity-85 transition-opacity cursor-pointer whitespace-nowrap"
              >
                ADD TO CART
              </button>

              {selectedFormat === 'physical' &&
                item.originalPrice &&
                item.originalPrice > item.price && (
                  <span className="text-xs text-zinc-400 line-through tabular-nums ml-1">
                    ₹{item.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
            </div>

            {/* Structured 2-Column × 3-Row Specifications Grid (Gestalten Reference) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-xs pb-8 mb-8 border-b border-[#ECECE7] dark:border-[#222227]">
              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  Editors
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 truncate">
                  {item.specs.publisher}
                </span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  Features
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 truncate">
                  {selectedFormat === 'ebook'
                    ? 'Instant PDF Download · High-Res'
                    : item.specs.features}
                </span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  Release Date
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 truncate">
                  {item.specs.releaseDate}
                </span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  Language
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 truncate">
                  {item.specs.language}
                </span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  Format
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 tabular-nums truncate">
                  {selectedFormat === 'ebook'
                    ? '6 × 9 in · Digital PDF'
                    : item.specs.format}
                </span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  ISBN
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 tabular-nums truncate">
                  {item.specs.isbn}
                </span>
              </div>
            </div>

            {/* Editorial Review Attribution */}
            {item.specs.reviewerQuote && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#18181B] dark:bg-zinc-800 text-white flex items-center justify-center text-xs font-editorial font-semibold">
                    {(item.specs.reviewerName || 'L')[0]}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#111111] dark:text-zinc-200">
                      Reviewed By
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.specs.reviewerName || 'LEKHIX Editorial Board'}
                    </p>
                  </div>
                </div>
                <p className="font-editorial italic text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  “{item.specs.reviewerQuote}”
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Cols 11-12): Vertical Bookshelf Strip (Gestalten Reference) */}
        <div
          className={`lg:col-span-2 border-t lg:border-t-0 lg:border-l border-[#ECECE7] dark:border-[#222227] bg-[#FAFAFA] dark:bg-[#111115] relative flex flex-col`}
        >
          {/* Vertical EXPAND BOOKSHELF toggle label on desktop */}
          <button
            type="button"
            onClick={() => setIsShelfExpanded((prev) => !prev)}
            className="hidden lg:flex items-center justify-center py-3 border-b border-[#ECECE7] dark:border-[#222227] text-[9px] font-bold tracking-[0.24em] uppercase text-zinc-500 hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
          >
            {isShelfExpanded ? 'COMPACT BOOKSHELF' : 'EXPAND BOOKSHELF'}
          </button>

          <div className="p-4 lg:p-6 overflow-x-auto lg:overflow-y-auto flex lg:flex-col items-center gap-6 max-h-[760px] hide-scrollbar">
            {catalog.map((shelfItem) => {
              const isSelected = shelfItem.id === item.id;
              return (
                <button
                  key={shelfItem.id}
                  onClick={() => {
                    haptic.selection();
                    onSelectItem(shelfItem);
                  }}
                  className={`group relative shrink-0 flex flex-col items-center text-center p-3 transition-colors cursor-pointer w-28 lg:w-full ${
                    isSelected
                      ? 'bg-[#F2F2EE] dark:bg-[#1A1A20] border border-[#111111]/25 dark:border-white/25'
                      : 'border border-transparent hover:bg-[#F4F4F0] dark:hover:bg-[#16161B]'
                  }`}
                >
                  <div
                    className={`${
                      isShelfExpanded ? 'w-24' : 'w-20 sm:w-24'
                    } aspect-[2/3] transition-transform duration-150 group-hover:-translate-y-0.5`}
                  >
                    <ProductImage6x9
                      src={shelfItem.image}
                      title={shelfItem.title}
                      author={shelfItem.specs.author}
                      category={shelfItem.category}
                      pedestal={false}
                    />
                  </div>
                  <span className="mt-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#111111] dark:text-zinc-300 line-clamp-2 leading-tight">
                    {shelfItem.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6x9 Sample Preview Modal */}
      <BookPreviewModal
        item={item}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </section>
  );
}
