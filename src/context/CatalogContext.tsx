import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { UserOrderRecord } from '../utils/ebookDownload';
import {
  IGNOU_PREPOPULATED_PROGRAM_COURSES,
  lookupIgnouCourseTitle,
  normalizeCourseCodeKey,
} from '../lib/ignouCourseCatalog';
import {
  IGNOU_ODL_PG_DIPLOMA_PROGRAMMES,
  IGNOU_ODL_DIPLOMA_PROGRAMMES,
  IGNOU_ODL_PG_CERTIFICATE_PROGRAMMES,
  IGNOU_ODL_CERTIFICATE_PROGRAMMES_FULL as IGNOU_ODL_CERTIFICATE_PROGRAMMES,
  IGNOU_ODL_AWARENESS_PROGRAMMES,
} from '../lib/ignouPart2Catalog';

export {
  IGNOU_ODL_PG_DIPLOMA_PROGRAMMES,
  IGNOU_ODL_DIPLOMA_PROGRAMMES,
  IGNOU_ODL_PG_CERTIFICATE_PROGRAMMES,
  IGNOU_ODL_CERTIFICATE_PROGRAMMES,
  IGNOU_ODL_AWARENESS_PROGRAMMES,
};

export type BookFormat = 'ebook' | 'physical' | 'both';
export type IgnouDegree =
  | 'Bachelor Degree'
  | 'Master Degree'
  | 'Post Graduate Diploma'
  | 'Diploma'
  | 'Post Graduate Certificate'
  | 'Certificate Degree'
  | 'Awareness / Appreciation';
export type IgnouYear = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
export type IgnouMaterialType = 'Assignment' | 'Project';

export const IGNOU_DEGREE_OPTIONS: IgnouDegree[] = [
  'Bachelor Degree',
  'Master Degree',
  'Post Graduate Diploma',
  'Diploma',
  'Post Graduate Certificate',
  'Certificate Degree',
  'Awareness / Appreciation',
];

export const IGNOU_YEAR_OPTIONS: IgnouYear[] = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
];

export interface IgnouCourseEntry {
  code: string;
  title: string;
  year: IgnouYear;
}

export interface IgnouProgrammeEntry {
  code: string;
  title: string;
  degree: IgnouDegree;
}

export interface IgnouDatabaseProgram {
  code: string;
  title: string;
  degree: IgnouDegree;
  courses: IgnouCourseEntry[];
}

