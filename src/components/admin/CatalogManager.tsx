import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Upload,
  Star,
  Ban,
  FolderPlus,
  FileText,
  ChevronDown,
} from 'lucide-react';
import {
  BookFormat,
  CatalogItem,
  getPhysicalFormatLabel,
  IGNOU_ALL_PROGRAMMES,
  IGNOU_DEGREE_OPTIONS,
  IGNOU_YEAR_OPTIONS,
  IgnouCourseEntry,
  IgnouDegree,
  IgnouMaterialType,
  IgnouProgrammeEntry,
  IgnouYear,
  isBookLikeCategory,
  useCatalog,
} from '../../context/CatalogContext';
import ProductImage6x9 from '../ProductImage6x9';
import { useToast } from '../../context/ToastContext';
import {
  IGNOU_PREPOPULATED_PROGRAM_COURSES,
  lookupIgnouCourseTitle,
  normalizeCourseCodeKey,
} from '../../lib/ignouCourseCatalog';

const IGNOU_MATERIAL_OPTIONS: IgnouMaterialType[] = ['Assignment', 'Project'];

function getCurrentIgnouSessionInfo(): {
  year: number;
  options: string[];
  defaultSession: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const nextYear = year + 1;
  const month = now.getMonth(); // 0 = Jan ... 5 = Jun, 6 = Jul ... 11 = Dec
  const janCurrent = `JAN ${year}`;
  const julCurrent = `JUL ${year}`;
  const janNext = `JAN ${nextYear}`;
  const julNext = `JUL ${nextYear}`;
  const defaultSession = month >= 6 ? julCurrent : janCurrent;
  return {
    year,
    options: [janCurrent, julCurrent, janNext, julNext],
    defaultSession,
  };
}

function getDefaultIgnouPages(materialType?: IgnouMaterialType): string {
  return materialType === 'Project' ? '60 Pages' : '25 Pages';
}

const AUTO_FEATURES_PRESETS = new Set([
  '',
  '25 Pages',
  '60 Pages',
  'Instant Solved PDF Download',
  'Neat A4 Handwritten Submission Ready',
  'Digital PDF Edition, 256 pages',
  'Hardcover, 256 pages',
]);

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
  demoPdfUrl: '',
  demoFileName: '',
  synopsisPdfUrl: '',
  synopsisFileName: '',
  synopsisDemoPdfUrl: '',
  synopsisDemoFileName: '',
  image: '',
  featured: true,
  soldOut: false,
  description: '',
  specs: {
    author: 'LEKHIX Editions',
    publisher: 'LEKHIX Press',
    releaseDate: String(new Date().getFullYear()),
    format: '6 × 9 in · PDF Edition',
    features: 'Digital PDF Edition, 256 pages',
    language: 'English',
    isbn: '',
    reviewerName: '',
    reviewerQuote: '',
  },
};

