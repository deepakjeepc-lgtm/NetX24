import React, { useState, useRef } from 'react';
import { Upload, Download, ArrowUpCircle, Loader2 } from 'lucide-react';

export default function ImageUpscaler({ onComplete }: { onComplete: (count?: number) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const [mode, setMode] = useState<'target' | 'factor'>('target');
  const [upscaleFactor, setUpscaleFactor] = useState<number>(2);
  
  const [targetValue, setTargetValue] = useState<string>('');
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('KB');
  
  const [format, setFormat] = useState<string>('image/jpeg');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [newSize, setNewSize] = useState(0);
  const [downloadName, setDownloadName] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setOriginalSize(selected.size);
      setResultUrl(null);
      setNewSize(0);
      setPreview(URL.createObjectURL(selected));
      setProgress(0);
      
      const defaultKB = Math.ceil((selected.size / 1024) + 50);
      setTargetValue(defaultKB.toString());
      setTargetUnit('KB');
    }
  };

  const handleUnitChange = (newUnit: 'KB' | 'MB') => {
    if (newUnit === targetUnit) return;
    
    if (targetValue && !isNaN(Number(targetValue))) {
      const val = Number(targetValue);
      if (newUnit === 'MB') {
        setTargetValue((val / 1024).toFixed(3).replace(/\.?0+$/, ''));
      } else {
        setTargetValue((val * 1024).toFixed(0));
      }
    }
    setTargetUnit(newUnit);
  };

  const getBlob = (img: HTMLImageElement, scale: number): Promise<Blob | null> => {
    return new Promise(resolve => {
      const canvas = canvasRef.current;
      if (!canvas) return resolve(null);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => resolve(blob), format, 1.0);
    });
  };

  const handleUpscale = async () => {
    if (!preview || !file || !canvasRef.current) return;
    setIsProcessing(true);
    setProgress(5);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = preview;
    
    img.onload = async () => {
      let finalBlob: Blob | null = null;
      
      if (mode === 'factor') {
        setProgress(45);
        await new Promise(r => setTimeout(r, 50));
        finalBlob = await getBlob(img, upscaleFactor);
        setProgress(100);
      } else {
        const targetBytes = targetUnit === 'MB' 
          ? Number(targetValue) * 1024 * 1024 
          : Number(targetValue) * 1024;
          
        let scale = 1.0;
        let currentBlob = await getBlob(img, scale);
        let attempts = 0;
        let step = 0.2;
        
        while (currentBlob && currentBlob.size < targetBytes && attempts < 15) {
          let currentProgress = Math.min(10 + Math.floor((currentBlob.size / targetBytes) * 80), 95);
          setProgress(currentProgress);
          
          // Yield to UI thread to render progress bar
          await new Promise(r => setTimeout(r, 150));
          
          if (currentBlob.size < targetBytes * 0.3) step = 0.6;
          else if (currentBlob.size < targetBytes * 0.6) step = 0.3;
          else if (currentBlob.size < targetBytes * 0.85) step = 0.15;
          else step = 0.05;
          
          scale += step;
          if (scale > 15) break;
          
          currentBlob = await getBlob(img, scale);
          attempts++;
        }
        finalBlob = currentBlob;
        setProgress(100);
      }
      
      if (finalBlob) {
        setNewSize(finalBlob.size);
        setResultUrl(URL.createObjectURL(finalBlob));
        
        const originalName = file.name;
        const lastDot = originalName.lastIndexOf('.');
        const nameWithoutExt = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
        const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
        setDownloadName(`${nameWithoutExt}_NetX24.${ext}`);
        
        onComplete(1);
      }
      
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 600);
    };
  };

  return (
    <div className="w-full max-w-2xl mx-auto overflow-hidden px-1">
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-extrabold text-[#1C1D20] dark:text-white mb-2 md:mb-4">Increase Image Size</h2>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">Input exact KB/MB or multiply resolution to increase file size.</p>
      </div>
      
      <div className="space-y-4 md:space-y-6 w-full">
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 text-center transition-all w-full overflow-hidden flex flex-col items-center justify-center ${
            isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } ${
            file 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
            disabled={isProcessing}
          />
          <Upload className="w-10 h-10 md:w-12 md:h-12 text-indigo-500 mb-3 md:mb-4 shrink-0" />
          <div className="w-full max-w-full px-2">
            <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-white mb-1 md:mb-2 truncate w-full block">
              {file ? file.name : 'Click to upload image'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">
              {file ? `Original Size: ${(originalSize / 1024).toFixed(2)} KB` : 'Supports JPG, PNG, WEBP'}
            </p>
          </div>
        </div>

        {file && !resultUrl && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 shadow-sm space-y-5 w-full">
            
            {/* Mode Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full">
              <button 
                onClick={() => setMode('target')}
                className={`flex-1 py-2 md:py-2.5 text-[11px] sm:text-xs md:text-sm font-bold rounded-lg transition-colors truncate px-1 ${mode === 'target' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Exact Size
              </button>
              <button 
                onClick={() => setMode('factor')}
                className={`flex-1 py-2 md:py-2.5 text-[11px] sm:text-xs md:text-sm font-bold rounded-lg transition-colors truncate px-1 ${mode === 'factor' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Multiply (1.5x-4x)
              </button>
            </div>

            <div className="space-y-4">
              {mode === 'target' ? (
                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Target Size</label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input 
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                    />
                    <select
                      value={targetUnit}
                      onChange={(e) => handleUnitChange(e.target.value as 'KB' | 'MB')}
                      className="px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-bold min-w-[70px] md:min-w-[80px]"
                    >
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                    </select>
                  </div>
                  
                  {targetValue && Number(targetValue) > 0 && (
                    <div className="mt-2 text-xs font-semibold text-indigo-600/80 dark:text-indigo-400/80 px-1">
                      {targetUnit === 'KB' 
                        ? `≈ ${(Number(targetValue) / 1024).toFixed(3)} MB`
                        : `≈ ${(Number(targetValue) * 1024).toFixed(0)} KB`
                      }
                    </div>
                  )}
                  <p className="text-[10px] md:text-xs text-slate-500 mt-1 leading-relaxed px-1">System iteratively adjusts size to reach this target.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Upscale Factor</label>
                  <select 
                    value={upscaleFactor}
                    onChange={(e) => setUpscaleFactor(Number(e.target.value))}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium"
                  >
                    <option value={1.5}>1.5x (Small Increase)</option>
                    <option value={2}>2x (Medium Increase)</option>
                    <option value={3}>3x (Large Increase)</option>
                    <option value={4}>4x (Massive Increase)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Output Format</label>
                <select 
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white font-medium text-sm md:text-base"
                >
                  <option value="image/jpeg">JPEG (High Quality)</option>
                  <option value="image/png">PNG (Best for increasing size)</option>
                  <option value="image/webp">WEBP</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={handleUpscale}
                disabled={isProcessing || (mode === 'target' && (!targetValue || Number(targetValue) <= 0))}
                className="w-full py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-90 disabled:cursor-not-allowed flex flex-col items-center justify-center shadow-md hover:shadow-lg shadow-indigo-500/20 text-sm md:text-base relative overflow-hidden"
              >
                {/* Progress Bar Background */}
                {isProcessing && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-black/20 dark:bg-black/30 transition-all duration-[800ms] ease-out pointer-events-none" 
                    style={{ width: `${progress}%` }}
                  />
                )}
                
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 shrink-0 animate-spin" />
                      <span className="tabular-nums min-w-[140px] text-left">Processing... {progress}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                      Increase Image Size
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {resultUrl && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 text-center shadow-sm w-full overflow-hidden">
            <h3 className="text-lg md:text-xl font-bold text-emerald-800 dark:text-emerald-400 mb-1 md:mb-2">Image Size Increased!</h3>
            
            <div className="flex flex-col items-center justify-center gap-1 mb-5 md:mb-6">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold text-base md:text-lg">
                New Size: {(newSize / 1024).toFixed(2)} KB
              </span>
              <span className="text-xs md:text-sm text-emerald-600/70 dark:text-emerald-500/70 font-medium">
                ({(originalSize / 1024).toFixed(2)} KB originally)
              </span>
            </div>
            
            <a 
              href={resultUrl} 
              download={downloadName}
              className="flex items-center justify-center gap-2 w-full py-3 md:py-4 px-4 md:px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20 text-sm md:text-base"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              Download Image
            </a>
            
            <p className="text-[10px] md:text-xs text-emerald-600/70 dark:text-emerald-500/50 mt-3 font-medium truncate w-full px-2 block">
              Saved as: {downloadName}
            </p>
            
            <button 
              onClick={() => {
                setResultUrl(null);
                setFile(null);
                setProgress(0);
              }}
              className="block w-full mt-5 md:mt-6 text-xs md:text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-widest"
            >
              Process Another Image
            </button>
          </div>
        )}
      </div>
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