/** Complete list of all 62 ODL Bachelor Degree Programmes from the official IGNOU PDF */
export const IGNOU_ODL_BACHELOR_PROGRAMMES: IgnouProgrammeEntry[] = [
  { code: 'BAAHD', title: 'Bachelor of Arts (Applied Hindi)', degree: 'Bachelor Degree' },
  { code: 'BAASK', title: 'Bachelor of Arts (Applied Sanskrit)', degree: 'Bachelor Degree' },
  { code: 'BAAUD', title: 'Bachelor of Arts (Applied Urdu)', degree: 'Bachelor Degree' },
  { code: 'BAECH', title: 'Bachelor of Arts (Honours) Economics', degree: 'Bachelor Degree' },
  { code: 'BAEGH', title: 'Bachelor of Arts (Honours) English', degree: 'Bachelor Degree' },
  { code: 'BAFEC', title: 'Bachelor of Arts (Economics)', degree: 'Bachelor Degree' },
  { code: 'BAFEDU', title: 'Bachelor of Arts (Education)', degree: 'Bachelor Degree' },
  { code: 'BAFEG', title: 'Bachelor of Arts (English)', degree: 'Bachelor Degree' },
  { code: 'BAFFSM', title: 'Bachelor of Arts (Facility and Services Management)', degree: 'Bachelor Degree' },
  { code: 'BAFHD', title: 'Bachelor of Arts (Hindi)', degree: 'Bachelor Degree' },
  { code: 'BAFHI', title: 'Bachelor of Arts (History)', degree: 'Bachelor Degree' },
  { code: 'BAFHSC', title: 'Bachelor of Arts (Home Science)', degree: 'Bachelor Degree' },
  { code: 'BAFJDM', title: 'Bachelor of Arts (Journalism and Digital Media)', degree: 'Bachelor Degree' },
  { code: 'BAFPA', title: 'Bachelor of Arts (Public Administration)', degree: 'Bachelor Degree' },
  { code: 'BAFPS', title: 'Bachelor of Arts (Political Science)', degree: 'Bachelor Degree' },
  { code: 'BAFPY', title: 'Bachelor of Arts (Philosophy)', degree: 'Bachelor Degree' },
  { code: 'BAFSK', title: 'Bachelor of Arts (Sanskrit)', degree: 'Bachelor Degree' },
  { code: 'BAFSM', title: 'Bachelor of Arts (Facility and Services Management)', degree: 'Bachelor Degree' },
  { code: 'BAFSO', title: 'Bachelor of Arts (Sociology)', degree: 'Bachelor Degree' },
  { code: 'BAFUD', title: 'Bachelor of Arts (Urdu)', degree: 'Bachelor Degree' },
  { code: 'BAFVTM', title: 'Bachelor of Arts (Vocational Studies) Tourism Management', degree: 'Bachelor Degree' },
  { code: 'BAGS', title: 'Bachelor of Arts (Gender Studies)', degree: 'Bachelor Degree' },
  { code: 'BAHDH', title: 'Bachelor of Arts (Honours) Hindi', degree: 'Bachelor Degree' },
  { code: 'BAHIH', title: 'Bachelor of Arts (Honours) History', degree: 'Bachelor Degree' },
  { code: 'BAM', title: 'Bachelor of Arts', degree: 'Bachelor Degree' },
  { code: 'BAMSME', title: 'Bachelor of Arts (Micro, Small & Medium Enterprises)', degree: 'Bachelor Degree' },
  { code: 'BAPAH', title: 'Bachelor of Arts (Honours) Public Administration', degree: 'Bachelor Degree' },
  { code: 'BAPFHMH', title: 'Bachelor of Arts (Performing Arts) Hindustani Music Honours', degree: 'Bachelor Degree' },
  { code: 'BAPSH', title: 'Bachelor of Arts (Hons) Political Science', degree: 'Bachelor Degree' },
  { code: 'BASKH', title: 'B.A. Honours Sanskrit (संस्कृत ऑनर्स)', degree: 'Bachelor Degree' },
  { code: 'BASOH', title: 'Bachelor of Arts (Hons) Sociology', degree: 'Bachelor Degree' },
  { code: 'BAUDH', title: 'B.A. Honours Urdu (उर्दू ऑनर्स)', degree: 'Bachelor Degree' },
  { code: 'BBA', title: 'Bachelor of Business Administration', degree: 'Bachelor Degree' },
  { code: 'BBARIL', title: 'Bachelor of Business Administration (Retailing)', degree: 'Bachelor Degree' },
  { code: 'BBASM', title: 'Bachelor of Business Administration (Services Management)', degree: 'Bachelor Degree' },
  { code: 'BCA_NEW', title: 'Bachelor of Computer Applications', degree: 'Bachelor Degree' },
  { code: 'BCOMF', title: 'Bachelor of Commerce', degree: 'Bachelor Degree' },
  { code: 'BED', title: 'Bachelor of Education', degree: 'Bachelor Degree' },
  { code: 'BFSW', title: 'Bachelor of Social Work', degree: 'Bachelor Degree' },
  { code: 'BFTTM', title: 'Bachelor of Tourism & Travel Management', degree: 'Bachelor Degree' },
  { code: 'BHM', title: 'Bachelor of Science (Hospitality & Hotel Administration)', degree: 'Bachelor Degree' },
  { code: 'BLIS', title: 'Bachelor of Library and Information Science', degree: 'Bachelor Degree' },
  { code: 'BPAFHM', title: 'Bachelor of Performing Arts (Hindustani Music)', degree: 'Bachelor Degree' },
  { code: 'BSCAEY', title: 'Bachelor of Science (Applied Science-Energy)', degree: 'Bachelor Degree' },
  { code: 'BSCANH', title: 'Bachelor of Science (Honours) Anthropology', degree: 'Bachelor Degree' },
  { code: 'BSCBCH', title: 'Bachelor of Science (Hons) Biochemistry', degree: 'Bachelor Degree' },
  { code: 'BSCFAN', title: 'Bachelor of Science (Anthropology)', degree: 'Bachelor Degree' },
  { code: 'BSCFBC', title: 'Bachelor of Science (Biochemistry)', degree: 'Bachelor Degree' },
  { code: 'BSCFFSQM', title: 'Bachelor of Science (Food Safety and Quality Management)', degree: 'Bachelor Degree' },
  { code: 'BSCFMT', title: 'Bachelor of Science (Mathematics)', degree: 'Bachelor Degree' },
  { code: 'BSCG', title: 'Bachelor of Science', degree: 'Bachelor Degree' },
  { code: 'BSCM', title: 'Bachelor of Science', degree: 'Bachelor Degree' },
  { code: 'BSCN', title: 'Bachelor of Science (Nursing (Post Basic))', degree: 'Bachelor Degree' },
  { code: 'BAAPS', title: 'Bachelor of Arts (Applied Skills)', degree: 'Bachelor Degree' },
  { code: 'BAMSAPS', title: 'Bachelor of Arts (Applied Skills-MSME)', degree: 'Bachelor Degree' },
  { code: 'BCOMAPS', title: 'Bachelor of Commerce (Applied Skills)', degree: 'Bachelor Degree' },
  { code: 'BSCAPS', title: 'Bachelor of Science (Applied Skills)', degree: 'Bachelor Degree' },
  { code: 'BTMAPS', title: 'Bachelor of Arts (Applied Skills-Tourism Management)', degree: 'Bachelor Degree' },
  { code: 'BABED', title: 'BA-BED Secondary Stage', degree: 'Bachelor Degree' },
  { code: 'BCOMBED', title: 'BCOM-BED Secondary Stage', degree: 'Bachelor Degree' },
  { code: 'BSCBED', title: 'BSC-BED Secondary Stage', degree: 'Bachelor Degree' },
  { code: 'BSCFFAD', title: 'Bachelor of Science (Fabric and Apparel Design)', degree: 'Bachelor Degree' },
];

