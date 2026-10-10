import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, Download, Loader2, Trash2 } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PageThumbnail {
  pageIndex: number;
  dataUrl: string;
}

export default function PdfSplit({ onComplete }: { onComplete: (count?: number) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [deletedPages, setDeletedPages] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPages([]);
      setDeletedPages(new Set());
      await loadThumbnails(selected);
    }
  };

  const loadThumbnails = async (pdfFile: File) => {
    setIsLoading(true);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const loadedPages: PageThumbnail[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport, canvas } as any).promise;
        
        loadedPages.push({
          pageIndex: i - 1, // 0-based
          dataUrl: canvas.toDataURL()
        });
      }
      setPages(loadedPages);
    } catch (error) {
      console.error(error);
      alert("Failed to load PDF pages. It might be encrypted or corrupted.");
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDelete = (pageIndex: number) => {
    setDeletedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageIndex)) {
        newSet.delete(pageIndex);
      } else {
        newSet.add(pageIndex);
      }
      return newSet;
    });
  };

  const generateNewPdf = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();
      
      const pagesToKeep = [];
      for (let i = 0; i < pages.length; i++) {
        if (!deletedPages.has(i)) {
          pagesToKeep.push(i);
        }
      }

      if (pagesToKeep.length === 0) {
        alert("Cannot generate an empty PDF. Please keep at least one page.");
        setIsProcessing(false);
        return;
      }

      const copiedPages = await newPdf.copyPages(originalPdf, pagesToKeep);
      copiedPages.forEach((page) => newPdf.addPage(page));
      
      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `split_${file.name}`;
      link.click();
      
      onComplete(1);
    } catch (error) {
      console.error(error);
      alert("Error generating PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const splitInHalf = async () => {
    if (!file || pages.length < 2) return;
    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      
      const midPoint = Math.ceil(pages.length / 2);
      
      // PDF 1
      const pdf1 = await PDFDocument.create();
      const pages1 = await pdf1.copyPages(originalPdf, Array.from({length: midPoint}, (_, i) => i));
      pages1.forEach(p => pdf1.addPage(p));
      const bytes1 = await pdf1.save();
      const link1 = document.createElement('a');
      link1.href = URL.createObjectURL(new Blob([bytes1], { type: 'application/pdf' }));
      link1.download = `part1_${file.name}`;
      link1.click();

      // PDF 2
      const pdf2 = await PDFDocument.create();
      const pages2 = await pdf2.copyPages(originalPdf, Array.from({length: pages.length - midPoint}, (_, i) => i + midPoint));
      pages2.forEach(p => pdf2.addPage(p));
      const bytes2 = await pdf2.save();
      const link2 = document.createElement('a');
      link2.href = URL.createObjectURL(new Blob([bytes2], { type: 'application/pdf' }));
      link2.download = `part2_${file.name}`;
      link2.click();

      onComplete(2);
    } catch (error) {
      console.error(error);
      alert("Error splitting PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-display font-extrabold text-slate-800 dark:text-white mb-2">Split & Extract PDF</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Delete specific pages or split a PDF into two parts.</p>
      </div>

      {!file && !isLoading && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500 transition-all"
        >
          <Upload className="w-12 h-12 text-slate-500 dark:text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Click to upload PDF</p>
        </div>
      )}

      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p className="text-slate-500 font-medium">Loading pages...</p>
        </div>
      )}

      {file && pages.length > 0 && !isLoading && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {file.name} ({pages.length} pages)
            </span>
            <button 
              onClick={() => { setFile(null); setPages([]); setDeletedPages(new Set()); }}
              className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-widest"
            >
              Start Over
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6 max-h-[400px] overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            {pages.map((p, i) => (
              <div 
                key={i} 
                onClick={() => toggleDelete(i)}
                className={`relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${deletedPages.has(i) ? 'border-red-500 opacity-50' : 'border-transparent hover:border-indigo-400 shadow-sm'}`}
              >
                <img src={p.dataUrl} alt={`Page ${i+1}`} className="w-full h-auto bg-white" />
                <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 text-white text-[10px] font-bold p-1 text-center">
                  Page {i + 1}
                </div>
                {deletedPages.has(i) && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <Trash2 className="w-8 h-8 text-red-600 bg-white rounded-full p-1 shadow-lg" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            {pages.length > 1 && (
              <button 
                onClick={splitInHalf}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded-xl transition-colors text-sm"
              >
                Split in Half (2 PDFs)
              </button>
            )}
            
            <button 
              onClick={generateNewPdf}
              disabled={isProcessing || deletedPages.size === pages.length}
              className="flex-1 py-3 px-4 bg-slate-800 dark:bg-indigo-600 hover:bg-slate-900 dark:hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2 text-sm disabled:opacity-70"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isProcessing ? 'Generating...' : `Save Remaining (${pages.length - deletedPages.size} pages)`}
            </button>
          </div>
        </div>
      )}

      <input 
        type="file" 
        accept="application/pdf" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
