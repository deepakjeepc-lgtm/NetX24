import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Upload,
  Star,
  RotateCcw,
} from 'lucide-react';
import {
  BookFormat,
  CatalogItem,
  INITIAL_CATALOG,
  useCatalog,
} from '../../context/CatalogContext';
import ProductImage6x9 from '../ProductImage6x9';
import { useToast } from '../../context/ToastContext';

const EMPTY_ITEM: CatalogItem = {
  id: '',
  title: '',
  category: 'Books',
  price: 590,
  originalPrice: undefined,
  bookFormat: 'ebook',
  ebookPrice: 590,
  ebookPdfUrl: '',
  ebookFileName: '',
  image: '/catalog/book-debt.png?v=4',
  featured: false,
  description: '',
  specs: {
    author: 'LEKHIX Editions',
    publisher: 'LEKHIX Press',
    releaseDate: 'Oct 2026',
    format: '6 × 9 in · PDF Edition',
    features: 'Digital PDF Edition, 256 pages',
    language: 'English',
    isbn: '978-3-89955-000-0',
    reviewerName: '',
    reviewerQuote: '',
  },
};

type AdminFilterCategory = 'All' | 'Books' | 'eBooks' | 'PhysicalBooks' | 'Stationery';

export default function CatalogManager() {
  const { catalog, saveCatalog } = useCatalog();
  const { showToast } = useToast();

  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterCat, setFilterCat] = useState<AdminFilterCategory>('All');
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const startCreate = (presetFormat: BookFormat = 'ebook') => {
    setIsCreating(true);
    setEditingItem({
      ...EMPTY_ITEM,
      id: `item-${Date.now()}`,
      category: 'Books',
      bookFormat: presetFormat,
      price: presetFormat === 'ebook' ? 590 : 1450,
      ebookPrice: 590,
      specs: {
        ...EMPTY_ITEM.specs,
        format: presetFormat === 'ebook' ? '6 × 9 in · PDF Edition' : '6 × 9 in',
        features:
          presetFormat === 'ebook'
            ? 'Digital PDF Edition, 256 pages'
            : 'Hardcover, 256 pages',
      },
    });
  };

  const startEdit = (item: CatalogItem) => {
    setIsCreating(false);
    const copy: CatalogItem = JSON.parse(JSON.stringify(item));
    if (copy.category === 'Books' && !copy.bookFormat) {
      copy.bookFormat = 'ebook';
    }
    setEditingItem(copy);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetW = 400;
        const targetH = 600; // Exact 6x9 ratio (2:3)
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#F2F2EE';
          ctx.fillRect(0, 0, targetW, targetH);
          const scale = Math.max(targetW / img.width, targetH / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const offsetX = (targetW - drawW) / 2;
          const offsetY = (targetH - drawH) / 2;
          ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
          setEditingItem({ ...editingItem, image: dataUrl });
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast({
        message: 'Please select a valid .pdf file for the eBook.',
        type: 'error',
        duration: 3000,
      });
      return;
    }

    setUploadingPdf(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64Data = ev.target?.result as string;
      try {
        const res = await fetch('/api/upload-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            base64Data,
          }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setEditingItem((prev) =>
            prev
              ? {
                  ...prev,
                  ebookPdfUrl: data.url,
                  ebookFileName: file.name,
                }
              : null
          );
          showToast({
            message: `PDF uploaded: ${file.name}`,
            type: 'success',
            duration: 3000,
          });
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch {
        if (file.size <= 650 * 1024) {
          setEditingItem((prev) =>
            prev
              ? {
                  ...prev,
                  ebookPdfUrl: base64Data,
                  ebookFileName: file.name,
                }
              : null
          );
          showToast({
            message: `PDF attached: ${file.name}`,
            type: 'success',
            duration: 3000,
          });
        } else {
          showToast({
            message: 'PDF upload failed. You can also paste an external PDF link.',
            type: 'error',
            duration: 3500,
          });
        }
      } finally {
        setUploadingPdf(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) return;

    setSaving(true);
    try {
      const cleanedItem: CatalogItem = { ...editingItem };
      if (cleanedItem.category === 'Books') {
        cleanedItem.bookFormat = cleanedItem.bookFormat || 'ebook';
        if (cleanedItem.bookFormat === 'ebook') {
          cleanedItem.ebookPrice = cleanedItem.price;
        } else if (cleanedItem.bookFormat === 'physical') {
          delete cleanedItem.ebookPrice;
          delete cleanedItem.ebookPdfUrl;
          delete cleanedItem.ebookFileName;
        } else if (
          cleanedItem.bookFormat === 'both' &&
          (!cleanedItem.ebookPrice || cleanedItem.ebookPrice <= 0)
        ) {
          cleanedItem.ebookPrice = Math.round(cleanedItem.price * 0.5);
        }
      } else {
        delete cleanedItem.bookFormat;
        delete cleanedItem.ebookPrice;
        delete cleanedItem.ebookPdfUrl;
        delete cleanedItem.ebookFileName;
      }

      const updated = isCreating
        ? [cleanedItem, ...catalog]
        : catalog.map((i) => (i.id === cleanedItem.id ? cleanedItem : i));
      await saveCatalog(updated);
      setEditingItem(null);
      setIsCreating(false);
      showToast({
        message: isCreating ? 'New edition added to catalog.' : 'Edition updated.',
        type: 'success',
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const updated = catalog.filter((i) => i.id !== id);
    await saveCatalog(updated);
    showToast({ message: 'Removed from catalog.', type: 'info', duration: 2500 });
  };

  const handleToggleFeatured = async (item: CatalogItem) => {
    const updated = catalog.map((i) =>
      i.id === item.id ? { ...i, featured: !i.featured } : i
    );
    await saveCatalog(updated);
  };

  const handleRestoreDefaults = async () => {
    await saveCatalog(INITIAL_CATALOG);
    showToast({
      message: 'Default LEKHIX Books, eBooks & Stationery catalog restored.',
      type: 'info',
      duration: 3000,
    });
  };

  const visibleItems = catalog.filter((i) => {
    if (filterCat === 'All') return true;
    if (filterCat === 'eBooks') {
      return (
        i.category === 'Books' &&
        (i.bookFormat === 'ebook' || i.bookFormat === 'both' || !i.bookFormat)
      );
    }
    if (filterCat === 'PhysicalBooks') {
      return (
        i.category === 'Books' &&
        (i.bookFormat === 'physical' || i.bookFormat === 'both')
      );
    }
    return i.category === filterCat;
  });

  const getTabCount = (cat: AdminFilterCategory) => {
    if (cat === 'All') return catalog.length;
    if (cat === 'eBooks') {
      return catalog.filter(
        (i) =>
          i.category === 'Books' &&
          (i.bookFormat === 'ebook' || i.bookFormat === 'both' || !i.bookFormat)
      ).length;
    }
    if (cat === 'PhysicalBooks') {
      return catalog.filter(
        (i) =>
          i.category === 'Books' &&
          (i.bookFormat === 'physical' || i.bookFormat === 'both')
      ).length;
    }
    return catalog.filter((i) => i.category === cat).length;
  };

  const getFormatLabel = (item: CatalogItem) => {
    if (item.category !== 'Books') return item.specs.format;
    const fmt = item.bookFormat || 'ebook';
    if (fmt === 'ebook') return 'EBOOK ONLY (PDF)';
    if (fmt === 'physical') return 'PHYSICAL ONLY (6×9 IN)';
    return 'BOTH (PHYSICAL + EBOOK PDF)';
  };

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E5E0] dark:border-[#26262B]">
        <div>
          <h2 className="font-editorial text-2xl font-semibold text-[#111111] dark:text-white">
            Books, eBooks (PDF) &amp; Stationery Catalog
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            New books default to eBook (PDF). Each book can be set to eBook Only, Physical Only, or Both.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="px-3.5 py-2.5 border border-[#D4D4D0] dark:border-[#2E2E36] text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 hover:border-[#111111] dark:hover:border-white transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={() => startCreate('ebook')}
            className="px-4 py-2.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.16em] hover:opacity-85 transition-opacity cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Add Book / Stationery
          </button>
        </div>
      </div>

      {/* Editor Drawer / Form */}
      {editingItem && (
        <form
          onSubmit={handleSaveItem}
          className="p-5 sm:p-6 md:p-8 bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] space-y-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#ECECE7] dark:border-[#242429]">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em]">
              {isCreating ? 'CREATE NEW 6×9 EDITION' : `EDITING: ${editingItem.title}`}
            </h3>
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="p-1 text-zinc-400 hover:text-[#111111] dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Live 6x9 Cover Preview & Upload */}
            <div className="lg:col-span-4 flex flex-col items-center">
              <div className="w-44 sm:w-48 aspect-[2/3] border border-[#E5E5E0] dark:border-[#26262B] shadow-lg overflow-hidden mb-4">
                <ProductImage6x9
                  src={editingItem.image}
                  title={editingItem.title || 'Untitled Edition'}
                  author={editingItem.specs.author}
                  category={editingItem.category}
                />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-3">
                6 × 9 INCH PREVIEW (2:3)
              </p>

              <label className="w-full max-w-xs px-4 py-2.5 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors inline-flex items-center justify-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload 6×9 Cover</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <div className="w-full max-w-xs mt-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Or Image Path / URL
                </label>
                <input
                  type="text"
                  value={editingItem.image}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, image: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none"
                />
              </div>
            </div>

            {/* Right: Core Metadata, Book Format Option (Default: eBook Only, Physical Only, or Both) */}
            <div className="lg:col-span-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                    Title (No extra subtitle on grid)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.title}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, title: e.target.value })
                    }
                    placeholder="e.g. Debt — The First 5,000 Years"
                    className="w-full px-3.5 py-2.5 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                    Category
                  </label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => {
                      const nextCat = e.target.value as 'Books' | 'Stationery';
                      setEditingItem({
                        ...editingItem,
                        category: nextCat,
                        bookFormat:
                          nextCat === 'Books'
                            ? editingItem.bookFormat || 'ebook'
                            : undefined,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#2E2E36] outline-none"
                  >
                    <option value="Books">Books</option>
                    <option value="Stationery">Stationery</option>
                  </select>
                </div>

                {/* Book Format Selector: Default eBook Only (PDF), Physical Only, or Both */}
                {editingItem.category === 'Books' && (
                  <div className="sm:col-span-2 p-4 bg-[#FAFAFA] dark:bg-[#18181D] border border-[#E5E5E0] dark:border-[#26262B] space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#111111] dark:text-white mb-2">
                        Book Edition Type (Default: eBook PDF · Or Physical Only · Or Both)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {(
                          [
                            {
                              id: 'ebook',
                              label: 'eBook Only (PDF Download)',
                            },
                            {
                              id: 'physical',
                              label: 'Physical Only (6×9 Book)',
                            },
                            {
                              id: 'both',
                              label: 'Both (Physical + eBook PDF)',
                            },
                          ] as const
                        ).map((opt) => {
                          const active =
                            (editingItem.bookFormat || 'ebook') === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                setEditingItem({
                                  ...editingItem,
                                  bookFormat: opt.id,
                                })
                              }
                              className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider border text-left transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                                  : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36] hover:border-[#111111] dark:hover:border-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* PDF Upload & URL Section when eBook or Both is selected */}
                    {(editingItem.bookFormat === 'ebook' ||
                      editingItem.bookFormat === 'both' ||
                      !editingItem.bookFormat) && (
                      <div className="pt-3 border-t border-[#E5E5E0] dark:border-[#26262B] grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                        {editingItem.bookFormat === 'both' && (
                          <div className="sm:col-span-4">
                            <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                              eBook PDF Price (₹ INR)
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={editingItem.ebookPrice || ''}
                              onChange={(e) =>
                                setEditingItem({
                                  ...editingItem,
                                  ebookPrice: Number(e.target.value),
                                })
                              }
                              placeholder="e.g. 590"
                              className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#2E2E36] outline-none tabular-nums"
                            />
                          </div>
                        )}

                        <div
                          className={
                            editingItem.bookFormat === 'both'
                              ? 'sm:col-span-4'
                              : 'sm:col-span-6'
                          }
                        >
                          <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                            Upload eBook PDF File
                          </label>
                          <label className="w-full px-3.5 py-2 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {uploadingPdf
                                ? 'Uploading PDF...'
                                : editingItem.ebookFileName
                                ? 'Replace PDF File'
                                : 'Choose .PDF File'}
                            </span>
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              onChange={handlePdfUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div
                          className={
                            editingItem.bookFormat === 'both'
                              ? 'sm:col-span-4'
                              : 'sm:col-span-6'
                          }
                        >
                          <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                            Or External PDF Download URL
                          </label>
                          <input
                            type="text"
                            value={editingItem.ebookPdfUrl || ''}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                ebookPdfUrl: e.target.value,
                              })
                            }
                            placeholder="https://... or /ebooks/file.pdf"
                            className="w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#2E2E36] outline-none"
                          />
                        </div>

                        {(editingItem.ebookFileName || editingItem.ebookPdfUrl) && (
                          <div className="sm:col-span-12 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300 bg-[#FFFFFF] dark:bg-[#141418] px-3 py-2 border border-[#E5E5E0] dark:border-[#26262B]">
                            <span className="truncate">
                              Attached PDF:{' '}
                              <strong className="text-[#111111] dark:text-white">
                                {editingItem.ebookFileName || editingItem.ebookPdfUrl}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingItem({
                                  ...editingItem,
                                  ebookPdfUrl: '',
                                  ebookFileName: '',
                                })
                              }
                              className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-600 ml-3 cursor-pointer whitespace-nowrap"
                            >
                              Clear PDF
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                    {editingItem.category === 'Books' &&
                    (editingItem.bookFormat === 'ebook' || !editingItem.bookFormat)
                      ? 'eBook PDF Price (₹ INR)'
                      : 'Physical Price (₹ INR)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingItem.price}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                    Original Price (Optional Strikethrough ₹)
                  </label>
                  <input
                    type="number"
                    value={editingItem.originalPrice || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        originalPrice: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Optional"
                    className="w-full px-3.5 py-2.5 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500 mb-1.5">
                  Editorial Synopsis
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none resize-none"
                />
              </div>

              {/* 6-Field Gestalten Specification Grid */}
              <div className="pt-2 border-t border-[#ECECE7] dark:border-[#242429]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-3">
                  EDITORIAL SPECIFICATIONS (SHOWN ON BOOK DETAIL VIEW)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">
                      Author / Designer
                    </label>
                    <input
                      type="text"
                      value={editingItem.specs.author}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          specs: { ...editingItem.specs, author: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">
                      Editors / Publisher
                    </label>
                    <input
                      type="text"
                      value={editingItem.specs.publisher}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          specs: { ...editingItem.specs, publisher: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">
                      Features / Pages
                    </label>
                    <input
                      type="text"
                      value={editingItem.specs.features}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          specs: { ...editingItem.specs, features: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">
                      Release Date
                    </label>
                    <input
                      type="text"
                      value={editingItem.specs.releaseDate}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          specs: {
                            ...editingItem.specs,
                            releaseDate: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">
                      Format (Default 6 × 9 in)
                    </label>
                    <input
                      type="text"
                      value={editingItem.specs.format}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          specs: { ...editingItem.specs, format: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">
                      ISBN / SKU
                    </label>
                    <input
                      type="text"
                      value={editingItem.specs.isbn}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          specs: { ...editingItem.specs, isbn: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-transparent border border-[#D4D4D0] dark:border-[#2E2E36] outline-none tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#ECECE7] dark:border-[#242429]">
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.featured}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, featured: e.target.checked })
                    }
                    className="accent-[#111111] dark:accent-white"
                  />
                  <span>Show in Hero Spotlight Carousel (01 — 04)</span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.18em] hover:opacity-85 transition-opacity cursor-pointer inline-flex items-center gap-2"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : 'Save Edition'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs: All | Books | eBooks (PDF) | Physical Books | Stationery */}
      <div className="flex items-center gap-5 overflow-x-auto hide-scrollbar text-xs font-bold uppercase tracking-[0.16em]">
        {(
          [
            { id: 'All', label: 'All' },
            { id: 'Books', label: 'All Books' },
            { id: 'eBooks', label: 'eBooks (PDF)' },
            { id: 'PhysicalBooks', label: 'Physical (6×9)' },
            { id: 'Stationery', label: 'Stationery' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCat(tab.id)}
            className={`pb-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filterCat === tab.id
                ? 'border-[#111111] dark:border-white text-[#111111] dark:text-white'
                : 'border-transparent text-zinc-400 hover:text-[#111111] dark:hover:text-white'
            }`}
          >
            {tab.label} ({getTabCount(tab.id)})
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] p-5 flex gap-5 items-start"
          >
            <div className="w-20 aspect-[2/3] shrink-0 border border-black/5 dark:border-white/10">
              <ProductImage6x9
                src={item.image}
                title={item.title}
                author={item.specs.author}
                category={item.category}
                pedestal={false}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-zinc-400 mb-1 truncate">
                <span>{item.category}</span>
                <span>·</span>
                <span className="tabular-nums text-[#111111] dark:text-zinc-300 font-semibold truncate">
                  {getFormatLabel(item)}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#111111] dark:text-white truncate">
                {item.title}
              </h4>
              <div className="flex flex-wrap items-baseline gap-2.5 mt-1 text-xs tabular-nums">
                {item.category === 'Books' && item.bookFormat === 'ebook' ? (
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    eBook PDF ₹{(item.ebookPrice || item.price).toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                    ₹{item.price.toLocaleString('en-IN')}
                  </span>
                )}
                {item.category === 'Books' &&
                  item.bookFormat === 'both' &&
                  item.ebookPrice && (
                    <span className="text-[11px] text-zinc-400">
                      · eBook PDF ₹{item.ebookPrice.toLocaleString('en-IN')}
                    </span>
                  )}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[#ECECE7] dark:border-[#222227]">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="text-[11px] font-bold uppercase tracking-wider text-[#111111] dark:text-white hover:opacity-70 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleFeatured(item)}
                  className={`text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer ${
                    item.featured
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                  }`}
                >
                  <Star className="w-3 h-3" fill={item.featured ? 'currentColor' : 'none'} />
                  <span>Hero</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="ml-auto text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