/** Official IGNOU Master Degree Programmes */
export const IGNOU_ODL_MASTER_PROGRAMMES: IgnouProgrammeEntry[] = [
  { code: 'MEG', title: 'Master of Arts (English)', degree: 'Master Degree' },
  { code: 'MHD', title: 'Master of Arts (Hindi)', degree: 'Master Degree' },
  { code: 'MPS', title: 'Master of Arts (Political Science)', degree: 'Master Degree' },
  { code: 'MAH', title: 'Master of Arts (History)', degree: 'Master Degree' },
  { code: 'MSO', title: 'Master of Arts (Sociology)', degree: 'Master Degree' },
  { code: 'MEC', title: 'Master of Arts (Economics)', degree: 'Master Degree' },
  { code: 'MPA', title: 'Master of Arts (Public Administration)', degree: 'Master Degree' },
  { code: 'MAPC', title: 'Master of Arts (Psychology)', degree: 'Master Degree' },
  { code: 'MAPY', title: 'Master of Arts (Philosophy)', degree: 'Master Degree' },
  { code: 'MARD', title: 'Master of Arts (Rural Development)', degree: 'Master Degree' },
  { code: 'MAEDU', title: 'Master of Arts (Education)', degree: 'Master Degree' },
  { code: 'MCOM', title: 'Master of Commerce', degree: 'Master Degree' },
  { code: 'MBA', title: 'Master of Business Administration', degree: 'Master Degree' },
  { code: 'MCA_NEW', title: 'Master of Computer Applications', degree: 'Master Degree' },
  { code: 'MLIS', title: 'Master of Library and Information Science', degree: 'Master Degree' },
  { code: 'MSW', title: 'Master of Social Work', degree: 'Master Degree' },
  { code: 'MTTM', title: 'Master of Tourism and Travel Management', degree: 'Master Degree' },
  { code: 'MAAN', title: 'Master of Arts (Anthropology)', degree: 'Master Degree' },
  { code: 'MAGD', title: 'Master of Arts (Gender and Development Studies)', degree: 'Master Degree' },
  { code: 'MAJMC', title: 'Master of Arts (Journalism and Mass Communication)', degree: 'Master Degree' },
  { code: 'MSK', title: 'Master of Arts (Sanskrit)', degree: 'Master Degree' },
  { code: 'MAUD', title: 'Master of Arts (Urdu)', degree: 'Master Degree' },
  { code: 'MSCDFSM', title: 'Master of Science (Dietetics and Food Service Management)', degree: 'Master Degree' },
  { code: 'MSCENV', title: 'Master of Science (Environmental Science)', degree: 'Master Degree' },
  { code: 'MSCMACS', title: 'Master of Science (Mathematics with Applications in Computer Science)', degree: 'Master Degree' },
];

