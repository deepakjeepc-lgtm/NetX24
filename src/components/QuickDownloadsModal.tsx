import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileDown, BookOpen, FileText, Download, Clock, Trash2, CheckCircle2, ExternalLink } from 'lucide-react';
import { getRecentDownloads, addRecentDownload, clearRecentDownloads, RecentDownloadItem } from '../utils/recentDownloads';

interface QuickDownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickDownloadsModal({ isOpen, onClose }: QuickDownloadsModalProps) {
  const [recentList, setRecentList] = useState<RecentDownloadItem[]>([]);
  const [activeTab, setActiveTab] = useState<'quick' | 'recent'>('recent');

  const loadRecent = () => {
    setRecentList(getRecentDownloads());
  };

  useEffect(() => {
    if (isOpen) {
      loadRecent();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => {
      loadRecent();
    };
    window.addEventListener('netx_recent_downloads_updated', handleUpdate);
    return () => window.removeEventListener('netx_recent_downloads_updated', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const downloadRateCard = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text('NetX24 Cyber Cafe', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Official Services & Price List (Rate Card)', 105, 30, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 38, 190, 38);

    const items = [
      ['Printing (B&W)', 'Rs. 2.5 / page'],
      ['Printing (Colour)', 'Rs. 5.0 / page'],
      ['Photocopy / Xerox', 'Rs. 2.0 / page'],
      ['Scanning Document', 'Rs. 10.0 / page'],
      ['Lamination (A4)', 'Rs. 20.0'],
      ['Passport Size Photo (Set of 6)', 'Rs. 20.0'],
      ['Jaati / Avashi / Aay Praman Patra', 'Rs. 50.0'],
      ['PAN Card Apply', 'Rs. 100.0'],
      ['IGNOU Solved Assignments', 'Rs. 19.0 - 49.0']
    ];

    let y = 50;
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);

    items.forEach(([service, price]) => {
      doc.text(service, 25, y);
      doc.text(price, 160, y, { align: 'right' });
      y += 10;
    });

    doc.line(20, y + 5, 190, y + 5);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('For queries or bulk orders, call +91 9229877290', 105, y + 18, { align: 'center' });

    doc.save('NetX24_Rate_Card.pdf');

    addRecentDownload({
      title: 'Services Rate Card PDF',
      category: 'Rate Card'
    });
  };

  const downloadSampleGuide = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('IGNOU Study Notes & Sample Paper', 105, 25, { align: 'center' });
    doc.setFontSize(12);
    const text = 'Welcome to NetX24 IGNOU Help Hub. Download complete solved assignments, previous year question papers, and high-scoring notes directly from our IGNOU section.';
    const splitText = doc.splitTextToSize(text, 170);
    doc.text(splitText, 20, 45);
    doc.save('IGNOU_Sample_Guide.pdf');

    addRecentDownload({
      title: 'IGNOU Sample Notes Guide',
      category: 'Sample Guide'
    });
  };

  const handleReDownload = async (item: RecentDownloadItem) => {
    if (item.category === 'Rate Card') {
      await downloadRateCard();
    } else if (item.category === 'Sample Guide') {
      await downloadSampleGuide();
    } else if (item.url) {
      window.open(item.url, '_blank');
    } else if (item.downloads && item.downloads.length > 0) {
      item.downloads.forEach(d => window.open(d.url, '_blank'));
    } else {
      alert(`Re-downloading ${item.title}`);
    }
  };

  const downloadsList = [
    {
      title: "Services Rate Card PDF",
      subtitle: "Official price list for all cyber cafe services",
      icon: <FileText className="w-5 h-5 text-indigo-500" />,
      action: downloadRateCard,
      badge: "Free"
    },
    {
      title: "IGNOU Sample Notes Guide",
      subtitle: "Important questions and assignment tips",
      icon: <BookOpen className="w-5 h-5 text-red-500" />,
      action: downloadSampleGuide,
      badge: "Guide"
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden max-h-[85vh] flex flex-col"
        >
          {/* Drag indicator bar for mobile */}
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-none">Downloads & History</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Saved in your local storage</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 shrink-0">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'recent'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Recent Downloads ({recentList.length})
            </button>
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'quick'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" /> Quick Resources
            </button>
          </div>

          <div className="overflow-y-auto space-y-3 pr-1 flex-grow">
            {activeTab === 'recent' ? (
              <>
                {recentList.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Recent Downloads Yet</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Downloaded IGNOU notes, rate cards, and tool results will appear here automatically.</p>
                  </div>
                ) : (
                  recentList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-500/40 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                          {item.category === 'Rate Card' && <FileText className="w-4 h-4 text-indigo-500" />}
                          {item.category === 'IGNOU Notes' && <BookOpen className="w-4 h-4 text-red-500" />}
                          {item.category === 'Tool Result' && <Download className="w-4 h-4 text-emerald-500" />}
                          {item.category === 'Sample Guide' && <BookOpen className="w-4 h-4 text-amber-500" />}
                          {item.category === 'Receipt' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {item.date}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleReDownload(item)}
                        className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-colors shrink-0"
                        title="Download / Open"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </>
            ) : (
              downloadsList.map((item, idx) => (
                <button
                  key={idx}
                  onClick={async () => { await item.action(); loadRecent(); }}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {item.title}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                          {item.badge}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <FileDown className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
                </button>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
            {activeTab === 'recent' && recentList.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear recent downloads history from local storage?')) {
                    clearRecentDownloads();
                  }
                }}
                className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            )}
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
