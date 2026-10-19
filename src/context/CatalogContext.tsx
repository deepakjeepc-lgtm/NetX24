import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export type BookFormat = 'physical' | 'ebook' | 'both';

export interface ProductSpecs {
  author: string;
  publisher: string;
  releaseDate: string;
  format: string;
  features: string;
  language: string;
  isbn: string;
  reviewerName?: string;
  reviewerQuote?: string;
}

export interface PreviewPage {
  pageNumber: number;
  heading: string;
  body: string;
}

export interface CatalogItem {
  id: string;
  title: string;
  category: 'Books' | 'Stationery';
  price: number;
  originalPrice?: number;
  image: string;
  featured: boolean;
  description: string;
  specs: ProductSpecs;
  previewPages?: PreviewPage[];
  /** For Books: whether sold as Physical hardcover, Digital eBook (PDF), or Both */
  bookFormat?: BookFormat;
  /** Price in INR for the eBook (PDF) edition when bookFormat is 'ebook' or 'both' */
  ebookPrice?: number;
  /** Uploaded PDF file path/data URL or external PDF download link */
  ebookPdfUrl?: string;
  /** Original PDF filename for display and download */
  ebookFileName?: string;
}

export interface CartItem {
  product: CatalogItem;
  quantity: number;
  selectedFormat: 'physical' | 'ebook';
}

export function getEffectivePrice(
  product: CatalogItem,
  selectedFormat: 'physical' | 'ebook' = 'physical'
): number {
  if (
    product.category === 'Books' &&
    selectedFormat === 'ebook' &&
    typeof product.ebookPrice === 'number' &&
    product.ebookPrice > 0
  ) {
    return product.ebookPrice;
  }
  return Number(product.price);
}