export const IGNOU_ALL_PROGRAMMES: IgnouProgrammeEntry[] = [
  ...IGNOU_ODL_BACHELOR_PROGRAMMES,
  ...IGNOU_ODL_MASTER_PROGRAMMES,
  ...IGNOU_ODL_PG_DIPLOMA_PROGRAMMES,
  ...IGNOU_ODL_DIPLOMA_PROGRAMMES,
  ...IGNOU_ODL_PG_CERTIFICATE_PROGRAMMES,
  ...IGNOU_ODL_CERTIFICATE_PROGRAMMES,
  ...IGNOU_ODL_AWARENESS_PROGRAMMES,
];

export const DEFAULT_CATEGORIES = ['Books', 'Stationery', 'IGNOU'] as const;

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
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  featured: boolean;
  soldOut?: boolean;
  description: string;
  specs: ProductSpecs;
  previewPages?: PreviewPage[];
  /** For Books, IGNOU & Custom Categories: 'ebook' (default PDF only), 'physical' (6x9 hardcover only), or 'both' */
  bookFormat?: BookFormat;
  /** Price in INR for the eBook (PDF) edition when bookFormat is 'ebook' or 'both' */
  ebookPrice?: number;
  /** Uploaded PDF file path/data URL or external PDF download link (Main Book / Assignment / Project PDF) */
  ebookPdfUrl?: string;
  /** Original PDF filename for display and download */
  ebookFileName?: string;
  /** Optional free Demo / Sample PDF file URL for users to preview/download before purchase */
  demoPdfUrl?: string;
  /** Original Demo PDF filename */
  demoFileName?: string;
  /** For IGNOU Project / Synopsis: second paid document (Synopsis PDF) */
  synopsisPdfUrl?: string;
  synopsisFileName?: string;
  /** For IGNOU Project / Synopsis: free Demo PDF for Synopsis */
  synopsisDemoPdfUrl?: string;
  synopsisDemoFileName?: string;
  /** IGNOU specific hierarchy metadata when category === 'IGNOU' */
  ignouDegree?: IgnouDegree;
  ignouYear?: IgnouYear;
  ignouProgramCode?: string;
  ignouProgramName?: string;
  ignouMaterialType?: IgnouMaterialType;
  ignouCourseCode?: string;
  ignouCourseTitle?: string;
}

export interface CartItem {
  product: CatalogItem;
  quantity: number;
  selectedFormat: 'physical' | 'ebook';
}

export function isBookLikeCategory(category: string): boolean {
  return category !== 'Stationery';
}

export function getPhysicalFormatLabel(
  product: Pick<CatalogItem, 'category' | 'ignouMaterialType'>
): string {
  if (product.category === 'IGNOU') {
    return product.ignouMaterialType === 'Project' ? 'HARDCOPY' : 'HANDWRITTEN';
  }
  return 'PHYSICAL';
}

export function getEffectivePrice(
  product: CatalogItem,
  selectedFormat: 'physical' | 'ebook' = 'physical'
): number {
  if (isBookLikeCategory(product.category) && selectedFormat === 'ebook') {
    if (typeof product.ebookPrice === 'number' && product.ebookPrice > 0) {
      return product.ebookPrice;
    }
    return Number(product.price) || 0;
  }
  return Number(product.price) || 0;
}

export function getDefaultSelectedFormat(
  product: CatalogItem
): 'physical' | 'ebook' {
  if (isBookLikeCategory(product.category)) {
    const mode = product.bookFormat || 'ebook';
    if (mode === 'ebook') return 'ebook';
    return 'physical';
  }
  return 'physical';
}

/** Zero hardcoded products — only items added by the Admin are shown */
export const INITIAL_CATALOG: CatalogItem[] = [];

/** Set of legacy demo IDs to strip automatically if previously saved in Firestore or localStorage */
const LEGACY_DEMO_IDS = new Set([
  'book-debt-first-5000',
  'book-architecture-silence',
  'book-modern-typography',
  'stat-brass-fountain-pen',
  'book-spatial-craft',
  'stat-linen-monolith-journal',
  'stat-architect-desk-holder',
  'stat-black-binder-set',
  'book-botanical-index',
  'book-enduring-object',
  'stat-archival-sketchbook',
  'book-quiet-geometry',
]);