export default function CatalogManager() {
  const {
    catalog,
    saveCatalog,
    ignouDatabase,
    saveIgnouDatabase,
    categories,
    customCategories,
    addCustomCategory,
    removeCustomCategory,
  } = useCatalog();
  const { showToast } = useToast();

  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('All');
  const [adminIgnouDegreeFilter, setAdminIgnouDegreeFilter] = useState<'All' | IgnouDegree>('All');
  const [adminIgnouProgramFilter, setAdminIgnouProgramFilter] = useState<string>('All');
  const [adminIgnouYearFilter, setAdminIgnouYearFilter] = useState<'All' | IgnouYear>('All');
  const [adminIgnouCourseFilter, setAdminIgnouCourseFilter] = useState<string>('All');
  const [adminIgnouTypeFilter, setAdminIgnouTypeFilter] = useState<'All' | IgnouMaterialType>('All');
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingSynopsisPdf, setUploadingSynopsisPdf] = useState(false);
  const [uploadingDemoPdf, setUploadingDemoPdf] = useState(false);
  const [uploadingSynopsisDemoPdf, setUploadingSynopsisDemoPdf] = useState(false);

  // Custom Category inline creator state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Program Code Combobox / Dropdown state
  const [isProgramDropdownOpen, setIsProgramDropdownOpen] = useState(false);
  const programDropdownRef = useRef<HTMLDivElement>(null);

  // Course Code Combobox / Dropdown state
  const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  const ignouSessionInfo = useMemo(() => getCurrentIgnouSessionInfo(), []);

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (
        programDropdownRef.current &&
        !programDropdownRef.current.contains(ev.target as Node)
      ) {
        setIsProgramDropdownOpen(false);
      }
      if (
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(ev.target as Node)
      ) {
        setIsCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter official IGNOU programmes + ignouDatabase + custom catalog programmes strictly by the selected Degree
  const activeDegree: IgnouDegree = editingItem?.ignouDegree || 'Bachelor Degree';

  const allProgrammeOptions = useMemo<IgnouProgrammeEntry[]>(() => {
    const map = new Map<string, IgnouProgrammeEntry>();
    for (const p of IGNOU_ALL_PROGRAMMES) {
      if (p.degree === activeDegree) {
        map.set(p.code.toUpperCase(), p);
      }
    }
    for (const dbProg of ignouDatabase) {
      if (dbProg.degree === activeDegree && dbProg.code) {
        const code = dbProg.code.trim().toUpperCase();
        map.set(code, {
          code,
          title: dbProg.title.trim(),
          degree: activeDegree,
        });
      }
    }
    for (const item of catalog) {
      if (
        item.category === 'IGNOU' &&
        item.ignouDegree === activeDegree &&
        item.ignouProgramCode
      ) {
        const code = item.ignouProgramCode.trim().toUpperCase();
        if (code && !map.has(code)) {
          map.set(code, {
            code,
            title: (item.ignouProgramName || '').trim(),
            degree: activeDegree,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [ignouDatabase, catalog, activeDegree]);

  const filteredProgrammeOptions = useMemo<IgnouProgrammeEntry[]>(() => {
    const q = (editingItem?.ignouProgramCode || '').trim().toLowerCase();
    if (!q) return allProgrammeOptions;
    const matches = allProgrammeOptions.filter(
      (p) =>
        p.code.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)
    );
    return matches.length > 0 ? matches : allProgrammeOptions;
  }, [allProgrammeOptions, editingItem?.ignouProgramCode]);

  // Courses from ignouDatabase + pre-populated catalog + existing catalog items for the currently selected Program Code
  const selectedProgramAllCourses = useMemo<IgnouCourseEntry[]>(() => {
    const progCode = (editingItem?.ignouProgramCode || '').trim().toUpperCase();
    if (!progCode) return [];
    const map = new Map<string, IgnouCourseEntry>();

    const dbProg = ignouDatabase.find(
      (p) => p.code.trim().toUpperCase() === progCode
    );
    if (dbProg && Array.isArray(dbProg.courses)) {
      for (const c of dbProg.courses) {
        const cCode = c.code.trim().toUpperCase();
        if (cCode) {
          map.set(`${c.year}::${normalizeCourseCodeKey(cCode)}`, {
            code: cCode,
            title: c.title.trim() || lookupIgnouCourseTitle(cCode) || cCode,
            year: c.year,
          });
        }
      }
    }

    const prepopulated = IGNOU_PREPOPULATED_PROGRAM_COURSES[progCode];
    if (prepopulated && Array.isArray(prepopulated)) {
      for (const c of prepopulated) {
        const cCode = c.code.trim().toUpperCase();
        const key = `${c.year}::${normalizeCourseCodeKey(cCode)}`;
        if (cCode && !map.has(key)) {
          map.set(key, {
            code: cCode,
            title: c.title.trim(),
            year: c.year,
          });
        }
      }
    }

    for (const item of catalog) {
      if (
        item.category === 'IGNOU' &&
        (item.ignouProgramCode || '').trim().toUpperCase() === progCode &&
        item.ignouCourseCode
      ) {
        const cCode = item.ignouCourseCode.trim().toUpperCase();
        const cYear: IgnouYear = item.ignouYear || '1st Year';
        const key = `${cYear}::${normalizeCourseCodeKey(cCode)}`;
        if (cCode && !map.has(key)) {
          map.set(key, {
            code: cCode,
            title: (item.title || '').trim(),
            year: cYear,
          });
        }
      }
    }

    return Array.from(map.values());
  }, [ignouDatabase, catalog, editingItem?.ignouProgramCode]);

  // Courses scoped to the currently selected Year (or all courses in the program if none in that year)
  const availableCourseOptionsForYear = useMemo<IgnouCourseEntry[]>(() => {
    const activeYear: IgnouYear = editingItem?.ignouYear || '1st Year';
    const inYear = selectedProgramAllCourses.filter((c) => c.year === activeYear);
    return inYear.length > 0 ? inYear : selectedProgramAllCourses;
  }, [selectedProgramAllCourses, editingItem?.ignouYear]);

  const filteredCourseOptions = useMemo<IgnouCourseEntry[]>(() => {
    const rawQ = (editingItem?.ignouCourseCode || '').trim();
    if (!rawQ) return availableCourseOptionsForYear;
    const qLower = rawQ.toLowerCase();
    const qNorm = normalizeCourseCodeKey(rawQ);
    const matches = availableCourseOptionsForYear.filter(
      (c) =>
        c.code.toLowerCase().includes(qLower) ||
        normalizeCourseCodeKey(c.code).includes(qNorm) ||
        c.title.toLowerCase().includes(qLower)
    );
    return matches.length > 0 ? matches : availableCourseOptionsForYear;
  }, [availableCourseOptionsForYear, editingItem?.ignouCourseCode]);

  const startCreate = (
    presetFormat: BookFormat = 'ebook',
    presetCategory = 'Books',
    presetIgnou?: {
      degree?: IgnouDegree;
      programCode?: string;
      programName?: string;
      year?: IgnouYear;
    }
  ) => {
    setIsCreating(true);
    setIsAddingCategory(false);
    setNewCategoryName('');
    setIsProgramDropdownOpen(false);
    setIsCourseDropdownOpen(false);
    const sessionInfo = getCurrentIgnouSessionInfo();
    setEditingItem({
      ...EMPTY_ITEM,
      id: `item-${Date.now()}`,
      category: presetCategory,
      bookFormat: isBookLikeCategory(presetCategory) ? presetFormat : undefined,
      price: presetFormat === 'ebook' ? 590 : 1450,
      ebookPrice: 590,
      soldOut: false,
      ignouDegree:
        presetCategory === 'IGNOU'
          ? presetIgnou?.degree || 'Bachelor Degree'
          : undefined,
      ignouYear:
        presetCategory === 'IGNOU'
          ? presetIgnou?.year || '1st Year'
          : undefined,
      ignouProgramCode:
        presetCategory === 'IGNOU'
          ? presetIgnou?.programCode || ''
          : undefined,
      ignouProgramName:
        presetCategory === 'IGNOU'
          ? presetIgnou?.programName || ''
          : undefined,
      ignouMaterialType: presetCategory === 'IGNOU' ? 'Assignment' : undefined,
      ignouCourseCode: presetCategory === 'IGNOU' ? '' : undefined,
      specs: {
        ...EMPTY_ITEM.specs,
        releaseDate:
          presetCategory === 'IGNOU'
            ? sessionInfo.defaultSession
            : String(sessionInfo.year),
        format:
          presetCategory === 'IGNOU'
            ? presetFormat === 'physical'
              ? 'Handwritten Hardcopy'
              : 'Solved PDF Edition'
            : presetFormat === 'ebook'
            ? '6 × 9 in · PDF Edition'
            : '6 × 9 in',
        features:
          presetCategory === 'IGNOU'
            ? getDefaultIgnouPages('Assignment')
            : presetFormat === 'ebook'
            ? 'Digital PDF Edition, 256 pages'
            : 'Hardcover, 256 pages',
      },
    });
  };

  const startEdit = (item: CatalogItem) => {
    setIsCreating(false);
    setIsAddingCategory(false);
    setNewCategoryName('');
    setIsProgramDropdownOpen(false);
    const copy: CatalogItem = JSON.parse(JSON.stringify(item));
    if (isBookLikeCategory(copy.category) && !copy.bookFormat) {
      copy.bookFormat = 'ebook';
    }
    if (copy.category === 'IGNOU') {
      if (!copy.ignouYear) {
        copy.ignouYear = '1st Year';
      }
      const sessionInfo = getCurrentIgnouSessionInfo();
      const rel = (copy.specs?.releaseDate || '').trim();
      if (!rel || rel === String(sessionInfo.year) || rel === '2026') {
        copy.specs = {
          ...copy.specs,
          releaseDate: sessionInfo.defaultSession,
        };
      }
      const feat = (copy.specs?.features || '').trim();
      if (
        !feat ||
        feat === 'Instant Solved PDF Download' ||
        feat === 'Neat A4 Handwritten Submission Ready'
      ) {
        copy.specs = {
          ...copy.specs,
          features: getDefaultIgnouPages(copy.ignouMaterialType),
        };
      }
    }
    copy.soldOut = Boolean(copy.soldOut);
    setEditingItem(copy);
  };

  const handleAddCustomCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    await addCustomCategory(trimmed);
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        category: trimmed,
        bookFormat: editingItem.bookFormat || 'ebook',
      });
    }
    setNewCategoryName('');
    setIsAddingCategory(false);
    showToast({
      message: `Category "${trimmed}" added.`,
      type: 'success',
      duration: 2500,
    });
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
          ctx.fillStyle = '#EAEAE4';
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

  const uploadPdfHelper = (
    file: File,
    onSuccess: (url: string, fileName: string) => void,
    setLoading: (loading: boolean) => void,
    label: string
  ) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast({
        message: `Please select a valid .pdf file for the ${label}.`,
        type: 'error',
        duration: 3000,
      });
      return;
    }

    setLoading(true);
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
          onSuccess(data.url, file.name);
          showToast({
            message: `${label} uploaded: ${file.name}`,
            type: 'success',
            duration: 3000,
          });
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch {
        if (file.size <= 650 * 1024) {
          onSuccess(base64Data, file.name);
          showToast({
            message: `${label} attached: ${file.name}`,
            type: 'success',
            duration: 3000,
          });
        } else {
          showToast({
            message: `${label} upload failed. You can also paste an external PDF link.`,
            type: 'error',
            duration: 3500,
          });
        }
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    uploadPdfHelper(
      file,
      (url, fileName) => {
        setEditingItem((prev) =>
          prev
            ? {
                ...prev,
                ebookPdfUrl: url,
                ebookFileName: fileName,
              }
            : null
        );
      },
      setUploadingPdf,
      editingItem.category === 'IGNOU' && editingItem.ignouMaterialType === 'Project'
        ? 'Project PDF'
        : 'Main PDF'
    );
  };

  const handleSynopsisPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    uploadPdfHelper(
      file,
      (url, fileName) => {
        setEditingItem((prev) =>
          prev
            ? {
                ...prev,
                synopsisPdfUrl: url,
                synopsisFileName: fileName,
              }
            : null
        );
      },
      setUploadingSynopsisPdf,
      'Synopsis PDF'
    );
  };

  const handleDemoPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    uploadPdfHelper(
      file,
      (url, fileName) => {
        setEditingItem((prev) =>
          prev
            ? {
                ...prev,
                demoPdfUrl: url,
                demoFileName: fileName,
              }
            : null
        );
      },
      setUploadingDemoPdf,
      editingItem.category === 'IGNOU' && editingItem.ignouMaterialType === 'Project'
        ? 'Project Demo PDF'
        : 'Demo PDF'
    );
  };

  const handleSynopsisDemoPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;
    uploadPdfHelper(
      file,
      (url, fileName) => {
        setEditingItem((prev) =>
          prev
            ? {
                ...prev,
                synopsisDemoPdfUrl: url,
                synopsisDemoFileName: fileName,
              }
            : null
        );
      },
      setUploadingSynopsisDemoPdf,
      'Synopsis Demo PDF'
    );
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.title.trim()) return;

    if (editingItem.category === 'IGNOU') {
      if (!editingItem.ignouDegree) {
        showToast({
          message: 'Please select an IGNOU Degree (Bachelor, Master, or Certificate).',
          type: 'error',
          duration: 3000,
        });
        return;
      }
      if (!editingItem.ignouMaterialType) {
        showToast({
          message: 'Please select whether this IGNOU upload is an Assignment or Project.',
          type: 'error',
          duration: 3000,
        });
        return;
      }
    }

    setSaving(true);
    try {
      const cleanedItem: CatalogItem = {
        ...editingItem,
        soldOut: Boolean(editingItem.soldOut),
      };

      if (cleanedItem.category === 'IGNOU') {
        cleanedItem.ignouDegree = cleanedItem.ignouDegree || 'Bachelor Degree';
        cleanedItem.ignouYear = cleanedItem.ignouYear || '1st Year';
        cleanedItem.ignouProgramCode = (cleanedItem.ignouProgramCode || '')
          .trim()
          .toUpperCase();
        cleanedItem.ignouProgramName = (cleanedItem.ignouProgramName || '').trim();
        cleanedItem.ignouMaterialType =
          cleanedItem.ignouMaterialType || 'Assignment';
        cleanedItem.ignouCourseCode = (cleanedItem.ignouCourseCode || '')
          .trim()
          .toUpperCase();
        delete cleanedItem.ignouCourseTitle;

        const rel = (cleanedItem.specs?.releaseDate || '').trim();
        if (!rel || rel === String(ignouSessionInfo.year) || rel === '2026') {
          cleanedItem.specs = {
            ...cleanedItem.specs,
            releaseDate: ignouSessionInfo.defaultSession,
          };
        }

        const feat = (cleanedItem.specs?.features || '').trim();
        if (
          !feat ||
          feat === 'Instant Solved PDF Download' ||
          feat === 'Neat A4 Handwritten Submission Ready'
        ) {
          cleanedItem.specs = {
            ...cleanedItem.specs,
            features: getDefaultIgnouPages(cleanedItem.ignouMaterialType),
          };
        }

        if (cleanedItem.ignouMaterialType !== 'Project') {
          delete cleanedItem.synopsisPdfUrl;
          delete cleanedItem.synopsisFileName;
          delete cleanedItem.synopsisDemoPdfUrl;
          delete cleanedItem.synopsisDemoFileName;
        }
      } else {
        delete cleanedItem.ignouDegree;
        delete cleanedItem.ignouYear;
        delete cleanedItem.ignouProgramCode;
        delete cleanedItem.ignouProgramName;
        delete cleanedItem.ignouMaterialType;
        delete cleanedItem.ignouCourseCode;
        delete cleanedItem.ignouCourseTitle;
        delete cleanedItem.synopsisPdfUrl;
        delete cleanedItem.synopsisFileName;
        delete cleanedItem.synopsisDemoPdfUrl;
        delete cleanedItem.synopsisDemoFileName;
      }

      if (isBookLikeCategory(cleanedItem.category)) {
        cleanedItem.bookFormat = cleanedItem.bookFormat || 'ebook';
        if (cleanedItem.bookFormat === 'ebook') {
          cleanedItem.ebookPrice = cleanedItem.price;
        } else if (cleanedItem.bookFormat === 'physical') {
          delete cleanedItem.ebookPrice;
          delete cleanedItem.ebookPdfUrl;
          delete cleanedItem.ebookFileName;
          delete cleanedItem.synopsisPdfUrl;
          delete cleanedItem.synopsisFileName;
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

      if (!cleanedItem.demoPdfUrl || !cleanedItem.demoPdfUrl.trim()) {
        delete cleanedItem.demoPdfUrl;
        delete cleanedItem.demoFileName;
      }
      if (!cleanedItem.synopsisPdfUrl || !cleanedItem.synopsisPdfUrl.trim()) {
        delete cleanedItem.synopsisPdfUrl;
        delete cleanedItem.synopsisFileName;
      }
      if (!cleanedItem.synopsisDemoPdfUrl || !cleanedItem.synopsisDemoPdfUrl.trim()) {
        delete cleanedItem.synopsisDemoPdfUrl;
        delete cleanedItem.synopsisDemoFileName;
      }

      const updated = isCreating
        ? [cleanedItem, ...catalog]
        : catalog.map((i) => (i.id === cleanedItem.id ? cleanedItem : i));
      await saveCatalog(updated);

      // Auto-sync IGNOU Program & Course into ignouDatabase if not already saved there
      if (cleanedItem.category === 'IGNOU' && cleanedItem.ignouProgramCode) {
        const pCode = cleanedItem.ignouProgramCode.trim().toUpperCase();
        const pTitle = (cleanedItem.ignouProgramName || '').trim();
        const pDeg: IgnouDegree = cleanedItem.ignouDegree || 'Bachelor Degree';
        const cCode = (cleanedItem.ignouCourseCode || '').trim().toUpperCase();
        const cTitle = (cleanedItem.title || '').trim();
        const cYear: IgnouYear = cleanedItem.ignouYear || '1st Year';

        const existingProg = ignouDatabase.find(
          (p) => p.code.trim().toUpperCase() === pCode
        );
        if (!existingProg) {
          const nextDb = [
            {
              code: pCode,
              title: pTitle,
              degree: pDeg,
              courses: cCode
                ? [{ code: cCode, title: cTitle, year: cYear }]
                : [],
            },
            ...ignouDatabase,
          ];
          await saveIgnouDatabase(nextDb);
        } else if (cCode) {
          const hasCourse = existingProg.courses.some(
            (c) => c.code.toUpperCase() === cCode && c.year === cYear
          );
          if (!hasCourse || (!existingProg.title && pTitle)) {
            const nextDb = ignouDatabase.map((p) =>
              p.code.trim().toUpperCase() === pCode
                ? {
                    ...p,
                    title: p.title || pTitle,
                    courses: hasCourse
                      ? p.courses
                      : [
                          ...p.courses,
                          { code: cCode, title: cTitle, year: cYear },
                        ],
                  }
                : p
            );
            await saveIgnouDatabase(nextDb);
          }
        }
      }

      setEditingItem(null);
      setIsCreating(false);
      showToast({
        message: isCreating ? 'New product added to catalog.' : 'Product updated.',
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

  const handleToggleSoldOut = async (item: CatalogItem) => {
    const nextSoldOut = !item.soldOut;
    const updated = catalog.map((i) =>
      i.id === item.id ? { ...i, soldOut: nextSoldOut } : i
    );
    await saveCatalog(updated);
    showToast({
      message: nextSoldOut
        ? `"${item.title}" marked as Sold Out.`
        : `"${item.title}" marked as In Stock.`,
      type: 'info',
      duration: 2500,
    });
  };

  const allIgnouCatalogItems = useMemo(
    () => catalog.filter((i) => i.category === 'IGNOU'),
    [catalog]
  );

  const adminAvailableIgnouPrograms = useMemo(() => {
    const items = allIgnouCatalogItems.filter(
      (i) =>
        adminIgnouDegreeFilter === 'All' ||
        i.ignouDegree === adminIgnouDegreeFilter
    );
    const map = new Map<string, { code: string; name: string; count: number }>();
    for (const item of items) {
      const code = (item.ignouProgramCode || '').trim().toUpperCase();
      if (!code) continue;
      const existing = map.get(code);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(code, {
          code,
          name: (item.ignouProgramName || '').trim(),
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [allIgnouCatalogItems, adminIgnouDegreeFilter]);

  const adminAvailableIgnouCourses = useMemo(() => {
    const items = allIgnouCatalogItems.filter(
      (i) =>
        (adminIgnouDegreeFilter === 'All' ||
          i.ignouDegree === adminIgnouDegreeFilter) &&
        (adminIgnouProgramFilter === 'All' ||
          (i.ignouProgramCode || '').trim().toUpperCase() ===
            adminIgnouProgramFilter) &&
        (adminIgnouYearFilter === 'All' ||
          i.ignouYear === adminIgnouYearFilter) &&
        (adminIgnouTypeFilter === 'All' ||
          i.ignouMaterialType === adminIgnouTypeFilter)
    );
    const map = new Map<string, number>();
    for (const item of items) {
      const code = (item.ignouCourseCode || '').trim().toUpperCase();
      if (!code) continue;
      map.set(code, (map.get(code) || 0) + 1);
    }
    return Array.from(map.entries()).map(([code, count]) => ({ code, count }));
  }, [
    allIgnouCatalogItems,
    adminIgnouDegreeFilter,
    adminIgnouProgramFilter,
    adminIgnouYearFilter,
    adminIgnouTypeFilter,
  ]);

  const visibleItems = useMemo(() => {
    let base = catalog.filter((i) => {
      if (filterCat === 'All') return true;
      if (filterCat === 'SoldOut') return Boolean(i.soldOut);
      if (filterCat === 'eBooks') {
        return (
          isBookLikeCategory(i.category) &&
          (i.bookFormat === 'ebook' || i.bookFormat === 'both' || !i.bookFormat)
        );
      }
      if (filterCat === 'PhysicalBooks') {
        return (
          isBookLikeCategory(i.category) &&
          (i.bookFormat === 'physical' || i.bookFormat === 'both')
        );
      }
      return i.category === filterCat;
    });

    if (filterCat === 'IGNOU') {
      if (adminIgnouDegreeFilter !== 'All') {
        base = base.filter((i) => i.ignouDegree === adminIgnouDegreeFilter);
      }
      if (adminIgnouProgramFilter !== 'All') {
        base = base.filter(
          (i) =>
            (i.ignouProgramCode || '').trim().toUpperCase() ===
            adminIgnouProgramFilter
        );
      }
      if (adminIgnouYearFilter !== 'All') {
        base = base.filter((i) => i.ignouYear === adminIgnouYearFilter);
      }
      if (adminIgnouCourseFilter !== 'All') {
        base = base.filter(
          (i) =>
            (i.ignouCourseCode || '').trim().toUpperCase() ===
            adminIgnouCourseFilter
        );
      }
      if (adminIgnouTypeFilter !== 'All') {
        base = base.filter((i) => i.ignouMaterialType === adminIgnouTypeFilter);
      }
    }

    return base;
  }, [
    catalog,
    filterCat,
    adminIgnouDegreeFilter,
    adminIgnouProgramFilter,
    adminIgnouYearFilter,
    adminIgnouCourseFilter,
    adminIgnouTypeFilter,
  ]);

  // Hierarchical grouping for Admin IGNOU view: Degree -> Program Code -> Year -> Courses
  const groupedIgnouSections = useMemo(() => {
    if (filterCat !== 'IGNOU') return [];
    const degreeOrder: Record<string, number> = {
      'Bachelor Degree': 1,
      'Master Degree': 2,
      'Certificate Degree': 3,
    };
    const yearOrder: Record<string, number> = {
      '1st Year': 1,
      '2nd Year': 2,
      '3rd Year': 3,
      '4th Year': 4,
    };

    const groupsMap = new Map<
      string,
      {
        key: string;
        degree: IgnouDegree;
        programCode: string;
        programName: string;
        year: IgnouYear;
        items: CatalogItem[];
      }
    >();

    for (const item of visibleItems) {
      const degree: IgnouDegree = item.ignouDegree || 'Bachelor Degree';
      const programCode =
        (item.ignouProgramCode || '').trim().toUpperCase() || 'UNSPECIFIED';
      const programName = (item.ignouProgramName || '').trim();
      const year: IgnouYear = item.ignouYear || '1st Year';
      const key = `${degree}__${programCode}__${year}`;

      const existing = groupsMap.get(key);
      if (existing) {
        if (!existing.programName && programName) {
          existing.programName = programName;
        }
        existing.items.push(item);
      } else {
        groupsMap.set(key, {
          key,
          degree,
          programCode,
          programName,
          year,
          items: [item],
        });
      }
    }

    const sections = Array.from(groupsMap.values());
    sections.sort((a, b) => {
      const degDiff = (degreeOrder[a.degree] || 9) - (degreeOrder[b.degree] || 9);
      if (degDiff !== 0) return degDiff;
      const progDiff = a.programCode.localeCompare(b.programCode);
      if (progDiff !== 0) return progDiff;
      return (yearOrder[a.year] || 9) - (yearOrder[b.year] || 9);
    });

    for (const sec of sections) {
      sec.items.sort((a, b) =>
        (a.ignouCourseCode || a.title).localeCompare(
          b.ignouCourseCode || b.title
        )
      );
    }

    return sections;
  }, [filterCat, visibleItems]);

  const getTabCount = (cat: string) => {
    if (cat === 'All') return catalog.length;
    if (cat === 'SoldOut') return catalog.filter((i) => Boolean(i.soldOut)).length;
    if (cat === 'eBooks') {
      return catalog.filter(
        (i) =>
          isBookLikeCategory(i.category) &&
          (i.bookFormat === 'ebook' || i.bookFormat === 'both' || !i.bookFormat)
      ).length;
    }
    if (cat === 'PhysicalBooks') {
      return catalog.filter(
        (i) =>
          isBookLikeCategory(i.category) &&
          (i.bookFormat === 'physical' || i.bookFormat === 'both')
      ).length;
    }
    return catalog.filter((i) => i.category === cat).length;
  };

  const getFormatLabel = (item: CatalogItem) => {
    if (!isBookLikeCategory(item.category)) return item.specs.format;
    const fmt = item.bookFormat || 'ebook';
    const physLabel = getPhysicalFormatLabel(item);
    if (item.category === 'IGNOU') {
      if (fmt === 'ebook') return 'PDF';
      if (fmt === 'physical') return physLabel;
      return `BOTH (${physLabel} + PDF)`;
    }
    if (fmt === 'ebook') return 'EBOOK PDF';
    if (fmt === 'physical') return 'PHYSICAL';
    return 'BOTH';
  };

  const filterTabs = [
    { id: 'All', label: 'All' },
    { id: 'Books', label: 'Books' },
    { id: 'IGNOU', label: 'IGNOU' },
    { id: 'Stationery', label: 'Stationery' },
    ...customCategories.map((c) => ({ id: c, label: c })),
    { id: 'eBooks', label: 'PDF / eBooks' },
    { id: 'PhysicalBooks', label: 'Handwritten / Hardcopy' },
    { id: 'SoldOut', label: 'Sold Out' },
  ];

  const isIgnouEditing = editingItem?.category === 'IGNOU';
  const isIgnouProjectEditing =
    isIgnouEditing && editingItem?.ignouMaterialType === 'Project';
  const editingPhysicalLabel = editingItem
    ? getPhysicalFormatLabel(editingItem)
    : 'PHYSICAL';

  const inputBaseClass =
    'w-full px-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#2E2E36] text-[#111111] dark:text-[#F5F5F7] placeholder:text-[10px] placeholder:font-semibold placeholder:uppercase placeholder:tracking-[0.14em] placeholder:text-zinc-400/75 dark:placeholder:text-zinc-500 focus:border-[#111111] dark:focus:border-white outline-none transition-colors';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Super Minimal Top Action Bar — Full-Width Action Buttons on Mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-5 border-b border-[#E5E5E0] dark:border-[#26262B]">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#111111] dark:text-white">
          CATALOG
        </h2>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={() => startCreate('ebook', 'IGNOU')}
            className="w-full sm:w-auto px-4 py-3 sm:py-2.5 border border-[#111111] dark:border-white text-[#111111] dark:text-white text-xs font-bold uppercase tracking-[0.16em] hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Add IGNOU Material
          </button>
          <button
            type="button"
            onClick={() => startCreate('ebook', 'Books')}
            className="w-full sm:w-auto px-4 py-3 sm:py-2.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.16em] hover:opacity-85 transition-opacity cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Add Book / Product
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
              {isCreating ? 'CREATE NEW EDITION' : `EDITING: ${editingItem.title}`}
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
            {/* Left: Live Book Cover Preview & Optional Upload */}
            <div className="lg:col-span-4 flex flex-col items-center">
              <div className="relative pt-6 mb-4 flex flex-col items-center">
                {editingItem.soldOut && (
                  <span className="mb-1.5 px-2.5 py-0.5 bg-[#8B1A1A] text-white text-[9px] font-bold uppercase tracking-[0.18em] whitespace-nowrap shadow-sm">
                    SOLD OUT
                  </span>
                )}
                <div className="relative w-44 sm:w-48 aspect-[2/3] shadow-lg overflow-hidden">
                  <ProductImage6x9
                    src={editingItem.image}
                    title={editingItem.title || 'Untitled Edition'}
                    author={editingItem.specs.author}
                    category={editingItem.category}
                    courseCode={editingItem.ignouCourseCode}
                    programCode={editingItem.ignouProgramCode}
                    year={editingItem.ignouYear}
                    releaseDate={editingItem.specs.releaseDate}
                  />
                </div>
              </div>

              <label className="w-full max-w-xs px-4 py-2.5 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors inline-flex items-center justify-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Cover (Optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <div className="w-full max-w-xs mt-3">
                <input
                  type="text"
                  value={editingItem.image}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, image: e.target.value })
                  }
                  placeholder="Cover Image URL (https://...)"
                  className={inputBaseClass}
                />
              </div>
            </div>

            {/* Right: Core Metadata, Category, IGNOU Hierarchy, Format, Demo PDF & Sold Out */}
            <div className="lg:col-span-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                {/* Title / Course Title Input — Faded label inside the box */}
                <div>
                  <input
                    type="text"
                    required
                    value={editingItem.title}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, title: e.target.value })
                    }
                    placeholder={
                      isIgnouEditing
                        ? 'Course Title / Material Title'
                        : 'Title (Book, IGNOU Material, or Stationery)'
                    }
                    className={inputBaseClass}
                  />
                </div>

                {/* Category Selector — Clean 'CATEGORY' Header */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                      CATEGORY
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory((prev) => !prev)}
                      className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#111111] dark:text-white hover:opacity-75 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FolderPlus className="w-3 h-3" />
                      <span>{isAddingCategory ? 'Close' : '+ Add Category'}</span>
                    </button>
                  </div>

                  <select
                    value={editingItem.category}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__ADD_NEW_CATEGORY__') {
                        setIsAddingCategory(true);
                        return;
                      }
                      const nextMaterialType: IgnouMaterialType | undefined =
                        val === 'IGNOU'
                          ? editingItem.ignouMaterialType || 'Assignment'
                          : undefined;
                      const currentRel = (editingItem.specs.releaseDate || '').trim();
                      const currentFeat = (editingItem.specs.features || '').trim();
                      setEditingItem({
                        ...editingItem,
                        category: val,
                        bookFormat: isBookLikeCategory(val)
                          ? editingItem.bookFormat || 'ebook'
                          : undefined,
                        ignouDegree:
                          val === 'IGNOU'
                            ? editingItem.ignouDegree || 'Bachelor Degree'
                            : undefined,
                        ignouYear:
                          val === 'IGNOU'
                            ? editingItem.ignouYear || '1st Year'
                            : undefined,
                        ignouMaterialType: nextMaterialType,
                        specs: {
                          ...editingItem.specs,
                          releaseDate:
                            val === 'IGNOU'
                              ? ignouSessionInfo.options.includes(currentRel)
                                ? currentRel
                                : ignouSessionInfo.defaultSession
                              : ignouSessionInfo.options.includes(currentRel)
                              ? String(ignouSessionInfo.year)
                              : currentRel || String(ignouSessionInfo.year),
                          features:
                            val === 'IGNOU'
                              ? AUTO_FEATURES_PRESETS.has(currentFeat)
                                ? getDefaultIgnouPages(nextMaterialType)
                                : editingItem.specs.features
                              : currentFeat === '25 Pages' || currentFeat === '60 Pages'
                              ? 'Digital PDF Edition, 256 pages'
                              : editingItem.specs.features,
                        },
                      });
                    }}
                    className={inputBaseClass}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__ADD_NEW_CATEGORY__">
                      + Add New Custom Category...
                    </option>
                  </select>

                  {/* Inline Custom Category Input Box */}
                  {isAddingCategory && (
                    <div className="mt-2 p-3 bg-[#FAFAFA] dark:bg-[#18181D] border border-[#D4D4D0] dark:border-[#2E2E36] space-y-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="New Category Name (e.g. Notes, Journals...)"
                          className={`flex-1 ${inputBaseClass}`}
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCategory}
                          className="px-3.5 py-2.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[10px] font-bold uppercase tracking-[0.16em] cursor-pointer whitespace-nowrap"
                        >
                          Add
                        </button>
                      </div>

                      {customCategories.length > 0 && (
                        <div className="pt-2 border-t border-[#E5E5E0] dark:border-[#26262B] flex flex-wrap items-center gap-1.5">
                          {customCategories.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-white dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#2E2E36]"
                            >
                              <span>{c}</span>
                              <button
                                type="button"
                                onClick={() => removeCustomCategory(c)}
                                className="text-zinc-400 hover:text-red-600 cursor-pointer"
                                title={`Remove ${c} category`}
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* IGNOU Structured Hierarchy Block (Shown when Category === 'IGNOU') */}
                {isIgnouEditing && (
                  <div className="sm:col-span-2 p-4 sm:p-5 bg-[#FAFAFA] dark:bg-[#18181D] border border-[#E5E5E0] dark:border-[#26262B] space-y-4">
                    <div className="border-b border-[#E5E5E0] dark:border-[#26262B] pb-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#111111] dark:text-white">
                        IGNOU PROGRAMME &amp; COURSE DETAILS
                      </span>
                    </div>

                    {/* 1. Select Degree Programme */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-2">
                        1. SELECT DEGREE / PROGRAMME CATEGORY
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {IGNOU_DEGREE_OPTIONS.map((deg) => {
                          const active = editingItem.ignouDegree === deg;
                          return (
                            <button
                              key={deg}
                              type="button"
                              onClick={() => {
                                const degreeChanged =
                                  editingItem.ignouDegree !== deg;
                                setEditingItem({
                                  ...editingItem,
                                  ignouDegree: deg,
                                  ignouYear: degreeChanged
                                    ? '1st Year'
                                    : editingItem.ignouYear || '1st Year',
                                  ignouProgramCode: degreeChanged
                                    ? ''
                                    : editingItem.ignouProgramCode,
                                  ignouProgramName: degreeChanged
                                    ? ''
                                    : editingItem.ignouProgramName,
                                  ignouMaterialType:
                                    editingItem.ignouMaterialType || 'Assignment',
                                });
                                setIsProgramDropdownOpen(false);
                              }}
                              className={`px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border text-left transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                                  : 'bg-[#FFFFFF] dark:bg-[#141418] text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36] hover:border-[#111111] dark:hover:border-white'
                              }`}
                            >
                              {deg}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Program Code (Combobox Dropdown scoped by selected Degree) & Program Name (Auto-Fill + Editable) */}
                    {editingItem.ignouDegree && (
                      <div className="pt-2 border-t border-[#E5E5E0] dark:border-[#26262B]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-2">
                          2. PROGRAM CODE &amp; PROGRAM NAME
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Left: Program Code Combobox / Dropdown */}
                          <div className="relative" ref={programDropdownRef}>
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                value={editingItem.ignouProgramCode || ''}
                                onFocus={() => setIsProgramDropdownOpen(true)}
                                onChange={(e) => {
                                  const rawVal = e.target.value;
                                  const upperVal = rawVal.trim().toUpperCase();
                                  const matchedProgramme =
                                    allProgrammeOptions.find(
                                      (p) => p.code.toUpperCase() === upperVal
                                    );
                                  setEditingItem({
                                    ...editingItem,
                                    ignouProgramCode: rawVal,
                                    ignouProgramName: matchedProgramme
                                      ? matchedProgramme.title
                                      : editingItem.ignouProgramName,
                                  });
                                  setIsProgramDropdownOpen(true);
                                }}
                                placeholder={
                                  editingItem.ignouDegree === 'Master Degree'
                                    ? 'PROGRAM CODE (E.G. MEG, MHD, MCOM)'
                                    : editingItem.ignouDegree ===
                                      'Post Graduate Diploma'
                                    ? 'PROGRAM CODE (E.G. PGDRD, PGDCA_NEW, PGDIBO)'
                                    : editingItem.ignouDegree === 'Diploma'
                                    ? 'PROGRAM CODE (E.G. DECE, DNHE, DTS)'
                                    : editingItem.ignouDegree ===
                                      'Post Graduate Certificate'
                                    ? 'PROGRAM CODE (E.G. PGCCL, PGCGI, PGCAP)'
                                    : editingItem.ignouDegree ===
                                      'Certificate Degree'
                                    ? 'PROGRAM CODE (E.G. CIT, CLIS, CFN, CFE)'
                                    : editingItem.ignouDegree ===
                                      'Awareness / Appreciation'
                                    ? 'PROGRAM CODE (E.G. APDF, ACE, NCD-102)'
                                    : 'PROGRAM CODE (E.G. BAAHD, BAM, BASKH, BAUDH)'
                                }
                                className={`${inputBaseClass} pr-9 uppercase`}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setIsProgramDropdownOpen((prev) => !prev)
                                }
                                className="absolute right-2.5 p-1 text-zinc-400 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                                title="Browse IGNOU Programme Codes"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {isProgramDropdownOpen && (
                              <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto bg-[#FFFFFF] dark:bg-[#141418] border border-[#111111] dark:border-white shadow-xl divide-y divide-[#ECECE7] dark:divide-[#242429]">
                                {filteredProgrammeOptions.map((prog) => {
                                  const isSelected =
                                    (
                                      editingItem.ignouProgramCode || ''
                                    ).toUpperCase() === prog.code.toUpperCase();
                                  return (
                                    <button
                                      key={prog.code}
                                      type="button"
                                      onClick={() => {
                                        setEditingItem({
                                          ...editingItem,
                                          ignouProgramCode: prog.code,
                                          ignouProgramName: prog.title,
                                        });
                                        setIsProgramDropdownOpen(false);
                                      }}
                                      className={`w-full px-3.5 py-2.5 text-left text-xs flex items-baseline justify-between gap-3 transition-colors cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                                          : 'hover:bg-[#F4F4F0] dark:hover:bg-[#1E1E24] text-[#111111] dark:text-[#F5F5F7]'
                                      }`}
                                    >
                                      <span className="font-bold uppercase tracking-wider shrink-0 tabular-nums">
                                        {prog.code}
                                      </span>
                                      <span
                                        className={`truncate text-[11px] ${
                                          isSelected
                                            ? 'text-zinc-200 dark:text-zinc-700'
                                            : 'text-zinc-500 dark:text-zinc-400'
                                        }`}
                                      >
                                        {prog.title}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Right: Program Name (Auto-filled on Program Code selection, and manually editable anytime) */}
                          <input
                            type="text"
                            value={editingItem.ignouProgramName || ''}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                ignouProgramName: e.target.value,
                              })
                            }
                            placeholder="PROGRAM NAME (AUTO-FILLS OR TYPE MANUALLY)"
                            className={inputBaseClass}
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. Select Year (1st Year, 2nd Year, 3rd Year, 4th Year) */}
                    {editingItem.ignouDegree && (
                      <div className="pt-2 border-t border-[#E5E5E0] dark:border-[#26262B]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-2">
                          3. SELECT YEAR
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {IGNOU_YEAR_OPTIONS.map((yr) => {
                            const active =
                              (editingItem.ignouYear || '1st Year') === yr;
                            const yrCourseCount = selectedProgramAllCourses.filter(
                              (c) => c.year === yr
                            ).length;
                            return (
                              <button
                                key={yr}
                                type="button"
                                onClick={() =>
                                  setEditingItem({
                                    ...editingItem,
                                    ignouYear: yr,
                                  })
                                }
                                className={`px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border text-left transition-colors cursor-pointer tabular-nums flex items-center justify-between gap-2 ${
                                  active
                                    ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                                    : 'bg-[#FFFFFF] dark:bg-[#141418] text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36] hover:border-[#111111] dark:hover:border-white'
                                }`}
                              >
                                <span>{yr}</span>
                                {yrCourseCount > 0 && (
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 tabular-nums ${
                                      active
                                        ? 'bg-white/20 text-white dark:bg-black/15 dark:text-[#111111]'
                                        : 'bg-[#F4F4F0] dark:bg-[#1E1E24] text-zinc-500 dark:text-zinc-400'
                                    }`}
                                  >
                                    {yrCourseCount}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. Select Material Type */}
                    {editingItem.ignouDegree && (
                      <div className="pt-2 border-t border-[#E5E5E0] dark:border-[#26262B]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mb-2">
                          4. SELECT MATERIAL TYPE
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {IGNOU_MATERIAL_OPTIONS.map((matType) => {
                            const active =
                              editingItem.ignouMaterialType === matType;
                            return (
                              <button
                                key={matType}
                                type="button"
                                onClick={() => {
                                  const currentFeat = (
                                    editingItem.specs.features || ''
                                  ).trim();
                                  setEditingItem({
                                    ...editingItem,
                                    ignouMaterialType: matType,
                                    specs: {
                                      ...editingItem.specs,
                                      features: AUTO_FEATURES_PRESETS.has(
                                        currentFeat
                                      )
                                        ? getDefaultIgnouPages(matType)
                                        : editingItem.specs.features,
                                    },
                                  });
                                }}
                                className={`px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border text-left transition-colors cursor-pointer ${
                                  active
                                    ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                                    : 'bg-[#FFFFFF] dark:bg-[#141418] text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36] hover:border-[#111111] dark:hover:border-white'
                                }`}
                              >
                                {matType === 'Assignment'
                                  ? 'SOLVED ASSIGNMENT'
                                  : 'PROJECT / SYNOPSIS'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 5. Course Code Selector / Input Box (Auto-fills Title from IGNOU Database & stays 100% editable) */}
                    <div className="pt-2 border-t border-[#E5E5E0] dark:border-[#26262B] space-y-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                        5. SELECT OR ENTER COURSE CODE (AUTO-FILLS TITLE)
                      </p>

                      {/* Quick-Select Course Chips when courses exist in Database for selected Program & Year */}
                      {availableCourseOptionsForYear.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                          {availableCourseOptionsForYear.map((course) => {
                            const isSelected =
                              (
                                editingItem.ignouCourseCode || ''
                              ).trim().toUpperCase() ===
                              course.code.toUpperCase();
                            return (
                              <button
                                key={`${course.year}::${course.code}`}
                                type="button"
                                onClick={() => {
                                  setEditingItem({
                                    ...editingItem,
                                    ignouCourseCode: course.code,
                                    ignouCourseTitle: course.title,
                                    title: course.title || editingItem.title,
                                    ignouYear: course.year || editingItem.ignouYear,
                                  });
                                  setIsCourseDropdownOpen(false);
                                }}
                                className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] border transition-colors cursor-pointer tabular-nums inline-flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                                    : 'bg-[#FFFFFF] dark:bg-[#141418] text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36] hover:border-[#111111] dark:hover:border-white'
                                }`}
                                title={course.title}
                              >
                                <span>{course.code}</span>
                                <span
                                  className={`font-normal truncate max-w-[160px] ${
                                    isSelected
                                      ? 'text-zinc-200 dark:text-zinc-700'
                                      : 'text-zinc-400'
                                  }`}
                                >
                                  · {course.title}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="relative" ref={courseDropdownRef}>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={editingItem.ignouCourseCode || ''}
                            onFocus={() => setIsCourseDropdownOpen(true)}
                            onChange={(e) => {
                              const rawVal = e.target.value;
                              const normKey = normalizeCourseCodeKey(rawVal);
                              const matchedCourse =
                                availableCourseOptionsForYear.find(
                                  (c) =>
                                    normalizeCourseCodeKey(c.code) === normKey
                                ) ||
                                selectedProgramAllCourses.find(
                                  (c) =>
                                    normalizeCourseCodeKey(c.code) === normKey
                                );
                              const fallbackMasterTitle =
                                lookupIgnouCourseTitle(rawVal);
                              const resolvedTitle =
                                matchedCourse?.title || fallbackMasterTitle;
                              setEditingItem({
                                ...editingItem,
                                ignouCourseCode: rawVal,
                                ...(resolvedTitle
                                  ? {
                                      ignouCourseTitle: resolvedTitle,
                                      title: resolvedTitle,
                                    }
                                  : {}),
                              });
                              setIsCourseDropdownOpen(true);
                            }}
                            placeholder="COURSE CODE (SELECT FROM DATABASE OR TYPE E.G. BHDC 101)"
                            className={`${inputBaseClass} pr-9 uppercase`}
                          />
                          {availableCourseOptionsForYear.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setIsCourseDropdownOpen((prev) => !prev)
                              }
                              className="absolute right-2.5 p-1 text-zinc-400 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                              title="Browse Program Courses from Database"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {isCourseDropdownOpen &&
                          filteredCourseOptions.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto bg-[#FFFFFF] dark:bg-[#141418] border border-[#111111] dark:border-white shadow-xl divide-y divide-[#ECECE7] dark:divide-[#242429]">
                              {filteredCourseOptions.map((course) => {
                                const isSelected =
                                  (
                                    editingItem.ignouCourseCode || ''
                                  ).trim().toUpperCase() ===
                                  course.code.toUpperCase();
                                return (
                                  <button
                                    key={`${course.year}::${course.code}`}
                                    type="button"
                                    onClick={() => {
                                      setEditingItem({
                                        ...editingItem,
                                        ignouCourseCode: course.code,
                                        ignouCourseTitle: course.title,
                                        title:
                                          course.title || editingItem.title,
                                        ignouYear:
                                          course.year || editingItem.ignouYear,
                                      });
                                      setIsCourseDropdownOpen(false);
                                    }}
                                    className={`w-full px-3.5 py-2.5 text-left text-xs flex items-baseline justify-between gap-3 transition-colors cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#111111] text-white dark:bg-white dark:text-[#111111]'
                                        : 'hover:bg-[#F4F4F0] dark:hover:bg-[#1E1E24] text-[#111111] dark:text-[#F5F5F7]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="font-bold uppercase tracking-wider tabular-nums">
                                        {course.code}
                                      </span>
                                      <span
                                        className={`text-[10px] uppercase tracking-wider ${
                                          isSelected
                                            ? 'text-zinc-300 dark:text-zinc-600'
                                            : 'text-zinc-400'
                                        }`}
                                      >
                                        ({course.year})
                                      </span>
                                    </div>
                                    <span
                                      className={`truncate text-[11px] ${
                                        isSelected
                                          ? 'text-zinc-200 dark:text-zinc-700'
                                          : 'text-zinc-500 dark:text-zinc-400'
                                      }`}
                                    >
                                      {course.title}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Format Selector: IGNOU uses PDF, HANDWRITTEN (Assignment) / HARDCOPY (Project), BOTH */}
                {isBookLikeCategory(editingItem.category) && (
                  <div className="sm:col-span-2 p-4 bg-[#FAFAFA] dark:bg-[#18181D] border border-[#E5E5E0] dark:border-[#26262B] space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-2">
                        FORMAT
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {(
                          [
                            {
                              id: 'ebook',
                              label: isIgnouEditing ? 'PDF' : 'EBOOK PDF',
                            },
                            {
                              id: 'physical',
                              label: isIgnouEditing
                                ? editingPhysicalLabel
                                : 'PHYSICAL',
                            },
                            {
                              id: 'both',
                              label: 'BOTH',
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
                              className={`px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border text-left transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                                  : 'bg-[#FFFFFF] dark:bg-[#141418] text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36] hover:border-[#111111] dark:hover:border-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Paid PDF Uploads when PDF or BOTH is selected */}
                    {(editingItem.bookFormat === 'ebook' ||
                      editingItem.bookFormat === 'both' ||
                      !editingItem.bookFormat) && (
                      <div className="pt-3 border-t border-[#E5E5E0] dark:border-[#26262B] space-y-3">
                        {editingItem.bookFormat === 'both' && (
                          <div>
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
                              placeholder="PDF Price (₹ INR)"
                              className={`${inputBaseClass} tabular-nums`}
                            />
                          </div>
                        )}

                        {/* When PROJECT / SYNOPSIS is selected: 2 Paid PDF Uploads (1. Synopsis PDF + 2. Project PDF) */}
                        {isIgnouProjectEditing ? (
                          <div className="space-y-3">
                            {/* Document 1: Synopsis PDF */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                              <div className="sm:col-span-6">
                                <label className="w-full px-3.5 py-2.5 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>
                                    {uploadingSynopsisPdf
                                      ? 'Uploading Synopsis...'
                                      : editingItem.synopsisFileName
                                      ? 'Replace Synopsis .PDF'
                                      : 'Upload Synopsis .PDF'}
                                  </span>
                                  <input
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    onChange={handleSynopsisPdfUpload}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              <div className="sm:col-span-6">
                                <input
                                  type="text"
                                  value={editingItem.synopsisPdfUrl || ''}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      synopsisPdfUrl: e.target.value,
                                    })
                                  }
                                  placeholder="Synopsis PDF URL (https://...)"
                                  className={inputBaseClass}
                                />
                              </div>
                              {(editingItem.synopsisFileName ||
                                editingItem.synopsisPdfUrl) && (
                                <div className="sm:col-span-12 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300 bg-[#FFFFFF] dark:bg-[#141418] px-3 py-2 border border-[#E5E5E0] dark:border-[#26262B]">
                                  <span className="truncate">
                                    Synopsis PDF:{' '}
                                    <strong className="text-[#111111] dark:text-white">
                                      {editingItem.synopsisFileName ||
                                        editingItem.synopsisPdfUrl}
                                    </strong>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingItem({
                                        ...editingItem,
                                        synopsisPdfUrl: '',
                                        synopsisFileName: '',
                                      })
                                    }
                                    className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-600 ml-3 cursor-pointer whitespace-nowrap"
                                  >
                                    Clear
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Document 2: Project Report PDF */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                              <div className="sm:col-span-6">
                                <label className="w-full px-3.5 py-2.5 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>
                                    {uploadingPdf
                                      ? 'Uploading Project...'
                                      : editingItem.ebookFileName
                                      ? 'Replace Project .PDF'
                                      : 'Upload Project .PDF'}
                                  </span>
                                  <input
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    onChange={handlePdfUpload}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                              <div className="sm:col-span-6">
                                <input
                                  type="text"
                                  value={editingItem.ebookPdfUrl || ''}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      ebookPdfUrl: e.target.value,
                                    })
                                  }
                                  placeholder="Project PDF URL (https://...)"
                                  className={inputBaseClass}
                                />
                              </div>
                              {(editingItem.ebookFileName ||
                                editingItem.ebookPdfUrl) && (
                                <div className="sm:col-span-12 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300 bg-[#FFFFFF] dark:bg-[#141418] px-3 py-2 border border-[#E5E5E0] dark:border-[#26262B]">
                                  <span className="truncate">
                                    Project PDF:{' '}
                                    <strong className="text-[#111111] dark:text-white">
                                      {editingItem.ebookFileName ||
                                        editingItem.ebookPdfUrl}
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
                                    Clear
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Single Full PDF Upload (Solved Assignment / Books / Custom) */
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-6">
                              <label className="w-full px-3.5 py-2.5 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap">
                                <Upload className="w-3.5 h-3.5" />
                                <span>
                                  {uploadingPdf
                                    ? 'Uploading PDF...'
                                    : editingItem.ebookFileName
                                    ? 'Replace Full PDF'
                                    : 'Upload Full .PDF'}
                                </span>
                                <input
                                  type="file"
                                  accept="application/pdf,.pdf"
                                  onChange={handlePdfUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            <div className="sm:col-span-6">
                              <input
                                type="text"
                                value={editingItem.ebookPdfUrl || ''}
                                onChange={(e) =>
                                  setEditingItem({
                                    ...editingItem,
                                    ebookPdfUrl: e.target.value,
                                  })
                                }
                                placeholder="Or External PDF URL (https://...)"
                                className={inputBaseClass}
                              />
                            </div>

                            {(editingItem.ebookFileName ||
                              editingItem.ebookPdfUrl) && (
                              <div className="sm:col-span-12 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300 bg-[#FFFFFF] dark:bg-[#141418] px-3 py-2 border border-[#E5E5E0] dark:border-[#26262B]">
                                <span className="truncate">
                                  Full PDF:{' '}
                                  <strong className="text-[#111111] dark:text-white">
                                    {editingItem.ebookFileName ||
                                      editingItem.ebookPdfUrl}
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
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* FREE DEMO / SAMPLE PDF UPLOAD (2 Demo Uploads when PROJECT / SYNOPSIS is selected) */}
                <div className="sm:col-span-2 p-4 bg-[#FAFAFA] dark:bg-[#18181D] border border-[#E5E5E0] dark:border-[#26262B] space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 inline-flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>
                      {isIgnouProjectEditing
                        ? 'DEMO PDF (SYNOPSIS DEMO & PROJECT DEMO)'
                        : 'DEMO PDF (OPTIONAL)'}
                    </span>
                  </p>

                  {isIgnouProjectEditing ? (
                    <div className="space-y-3">
                      {/* Demo 1: Synopsis Demo PDF */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-6">
                          <label className="w-full px-3.5 py-2.5 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {uploadingSynopsisDemoPdf
                                ? 'Uploading Synopsis Demo...'
                                : editingItem.synopsisDemoFileName
                                ? 'Replace Synopsis Demo .PDF'
                                : 'Upload Synopsis Demo .PDF'}
                            </span>
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              onChange={handleSynopsisDemoPdfUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="sm:col-span-6">
                          <input
                            type="text"
                            value={editingItem.synopsisDemoPdfUrl || ''}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                synopsisDemoPdfUrl: e.target.value,
                              })
                            }
                            placeholder="Synopsis Demo PDF URL (https://...)"
                            className={inputBaseClass}
                          />
                        </div>

                        {(editingItem.synopsisDemoFileName ||
                          editingItem.synopsisDemoPdfUrl) && (
                          <div className="sm:col-span-12 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300 bg-[#FFFFFF] dark:bg-[#141418] px-3 py-2 border border-[#E5E5E0] dark:border-[#26262B]">
                            <span className="truncate">
                              Synopsis Demo:{' '}
                              <strong className="text-[#111111] dark:text-white">
                                {editingItem.synopsisDemoFileName ||
                                  editingItem.synopsisDemoPdfUrl}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingItem({
                                  ...editingItem,
                                  synopsisDemoPdfUrl: '',
                                  synopsisDemoFileName: '',
                                })
                              }
                              className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-600 ml-3 cursor-pointer whitespace-nowrap"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Demo 2: Project Demo PDF */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-6">
                          <label className="w-full px-3.5 py-2.5 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {uploadingDemoPdf
                                ? 'Uploading Project Demo...'
                                : editingItem.demoFileName
                                ? 'Replace Project Demo .PDF'
                                : 'Upload Project Demo .PDF'}
                            </span>
                            <input
                              type="file"
                              accept="application/pdf,.pdf"
                              onChange={handleDemoPdfUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <div className="sm:col-span-6">
                          <input
                            type="text"
                            value={editingItem.demoPdfUrl || ''}
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                demoPdfUrl: e.target.value,
                              })
                            }
                            placeholder="Project Demo PDF URL (https://...)"
                            className={inputBaseClass}
                          />
                        </div>

                        {(editingItem.demoFileName || editingItem.demoPdfUrl) && (
                          <div className="sm:col-span-12 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300 bg-[#FFFFFF] dark:bg-[#141418] px-3 py-2 border border-[#E5E5E0] dark:border-[#26262B]">
                            <span className="truncate">
                              Project Demo:{' '}
                              <strong className="text-[#111111] dark:text-white">
                                {editingItem.demoFileName || editingItem.demoPdfUrl}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingItem({
                                  ...editingItem,
                                  demoPdfUrl: '',
                                  demoFileName: '',
                                })
                              }
                              className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-600 ml-3 cursor-pointer whitespace-nowrap"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Single Demo PDF Upload */
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-6">
                        <label className="w-full px-3.5 py-2.5 border border-[#111111] dark:border-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap">
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {uploadingDemoPdf
                              ? 'Uploading Demo...'
                              : editingItem.demoFileName
                              ? 'Replace Demo PDF'
                              : 'Upload Demo .PDF'}
                          </span>
                          <input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handleDemoPdfUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          value={editingItem.demoPdfUrl || ''}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              demoPdfUrl: e.target.value,
                            })
                          }
                          placeholder="Or External Demo PDF URL (https://...)"
                          className={inputBaseClass}
                        />
                      </div>

                      {(editingItem.demoFileName || editingItem.demoPdfUrl) && (
                        <div className="sm:col-span-12 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-300 bg-[#FFFFFF] dark:bg-[#141418] px-3 py-2 border border-[#E5E5E0] dark:border-[#26262B]">
                          <span className="truncate">
                            Demo PDF:{' '}
                            <strong className="text-[#111111] dark:text-white">
                              {editingItem.demoFileName || editingItem.demoPdfUrl}
                            </strong>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingItem({
                                ...editingItem,
                                demoPdfUrl: '',
                                demoFileName: '',
                              })
                            }
                            className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-600 ml-3 cursor-pointer whitespace-nowrap"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Price & Original Price Inputs (Faded label inside the box) */}
                <div>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingItem.price || ''}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        price: Number(e.target.value),
                      })
                    }
                    placeholder={
                      isBookLikeCategory(editingItem.category) &&
                      (editingItem.bookFormat === 'ebook' || !editingItem.bookFormat)
                        ? 'PDF Price (₹ INR)'
                        : `${
                            editingPhysicalLabel.charAt(0) +
                            editingPhysicalLabel.slice(1).toLowerCase()
                          } Price (₹ INR)`
                    }
                    className={`${inputBaseClass} tabular-nums`}
                  />
                </div>

                <div>
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
                    placeholder="Original Price (₹ Optional Strikethrough)"
                    className={`${inputBaseClass} tabular-nums`}
                  />
                </div>
              </div>

              {/* Editorial Synopsis — Faded label inside the box */}
              <div>
                <textarea
                  rows={3}
                  required
                  value={editingItem.description}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  placeholder="Editorial Synopsis / Product Description..."
                  className={`${inputBaseClass} resize-none`}
                />
              </div>

              {/* 6-Field Specification Grid — Faded placeholders inside each box */}
              <div className="pt-2 border-t border-[#ECECE7] dark:border-[#242429]">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400 mb-3">
                  SPECIFICATIONS
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={editingItem.specs.author}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        specs: { ...editingItem.specs, author: e.target.value },
                      })
                    }
                    placeholder="Author / Prepared By"
                    className={inputBaseClass}
                  />
                  <input
                    type="text"
                    value={editingItem.specs.publisher}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        specs: { ...editingItem.specs, publisher: e.target.value },
                      })
                    }
                    placeholder="Editors / Publisher"
                    className={inputBaseClass}
                  />
                  <input
                    type="text"
                    value={editingItem.specs.features}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        specs: { ...editingItem.specs, features: e.target.value },
                      })
                    }
                    placeholder={
                      isIgnouEditing
                        ? 'PAGES / FEATURES (E.G. 25 PAGES)'
                        : 'Features / Pages'
                    }
                    className={inputBaseClass}
                  />
                  {isIgnouEditing ? (
                    <select
                      value={
                        ignouSessionInfo.options.includes(
                          (editingItem.specs.releaseDate || '').trim()
                        )
                          ? (editingItem.specs.releaseDate || '').trim()
                          : ignouSessionInfo.defaultSession
                      }
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          specs: {
                            ...editingItem.specs,
                            releaseDate: e.target.value,
                          },
                        })
                      }
                      className={`${inputBaseClass} font-semibold uppercase tracking-wider cursor-pointer tabular-nums`}
                    >
                      {ignouSessionInfo.options.map((sessionOpt) => (
                        <option key={sessionOpt} value={sessionOpt}>
                          {sessionOpt}
                        </option>
                      ))}
                    </select>
                  ) : (
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
                      placeholder="Session / Release Year"
                      className={inputBaseClass}
                    />
                  )}
                  <input
                    type="text"
                    value={editingItem.specs.format}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        specs: { ...editingItem.specs, format: e.target.value },
                      })
                    }
                    placeholder="Format (e.g. 6 × 9 in)"
                    className={inputBaseClass}
                  />
                  <input
                    type="text"
                    value={editingItem.specs.isbn}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        specs: { ...editingItem.specs, isbn: e.target.value },
                      })
                    }
                    placeholder="ISBN / SKU / Code"
                    className={`${inputBaseClass} tabular-nums`}
                  />
                </div>
              </div>

              {/* Hero & Sold Out Checkboxes */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#ECECE7] dark:border-[#242429]">
                <div className="flex flex-wrap items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingItem.featured}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, featured: e.target.checked })
                      }
                      className="accent-[#111111] dark:accent-white"
                    />
                    <span>Show in Hero Spotlight</span>
                  </label>

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingItem.soldOut)}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, soldOut: e.target.checked })
                      }
                      className="accent-red-600"
                    />
                    <span>Mark as Sold Out</span>
                  </label>
                </div>

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

      {/* Filter Tabs */}
      <div className="flex items-center gap-5 overflow-x-auto hide-scrollbar text-xs font-bold uppercase tracking-[0.16em]">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setFilterCat(tab.id);
              if (tab.id !== 'IGNOU') {
                setAdminIgnouDegreeFilter('All');
                setAdminIgnouProgramFilter('All');
                setAdminIgnouYearFilter('All');
                setAdminIgnouCourseFilter('All');
                setAdminIgnouTypeFilter('All');
              }
            }}
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

      {/* Admin IGNOU Progressive Hierarchical Filter Bar (1. Degree -> 2. Program Code -> 3. Year -> 4. Course Code -> 5. Material) */}
      {filterCat === 'IGNOU' && allIgnouCatalogItems.length > 0 && (
        <div className="p-4 sm:p-5 bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] space-y-3.5">
          {/* Step 1: Select Degree Programme (Always visible first) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mr-1">
              1. Degree:
            </span>
            {(['All', ...IGNOU_DEGREE_OPTIONS] as const).map((deg) => {
              const active = adminIgnouDegreeFilter === deg;
              const count =
                deg === 'All'
                  ? allIgnouCatalogItems.length
                  : allIgnouCatalogItems.filter((i) => i.ignouDegree === deg)
                      .length;
              return (
                <button
                  key={deg}
                  type="button"
                  onClick={() => {
                    setAdminIgnouDegreeFilter(deg);
                    setAdminIgnouProgramFilter('All');
                    setAdminIgnouYearFilter('All');
                    setAdminIgnouCourseFilter('All');
                    setAdminIgnouTypeFilter('All');
                  }}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                    active
                      ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                      : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                  }`}
                >
                  {deg === 'All' ? `All Degrees (${count})` : `${deg} (${count})`}
                </button>
              );
            })}
          </div>

          {/* Step 2: Select Program Code (Appears ONLY after a specific Degree is selected) */}
          {adminIgnouDegreeFilter !== 'All' && (
            <div className="pt-3 border-t border-[#ECECE7] dark:border-[#222227] flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mr-1">
                2. Program Code:
              </span>
              <button
                type="button"
                onClick={() => {
                  setAdminIgnouProgramFilter('All');
                  setAdminIgnouYearFilter('All');
                  setAdminIgnouCourseFilter('All');
                  setAdminIgnouTypeFilter('All');
                }}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap ${
                  adminIgnouProgramFilter === 'All'
                    ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                    : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                }`}
              >
                All Programs
              </button>
              {adminAvailableIgnouPrograms.length > 0 ? (
                adminAvailableIgnouPrograms.map((prog) => {
                  const active = adminIgnouProgramFilter === prog.code;
                  return (
                    <button
                      key={prog.code}
                      type="button"
                      onClick={() => {
                        setAdminIgnouProgramFilter(prog.code);
                        setAdminIgnouYearFilter('All');
                        setAdminIgnouCourseFilter('All');
                        setAdminIgnouTypeFilter('All');
                      }}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                        active
                          ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                          : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                      }`}
                    >
                      {prog.name
                        ? `${prog.code} (${prog.name}) [${prog.count}]`
                        : `${prog.code} [${prog.count}]`}
                    </button>
                  );
                })
              ) : (
                <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                  No Program Codes Uploaded In This Degree Yet
                </span>
              )}
            </div>
          )}

          {/* Step 3: Select Year (Appears ONLY after a specific Program Code is selected) */}
          {adminIgnouDegreeFilter !== 'All' &&
            adminIgnouProgramFilter !== 'All' && (
              <div className="pt-3 border-t border-[#ECECE7] dark:border-[#222227] flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mr-1">
                  3. Year:
                </span>
                {(['All', ...IGNOU_YEAR_OPTIONS] as const).map((yr) => {
                  const active = adminIgnouYearFilter === yr;
                  const yrCount = allIgnouCatalogItems.filter(
                    (i) =>
                      i.ignouDegree === adminIgnouDegreeFilter &&
                      (i.ignouProgramCode || '').trim().toUpperCase() ===
                        adminIgnouProgramFilter &&
                      (yr === 'All' || i.ignouYear === yr)
                  ).length;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setAdminIgnouYearFilter(yr);
                        setAdminIgnouCourseFilter('All');
                        setAdminIgnouTypeFilter('All');
                      }}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                        active
                          ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                          : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                      }`}
                    >
                      {yr === 'All'
                        ? `All Years (${yrCount})`
                        : `${yr} (${yrCount})`}
                    </button>
                  );
                })}
              </div>
            )}

          {/* Step 4: Select Course Code (Appears ONLY after a specific Year is selected) */}
          {adminIgnouDegreeFilter !== 'All' &&
            adminIgnouProgramFilter !== 'All' &&
            adminIgnouYearFilter !== 'All' && (
              <div className="pt-3 border-t border-[#ECECE7] dark:border-[#222227] flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mr-1">
                  4. Course Code:
                </span>
                <button
                  type="button"
                  onClick={() => setAdminIgnouCourseFilter('All')}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap ${
                    adminIgnouCourseFilter === 'All'
                      ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                      : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                  }`}
                >
                  All Courses
                </button>
                {adminAvailableIgnouCourses.length > 0 ? (
                  adminAvailableIgnouCourses.map((c) => {
                    const active = adminIgnouCourseFilter === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setAdminIgnouCourseFilter(c.code)}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                          active
                            ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                            : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                        }`}
                      >
                        {c.code} ({c.count})
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

          {/* Step 5: Select Material Type (Appears after Year is selected) */}
          {adminIgnouDegreeFilter !== 'All' &&
            adminIgnouProgramFilter !== 'All' &&
            adminIgnouYearFilter !== 'All' && (
              <div className="pt-3 border-t border-[#ECECE7] dark:border-[#222227] flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 mr-1">
                  5. Material:
                </span>
                {(['All', ...IGNOU_MATERIAL_OPTIONS] as const).map((type) => {
                  const active = adminIgnouTypeFilter === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setAdminIgnouTypeFilter(type);
                        setAdminIgnouCourseFilter('All');
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

      {/* Empty State when Admin has 0 products */}
      {visibleItems.length === 0 ? (
        <div className="py-12 sm:py-16 px-5 sm:px-6 bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] text-center space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
            NO PRODUCTS IN THIS VIEW YET
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 max-w-md mx-auto">
            <button
              type="button"
              onClick={() =>
                startCreate(
                  'ebook',
                  'IGNOU',
                  filterCat === 'IGNOU'
                    ? {
                        degree:
                          adminIgnouDegreeFilter !== 'All'
                            ? adminIgnouDegreeFilter
                            : undefined,
                        programCode:
                          adminIgnouProgramFilter !== 'All'
                            ? adminIgnouProgramFilter
                            : undefined,
                        year:
                          adminIgnouYearFilter !== 'All'
                            ? adminIgnouYearFilter
                            : undefined,
                      }
                    : undefined
                )
              }
              className="w-full sm:w-auto px-5 py-3 border border-[#111111] dark:border-white text-[#111111] dark:text-white text-xs font-bold uppercase tracking-[0.18em] hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add IGNOU Material
            </button>
            <button
              type="button"
              onClick={() => startCreate('ebook', 'Books')}
              className="w-full sm:w-auto px-6 py-3 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.18em] hover:opacity-85 cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Add Book / Product
            </button>
          </div>
        </div>
      ) : filterCat === 'IGNOU' ? (
        /* Structured Hierarchical View for Admin IGNOU Tab (Degree -> Program Code -> Year -> Courses) */
        <div className="space-y-7">
          {groupedIgnouSections.map((section) => (
            <div
              key={section.key}
              className="border border-[#E5E5E0] dark:border-[#26262B] bg-[#FAFAFA] dark:bg-[#121216] p-4 sm:p-5 space-y-4"
            >
              {/* Hierarchy Group Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E0] dark:border-[#26262B]">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
                  <span className="px-2.5 py-1 bg-[#111111] text-white dark:bg-white dark:text-[#111111]">
                    {section.degree}
                  </span>
                  <span className="text-zinc-400">→</span>
                  <span className="px-2.5 py-1 bg-[#FFFFFF] dark:bg-[#18181E] border border-[#D4D4D0] dark:border-[#2E2E36] text-[#111111] dark:text-white tabular-nums">
                    {section.programName
                      ? `${section.programCode} (${section.programName})`
                      : section.programCode}
                  </span>
                  <span className="text-zinc-400">→</span>
                  <span className="px-2.5 py-1 bg-[#FFFFFF] dark:bg-[#18181E] border border-[#D4D4D0] dark:border-[#2E2E36] text-[#111111] dark:text-white tabular-nums">
                    {section.year}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400 ml-1 tabular-nums">
                    ({section.items.length}{' '}
                    {section.items.length === 1 ? 'Product' : 'Products'})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    startCreate('ebook', 'IGNOU', {
                      degree: section.degree,
                      programCode:
                        section.programCode === 'UNSPECIFIED'
                          ? ''
                          : section.programCode,
                      programName: section.programName,
                      year: section.year,
                    })
                  }
                  className="self-start sm:self-auto px-3 py-1.5 border border-[#111111] dark:border-white text-[#111111] dark:text-white text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Course In {section.programCode} · {section.year}</span>
                </button>
              </div>

              {/* Cards inside this Degree -> Program Code -> Year group */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {section.items.map((item) => {
                  const itemPhysLabel = getPhysicalFormatLabel(item);
                  return (
                    <div
                      key={item.id}
                      className="bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] p-5 flex gap-5 items-start"
                    >
                      <div className="flex flex-col items-center shrink-0">
                        {item.soldOut && (
                          <span className="mb-1 px-2 py-0.5 bg-[#8B1A1A] text-white text-[8px] font-bold uppercase tracking-[0.16em] whitespace-nowrap">
                            SOLD OUT
                          </span>
                        )}
                        <div className="relative w-20 aspect-[2/3] border border-black/5 dark:border-white/10">
                          <ProductImage6x9
                            src={item.image}
                            title={item.title}
                            author={item.specs.author}
                            category={item.category}
                            courseCode={item.ignouCourseCode}
                            programCode={item.ignouProgramCode}
                            year={item.ignouYear}
                            releaseDate={item.specs.releaseDate}
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mb-1">
                          {item.ignouCourseCode && (
                            <span className="px-2 py-0.5 bg-[#111111] text-white dark:bg-white dark:text-[#111111] tabular-nums">
                              {item.ignouCourseCode}
                            </span>
                          )}
                          {item.ignouMaterialType && (
                            <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200">
                              {item.ignouMaterialType === 'Assignment'
                                ? 'Solved Assignment'
                                : 'Project / Synopsis'}
                            </span>
                          )}
                          <span className="text-zinc-400 tabular-nums">
                            · {getFormatLabel(item)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[#111111] dark:text-white truncate">
                          {item.title}
                        </h4>

                        <div className="flex flex-wrap items-baseline gap-2.5 mt-1 text-xs tabular-nums">
                          {item.bookFormat === 'ebook' ? (
                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                              PDF ₹
                              {(item.ebookPrice || item.price).toLocaleString(
                                'en-IN'
                              )}
                            </span>
                          ) : (
                            <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                              {item.bookFormat === 'physical' ||
                              item.bookFormat === 'both'
                                ? `${
                                    itemPhysLabel.charAt(0) +
                                    itemPhysLabel.slice(1).toLowerCase()
                                  } `
                                : ''}
                              ₹{item.price.toLocaleString('en-IN')}
                            </span>
                          )}
                          {item.bookFormat === 'both' && item.ebookPrice && (
                            <span className="text-[11px] text-zinc-400">
                              · PDF ₹{item.ebookPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {(item.demoPdfUrl || item.synopsisDemoPdfUrl) && (
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            ✓{' '}
                            {item.synopsisDemoPdfUrl && item.demoPdfUrl
                              ? 'Synopsis + Project Demo PDFs'
                              : item.synopsisDemoPdfUrl
                              ? 'Synopsis Demo PDF'
                              : 'Demo PDF'}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-[#ECECE7] dark:border-[#222227]">
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
                            <Star
                              className="w-3 h-3"
                              fill={item.featured ? 'currentColor' : 'none'}
                            />
                            <span>Hero</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSoldOut(item)}
                            className={`text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer ${
                              item.soldOut
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                            }`}
                            title={
                              item.soldOut
                                ? 'Click to mark In Stock'
                                : 'Click to mark Sold Out'
                            }
                          >
                            <Ban className="w-3 h-3" />
                            <span>
                              {item.soldOut ? 'Sold Out' : 'Mark Sold Out'}
                            </span>
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Standard Catalog Grid (All, Books, Stationery, etc.) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleItems.map((item) => {
            const isIgnouItem = item.category === 'IGNOU';
            const itemPhysLabel = getPhysicalFormatLabel(item);
            return (
              <div
                key={item.id}
                className="bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] p-5 flex gap-5 items-start"
              >
                <div className="flex flex-col items-center shrink-0">
                  {item.soldOut && (
                    <span className="mb-1 px-2 py-0.5 bg-[#8B1A1A] text-white text-[8px] font-bold uppercase tracking-[0.16em] whitespace-nowrap">
                      SOLD OUT
                    </span>
                  )}
                  <div className="relative w-20 aspect-[2/3] border border-black/5 dark:border-white/10">
                    <ProductImage6x9
                      src={item.image}
                      title={item.title}
                      author={item.specs.author}
                      category={item.category}
                      courseCode={item.ignouCourseCode}
                      programCode={item.ignouProgramCode}
                      year={item.ignouYear}
                      releaseDate={item.specs.releaseDate}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-zinc-400 mb-1 truncate">
                    <span>{item.category}</span>
                    <span>·</span>
                    <span className="tabular-nums text-[#111111] dark:text-zinc-300 font-semibold truncate">
                      {getFormatLabel(item)}
                    </span>
                  </div>

                  {isIgnouItem && (
                    <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">
                      {item.ignouDegree && <span>{item.ignouDegree}</span>}
                      {item.ignouProgramCode && (
                        <span>· {item.ignouProgramCode}</span>
                      )}
                      {item.ignouYear && <span>· {item.ignouYear}</span>}
                      {item.ignouCourseCode && (
                        <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[#111111] dark:text-white">
                          {item.ignouCourseCode}
                        </span>
                      )}
                      {item.ignouMaterialType && (
                        <span>· {item.ignouMaterialType}</span>
                      )}
                    </div>
                  )}

                  <h4 className="text-sm font-bold text-[#111111] dark:text-white truncate">
                    {item.title}
                  </h4>

                  {isIgnouItem && item.ignouProgramName && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                      {item.ignouProgramName}
                    </p>
                  )}

                  <div className="flex flex-wrap items-baseline gap-2.5 mt-1 text-xs tabular-nums">
                    {isBookLikeCategory(item.category) &&
                    item.bookFormat === 'ebook' ? (
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                        {isIgnouItem ? 'PDF' : 'eBook PDF'} ₹
                        {(item.ebookPrice || item.price).toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                        {isIgnouItem &&
                        (item.bookFormat === 'physical' ||
                          item.bookFormat === 'both')
                          ? `${
                              itemPhysLabel.charAt(0) +
                              itemPhysLabel.slice(1).toLowerCase()
                            } `
                          : ''}
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                    )}
                    {isBookLikeCategory(item.category) &&
                      item.bookFormat === 'both' &&
                      item.ebookPrice && (
                        <span className="text-[11px] text-zinc-400">
                          · {isIgnouItem ? 'PDF' : 'eBook PDF'} ₹
                          {item.ebookPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                  </div>

                  {(item.demoPdfUrl || item.synopsisDemoPdfUrl) && (
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      ✓{' '}
                      {item.synopsisDemoPdfUrl && item.demoPdfUrl
                        ? 'Synopsis + Project Demo PDFs'
                        : item.synopsisDemoPdfUrl
                        ? 'Synopsis Demo PDF'
                        : 'Demo PDF'}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-[#ECECE7] dark:border-[#222227]">
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
                      onClick={() => handleToggleSoldOut(item)}
                      className={`text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer ${
                        item.soldOut
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-zinc-400 hover:text-[#111111] dark:hover:text-white'
                      }`}
                      title={item.soldOut ? 'Click to mark In Stock' : 'Click to mark Sold Out'}
                    >
                      <Ban className="w-3 h-3" />
                      <span>{item.soldOut ? 'Sold Out' : 'Mark Sold Out'}</span>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
