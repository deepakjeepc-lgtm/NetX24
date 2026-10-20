import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Database,
  BookOpen,
} from 'lucide-react';
import {
  IGNOU_DEGREE_OPTIONS,
  IGNOU_YEAR_OPTIONS,
  IgnouCourseEntry,
  IgnouDatabaseProgram,
  IgnouDegree,
  IgnouYear,
  useCatalog,
} from '../../context/CatalogContext';
import { useToast } from '../../context/ToastContext';
import {
  lookupIgnouCourseTitle,
  normalizeCourseCodeKey,
} from '../../lib/ignouCourseCatalog';

export default function DatabaseManager() {
  const { ignouDatabase, saveIgnouDatabase, catalog } = useCatalog();
  const { showToast } = useToast();

  const [activeSection] = useState<'ignou'>('ignou');
  const [degreeFilter, setDegreeFilter] = useState<'All' | IgnouDegree>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyWithCourses, setOnlyWithCourses] = useState(false);

  // Expanded program code for managing its courses
  const [expandedProgramCode, setExpandedProgramCode] = useState<string | null>(
    null
  );
  const [activeYearTab, setActiveYearTab] = useState<'All' | IgnouYear>('All');

  // Add new program form state
  const [isAddingProgram, setIsAddingProgram] = useState(false);
  const [newProgramDegree, setNewProgramDegree] =
    useState<IgnouDegree>('Bachelor Degree');
  const [newProgramCode, setNewProgramCode] = useState('');
  const [newProgramTitle, setNewProgramTitle] = useState('');

  // Edit existing program header state
  const [editingProgramOriginalCode, setEditingProgramOriginalCode] = useState<
    string | null
  >(null);
  const [editProgramDegree, setEditProgramDegree] =
    useState<IgnouDegree>('Bachelor Degree');
  const [editProgramCode, setEditProgramCode] = useState('');
  const [editProgramTitle, setEditProgramTitle] = useState('');

  // Add course state (inside expanded program)
  const [newCourseYear, setNewCourseYear] = useState<IgnouYear>('1st Year');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseTitle, setNewCourseTitle] = useState('');

  // Inline edit course state
  const [editingCourseKey, setEditingCourseKey] = useState<string | null>(null);
  const [editCourseYear, setEditCourseYear] = useState<IgnouYear>('1st Year');
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseTitle, setEditCourseTitle] = useState('');

  const [saving, setSaving] = useState(false);

  // Merge any IGNOU courses already present in catalog so existing catalog courses show up too
  const mergedDatabase = useMemo<IgnouDatabaseProgram[]>(() => {
    const map = new Map<string, IgnouDatabaseProgram>();

    for (const p of ignouDatabase) {
      const code = p.code.trim().toUpperCase();
      map.set(code, {
        ...p,
        code,
        courses: [...p.courses],
      });
    }

    for (const item of catalog) {
      if (item.category !== 'IGNOU' || !item.ignouProgramCode) continue;
      const pCode = item.ignouProgramCode.trim().toUpperCase();
      if (!pCode) continue;

      const existingProg = map.get(pCode);
      const deg: IgnouDegree = item.ignouDegree || 'Bachelor Degree';
      const pTitle = (item.ignouProgramName || '').trim();

      if (!existingProg) {
        map.set(pCode, {
          code: pCode,
          title: pTitle,
          degree: deg,
          courses: [],
        });
      } else if (!existingProg.title && pTitle) {
        existingProg.title = pTitle;
      }

      const cCode = (item.ignouCourseCode || '').trim().toUpperCase();
      const cTitle = (item.title || '').trim();
      const cYear: IgnouYear = item.ignouYear || '1st Year';
      if (cCode) {
        const prog = map.get(pCode)!;
        const alreadyHas = prog.courses.some(
          (c) =>
            normalizeCourseCodeKey(c.code) === normalizeCourseCodeKey(cCode) &&
            c.year === cYear
        );
        if (!alreadyHas) {
          prog.courses.push({
            code: cCode,
            title: cTitle || lookupIgnouCourseTitle(cCode) || cCode,
            year: cYear,
          });
        }
      }
    }

    return Array.from(map.values());
  }, [ignouDatabase, catalog]);

  const totalCoursesCount = useMemo(
    () => mergedDatabase.reduce((sum, p) => sum + p.courses.length, 0),
    [mergedDatabase]
  );

  const filteredPrograms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const normQ = normalizeCourseCodeKey(searchQuery).toLowerCase();
    return mergedDatabase
      .filter((p) => {
        if (degreeFilter !== 'All' && p.degree !== degreeFilter) return false;
        if (onlyWithCourses && p.courses.length === 0) return false;
        if (!q) return true;
        if (
          p.code.toLowerCase().includes(q) ||
          normalizeCourseCodeKey(p.code).toLowerCase().includes(normQ) ||
          p.title.toLowerCase().includes(q)
        ) {
          return true;
        }
        return p.courses.some(
          (c) =>
            c.code.toLowerCase().includes(q) ||
            (normQ.length > 0 &&
              normalizeCourseCodeKey(c.code).toLowerCase().includes(normQ)) ||
            c.title.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Put programs that have courses at the top for quick access, then alphabetical
        if (a.courses.length > 0 && b.courses.length === 0) return -1;
        if (a.courses.length === 0 && b.courses.length > 0) return 1;
        return a.code.localeCompare(b.code);
      });
  }, [mergedDatabase, degreeFilter, onlyWithCourses, searchQuery]);

  const inputBaseClass =
    'w-full px-3.5 py-2.5 text-xs bg-[#FFFFFF] dark:bg-[#141418] border border-[#D4D4D0] dark:border-[#2E2E36] text-[#111111] dark:text-[#F5F5F7] placeholder:text-[10px] placeholder:font-semibold placeholder:uppercase placeholder:tracking-[0.14em] placeholder:text-zinc-400/75 dark:placeholder:text-zinc-500 focus:border-[#111111] dark:focus:border-white outline-none transition-colors';

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newProgramCode.trim().toUpperCase();
    const cleanTitle = newProgramTitle.trim();
    if (!cleanCode) {
      showToast({
        message: 'Please enter a Program Code.',
        type: 'error',
        duration: 2500,
      });
      return;
    }

    setSaving(true);
    try {
      const existingIdx = mergedDatabase.findIndex(
        (p) => p.code.toUpperCase() === cleanCode
      );
      let nextList: IgnouDatabaseProgram[];
      if (existingIdx > -1) {
        nextList = mergedDatabase.map((p, idx) =>
          idx === existingIdx
            ? {
                ...p,
                degree: newProgramDegree,
                title: cleanTitle || p.title,
              }
            : p
        );
      } else {
        nextList = [
          {
            code: cleanCode,
            title: cleanTitle,
            degree: newProgramDegree,
            courses: [],
          },
          ...mergedDatabase,
        ];
      }

      await saveIgnouDatabase(nextList);
      setNewProgramCode('');
      setNewProgramTitle('');
      setIsAddingProgram(false);
      setExpandedProgramCode(cleanCode);
      showToast({
        message: `Program ${cleanCode} saved to IGNOU Database.`,
        type: 'success',
        duration: 2500,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditProgram = (prog: IgnouDatabaseProgram) => {
    setEditingProgramOriginalCode(prog.code);
    setEditProgramDegree(prog.degree);
    setEditProgramCode(prog.code);
    setEditProgramTitle(prog.title);
  };

  const handleSaveEditProgram = async () => {
    if (!editingProgramOriginalCode) return;
    const cleanCode = editProgramCode.trim().toUpperCase();
    const cleanTitle = editProgramTitle.trim();
    if (!cleanCode) return;

    setSaving(true);
    try {
      const nextList = mergedDatabase.map((p) =>
        p.code === editingProgramOriginalCode
          ? {
              ...p,
              code: cleanCode,
              title: cleanTitle,
              degree: editProgramDegree,
            }
          : p
      );
      await saveIgnouDatabase(nextList);
      if (expandedProgramCode === editingProgramOriginalCode) {
        setExpandedProgramCode(cleanCode);
      }
      setEditingProgramOriginalCode(null);
      showToast({
        message: `Program ${cleanCode} updated.`,
        type: 'success',
        duration: 2500,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgram = async (code: string) => {
    setSaving(true);
    try {
      const nextList = mergedDatabase.filter((p) => p.code !== code);
      await saveIgnouDatabase(nextList);
      if (expandedProgramCode === code) {
        setExpandedProgramCode(null);
      }
      showToast({
        message: `Program ${code} removed from database.`,
        type: 'info',
        duration: 2500,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCourse = async (e: React.FormEvent, programCode: string) => {
    e.preventDefault();
    const cleanCourseCode = newCourseCode.trim().toUpperCase();
    const cleanCourseTitle = newCourseTitle.trim();
    if (!cleanCourseCode || !cleanCourseTitle) {
      showToast({
        message: 'Please enter both Course Code and Course Title.',
        type: 'error',
        duration: 2500,
      });
      return;
    }

    setSaving(true);
    try {
      const nextList = mergedDatabase.map((prog) => {
        if (prog.code !== programCode) return prog;
        const filteredCourses = prog.courses.filter(
          (c) =>
            !(
              c.code.toUpperCase() === cleanCourseCode &&
              c.year === newCourseYear
            )
        );
        return {
          ...prog,
          courses: [
            ...filteredCourses,
            {
              code: cleanCourseCode,
              title: cleanCourseTitle,
              year: newCourseYear,
            },
          ],
        };
      });

      await saveIgnouDatabase(nextList);
      setNewCourseCode('');
      setNewCourseTitle('');
      showToast({
        message: `Course ${cleanCourseCode} added under ${programCode} (${newCourseYear}).`,
        type: 'success',
        duration: 2500,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditCourse = (
    programCode: string,
    course: IgnouCourseEntry
  ) => {
    setEditingCourseKey(`${programCode}::${course.year}::${course.code}`);
    setEditCourseYear(course.year);
    setEditCourseCode(course.code);
    setEditCourseTitle(course.title);
  };

  const handleSaveEditCourse = async (
    programCode: string,
    originalYear: IgnouYear,
    originalCode: string
  ) => {
    const cleanCode = editCourseCode.trim().toUpperCase();
    const cleanTitle = editCourseTitle.trim();
    if (!cleanCode || !cleanTitle) return;

    setSaving(true);
    try {
      const nextList = mergedDatabase.map((prog) => {
        if (prog.code !== programCode) return prog;
        const updatedCourses = prog.courses.map((c) =>
          c.year === originalYear && c.code === originalCode
            ? {
                code: cleanCode,
                title: cleanTitle,
                year: editCourseYear,
              }
            : c
        );
        return {
          ...prog,
          courses: updatedCourses,
        };
      });

      await saveIgnouDatabase(nextList);
      setEditingCourseKey(null);
      showToast({
        message: `Course ${cleanCode} updated.`,
        type: 'success',
        duration: 2500,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (
    programCode: string,
    year: IgnouYear,
    courseCode: string
  ) => {
    setSaving(true);
    try {
      const nextList = mergedDatabase.map((prog) => {
        if (prog.code !== programCode) return prog;
        return {
          ...prog,
          courses: prog.courses.filter(
            (c) => !(c.year === year && c.code === courseCode)
          ),
        };
      });
      await saveIgnouDatabase(nextList);
      showToast({
        message: `Course ${courseCode} removed.`,
        type: 'info',
        duration: 2500,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Bar: DATABASE Title + IGNOU Section Badge + Add Program Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-5 border-b border-[#E5E5E0] dark:border-[#26262B]">
        <div className="flex items-center gap-3">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#111111] dark:text-white">
            DATABASE
          </h2>
          <span className="px-2.5 py-1 bg-[#111111] text-white dark:bg-white dark:text-[#111111] text-[10px] font-bold uppercase tracking-[0.16em]">
            {activeSection === 'ignou' ? 'IGNOU' : activeSection}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400 tabular-nums">
            {mergedDatabase.length} PROGRAMS · {totalCoursesCount} COURSES
          </span>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddingProgram((prev) => !prev)}
            className="w-full sm:w-auto px-4 py-3 sm:py-2.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.16em] hover:opacity-85 transition-opacity cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isAddingProgram ? (
              <>
                <X className="w-3.5 h-3.5" /> Close Form
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Add IGNOU Program
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add New IGNOU Program Drawer */}
      {isAddingProgram && (
        <form
          onSubmit={handleAddProgram}
          className="p-5 sm:p-6 bg-[#FFFFFF] dark:bg-[#141418] border border-[#111111] dark:border-white space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#ECECE7] dark:border-[#242429]">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em]">
              ADD / UPDATE IGNOU PROGRAM IN DATABASE
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingProgram(false)}
              className="text-zinc-400 hover:text-[#111111] dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              1. SELECT PROGRAMME CATEGORY / DEGREE
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {IGNOU_DEGREE_OPTIONS.map((deg) => {
                const active = newProgramDegree === deg;
                return (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => setNewProgramDegree(deg)}
                    className={`px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider border text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                        : 'bg-[#FAFAFA] dark:bg-[#18181D] text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                    }`}
                  >
                    {deg}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <input
              type="text"
              required
              value={newProgramCode}
              onChange={(e) => setNewProgramCode(e.target.value)}
              placeholder="PROGRAM CODE (E.G. BAHDH, BAG, MEG)"
              className={`${inputBaseClass} uppercase`}
            />
            <input
              type="text"
              required
              value={newProgramTitle}
              onChange={(e) => setNewProgramTitle(e.target.value)}
              placeholder="PROGRAM TITLE (E.G. BACHELOR OF ARTS (HONOURS) HINDI)"
              className={inputBaseClass}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingProgram(false)}
              className="px-4 py-2.5 border border-[#D4D4D0] dark:border-[#2E2E36] text-xs font-bold uppercase tracking-[0.16em] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-xs font-bold uppercase tracking-[0.16em] cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Program'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar: Degree Tabs + Search + With Courses Filter */}
      <div className="p-4 sm:p-5 bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(['All', ...IGNOU_DEGREE_OPTIONS] as const).map((deg) => {
              const active = degreeFilter === deg;
              const progCount =
                deg === 'All'
                  ? mergedDatabase.length
                  : mergedDatabase.filter((p) => p.degree === deg).length;
              const courseCount = (
                deg === 'All'
                  ? mergedDatabase
                  : mergedDatabase.filter((p) => p.degree === deg)
              ).reduce((s, p) => s + p.courses.length, 0);

              return (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setDegreeFilter(deg)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                      : 'bg-transparent text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36] hover:border-[#111111] dark:hover:border-white'
                  }`}
                >
                  {deg === 'All' ? 'All Degrees' : deg} ({progCount} · {courseCount} Courses)
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOnlyWithCourses((prev) => !prev)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer self-start md:self-auto ${
              onlyWithCourses
                ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                : 'bg-transparent text-zinc-500 dark:text-zinc-400 border-[#D4D4D0] dark:border-[#2E2E36]'
            }`}
          >
            {onlyWithCourses ? 'Showing Only Programs With Courses' : 'Filter: With Courses Only'}
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH BY PROGRAM CODE (E.G. BAHDH), PROGRAM TITLE, OR COURSE CODE (E.G. BHDC 101)..."
            className={`${inputBaseClass} pl-9`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#111111] dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Programs & Year-Wise Courses Accordion List */}
      <div className="space-y-3">
        {filteredPrograms.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-[#D4D4D0] dark:border-[#2E2E36] text-xs uppercase tracking-[0.16em] text-zinc-400">
            No matching IGNOU programs found.
          </div>
        ) : (
          filteredPrograms.map((prog) => {
            const isExpanded = expandedProgramCode === prog.code;
            const isEditingProg = editingProgramOriginalCode === prog.code;
            const visibleCourses =
              activeYearTab === 'All'
                ? prog.courses
                : prog.courses.filter((c) => c.year === activeYearTab);

            return (
              <div
                key={prog.code}
                className="bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] transition-colors"
              >
                {/* Program Header Bar */}
                <div className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {isEditingProg ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
                      <select
                        value={editProgramDegree}
                        onChange={(e) =>
                          setEditProgramDegree(e.target.value as IgnouDegree)
                        }
                        className={inputBaseClass}
                      >
                        {IGNOU_DEGREE_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={editProgramCode}
                        onChange={(e) => setEditProgramCode(e.target.value)}
                        placeholder="PROGRAM CODE"
                        className={`${inputBaseClass} uppercase`}
                      />
                      <input
                        type="text"
                        value={editProgramTitle}
                        onChange={(e) => setEditProgramTitle(e.target.value)}
                        placeholder="PROGRAM TITLE"
                        className={inputBaseClass}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveEditProgram}
                          className="px-3 py-2 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[10px] font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProgramOriginalCode(null)}
                          className="px-3 py-2 border border-[#D4D4D0] dark:border-[#2E2E36] text-[10px] font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedProgramCode(isExpanded ? null : prog.code);
                          setActiveYearTab('All');
                        }}
                        className="flex-1 flex items-center gap-3 text-left cursor-pointer min-w-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 shrink-0 text-zinc-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 shrink-0 text-zinc-400" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 bg-[#111111] text-white dark:bg-white dark:text-[#111111] text-[10px] font-bold uppercase tracking-[0.14em] tabular-nums">
                              {prog.code}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                              {prog.degree}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] tabular-nums border ${
                                prog.courses.length > 0
                                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                                  : 'border-[#E5E5E0] dark:border-[#26262B] text-zinc-400'
                              }`}
                            >
                              {prog.courses.length} Courses
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-[#111111] dark:text-[#F5F5F7] mt-1 truncate">
                            {prog.title || 'Untitled Programme'}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedProgramCode(prog.code);
                            setActiveYearTab('All');
                          }}
                          className="px-3 py-1.5 border border-[#111111] dark:border-white text-[10px] font-bold uppercase tracking-[0.14em] hover:bg-[#111111] hover:text-white dark:hover:bg-white dark:hover:text-[#111111] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3 h-3" /> Manage Courses ({prog.courses.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditProgram(prog)}
                          className="p-2 border border-[#E5E5E0] dark:border-[#26262B] text-zinc-500 hover:text-[#111111] dark:hover:text-white cursor-pointer"
                          title="Edit Program Code / Title"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProgram(prog.code)}
                          className="p-2 border border-[#E5E5E0] dark:border-[#26262B] text-zinc-400 hover:text-red-500 cursor-pointer"
                          title="Delete Program"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Expanded Course Manager for this Program */}
                {isExpanded && (
                  <div className="border-t border-[#ECECE7] dark:border-[#242429] bg-[#FAFAFA] dark:bg-[#101014] p-4 sm:p-5 space-y-5">
                    {/* Add Course Form for this Program */}
                    <form
                      onSubmit={(e) => handleAddCourse(e, prog.code)}
                      className="p-4 bg-[#FFFFFF] dark:bg-[#141418] border border-[#E5E5E0] dark:border-[#26262B] space-y-3"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                        ADD COURSE TO {prog.code} ({prog.title})
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        {/* Year Selector */}
                        <div className="sm:col-span-3">
                          <select
                            value={newCourseYear}
                            onChange={(e) =>
                              setNewCourseYear(e.target.value as IgnouYear)
                            }
                            className={inputBaseClass}
                          >
                            {IGNOU_YEAR_OPTIONS.map((yr) => (
                              <option key={yr} value={yr}>
                                {yr}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Course Code */}
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            required
                            value={newCourseCode}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewCourseCode(val);
                              const matchedTitle = lookupIgnouCourseTitle(val);
                              if (matchedTitle) {
                                setNewCourseTitle(matchedTitle);
                              }
                            }}
                            placeholder="COURSE CODE (E.G. BHDC 101)"
                            className={`${inputBaseClass} uppercase`}
                          />
                        </div>

                        {/* Course Title */}
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            required
                            value={newCourseTitle}
                            onChange={(e) => setNewCourseTitle(e.target.value)}
                            placeholder="COURSE TITLE (E.G. हिन्दी साहित्य का इतिहास)"
                            className={inputBaseClass}
                          />
                        </div>

                        {/* Submit Button */}
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="w-full h-full min-h-[38px] px-3 py-2 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[10px] font-bold uppercase tracking-[0.16em] hover:opacity-85 transition-opacity cursor-pointer inline-flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Course
                          </button>
                        </div>
                      </div>
                    </form>

                    {/* Year Filter Tabs inside Expanded Program */}
                    <div className="flex flex-wrap items-center gap-2">
                      {(['All', ...IGNOU_YEAR_OPTIONS] as const).map((yr) => {
                        const active = activeYearTab === yr;
                        const count =
                          yr === 'All'
                            ? prog.courses.length
                            : prog.courses.filter((c) => c.year === yr).length;
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              setActiveYearTab(yr);
                              if (yr !== 'All') setNewCourseYear(yr);
                            }}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] border transition-colors cursor-pointer tabular-nums ${
                              active
                                ? 'bg-[#111111] text-white border-[#111111] dark:bg-white dark:text-[#111111] dark:border-white'
                                : 'bg-[#FFFFFF] dark:bg-[#141418] text-zinc-600 dark:text-zinc-300 border-[#D4D4D0] dark:border-[#2E2E36]'
                            }`}
                          >
                            {yr === 'All' ? 'All Years' : yr} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Courses Table / List Grouped or Filtered by Year */}
                    {visibleCourses.length === 0 ? (
                      <div className="p-6 text-center bg-[#FFFFFF] dark:bg-[#141418] border border-dashed border-[#D4D4D0] dark:border-[#2E2E36] text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                        No courses added for {prog.code}{' '}
                        {activeYearTab !== 'All' ? `in ${activeYearTab}` : ''} yet.
                        Use the form above to add courses.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#ECECE7] dark:divide-[#242429] border border-[#E5E5E0] dark:border-[#26262B] bg-[#FFFFFF] dark:bg-[#141418]">
                        {visibleCourses.map((course) => {
                          const cKey = `${prog.code}::${course.year}::${course.code}`;
                          const isEditingThisCourse = editingCourseKey === cKey;

                          return (
                            <div
                              key={cKey}
                              className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              {isEditingThisCourse ? (
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                                  <div className="sm:col-span-3">
                                    <select
                                      value={editCourseYear}
                                      onChange={(e) =>
                                        setEditCourseYear(
                                          e.target.value as IgnouYear
                                        )
                                      }
                                      className={inputBaseClass}
                                    >
                                      {IGNOU_YEAR_OPTIONS.map((yr) => (
                                        <option key={yr} value={yr}>
                                          {yr}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="sm:col-span-3">
                                    <input
                                      type="text"
                                      value={editCourseCode}
                                      onChange={(e) =>
                                        setEditCourseCode(e.target.value)
                                      }
                                      className={`${inputBaseClass} uppercase`}
                                    />
                                  </div>
                                  <div className="sm:col-span-4">
                                    <input
                                      type="text"
                                      value={editCourseTitle}
                                      onChange={(e) =>
                                        setEditCourseTitle(e.target.value)
                                      }
                                      className={inputBaseClass}
                                    />
                                  </div>
                                  <div className="sm:col-span-2 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSaveEditCourse(
                                          prog.code,
                                          course.year,
                                          course.code
                                        )
                                      }
                                      className="px-3 py-2 bg-[#111111] dark:bg-white text-white dark:text-[#111111] text-[10px] font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" /> Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCourseKey(null)}
                                      className="px-2.5 py-2 border border-[#D4D4D0] dark:border-[#2E2E36] text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                                    <span className="px-2 py-0.5 bg-[#F4F4F0] dark:bg-[#1E1E24] border border-[#D4D4D0] dark:border-[#2E2E36] text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-300 tabular-nums">
                                      {course.year}
                                    </span>
                                    <span className="px-2.5 py-0.5 bg-[#111111] text-white dark:bg-white dark:text-[#111111] text-[10px] font-bold uppercase tracking-[0.14em] tabular-nums">
                                      {course.code}
                                    </span>
                                    <span className="text-xs font-semibold text-[#111111] dark:text-[#F5F5F7]">
                                      {course.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleStartEditCourse(prog.code, course)
                                      }
                                      className="px-2.5 py-1 border border-[#E5E5E0] dark:border-[#26262B] text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-[#111111] dark:hover:text-white cursor-pointer inline-flex items-center gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteCourse(
                                          prog.code,
                                          course.year,
                                          course.code
                                        )
                                      }
                                      className="p-1.5 border border-[#E5E5E0] dark:border-[#26262B] text-zinc-400 hover:text-red-500 cursor-pointer"
                                      title="Remove Course"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