interface CatalogContextType {
  catalog: CatalogItem[];
  saveCatalog: (newItems: CatalogItem[], nextCustomCategories?: string[]) => Promise<void>;
  ignouDatabase: IgnouDatabaseProgram[];
  saveIgnouDatabase: (programs: IgnouDatabaseProgram[]) => Promise<void>;
  categories: string[];
  customCategories: string[];
  addCustomCategory: (name: string) => Promise<void>;
  removeCustomCategory: (name: string) => Promise<void>;
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
  userOrders: UserOrderRecord[];
  addUserOrder: (order: UserOrderRecord) => void;
  isOrdersOpen: boolean;
  setIsOrdersOpen: (open: boolean) => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'lekhix_cart_v2';
const ORDERS_STORAGE_KEY = 'lekhix_my_orders_v1';

export function buildDefaultIgnouDatabase(): IgnouDatabaseProgram[] {
  return IGNOU_ALL_PROGRAMMES.map((p) => {
    const code = p.code.trim().toUpperCase();
    const prepopulated = IGNOU_PREPOPULATED_PROGRAM_COURSES[code] || [];
    return {
      code,
      title: p.title.trim(),
      degree: p.degree,
      courses: prepopulated.map((c) => ({ ...c })),
    };
  });
}

function normalizeIgnouDatabasePrograms(
  rawPrograms: unknown
): IgnouDatabaseProgram[] {
  const validDegrees = new Set<IgnouDegree>(IGNOU_DEGREE_OPTIONS);
  const validYears = new Set<IgnouYear>([
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
  ]);

  if (!Array.isArray(rawPrograms) || rawPrograms.length === 0) {
    return buildDefaultIgnouDatabase();
  }

  const defaultProgrammeMap = new Map<string, IgnouProgrammeEntry>();
  for (const defProg of IGNOU_ALL_PROGRAMMES) {
    defaultProgrammeMap.set(defProg.code.trim().toUpperCase(), defProg);
  }

  const cleaned: IgnouDatabaseProgram[] = [];
  const seenCodes = new Set<string>();

  for (const item of rawPrograms) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const code = typeof obj.code === 'string' ? obj.code.trim().toUpperCase() : '';
    if (!code || seenCodes.has(code)) continue;
    seenCodes.add(code);

    const defProg = defaultProgrammeMap.get(code);
    const degree: IgnouDegree = validDegrees.has(obj.degree as IgnouDegree)
      ? (obj.degree as IgnouDegree)
      : defProg?.degree || 'Bachelor Degree';

    let title = typeof obj.title === 'string' ? obj.title.trim() : '';
    if (
      defProg &&
      (!title ||
        (code === 'BASKH' && title === 'Bachelor of Arts (Hons) Sanskrit') ||
        (code === 'BAUDH' && title === 'Bachelor of Arts (Hons) URDU') ||
        !title.includes('(') && defProg.title.includes('('))
    ) {
      title = defProg.title.trim();
    }

    const courses: IgnouCourseEntry[] = [];
    const seenCourses = new Set<string>();
    if (Array.isArray(obj.courses)) {
      for (const c of obj.courses) {
        if (!c || typeof c !== 'object') continue;
        const cObj = c as Record<string, unknown>;
        const cCode =
          typeof cObj.code === 'string' ? cObj.code.trim().toUpperCase() : '';
        if (!cCode) continue;
        const cYear: IgnouYear = validYears.has(cObj.year as IgnouYear)
          ? (cObj.year as IgnouYear)
          : '1st Year';
        const rawTitle = typeof cObj.title === 'string' ? cObj.title.trim() : '';
        const cTitle = rawTitle || lookupIgnouCourseTitle(cCode) || cCode;
        const key = `${cYear}::${normalizeCourseCodeKey(cCode)}`;
        if (seenCourses.has(key)) continue;
        seenCourses.add(key);
        courses.push({
          code: cCode,
          title: cTitle,
          year: cYear,
        });
      }
    }

    // Merge pre-populated default courses for this program if not already present
    const prepopulated = IGNOU_PREPOPULATED_PROGRAM_COURSES[code];
    if (prepopulated && prepopulated.length > 0) {
      for (const pre of prepopulated) {
        const key = `${pre.year}::${normalizeCourseCodeKey(pre.code)}`;
        if (!seenCourses.has(key)) {
          seenCourses.add(key);
          courses.push({ ...pre });
        }
      }
    }

    cleaned.push({
      code,
      title,
      degree,
      courses,
    });
  }

