import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import {
  CatalogItem,
  getDefaultSelectedFormat,
  getEffectivePrice,
  getPhysicalFormatLabel,
  isBookLikeCategory,
  useCatalog,
} from '../context/CatalogContext';
import ProductImage6x9 from './ProductImage6x9';
import { triggerDemoPdfDownload } from '../utils/ebookDownload';
import { useToast } from '../context/ToastContext';
import { haptic } from '../utils/haptics';

interface EditorialDetailViewProps {
  item: CatalogItem;
  onBack: () => void;
  onBuyNow: (item: CatalogItem, format?: 'physical' | 'ebook') => void;
}

export default function EditorialDetailView({
  item,
  onBack,
  onBuyNow,
}: EditorialDetailViewProps) {
  const { addToCart, cartCount, setIsCartOpen } = useCatalog();
  const { showToast } = useToast();
  const [activeSlide, setActiveSlide] = useState(0);

  const isIgnou = item.category === 'IGNOU';
  const physicalFormatLabel = getPhysicalFormatLabel(item);

  const bookFormatMode = isBookLikeCategory(item.category)
    ? item.bookFormat || 'ebook'
    : 'physical';

  const [selectedFormat, setSelectedFormat] = useState<'physical' | 'ebook'>(
    getDefaultSelectedFormat(item)
  );

  useEffect(() => {
    setSelectedFormat(getDefaultSelectedFormat(item));
    setActiveSlide(0);
  }, [item]);

  const previewPages =
    item.previewPages && item.previewPages.length > 0
      ? item.previewPages
      : [
          {
            pageNumber: 1,
            heading: item.title,
            body: item.description,
          },
          {
            pageNumber: 2,
            heading: 'Edition Specifications & Colophon',
            body: `Published by ${item.specs?.publisher || 'LEKHIX Press'}. Authored by ${
              item.specs?.author || 'LEKHIX Editions'
            }. Format: ${item.specs?.format || '6 × 9 in'}. ${
              item.specs?.features || 'Archival Edition'
            }. Language: ${item.specs?.language || 'English'}. ISBN: ${
              item.specs?.isbn || ''
            }.`,
          },
        ];

  // Slide 0 = Front Cover, Slides 1..N = Inline 6x9 Preview Pages
  const totalSlides = previewPages.length + 1;

  const handleNextSlide = () => {
    haptic.light();
    setActiveSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    haptic.light();
    setActiveSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleOpenDemoPdf = (which: 'main' | 'synopsis' = 'main') => {
    haptic.medium();
    const downloadedName = triggerDemoPdfDownload(item, which);
    if (downloadedName) {
      showToast({
        message: `Opening Demo PDF: ${downloadedName}`,
        type: 'info',
        duration: 2800,
      });
    }
  };

  const activePrice = getEffectivePrice(item, selectedFormat);

  const sentences = item.description.split(/(?<=\.)\s+/);
  const leadParagraph = sentences.slice(0, 2).join(' ');
  const bodyParagraph =
    sentences.slice(2).join(' ') ||
    'Crafted to strict 6 × 9 inch archival standards with acid-free paper and durable studio binding.';

  return (
    <section className="w-full bg-[#FFFFFF] dark:bg-[#0E0E11] border-b border-[#E5E5E0] dark:border-[#222227]">
      {/* Sub-Navigation Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 h-13 sm:h-14 flex items-center justify-between border-b border-[#ECECE7] dark:border-[#222227] text-xs">
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
          {item.category} Listing
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

      {/* Main 2-Column Editorial Detail Layout */}
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        {/* Left Column (Cols 1-5): Inline 6x9 Slide Preview + Free Demo PDF Buttons */}
        <div className="lg:col-span-5 p-6 sm:p-10 md:p-14 lg:p-16 flex flex-col items-center justify-center relative">
          <div className="relative flex flex-col items-center w-full max-w-[272px] sm:max-w-[288px]">
            {/* 6x9 Pedestal & Shadowed Slide Frame */}
            <div
              onClick={handleNextSlide}
              className="relative w-full bg-[#F2F2EE] dark:bg-[#141417] px-4 pt-8 pb-4 sm:px-5 sm:pt-9 sm:pb-5 cursor-pointer group select-none"
              title="Tap to flip through 6×9 preview pages"
            >
              <div className="relative w-full aspect-[2/3]">
                {item.soldOut && (
                  <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-20 px-3 py-0.5 bg-[#8B1A1A] text-white text-[9px] font-bold uppercase tracking-[0.18em] whitespace-nowrap shadow-sm">
                    SOLD OUT
                  </span>
                )}
                <div className="w-full h-full shadow-[0_20px_40px_-12px_rgba(0,0,0,0.28)] dark:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)] overflow-hidden relative">
                  {activeSlide === 0 ? (
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
                  ) : (
                    /* Inline 6x9 Archival Page Spread */
                    <div className="w-full h-full p-5 sm:p-6 flex flex-col justify-between bg-[#FCFBF7] dark:bg-[#18181D] text-[#18181B] dark:text-[#F4F4F6] border border-black/10 dark:border-white/10">
                      <div className="flex items-center justify-between text-[9px] font-bold tracking-[0.18em] uppercase text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        <span className="truncate max-w-[140px]">LEKHIX EDITION</span>
                        <span className="tabular-nums shrink-0">
                          P. {previewPages[activeSlide - 1].pageNumber}
                        </span>
                      </div>

                      <div className="my-auto py-3 overflow-y-auto hide-scrollbar">
                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1.5">
                          EXCERPT 0{activeSlide}
                        </p>
                        <h3 className="font-editorial text-lg sm:text-xl font-semibold mb-2.5 leading-snug text-[#111111] dark:text-white">
                          {previewPages[activeSlide - 1].heading}
                        </h3>
                        <p className="text-[11px] sm:text-xs leading-[1.65] text-zinc-600 dark:text-zinc-300">
                          {previewPages[activeSlide - 1].body}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[8px] font-bold tracking-[0.18em] uppercase text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <span>6 × 9 INCH PAGE</span>
                        <span className="tabular-nums">
                          0{activeSlide + 1} / 0{totalSlides}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inline Slide Controls Below the 6x9 Frame */}
            <div className="mt-5 w-full flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handlePrevSlide}
                className="p-2 border border-[#E5E5E0] dark:border-[#26262B] text-[#111111] dark:text-white hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer"
                aria-label="Previous preview slide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleNextSlide}
                className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#111111] dark:text-zinc-200 hover:opacity-70 transition-opacity cursor-pointer tabular-nums"
              >
                {activeSlide === 0
                  ? `CLICK FOR PREVIEW · 01 / 0${totalSlides}`
                  : `PREVIEW PAGE 0${activeSlide} · 0${activeSlide + 1} / 0${totalSlides}`}
              </button>

              <button
                type="button"
                onClick={handleNextSlide}
                className="p-2 border border-[#E5E5E0] dark:border-[#26262B] text-[#111111] dark:text-white hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer"
                aria-label="Next preview slide"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Free Demo / Sample PDF Buttons Below 6x9 Preview */}
            {item.synopsisDemoPdfUrl && (
              <button
                type="button"
                onClick={() => handleOpenDemoPdf('synopsis')}
                className="mt-3.5 w-full px-4 py-2.5 border border-[#111111] dark:border-white text-[10px] font-bold uppercase tracking-[0.18em] text-[#111111] dark:text-white hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>SYNOPSIS DEMO PDF</span>
              </button>
            )}

            {item.demoPdfUrl && (
              <button
                type="button"
                onClick={() => handleOpenDemoPdf('main')}
                className="mt-2.5 w-full px-4 py-2.5 border border-[#111111] dark:border-white text-[10px] font-bold uppercase tracking-[0.18em] text-[#111111] dark:text-white hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>
                  {isIgnou && item.ignouMaterialType === 'Project'
                    ? 'PROJECT DEMO PDF'
                    : 'VIEW / DOWNLOAD DEMO PDF'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column (Cols 6-12): Editorial Typography, IGNOU Course Info, Format Selector, Demo PDF & Purchase Module */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-14 lg:py-16 lg:px-12 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[#ECECE7] dark:border-[#222227]">
          <div className="max-w-2xl">
            {isIgnou && (
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-2">
                {[
                  'IGNOU',
                  item.ignouDegree,
                  item.ignouYear,
                  item.ignouProgramCode,
                  item.ignouMaterialType === 'Project'
                    ? 'PROJECT / SYNOPSIS'
                    : 'SOLVED ASSIGNMENT',
                  item.ignouCourseCode,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}

            <h1
              className="font-editorial text-2xl sm:text-4xl md:text-[42px] font-semibold text-[#111111] dark:text-[#F5F5F7] leading-[1.12] tracking-tight mb-2.5"
              style={{ textWrap: 'balance' }}
            >
              {item.title}
            </h1>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
              by{' '}
              <span className="font-bold uppercase tracking-[0.14em] text-[#111111] dark:text-[#F5F5F7]">
                {item.specs?.author}
              </span>
            </p>

            {/* IGNOU Programme & Course Hierarchy Block */}
            {isIgnou && (
              <div className="mb-6 p-4 bg-[#FAFAFA] dark:bg-[#15151A] border border-[#E5E5E0] dark:border-[#26262B] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-0.5">
                    Degree Programme
                  </span>
                  <span className="font-bold text-[#111111] dark:text-white">
                    {item.ignouDegree || 'IGNOU Programme'}
                  </span>
                </div>
                {item.ignouYear && (
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-0.5">
                      Academic Year
                    </span>
                    <span className="font-bold text-[#111111] dark:text-white tabular-nums">
                      {item.ignouYear}
                    </span>
                  </div>
                )}
                {(item.ignouProgramCode || item.ignouProgramName) && (
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-0.5">
                      Program
                    </span>
                    <span className="font-bold text-[#111111] dark:text-white">
                      {[item.ignouProgramCode, item.ignouProgramName]
                        .filter(Boolean)
                        .join(' — ')}
                    </span>
                  </div>
                )}
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-0.5">
                    Material Type
                  </span>
                  <span className="font-bold text-[#111111] dark:text-white">
                    {item.ignouMaterialType === 'Project'
                      ? 'Project / Synopsis'
                      : 'Solved Assignment'}
                  </span>
                </div>
                {item.ignouCourseCode && (
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-0.5">
                      Course Code
                    </span>
                    <span className="font-bold text-[#111111] dark:text-white tabular-nums">
                      {item.ignouCourseCode}
                    </span>
                  </div>
                )}
                {item.ignouCourseTitle && (
                  <div>
                    <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-0.5">
                      Course Title
                    </span>
                    <span className="font-semibold text-[#111111] dark:text-white">
                      {item.ignouCourseTitle}
                    </span>
                  </div>
                )}
              </div>
            )}

            <p className="font-editorial italic text-base sm:text-[19px] leading-relaxed text-[#27272A] dark:text-zinc-200 mb-4">
              {leadParagraph}
            </p>

            <p className="text-xs sm:text-[13px] leading-[1.8] text-zinc-600 dark:text-zinc-400 mb-6">
              {bodyParagraph}
            </p>

            {/* Book / IGNOU / Custom Edition Format Selector */}
            {isBookLikeCategory(item.category) && (
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-2.5">
                  FORMAT
                </p>
                {bookFormatMode === 'both' ? (
                  <div className="inline-flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setSelectedFormat('physical');
                      }}
                      className={`px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                        selectedFormat === 'physical'
                          ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                          : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36] hover:border-[#111111] dark:hover:border-white'
                      }`}
                    >
                      {physicalFormatLabel} · ₹{item.price.toLocaleString('en-IN')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setSelectedFormat('ebook');
                      }}
                      className={`px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                        selectedFormat === 'ebook'
                          ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                          : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36] hover:border-[#111111] dark:hover:border-white'
                      }`}
                    >
                      {isIgnou ? 'PDF' : 'EBOOK PDF'} · ₹
                      {(item.ebookPrice || item.price).toLocaleString('en-IN')}
                    </button>
                  </div>
                ) : bookFormatMode === 'ebook' ? (
                  <div className="inline-block px-3.5 py-2 border border-[#111111] dark:border-white text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111] dark:text-white">
                    {isIgnou ? 'PDF' : 'EBOOK PDF'}
                  </div>
                ) : (
                  <div className="inline-block px-3.5 py-2 border border-[#111111] dark:border-white text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111] dark:text-white">
                    {physicalFormatLabel}
                  </div>
                )}
              </div>
            )}

            {/* Purchase & Free Demo PDF Module */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pb-8 mb-8 border-b border-[#ECECE7] dark:border-[#222227]">
              {item.soldOut ? (
                <>
                  <button
                    type="button"
                    disabled
                    className="px-6 sm:px-7 py-3 bg-[#8B1A1A] text-white text-xs font-bold tracking-[0.18em] uppercase cursor-not-allowed whitespace-nowrap"
                  >
                    SOLD OUT
                  </button>
                  <span className="text-xs font-bold tabular-nums text-zinc-500 dark:text-zinc-400">
                    ₹{activePrice.toLocaleString('en-IN')}
                  </span>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      haptic.medium();
                      onBuyNow(item, selectedFormat);
                    }}
                    className="px-6 sm:px-7 py-3 border border-[#1E3A5F] dark:border-white text-xs font-bold tracking-[0.18em] uppercase text-[#111111] dark:text-white hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer tabular-nums whitespace-nowrap"
                  >
                    {selectedFormat === 'ebook'
                      ? isIgnou
                        ? 'BUY PDF'
                        : 'BUY EBOOK (PDF)'
                      : isIgnou
                      ? `BUY ${physicalFormatLabel}`
                      : 'BUY'}{' '}
                    ₹{activePrice.toLocaleString('en-IN')}
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
                </>
              )}

              {/* Free Demo PDF Download Buttons alongside Buy / Add to Cart */}
              {item.synopsisDemoPdfUrl && (
                <button
                  type="button"
                  onClick={() => handleOpenDemoPdf('synopsis')}
                  className="px-4 py-3 border border-[#D4D4D0] dark:border-[#2E2E36] text-[11px] font-bold tracking-[0.16em] uppercase text-[#111111] dark:text-white hover:border-[#111111] dark:hover:border-white transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>SYNOPSIS DEMO</span>
                </button>
              )}

              {item.demoPdfUrl && (
                <button
                  type="button"
                  onClick={() => handleOpenDemoPdf('main')}
                  className="px-4 py-3 border border-[#D4D4D0] dark:border-[#2E2E36] text-[11px] font-bold tracking-[0.16em] uppercase text-[#111111] dark:text-white hover:border-[#111111] dark:hover:border-white transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>
                    {isIgnou && item.ignouMaterialType === 'Project'
                      ? 'PROJECT DEMO'
                      : 'DEMO PDF'}
                  </span>
                </button>
              )}
            </div>

            {/* Structured 2-Column × 3-Row Specifications Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-xs pb-8 mb-8 border-b border-[#ECECE7] dark:border-[#222227]">
              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  Editors
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 truncate">
                  {item.specs?.publisher}
                </span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  Features
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 truncate">
                  {selectedFormat === 'ebook'
                    ? 'Instant PDF Download · High-Res'
                    : isIgnou
                    ? `${physicalFormatLabel} Edition`
                    : item.specs?.features}
                </span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  Release Date
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 truncate">
                  {item.specs?.releaseDate}
                </span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  Language
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 truncate">
                  {item.specs?.language}
                </span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  Format
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 tabular-nums truncate">
                  {selectedFormat === 'ebook'
                    ? isIgnou
                      ? 'PDF'
                      : '6 × 9 in · Digital PDF'
                    : isIgnou
                    ? physicalFormatLabel
                    : item.specs?.format}
                </span>
              </div>

              <div className="flex items-baseline justify-between sm:justify-start gap-4">
                <span className="w-24 shrink-0 font-bold text-[#111111] dark:text-zinc-200">
                  {isIgnou ? 'Course Code' : 'ISBN'}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 tabular-nums truncate">
                  {isIgnou
                    ? item.ignouCourseCode || item.specs?.isbn
                    : item.specs?.isbn}
                </span>
              </div>
            </div>

            {item.specs?.reviewerQuote && (
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
      </div>
    </section>
  );
}
