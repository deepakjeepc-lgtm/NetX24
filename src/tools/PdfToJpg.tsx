import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, Download, Loader2 } from 'lucide-react';

// Setup worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PdfToJpg({ onComplete }: { onComplete: (count?: number) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setImages([]);
      await processPdf(selected);
    }
  };

  const processPdf = async (pdfFile: File) => {
    setIsProcessing(true);
    setProgress(0);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const generatedImages: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          const renderContext: any = {
            canvasContext: context,
            viewport: viewport,
          };
          await page.render(renderContext).promise;
          generatedImages.push(canvas.toDataURL('image/jpeg', 0.9));
        }
        setProgress(Math.round((i / numPages) * 100));
      }
      
      setImages(generatedImages);
      onComplete(1);
    } catch (error) {
      console.error(error);
      alert('Error extracting images from PDF');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const downloadImage = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `page_${index + 1}.jpg`;
    link.click();
  };

  return (
    <div>
      <h3 className="text-2xl font-display font-extrabold text-slate-800 mb-6">PDF to JPG</h3>
      
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
          <div className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-xl gap-2">
            <div className="flex items-center justify-between">
              <p className="text-slate-800 font-medium truncate max-w-[200px]">{file.name}</p>
              {isProcessing && <span className="text-xs font-medium text-[#6B81FA]">{progress}%</span>}
            </div>
            {isProcessing && (
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#6B81FA] h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-2">
              {images.map((img, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border-slate-200">
                  <img src={img} alt={`Page ${i + 1}`} className="w-full h-auto object-cover" />
                  <div className="absolute inset-0 bg-white border border-slate-200/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => downloadImage(img, i)}
                      className="p-2 bg-blue-600 text-slate-800 rounded-full hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 bg-white border border-slate-200/80 text-slate-800 text-xs px-2 py-1 rounded">
                    Pg {i + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => {
                setFile(null);
                setImages([]);
              }}
              className="w-full py-3 px-4 bg-slate-50 border border-slate-100 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors"
            >
              Upload Another
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
