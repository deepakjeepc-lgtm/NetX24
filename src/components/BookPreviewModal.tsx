import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CatalogItem } from '../context/CatalogContext';
import ProductImage6x9 from './ProductImage6x9';

interface BookPreviewModalProps {
  item: CatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookPreviewModal({ item, isOpen, onClose }: BookPreviewModalProps) {
  const [activeSpread, setActiveSpread] = useState(0);

  if (!isOpen || !item) return null;

  const pages =
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
            body: `Published by ${item.specs.publisher}. Authored/Designed by ${item.specs.author}. Format: ${item.specs.format} (6 × 9 inches). ${item.specs.features}. Language: ${item.specs.language}. Identifier: ${item.specs.isbn}.`,
          },
        ];

  const totalViews = pages.length + 1; // 0 = 6x9 Cover Plate, 1..N = Sample Pages

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/75 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#FFFFFF] dark:bg-[#111114] text-[#111111] dark:text-[#F5F5F7] border border-[#E5E5E0] dark:border-[#26262B] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E0] dark:border-[#26262B]">
          <div className="flex items-center gap-3 text-xs tracking-[0.15em] uppercase text-zinc-500 dark:text-zinc-400">
            <span>6 × 9 INCH EDITION PREVIEW</span>
            <span>·</span>
            <span className="text-[#111111] dark:text-white font-semibold truncate max-w-xs">
              {item.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main 6x9 Proportion Reader Body */}
        <div className="p-6 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 bg-[#F6F6F3] dark:bg-[#0D0D10]">
          {/* Left: Strict 6x9 Cover or Page Frame */}
          <div className="w-60 sm:w-72 shrink-0 aspect-[2/3] overflow-hidden">
            {activeSpread === 0 ? (
              <ProductImage6x9
                src={item.image}
                title={item.title}
                author={item.specs.author}
                category={item.category}
                pedestal={false}
              />
            ) : (
              <div className="w-full h-full p-7 flex flex-col justify-between bg-[#FCFBF7] dark:bg-[#16161A] text-[#18181B] dark:text-[#E4E4E7]">
                <div className="flex items-center justify-between text-[10px] tracking-[0.18em] uppercase text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <span>LEKHIX</span>
                  <span className="tabular-nums">
                    P. {pages[activeSpread - 1].pageNumber}
                  </span>
                </div>
                <div className="my-auto py-4">
                  <h4 className="font-editorial text-xl font-semibold mb-3 leading-snug">
                    {pages[activeSpread - 1].heading}
                  </h4>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {pages[activeSpread - 1].body}
                  </p>
                </div>
                <div className="text-[9px] tracking-[0.2em] uppercase text-zinc-400 text-center pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  6 × 9 INCH ARCHIVAL PLATE
                </div>
              </div>
            )}
          </div>

          {/* Right: Editorial Excerpt & Navigation */}
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-2">
                {activeSpread === 0
                  ? 'FRONT COVER · 6 × 9 IN (15.2 × 22.9 CM)'
                  : `EXCERPT SPREAD 0${activeSpread}`}
              </p>
              <h3 className="font-editorial text-2xl md:text-3xl font-semibold text-[#111111] dark:text-white mb-2">
                {activeSpread === 0 ? item.title : pages[activeSpread - 1].heading}
              </h3>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 mb-5">
                by {item.specs.author}
              </p>
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {activeSpread === 0 ? item.description : pages[activeSpread - 1].body}
              </p>
            </div>

            <div className="pt-6 border-t border-[#E5E5E0] dark:border-[#26262B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setActiveSpread((prev) => (prev - 1 + totalViews) % totalViews)
                  }
                  className="px-3.5 py-2 border border-[#111111]/25 dark:border-white/25 text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  onClick={() => setActiveSpread((prev) => (prev + 1) % totalViews)}
                  className="px-3.5 py-2 border border-[#111111]/25 dark:border-white/25 text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs font-semibold tracking-[0.2em] tabular-nums text-zinc-500 dark:text-zinc-400">
                0{activeSpread + 1} / 0{totalViews}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
