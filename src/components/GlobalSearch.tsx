import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Briefcase, Wrench, BookOpen, ChevronRight } from 'lucide-react';
import { useServicesData } from '../context/ServicesDataContext';
import { useIgnouData } from '../context/IgnouDataContext';
import { motion, AnimatePresence } from 'motion/react';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { services } = useServicesData();
  const { assignmentsData: ignouLevels } = useIgnouData();
  
  const tools = [
    { id: 'img-compress', title: 'Compress Image', desc: 'Reduce image file size instantly.' },
    { id: 'img-resize', title: 'Resize Image', desc: 'Resize images to passport or custom size.' },
    { id: 'jpg-pdf', title: 'JPG to PDF', desc: 'Convert images into a single PDF.' },
    { id: 'pdf-compress', title: 'Compress PDF', desc: 'Reduce PDF file size.' },
    { id: 'pdf-jpg', title: 'PDF to JPG', desc: 'Extract pages from PDF as images.' },
    { id: 'pdf-merge', title: 'PDF Merge / Split', desc: 'Combine or extract PDF pages.' }
  ];

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
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Search logic
  const searchLower = query.toLowerCase().trim();
  
  const filteredServices = searchLower ? services.filter(s => 
    s.title.toLowerCase().includes(searchLower) || 
    s.subtitle.toLowerCase().includes(searchLower)
  ) : [];

  const filteredTools = searchLower ? tools.filter(t => 
    t.title.toLowerCase().includes(searchLower) || 
    t.desc.toLowerCase().includes(searchLower)
  ) : [];

  const filteredIgnou = searchLower ? ignouLevels.flatMap(level => 
    level.courses.flatMap(course => 
      course.years.flatMap(year => 
        year.subjects.filter(sub => 
          sub.code.toLowerCase().includes(searchLower) || 
          sub.name.toLowerCase().includes(searchLower)
        ).map(sub => ({
          ...sub,
          levelName: level.name,
          courseName: course.fullName,
          yearName: year.name
        }))
      )
    )
  ) : [];

  const hasResults = filteredServices.length > 0 || filteredTools.length > 0 || filteredIgnou.length > 0;
  const isSearching = searchLower.length > 0;

  const handleSelect = (sectionId: string) => {
    setIsOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[70vh]"
          >
            <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" strokeWidth={1.5} />
              <input 
                ref={inputRef}
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for services, tools, or IGNOU notes..."
                className="flex-grow bg-transparent border-none outline-none px-4 text-lg text-slate-900 dark:text-white placeholder:text-slate-400 w-full"
              />
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors ml-2 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

              <div className="overflow-y-auto flex-grow p-2 no-scrollbar">
                {!isSearching && (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                    <Search className="w-10 h-10 mb-3 opacity-20" />
                    <p>Start typing to search across the platform.</p>
                  </div>
                )}
                
                {isSearching && !hasResults && (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <p>No results found for "{query}"</p>
                  </div>
                )}

                {isSearching && hasResults && (
                  <div className="space-y-4 py-2">
                    {/* Services Results */}
                    {filteredServices.length > 0 && (
                      <div>
                        <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Briefcase className="w-3 h-3" /> Services
                        </div>
                        {filteredServices.map(svc => (
                          <button 
                            key={svc.id}
                            onClick={() => handleSelect('services')}
                            className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{svc.title}</div>
                              <div className="text-xs text-slate-500">{svc.subtitle}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Tools Results */}
                    {filteredTools.length > 0 && (
                      <div>
                        <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Wrench className="w-3 h-3" /> Local Tools
                        </div>
                        {filteredTools.map(tool => (
                          <button 
                            key={tool.id}
                            onClick={() => handleSelect('tools')}
                            className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{tool.title}</div>
                              <div className="text-xs text-slate-500">{tool.desc}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* IGNOU Results */}
                    {filteredIgnou.length > 0 && (
                      <div>
                        <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <BookOpen className="w-3 h-3" /> IGNOU Notes
                        </div>
                        {filteredIgnou.map((sub, i) => (
                          <button 
                            key={`${sub.code}-${i}`}
                            onClick={() => handleSelect('ignou')}
                            className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 group transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {sub.code} - {sub.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {sub.courseName} • {sub.yearName}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">₹{sub.price}</span>
                              <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center bg-white dark:bg-slate-800 rounded px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 shadow-sm">esc</span> to close
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-500 dark:text-slate-400">NetX24 Search</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center p-2 md:px-4 md:py-2 md:w-64 bg-transparent md:bg-slate-100/80 hover:bg-slate-100 md:hover:bg-slate-200/80 dark:md:bg-slate-800/50 dark:hover:bg-slate-800 md:dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 md:text-slate-500 md:dark:text-slate-400 rounded-full transition-colors border border-transparent md:hover:border-slate-300 md:dark:hover:border-slate-600"
      >
        <Search className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0" strokeWidth={1.5} />
        <span className="hidden md:inline text-sm font-medium whitespace-nowrap ml-2">Search NetX24...</span>
      </button>
      
      {typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent}
    </>
  );
}
