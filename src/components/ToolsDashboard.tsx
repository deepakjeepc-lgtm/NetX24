import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, setDoc, increment } from 'firebase/firestore';
import { 
  ArrowRight,
  ArrowUpRight, 
  ImageDown, 
  Maximize, 
  Settings2, 
  FileImage, 
  FileDown, 
  Images, 
  Files, 
  SplitSquareHorizontal,
  Loader2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { haptic } from '../utils/haptics';
import { addRecentDownload } from '../utils/recentDownloads';

// Lazy loaded tool modules
const ImageCompressor = lazy(() => import('../tools/ImageCompressor'));
const PdfCompressor = lazy(() => import('../tools/PdfCompressor'));
const JpgToPdf = lazy(() => import('../tools/JpgToPdf'));
const PdfToJpg = lazy(() => import('../tools/PdfToJpg'));
const ImageResizer = lazy(() => import('../tools/ImageResizer'));
const PdfMerge = lazy(() => import('../tools/PdfMerge'));
const PdfSplit = lazy(() => import('../tools/PdfSplit'));
const ImageResizeCompress = lazy(() => import('../tools/ImageResizeCompress'));
const ImageUpscaler = lazy(() => import('../tools/ImageUpscaler'));

export default function ToolsDashboard({ setToolsUsedCount }: { setToolsUsedCount: React.Dispatch<React.SetStateAction<number>> }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const { showToast } = useToast();

  const tools = [
    { 
      id: 'img-upscale', 
      title: 'Increase Image Size', 
      desc: 'Upscale resolution & target size (KB/MB).',
      badge: 'Resolution',
      icon: ArrowUpRight,
      color: 'text-orange-500 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-500/10',
      hoverColor: 'group-hover:bg-orange-500',
    },
    { 
      id: 'img-compress', 
      title: 'Compress Image', 
      desc: 'Reduce image file size instantly.',
      badge: 'Compress',
      icon: ImageDown,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-500/10',
      hoverColor: 'group-hover:bg-blue-500',
    },
    { 
      id: 'img-resize', 
      title: 'Resize Image', 
      desc: 'Passport & custom dimension sizing.',
      badge: 'Resize',
      icon: Maximize,
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      hoverColor: 'group-hover:bg-emerald-500',
    },
    { 
      id: 'img-resize-compress', 
      title: 'Resize + Compress', 
      desc: 'Resize dimensions & adjust KB together.',
      badge: '2-in-1',
      icon: Settings2,
      color: 'text-violet-500 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-500/10',
      hoverColor: 'group-hover:bg-violet-500',
    },
    { 
      id: 'jpg-pdf', 
      title: 'JPG to PDF', 
      desc: 'Convert multiple images into one PDF.',
      badge: 'Convert',
      icon: FileImage,
      color: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
      hoverColor: 'group-hover:bg-amber-500',
    },
    { 
      id: 'pdf-compress', 
      title: 'Compress PDF', 
      desc: 'Reduce PDF document file size.',
      badge: 'Reduce',
      icon: FileDown,
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-500/10',
      hoverColor: 'group-hover:bg-red-500',
    },
    { 
      id: 'pdf-jpg', 
      title: 'PDF to JPG', 
      desc: 'Extract pages from PDF as clear images.',
      badge: 'Extract',
      icon: Images,
      color: 'text-pink-500 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-500/10',
      hoverColor: 'group-hover:bg-pink-500',
    },
    { 
      id: 'pdf-merge', 
      title: 'Merge PDF', 
      desc: 'Combine multiple PDFs and images.',
      badge: 'Combine',
      icon: Files,
      color: 'text-indigo-500 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-500/10',
      hoverColor: 'group-hover:bg-indigo-500',
    },
    { 
      id: 'pdf-split', 
      title: 'Split PDF', 
      desc: 'Extract or split PDF pages easily.',
      badge: 'Split',
      icon: SplitSquareHorizontal,
      color: 'text-cyan-500 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 dark:bg-cyan-500/10',
      hoverColor: 'group-hover:bg-cyan-500',
    }
  ];

  const handleToolUsed = async (count: number = 1) => {
    haptic.success();
    showToast({ message: 'Processing complete! Document is ready to download.', type: 'success' });
    try {
      const statsRef = doc(db, 'stats', 'toolsUsed');
      await setDoc(statsRef, { count: increment(count) }, { merge: true });
    } catch (e: any) {
      console.warn('Could not update tool stats in Firestore:', e?.message || e);
    }

    const currentToolInfo = tools.find(t => t.id === activeTool);
    addRecentDownload({
      title: currentToolInfo ? `${currentToolInfo.title} Output` : 'Tool Document Result',
      category: 'Tool Result'
    });
  };

  const selectTool = (toolId: string | null) => {
    haptic.selection();
    setActiveTool(toolId);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const toolsEl = document.getElementById('tools');
    if (toolsEl) {
      toolsEl.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  };

  return (
    <div className="relative z-20 w-full">
      {activeTool ? (
        <div className="w-full">
          <button 
            onClick={() => selectTool(null)}
            className="mb-4 sm:mb-8 text-xs sm:text-sm text-indigo-500 hover:text-indigo-600 font-bold uppercase tracking-widest flex items-center gap-2 transition-colors group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" />
            </div>
            Back to all tools
          </button>
          
          <div className="bg-slate-50/90 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] p-3 sm:p-6 md:p-12 border border-slate-200/60 dark:border-slate-800/60 shadow-sm w-full overflow-hidden">
            <Suspense fallback={
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-widest">Loading Tool...</span>
              </div>
            }>
              {activeTool === 'img-compress' && <ImageCompressor onComplete={handleToolUsed} />}
              {activeTool === 'img-upscale' && <ImageUpscaler onComplete={handleToolUsed} />}
              {activeTool === 'pdf-compress' && <PdfCompressor onComplete={handleToolUsed} />}
              {activeTool === 'jpg-pdf' && <JpgToPdf onComplete={handleToolUsed} />}
              {activeTool === 'pdf-jpg' && <PdfToJpg onComplete={handleToolUsed} />}
              {activeTool === 'img-resize' && <ImageResizer onComplete={handleToolUsed} />}
              {activeTool === 'img-resize-compress' && <ImageResizeCompress onComplete={handleToolUsed} />}
              {activeTool === 'pdf-merge' && <PdfMerge onComplete={handleToolUsed} />}
              {activeTool === 'pdf-split' && <PdfSplit onComplete={handleToolUsed} />}
            </Suspense>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 w-full">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10px" }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                onClick={() => selectTool(tool.id)}
                className="text-left p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/80 shadow-xs hover:shadow-xl hover:border-indigo-500/40 dark:hover:border-indigo-400/40 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden active:scale-[0.98] min-h-[120px] sm:min-h-[135px]"
              >
                {/* Soft ambient hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-indigo-500/5 group-hover:from-indigo-500/10 transition-all duration-500 pointer-events-none" />
                
                <div className="w-full relative z-10 flex items-start justify-between gap-1.5 mb-3 sm:mb-4">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${tool.bgColor} flex items-center justify-center ${tool.color} group-hover:scale-110 ${tool.hoverColor} group-hover:text-white transition-all duration-300 shadow-xs shrink-0 ring-1 ring-black/5 dark:ring-white/5`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.75} />
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800/80 px-2 py-0.5 rounded-md uppercase group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition-colors">
                      {tool.badge}
                    </span>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 transition-all">
                      <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
                
                <div className="w-full relative z-10 mt-auto">
                  <h3 className="text-sm sm:text-base md:text-lg font-display font-extrabold text-[#1C1D20] dark:text-white tracking-tight leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    {tool.title}
                  </h3>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
