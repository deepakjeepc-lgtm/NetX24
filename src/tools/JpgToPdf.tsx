import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import { Upload, Download, Loader2, X } from 'lucide-react';

export default function JpgToPdf({ onComplete }: { onComplete: (count?: number) => void }) {
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

  const convertToPdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgress(0);
    try {
      const pdf = new jsPDF();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imgData = await readFileAsDataURL(file);
        
        if (i > 0) pdf.addPage();
        
        const props = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (props.height * pdfWidth) / props.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        setProgress(Math.round(((i + 1) / files.length) * 90));
      }
      
      pdf.save('converted_images.pdf');
      setProgress(100);
      onComplete(files.length);
    } catch (error) {
      console.error(error);
      alert('Error creating PDF');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      <h3 className="text-2xl font-display font-extrabold text-slate-800 mb-6">JPG/PNG to PDF</h3>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50 border border-slate-100 hover:border-slate-600 transition-all mb-6"
      >
        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-slate-500 font-medium">Add Images</p>
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
            onClick={convertToPdf}
            disabled={isProcessing}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isProcessing ? 'Converting...' : 'Generate PDF'}
          </button>
        </div>
      )}
      
      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        multiple
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
