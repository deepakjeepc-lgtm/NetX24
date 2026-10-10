import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Crop, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function ImageResizeCompress({ onComplete }: { onComplete: (count?: number) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dimension, setDimension] = useState<{w: number, h: number}>({w: 354, h: 472}); // default
  const [preset, setPreset] = useState('passport');
  const [targetKb, setTargetKb] = useState<number>(50);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const presets = [
    { id: 'passport', name: 'Passport Size (3.5 x 4.5 cm)', w: 413, h: 531 },
    { id: 'stamp', name: 'Stamp Size (2 x 2.5 cm)', w: 236, h: 295 },
    { id: 'pan', name: 'PAN Card Photo (2.5 x 3.5 cm)', w: 295, h: 413 },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
    }
  };

  useEffect(() => {
    if (preview && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = dimension.w;
          canvas.height = dimension.h;
          
          const imgRatio = img.width / img.height;
          const canvasRatio = canvas.width / canvas.height;
          let drawWidth, drawHeight, offsetX, offsetY;
          
          if (imgRatio > canvasRatio) {
            drawHeight = canvas.height;
            drawWidth = img.width * (canvas.height / img.height);
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
          } else {
            drawWidth = canvas.width;
            drawHeight = img.height * (canvas.width / img.width);
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
          }
          
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }
      };
      img.src = preview;
    }
  }, [preview, dimension]);

  const handleDownload = async () => {
    if (!canvasRef.current || !file) return;
    
    setIsProcessing(true);
    setProgress(10);
    
    try {
      // First get the resized image from canvas
      const blob = await new Promise<Blob>((resolve) => {
        canvasRef.current!.toBlob((b) => resolve(b!), 'image/jpeg', 1.0);
      });
      
      const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
      setProgress(40);
      
      // Now compress to target KB
      const options = {
        maxSizeMB: targetKb / 1024,
        maxWidthOrHeight: Math.max(dimension.w, dimension.h),
        useWebWorker: true,
        onProgress: (p: number) => {
          setProgress(40 + (p * 0.5)); // Map 0-100 to 40-90
        }
      };
      
      const compressedFile = await imageCompression(resizedFile, options);
      setProgress(95);
      
      const link = document.createElement('a');
      link.download = `resized_compressed_${file.name}`;
      link.href = URL.createObjectURL(compressedFile);
      link.click();
      
      setProgress(100);
      onComplete(1);
    } catch (e) {
      console.error(e);
      alert("Error processing image.");
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 1000);
    }
  };

  const applyPreset = (id: string, w: number, h: number) => {
    setPreset(id);
    setDimension({ w, h });
  };

  return (
    <div>
      <h3 className="text-2xl font-display font-extrabold text-slate-800 dark:text-white mb-6">Resize + Compress Image</h3>
      
      {!preview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500 transition-all"
        >
          <Upload className="w-12 h-12 text-slate-500 dark:text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Click to upload image</p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">Dimension Presets</p>
              <div className="flex flex-col gap-2">
                {presets.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => applyPreset(p.id, p.w, p.h)}
                    className={`py-2 px-4 rounded-xl text-sm font-medium text-left border ${preset === p.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Width (px)</label>
                <input 
                  type="number" 
                  value={dimension.w}
                  onChange={(e) => { setPreset('custom'); setDimension(prev => ({...prev, w: parseInt(e.target.value) || 1})) }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Height (px)</label>
                <input 
                  type="number" 
                  value={dimension.h}
                  onChange={(e) => { setPreset('custom'); setDimension(prev => ({...prev, h: parseInt(e.target.value) || 1})) }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Target File Size (Max KB)</label>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{targetKb} KB</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="1024" 
                step="10"
                value={targetKb}
                onChange={(e) => setTargetKb(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>10 KB</span>
                <span>1 MB</span>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => { setFile(null); setPreview(null); }}
                className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium rounded-xl transition-colors text-sm"
              >
                Change Image
              </button>
              <button 
                onClick={handleDownload}
                disabled={isProcessing}
                className="flex-1 py-3 bg-slate-800 dark:bg-indigo-600 hover:bg-slate-900 dark:hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2 text-sm disabled:opacity-70 relative overflow-hidden"
              >
                {isProcessing ? (
                  <>
                    <div className="absolute inset-0 bg-slate-700">
                      <div className="h-full bg-[#6B81FA] dark:bg-indigo-400 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="relative z-10">Processing... {Math.round(progress)}%</span>
                  </>
                ) : (
                  <><Download className="w-4 h-4" /> Download</>
                )}
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-center min-h-[300px]">
             <canvas ref={canvasRef} className="max-w-full max-h-[400px] shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
          </div>
        </div>
      )}
      
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
