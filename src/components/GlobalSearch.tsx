import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { CatalogItem, useCatalog } from '../context/CatalogContext';
import ProductImage6x9 from './ProductImage6x9';
import { haptic } from '../utils/haptics';

interface GlobalSearchProps {
  onSelectProduct?: (item: CatalogItem) => void;
}

export default function GlobalSearch({ onSelectProduct }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { catalog } = useCatalog();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const searchLower = query.toLowerCase().trim();
  const results = searchLower
    ? catalog.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.specs.author.toLowerCase().includes(searchLower) ||
          item.specs.isbn.toLowerCase().includes(searchLower)
      )
    : catalog.slice(0, 4);

  const modalContent = isOpen ? (
    <div
      className="fixed inset-0 z-[200] bg-black/65 flex items-start justify-center pt-[10vh] px-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#111114] border border-[#E5E5E0] dark:border-[#26262B] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-6 py-4 border-b border-[#E5E5E0] dark:border-[#26262B]">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, authors, ISBN, or stationery..."
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-[#111111] dark:text-[#F5F5F7] placeholder:text-zinc-400"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-zinc-400 hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close Search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">
            {searchLower ? `RESULTS (${results.length})` : 'CURATED EDITIONS'}
          </p>

          {results.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-500">
              No matching books or stationery found for “{query}”.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    haptic.selection();
                    setIsOpen(false);
                    onSelectProduct?.(item);
                  }}
                  className="flex items-center gap-4 p-3 text-left bg-[#FAFAFA] dark:bg-[#16161B] hover:bg-[#F2F2EE] dark:hover:bg-[#1E1E24] border border-[#ECECE7] dark:border-[#242429] transition-colors cursor-pointer"
                >
                  <div className="w-12 aspect-[2/3] shrink-0 shadow-sm">
                    <ProductImage6x9
                      src={item.image}
                      title={item.title}
                      author={item.specs.author}
                      category={item.category}
                      pedestal={false}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#111111] dark:text-[#F5F5F7] truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums mt-1">
                      ₹{item.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => {
          haptic.light();
          setIsOpen(true);
        }}
        className="p-2 text-[#111111] dark:text-[#F5F5F7] hover:opacity-65 transition-opacity cursor-pointer"
        aria-label="Search Catalog"
        title="Search Catalog"
      >
        <Search className="w-4 h-4" strokeWidth={1.75} />
      </button>
      {typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent}
    </>
  );
}
