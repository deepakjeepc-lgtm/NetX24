import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, Loader2, X, Plus } from 'lucide-react';

export default function PdfMergeSplit({ onComplete }: { onComplete: (count?: number) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const mergePdfs = async () => {
    if (files.length < 2) {
      alert("Please upload at least 2 PDFs to merge.");
      return;
    }
    
    setIsProcessing(true);
    setProgress(0);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        setProgress(Math.round(((i + 1) / files.length) * 90));
      }
      
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `merged_${Date.now()}.pdf`;
      link.click();
      setProgress(100);
      onComplete(files.length);
    } catch (error) {
      console.error(error);
      alert('Error merging PDFs. They might be encrypted.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-display font-extrabold text-slate-800 mb-6">PDF Merge</h3>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50 border border-slate-100 hover:border-slate-600 transition-all mb-6"
      >
        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-slate-500 font-medium">Add PDFs</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {files.map((file, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="text-slate-500 truncate max-w-[200px] text-sm">{file.name}</span>
                <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {isProcessing && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-[#6B81FA]">Processing...</span>
                <span className="text-xs font-medium text-[#6B81FA]">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#6B81FA] h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
          
          <button 
            onClick={mergePdfs}
            disabled={isProcessing || files.length < 2}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isProcessing ? 'Merging...' : files.length < 2 ? 'Add more PDFs to merge' : 'Merge PDFs'}
          </button>
        </div>
      )}
      
      <input 
        type="file" 
        accept="application/pdf" 
        multiple
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