  // Ensure any missing default programmes from IGNOU_ALL_PROGRAMMES are also included
  for (const defProg of IGNOU_ALL_PROGRAMMES) {
    const defCode = defProg.code.trim().toUpperCase();
    if (!seenCodes.has(defCode)) {
      seenCodes.add(defCode);
      const prepopulated = IGNOU_PREPOPULATED_PROGRAM_COURSES[defCode] || [];
      cleaned.push({
        code: defCode,
        title: defProg.title.trim(),
        degree: defProg.degree,
        courses: prepopulated.map((c) => ({ ...c })),
      });
    }
  }

  return cleaned;
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== undefined)
      .map((v) => stripUndefinedDeep(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined && !(typeof v === 'number' && Number.isNaN(v))) {
        cleaned[k] = stripUndefinedDeep(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

function normalizeCatalogItems(items: CatalogItem[]): CatalogItem[] {
  return items
    .filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        !LEGACY_DEMO_IDS.has(item.id)
    )
    .map((item) => {
      const reviewerName = item.specs?.reviewerName;
      const reviewerQuote = item.specs?.reviewerQuote;
      const category = (item.category || 'Books').trim() || 'Books';

      const safeSpecs: ProductSpecs = {
        author: item.specs?.author || 'LEKHIX Editions',
        publisher: item.specs?.publisher || 'LEKHIX Press',
        releaseDate: item.specs?.releaseDate || '2026',
        format: item.specs?.format || '6 × 9 in',
        features: item.specs?.features || 'Archival Edition',
        language: item.specs?.language || 'English',
        isbn: item.specs?.isbn || '978-3-89955-000-0',
        ...(reviewerName ? { reviewerName } : {}),
        ...(reviewerQuote ? { reviewerQuote } : {}),
      };

      const cleanedImage =
        item.image && item.image.startsWith('/catalog/') ? '' : item.image || '';

      if (isBookLikeCategory(category)) {
        const bookFormat: BookFormat = item.bookFormat || 'ebook';
        const ebookPrice =
          typeof item.ebookPrice === 'number' && item.ebookPrice > 0
            ? item.ebookPrice
            : bookFormat === 'ebook'
            ? Number(item.price)
            : Math.round(Number(item.price) * 0.5);
        return stripUndefinedDeep({
          ...item,
          category,
          image: cleanedImage,
          price: Number(item.price) || 0,
          soldOut: Boolean(item.soldOut),
          specs: safeSpecs,
          bookFormat,
          ...(bookFormat === 'physical' ? {} : { ebookPrice }),
        });
      }
      return stripUndefinedDeep({
        ...item,
        category,
        image: cleanedImage,
        price: Number(item.price) || 0,
        soldOut: Boolean(item.soldOut),
        specs: safeSpecs,
      });
    });
}

function sanitizeStoredCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const valid: CartItem[] = [];
  for (const entry of raw) {
    if (
      entry &&
      typeof entry === 'object' &&
      entry.product &&
      typeof entry.product.id === 'string' &&
      typeof entry.product.title === 'string' &&
      !LEGACY_DEMO_IDS.has(entry.product.id)
    ) {
      const normalizedProduct = normalizeCatalogItems([entry.product])[0];
      if (normalizedProduct && !normalizedProduct.soldOut) {
        valid.push({
          product: normalizedProduct,
          quantity: Math.max(1, Number(entry.quantity) || 1),
          selectedFormat:
            entry.selectedFormat === 'ebook'
              ? 'ebook'
              : getDefaultSelectedFormat(normalizedProduct),
        });
      }
    }
  }
  return valid;
}

function sanitizeStoredOrders(raw: unknown): UserOrderRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is UserOrderRecord =>
      Boolean(
        entry &&
          typeof entry === 'object' &&
          typeof (entry as UserOrderRecord).orderId === 'string' &&
          typeof (entry as UserOrderRecord).amount === 'number' &&
          Array.isArray((entry as UserOrderRecord).items)
      )
  );
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<CatalogItem[]>(INITIAL_CATALOG);
  const [ignouDatabase, setIgnouDatabase] = useState<IgnouDatabaseProgram[]>(() =>
    buildDefaultIgnouDatabase()
  );
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      return sanitizeStoredCart(JSON.parse(saved));
    } catch {
      return [];
    }
  });
  const [userOrders, setUserOrders] = useState<UserOrderRecord[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (!saved) return [];
      return sanitizeStoredOrders(JSON.parse(saved));
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    for (const c of customCategories) {
      if (c && c.trim()) set.add(c.trim());
    }
    for (const item of catalog) {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    }
    return Array.from(set);
  }, [customCategories, catalog]);

  // Real-time Firestore listener for /appData/catalog
  useEffect(() => {
    const docRef = doc(db, 'appData', 'catalog');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.customCategories)) {
            setCustomCategories(
              data.customCategories
                .filter((c: unknown): c is string => typeof c === 'string' && c.trim().length > 0)
                .map((c: string) => c.trim())
            );
          }
          if (Array.isArray(data.items)) {
            const cleaned = normalizeCatalogItems(data.items);
            setCatalog(cleaned);
            setCart((prevCart) =>
              prevCart.filter((ci) => {
                const match = cleaned.find((p) => p.id === ci.product.id);
                return match && !match.soldOut;
              })
            );
          }
        } else {
          setCatalog([]);
        }
      },
      (error) => {
        console.warn('Catalog listener fallback:', error.message);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Firestore listener for /appData/ignouDatabase
  useEffect(() => {
    const docRef = doc(db, 'appData', 'ignouDatabase');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.programs)) {
            setIgnouDatabase(normalizeIgnouDatabasePrograms(data.programs));
          }
        } else {
          setIgnouDatabase(buildDefaultIgnouDatabase());
        }
      },
      (error) => {
        console.warn('IGNOU database listener fallback:', error.message);
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

  // Persist userOrders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(userOrders));
    } catch (e) {
      console.error('Failed to persist orders:', e);
    }
  }, [userOrders]);

  const addUserOrder = (order: UserOrderRecord) => {
    setUserOrders((prev) => [
      order,
      ...prev.filter((o) => o.orderId !== order.orderId),
    ]);
  };

  const saveCatalog = async (
    newItems: CatalogItem[],
    nextCustomCategories?: string[]
  ) => {
    const normalized = stripUndefinedDeep(normalizeCatalogItems(newItems));
    const resolvedCustom = stripUndefinedDeep(
      (nextCustomCategories ?? customCategories)
        .map((c) => c.trim())
        .filter(
          (c) =>
            c.length > 0 &&
            !DEFAULT_CATEGORIES.includes(c as (typeof DEFAULT_CATEGORIES)[number])
        )
    );
    setCatalog(normalized);
    setCustomCategories(resolvedCustom);
    const path = 'appData/catalog';
    try {
      await setDoc(doc(db, 'appData', 'catalog'), {
        items: normalized,
        customCategories: resolvedCustom,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const saveIgnouDatabase = async (programs: IgnouDatabaseProgram[]) => {
    const normalized = stripUndefinedDeep(normalizeIgnouDatabasePrograms(programs));
    setIgnouDatabase(normalized);
    const path = 'appData/ignouDatabase';
    try {
      await setDoc(doc(db, 'appData', 'ignouDatabase'), {
        programs: normalized,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const addCustomCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (
      DEFAULT_CATEGORIES.some((d) => d.toLowerCase() === trimmed.toLowerCase()) ||
      customCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())
    ) {
      return;
    }
    const next = [...customCategories, trimmed];
    await saveCatalog(catalog, next);
  };

  const removeCustomCategory = async (name: string) => {
    const next = customCategories.filter((c) => c !== name);
    await saveCatalog(catalog, next);
  };

  const addToCart = (
    product: CatalogItem,
    qty = 1,
    selectedFormat?: 'physical' | 'ebook'
  ) => {
    if (product.soldOut) return;
    const format: 'physical' | 'ebook' =
      selectedFormat || getDefaultSelectedFormat(product);

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
        ignouDatabase,
        saveIgnouDatabase,
        categories,
        customCategories,
        addCustomCategory,
        removeCustomCategory,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        userOrders,
        addUserOrder,
        isOrdersOpen,
        setIsOrdersOpen,
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
