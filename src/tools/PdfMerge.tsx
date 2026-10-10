import React, { useState, useRef } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import { Upload, Download, Loader2, X, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

interface FileItem {
  id: string;
  file: File;
  type: 'image' | 'pdf';
}

type PageSizeOption = 'Original' | 'A4' | 'A5';

export default function PdfMerge({ onComplete }: { onComplete: (count?: number) => void }) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageSize, setPageSize] = useState<PageSizeOption>('A4');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newItems = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: file.type.includes('image') ? 'image' : 'pdf' as 'image' | 'pdf'
      }));
      setItems(prev => [...prev, ...newItems]);
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setItems(prev => {
      const newItems = [...prev];
      const temp = newItems[index - 1];
      newItems[index - 1] = newItems[index];
      newItems[index] = temp;
      return newItems;
    });
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    setItems(prev => {
      const newItems = [...prev];
      const temp = newItems[index + 1];
      newItems[index + 1] = newItems[index];
      newItems[index] = temp;
      return newItems;
    });
  };

  const getPageDimensions = () => {
    switch (pageSize) {
      case 'A4': return PageSizes.A4;
      case 'A5': return PageSizes.A5;
      default: return null;
    }
  };

  const mergeFiles = async () => {
    if (items.length < 2) {
      alert("Please upload at least 2 files to merge.");
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const arrayBuffer = await item.file.arrayBuffer();
        
        let pageDimensions = getPageDimensions();

        if (item.type === 'pdf') {
          const pdf = await PDFDocument.load(arrayBuffer);
          
          if (pageDimensions) {
            // Embed PDF pages to resize them
            const embeddedPages = await mergedPdf.embedPdf(arrayBuffer, pdf.getPageIndices());
            
            embeddedPages.forEach((embeddedPage) => {
              const isLandscape = embeddedPage.width > embeddedPage.height;
              const currentDims: [number, number] = isLandscape 
                ? [Math.max(pageDimensions[0], pageDimensions[1]), Math.min(pageDimensions[0], pageDimensions[1])]
                : [Math.min(pageDimensions[0], pageDimensions[1]), Math.max(pageDimensions[0], pageDimensions[1])];

              const page = mergedPdf.addPage(currentDims);
              
              const scale = Math.min(
                currentDims[0] / embeddedPage.width,
                currentDims[1] / embeddedPage.height
              );
              
              const scaledWidth = embeddedPage.width * scale;
              const scaledHeight = embeddedPage.height * scale;
              
              const x = (currentDims[0] - scaledWidth) / 2;
              const y = (currentDims[1] - scaledHeight) / 2;
              
              page.drawPage(embeddedPage, {
                x,
                y,
                width: scaledWidth,
                height: scaledHeight,
              });
            });
          } else {
            // Add exactly as original
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
          }
        } else if (item.type === 'image') {
          let image;
          if (item.file.type.includes('png')) {
            image = await mergedPdf.embedPng(arrayBuffer);
          } else {
            image = await mergedPdf.embedJpg(arrayBuffer);
          }
          
          let page;
          
          if (pageDimensions) {
            const isLandscape = image.width > image.height;
            const currentDims: [number, number] = isLandscape 
              ? [Math.max(pageDimensions[0], pageDimensions[1]), Math.min(pageDimensions[0], pageDimensions[1])]
              : [Math.min(pageDimensions[0], pageDimensions[1]), Math.max(pageDimensions[0], pageDimensions[1])];

            page = mergedPdf.addPage(currentDims);
            
            // Calculate scale to fit image within the page
            const scale = Math.min(
              currentDims[0] / image.width,
              currentDims[1] / image.height
            );
            
            const scaledWidth = image.width * scale;
            const scaledHeight = image.height * scale;
            
            // Center the image
            const x = (currentDims[0] - scaledWidth) / 2;
            const y = (currentDims[1] - scaledHeight) / 2;
            
            page.drawImage(image, {
              x,
              y,
              width: scaledWidth,
              height: scaledHeight,
            });
          } else {
            page = mergedPdf.addPage([image.width, image.height]);
            page.drawImage(image, {
              x: 0,
              y: 0,
              width: image.width,
              height: image.height,
            });
          }
        }
        
        setProgress(Math.round(((i + 1) / items.length) * 90));
      }
      
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `merged_${Date.now()}.pdf`;
      link.click();
      
      setProgress(100);
      onComplete(items.length);
    } catch (error) {
      console.error(error);
      alert('Error merging files. Ensure PDFs are not password protected.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-display font-extrabold text-slate-800 dark:text-white mb-2">Merge PDF</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Combine PDFs and images into one. Adjust the order below.</p>
      </div>

      <div className="mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
          Output Page Size
        </label>
        <div className="flex gap-4">
          {(['A4', 'A5', 'Original'] as PageSizeOption[]).map((size) => (
            <label key={size} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pageSize"
                value={size}
                checked={pageSize === size}
                onChange={(e) => setPageSize(e.target.value as PageSizeOption)}
                className="text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{size}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
          This applies to all pages. Select 'Original' to keep exact dimensions.
        </p>
      </div>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500 transition-all mb-6"
      >
        <Upload className="w-8 h-8 text-slate-500 dark:text-slate-400 mx-auto mb-2" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Add PDFs and Images</p>
      </div>

      {items.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {items.map((item, index) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1 text-slate-400">
                    <button onClick={() => moveUp(index)} disabled={index === 0} className="hover:text-slate-600 dark:hover:text-white disabled:opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveDown(index)} disabled={index === items.length - 1} className="hover:text-slate-600 dark:hover:text-white disabled:opacity-30">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    {item.type === 'pdf' ? '📄' : '🖼️'}
                  </div>
                  <div>
                    <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[150px] md:max-w-[300px] block text-sm">
                      {item.file.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB • {item.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {isProcessing && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Processing...</span>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
          
          <button 
            onClick={mergeFiles}
            disabled={isProcessing || items.length < 2}
            className="w-full py-3 px-4 bg-slate-800 dark:bg-indigo-600 hover:bg-slate-900 dark:hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isProcessing ? 'Merging...' : items.length < 2 ? 'Add more files to merge' : 'Merge Files'}
          </button>
        </div>
      )}
      
      <input 
        type="file" 
        accept="application/pdf, image/png, image/jpeg, image/jpg" 
        multiple
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