export const INITIAL_CATALOG: CatalogItem[] = [
  {
    id: 'book-debt-first-5000',
    title: 'Debt — The First 5,000 Years',
    category: 'Books',
    price: 1450,
    originalPrice: 1800,
    bookFormat: 'both',
    ebookPrice: 650,
    ebookFileName: 'Debt_The_First_5000_Years_LEKHIX_Edition.pdf',
    image: '/catalog/book-debt.png?v=4',
    featured: true,
    description:
      'Diminutive rooms, grand possibilities. Here anthropologist David Graeber presents a stunning reversal of conventional wisdom: he shows that before there was money, there was debt. For more than 5,000 years, since the beginnings of the first agrarian empires, humans have used elaborate credit systems to buy and sell goods—that is, long before the invention of coins or cash.',
    specs: {
      author: 'David Graeber',
      publisher: 'LEKHIX Editions',
      releaseDate: 'May 2026',
      format: '6 × 9 in',
      features: 'Full color, 256 pages',
      language: 'English',
      isbn: '978-3-89955-698-8',
      reviewerName: 'Christopher Reath',
      reviewerQuote:
        'An essential foundational work on human reciprocity, value, and institutional memory—presented in a tactile 6×9 collector edition.',
    },
    previewPages: [
      {
        pageNumber: 1,
        heading: 'Chapter I · The Experience of Moral Confusion',
        body: 'Why is it that an obligation between two people can be transformed, by the simple application of arithmetic, into a cold and indisputable moral imperative? Across five millennia of recorded history, human societies have wrestled with the tension between interpersonal trust and quantified ledger keeping.',
      },
      {
        pageNumber: 14,
        heading: 'Chapter II · The Myth of Barter',
        body: 'Every textbook of economics begins with the same imaginary village in which neighbors trade arrowheads for shoes until they invent coinage. Yet anthropological archives reveal something far more sophisticated: credit systems predated bullion by thousands of years in Mesopotamia and the Indus Valley.',
      },
      {
        pageNumber: 42,
        heading: 'Colophon & 6×9 Edition Note',
        body: 'Set in Cormorant Garamond and Plus Jakarta Sans. Printed on 120gsm archival acid-free ivory paper and bound in vermilion bookcloth at 6 × 9 inches (15.2 × 22.9 cm).',
      },
    ],
  },
  {
    id: 'book-architecture-silence',
    title: 'The Architecture of Silence',
    category: 'Books',
    price: 1850,
    bookFormat: 'both',
    ebookPrice: 790,
    ebookFileName: 'The_Architecture_of_Silence_LEKHIX_Edition.pdf',
    image: '/catalog/book-architecture.png?v=4',
    featured: true,
    description:
      'An intimate architectural monograph exploring minimalist sacred spaces, raw concrete pavilions, and timber sanctuaries across Kyoto, Zurich, and Ahmedabad. Photographed entirely in natural dawn light and bound in tactile obsidian bookcloth.',
    specs: {
      author: 'Kenjiro Sato',
      publisher: 'LEKHIX Press',
      releaseDate: 'August 2026',
      format: '6 × 9 in',
      features: 'Linen hardcover, 312 pages',
      language: 'English',
      isbn: '978-3-89955-742-8',
      reviewerName: 'Alina Lindqvist',
      reviewerQuote:
        'Every spread breathes with stillness. The 6×9 vertical proportion frames architectural light and shadow with remarkable intimacy.',
    },
    previewPages: [
      {
        pageNumber: 1,
        heading: 'I · Light as Structural Material',
        body: 'When ornament is pared away to raw board-formed concrete and unvarnished hinoki cypress, daylight ceases to be passive illumination and becomes the primary room-defining element.',
      },
      {
        pageNumber: 28,
        heading: 'II · Courtyard Proportions',
        body: 'Measured drawings and dawn photographs of twelve contemplative courtyards, documenting acoustic stillness and seasonal shadow geometry.',
      },
    ],
  },
  {
    id: 'book-modern-typography',
    title: 'Forms of Modern Typography',
    category: 'Books',
    price: 1650,
    originalPrice: 1950,
    bookFormat: 'both',
    ebookPrice: 720,
    ebookFileName: 'Forms_of_Modern_Typography_LEKHIX_Edition.pdf',
    image: '/catalog/book-typography.png?v=4',
    featured: true,
    description:
      'A definitive study of Swiss grid systems, asymmetric page architecture, and contemporary editorial type foundries. Features archival specimen sheets, essays on negative space, and 6×9 trade book layout mathematics.',
    specs: {
      author: 'Emil Ruder & Clara Vance',
      publisher: 'LEKHIX Editions',
      releaseDate: 'October 2026',
      format: '6 × 9 in',
      features: 'Smyth-sewn hardcover, 288 pages',
      language: 'English',
      isbn: '978-3-89955-819-7',
      reviewerName: 'Marcus Weber',
      reviewerQuote:
        'A masterclass in typographic rhythm, margin geometry, and print production craftsmanship.',
    },
    previewPages: [
      {
        pageNumber: 1,
        heading: 'The Function of White Space',
        body: 'Typography is only legible when the unprinted paper speaks with equal clarity to the printed ink. The 6×9 inch page ratio offers a classic harmonic rectangle for sustained reading.',
      },
    ],
  },
  {
    id: 'stat-brass-fountain-pen',
    title: 'Machined Brass Fountain Pen',
    category: 'Stationery',
    price: 2400,
    image: '/catalog/stat-brass-pen.png?v=4',
    featured: true,
    description:
      'Precision-milled from solid C36000 billet brass with a German iridium fine nib and paired with our 50ml Carbon Archive ink bottle. Engineered for balanced weight and a warm patina that evolves with daily writing.',
    specs: {
      author: 'LEKHIX Atelier',
      publisher: 'LEKHIX Stationery',
      releaseDate: '2026 Collection',
      format: '6 × 9 in Presentation Box',
      features: 'Solid Brass + 50ml Archive Ink',
      language: 'Fine Nib (0.5mm)',
      isbn: 'LKX-ST-0041',
      reviewerName: 'Vikramaditya Sen',
      reviewerQuote:
        'Impeccable machining tolerances and effortless ink flow on uncoated cotton paper.',
    },
  },
  {
    id: 'book-spatial-craft',
    title: 'Spatial Craft & Material',
    category: 'Books',
    price: 1590,
    bookFormat: 'both',
    ebookPrice: 690,
    ebookFileName: 'Spatial_Craft_and_Material_LEKHIX_Edition.pdf',
    image: '/catalog/book-spatial.png?v=4',
    featured: false,
    description:
      'Examining tactile materiality in contemporary interior architecture—travertine stone, unbleached linen, blackened steel, and hand-thrown ceramics across twenty-four residences.',
    specs: {
      author: 'Aarav Mehta',
      publisher: 'LEKHIX Press',
      releaseDate: 'July 2026',
      format: '6 × 9 in',
      features: 'Uncoated Munken paper, 240 pages',
      language: 'English',
      isbn: '978-3-89955-902-6',
      reviewerName: 'Sora Takahashi',
      reviewerQuote:
        'Tactile, restrained, and deeply researched—an indispensable reference for spatial designers.',
    },
  },
  {
    id: 'stat-linen-monolith-journal',
    title: 'Linen Monolith 6×9 Journal',
    category: 'Stationery',
    price: 890,
    originalPrice: 1100,
    image: '/catalog/stat-linen-journal.png?v=4',
    featured: false,
    description:
      'Lay-flat thread-bound 6×9 inch studio notebook wrapped in Japanese charcoal bookcloth. Filled with 192 pages of 120gsm acid-free fountain-pen friendly ivory paper.',
    specs: {
      author: 'LEKHIX Atelier',
      publisher: 'LEKHIX Stationery',
      releaseDate: '2026 Collection',
      format: '6 × 9 in',
      features: '120gsm Ivory Paper, 192 Pages',
      language: 'Unruled / Dot Grid',
      isbn: 'LKX-ST-0018',
    },
  },
  {
    id: 'stat-architect-desk-holder',
    title: 'Copper Wire Desk Pen Holder',
    category: 'Stationery',
    price: 1250,
    image: '/catalog/stat-desk-holder.png?v=4',
    featured: false,
    description:
      'Hand-brazed geometric copper wire desk vessel paired with cedarwood graphite drafting pencils. Designed to bring architectural order to your reading and writing desk.',
    specs: {
      author: 'LEKHIX Atelier',
      publisher: 'LEKHIX Stationery',
      releaseDate: '2026 Collection',
      format: '6 × 9 in Studio Edition',
      features: 'Brushed Rose Copper & Weighted Base',
      language: 'Universal',
      isbn: 'LKX-ST-0029',
    },
  },
  {
    id: 'stat-black-binder-set',
    title: 'Matte Black Paper Clip Set',
    category: 'Stationery',
    price: 450,
    originalPrice: 600,
    image: '/catalog/stat-paper-clip.png?v=4',
    featured: false,
    description:
      'Heavy-gauge tempered spring steel binder clips in matte carbon finish. Ideal for securing manuscripts, looseleaf sketches, and bookmarking 6×9 trade editions.',
    specs: {
      author: 'LEKHIX Atelier',
      publisher: 'LEKHIX Stationery',
      releaseDate: '2026 Collection',
      format: '6 × 9 in Studio Pack',
      features: 'Tempered Black Steel, Set of 4',
      language: 'Universal',
      isbn: 'LKX-ST-0064',
    },
  },
  {
    id: 'book-botanical-index',
    title: 'The Nocturnal Botanical Index',
    category: 'Books',
    price: 1720,
    bookFormat: 'both',
    ebookPrice: 750,
    ebookFileName: 'The_Nocturnal_Botanical_Index_LEKHIX_Edition.pdf',
    image: '/catalog/book-botanical.png?v=4',
    featured: false,
    description:
      'An illustrated compendium of rare night-blooming flora, pressed herbarium plates, and botanical essays printed in deep indigo and silver metallic ink on cotton rag paper.',
    specs: {
      author: 'Elena Rostova',
      publisher: 'LEKHIX Editions',
      releaseDate: 'September 2026',
      format: '6 × 9 in',
      features: 'Clothbound Hardcover, 272 pages',
      language: 'English',
      isbn: '978-3-89955-954-5',
    },
  },
  {
    id: 'book-enduring-object',
    title: 'The Enduring Object',
    category: 'Books',
    price: 1680,
    originalPrice: 1990,
    bookFormat: 'both',
    ebookPrice: 740,
    ebookFileName: 'The_Enduring_Object_LEKHIX_Edition.pdf',
    image: '/catalog/book-minimal-object.png?v=4',
    featured: false,
    description:
      'A curated archive of twentieth-century industrial design, precision writing instruments, and everyday functional objects designed to last for generations.',
    specs: {
      author: 'Dieter & Hans Vogel',
      publisher: 'LEKHIX Editions',
      releaseDate: 'November 2026',
      format: '6 × 9 in',
      features: 'Hardcover, 264 pages',
      language: 'English',
      isbn: '978-3-89955-981-1',
    },
  },
  {
    id: 'stat-archival-sketchbook',
    title: 'Archival Cotton Sketchbook',
    category: 'Stationery',
    price: 980,
    image: '/catalog/stat-linen-journal.png?v=4',
    featured: false,
    description:
      'Cold-pressed 180gsm cotton rag sketchbook bound in raw charcoal bookcloth at 6 × 9 inches. Opens 180 degrees flat for architectural drawing and ink wash.',
    specs: {
      author: 'LEKHIX Atelier',
      publisher: 'LEKHIX Stationery',
      releaseDate: '2026 Collection',
      format: '6 × 9 in',
      features: '180gsm Cotton Paper, 128 Pages',
      language: 'Unruled',
      isbn: 'LKX-ST-0072',
    },
  },
  {
    id: 'book-quiet-geometry',
    title: 'Quiet Geometry in Print',
    category: 'Books',
    price: 1540,
    bookFormat: 'ebook',
    ebookPrice: 590,
    ebookFileName: 'Quiet_Geometry_in_Print_LEKHIX_eBook.pdf',
    image: '/catalog/book-spatial.png?v=4',
    featured: false,
    description:
      'Essays and visual studies on proportional systems, bookbinding traditions, and architectural page layouts from Renaissance folios to modern 6×9 trade editions.',
    specs: {
      author: 'Nandini Rao',
      publisher: 'LEKHIX Press',
      releaseDate: 'October 2026',
      format: '6 × 9 in · PDF Edition',
      features: 'Digital PDF, 224 pages',
      language: 'English',
      isbn: '978-3-89955-994-1',
    },
  },
];

