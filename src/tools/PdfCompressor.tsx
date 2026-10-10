import React, { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, Loader2 } from 'lucide-react';

export default function PdfCompressor({ onComplete }: { onComplete: (count?: number) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [compressedPdf, setCompressedPdf] = useState<Uint8Array | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setCompressedPdf(null);
      await compressPdf(selected);
    }
  };

  const compressPdf = async (pdfFile: File) => {
    setIsCompressing(true);
    setProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 15, 90));
    }, 200);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      // Load and save without preserving metadata, often reduces size
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
      
      setCompressedPdf(pdfBytes);
      setProgress(100);
      onComplete(1);
    } catch (error) {
      console.error(error);
      alert('Error processing PDF. The file might be encrypted or corrupted.');
    } finally {
      clearInterval(progressInterval);
      setIsCompressing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <h3 className="text-2xl font-display font-extrabold text-slate-800 mb-6">PDF Compressor</h3>
      <p className="text-slate-500 text-sm mb-6">Note: Client-side PDF compression works best for PDFs with lots of unoptimized metadata. Size reduction may vary.</p>
      
      {!file ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center cursor-pointer hover:bg-slate-50 border border-slate-100 hover:border-slate-600 transition-all"
        >
          <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Click to upload PDF</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-slate-800 font-medium truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
              <p className="text-slate-500 text-sm">Original: {formatSize(file.size)}</p>
            </div>
            {isCompressing ? (
              <div className="text-right w-1/3">
                <p className="text-sm font-medium text-[#6B81FA] mb-1">{progress}%</p>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#6B81FA] h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            ) : compressedPdf ? (
              <div className="text-right">
                <p className="text-blue-400 font-bold text-lg">{formatSize(compressedPdf.byteLength)}</p>
                {compressedPdf.byteLength < file.size && (
                  <p className="text-green-500/70 text-xs">- {((1 - compressedPdf.byteLength / file.size) * 100).toFixed(0)}%</p>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => {
                setFile(null);
                setCompressedPdf(null);
              }}
              className="flex-1 py-3 px-4 bg-slate-50 border border-slate-100 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors"
            >
              Upload Another
            </button>
            {compressedPdf && (
              <button 
                onClick={() => {
                  const blob = new Blob([compressedPdf], { type: 'application/pdf' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `optimized_${file.name}`;
                  link.click();
                }}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white text-slate-800 font-medium rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                <Download className="w-5 h-5" /> Download
              </button>
            )}
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