interface CatalogContextType {
  catalog: CatalogItem[];
  saveCatalog: (newItems: CatalogItem[]) => Promise<void>;
  cart: CartItem[];
  addToCart: (
    product: CatalogItem,
    qty?: number,
    selectedFormat?: 'physical' | 'ebook'
  ) => void;
  removeFromCart: (productId: string, selectedFormat?: 'physical' | 'ebook') => void;
  updateCartQuantity: (
    productId: string,
    qty: number,
    selectedFormat?: 'physical' | 'ebook'
  ) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'lekhix_cart_v1';

function normalizeCatalogItems(items: CatalogItem[]): CatalogItem[] {
  return items.map((item) => {
    if (item.category === 'Books') {
      const bookFormat: BookFormat = item.bookFormat || 'both';
      const ebookPrice =
        typeof item.ebookPrice === 'number' && item.ebookPrice > 0
          ? item.ebookPrice
          : bookFormat === 'ebook'
          ? item.price
          : Math.round(item.price * 0.45);
      return {
        ...item,
        bookFormat,
        ebookPrice,
      };
    }
    return item;
  });
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogItem[]>(INITIAL_CATALOG);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((c: any) => ({
        ...c,
        selectedFormat: c.selectedFormat === 'ebook' ? 'ebook' : 'physical',
      }));
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Real-time Firestore listener for /appData/catalog
  useEffect(() => {
    const docRef = doc(db, 'appData', 'catalog');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.items) && data.items.length > 0) {
            setCatalog(normalizeCatalogItems(data.items));
          }
        }
      },
      (error) => {
        console.warn('Using local seeded catalog fallback:', error.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart:', e);
    }
  }, [cart]);

  const saveCatalog = async (newItems: CatalogItem[]) => {
    const normalized = normalizeCatalogItems(newItems);
    setCatalog(normalized);
    const path = 'appData/catalog';
    try {
      await setDoc(doc(db, 'appData', 'catalog'), {
        items: normalized,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const addToCart = (
    product: CatalogItem,
    qty = 1,
    selectedFormat?: 'physical' | 'ebook'
  ) => {
    const format: 'physical' | 'ebook' =
      selectedFormat ||
      (product.category === 'Books' && product.bookFormat === 'ebook'
        ? 'ebook'
        : 'physical');

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedFormat === format
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          product,
          quantity: updated[existingIndex].quantity + qty,
        };
        return updated;
      }
      return [...prev, { product, quantity: qty, selectedFormat: format }];
    });
  };

  const removeFromCart = (
    productId: string,
    selectedFormat?: 'physical' | 'ebook'
  ) => {
    setCart((prev) =>
      prev.filter((i) =>
        selectedFormat
          ? !(i.product.id === productId && i.selectedFormat === selectedFormat)
          : i.product.id !== productId
      )
    );
  };

  const updateCartQuantity = (
    productId: string,
    qty: number,
    selectedFormat?: 'physical' | 'ebook'
  ) => {
    if (qty <= 0) {
      removeFromCart(productId, selectedFormat);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId &&
        (!selectedFormat || i.selectedFormat === selectedFormat)
          ? { ...i, quantity: qty }
          : i
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) =>
      sum + getEffectivePrice(item.product, item.selectedFormat) * item.quantity,
    0
  );

  return (
    <CatalogContext.Provider
      value={{
        catalog,
        saveCatalog,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}
