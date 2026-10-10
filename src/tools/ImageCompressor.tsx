import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Upload, Download, Loader2 } from 'lucide-react';

export default function ImageCompressor({ onComplete }: { onComplete: (count?: number) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [targetSizeKB, setTargetSizeKB] = useState<number | string>(500);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setCompressedFile(null);
      const target = typeof targetSizeKB === 'number' ? targetSizeKB : 500;
      await compressImage(selected, target);
    }
  };

  const [progress, setProgress] = useState(0);

  const compressImage = async (imageFile: File, targetKB: number) => {
    setIsCompressing(true);
    setProgress(0);
    try {
      const options = {
        maxSizeMB: targetKB / 1024,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        onProgress: (p: number) => setProgress(p),
      };
      const compressed = await imageCompression(imageFile, options);
      setCompressedFile(compressed);
      setProgress(100);
      onComplete(1);
    } catch (error) {
      console.error(error);
      alert('Error compressing image');
    } finally {
      setIsCompressing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleTargetSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setTargetSizeKB('');
      return;
    }
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setTargetSizeKB(val);
    }
  };

  const recompress = async () => {
    if (file) {
      const target = typeof targetSizeKB === 'number' ? targetSizeKB : 500;
      await compressImage(file, target);
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
      <h3 className="text-2xl font-display font-extrabold text-slate-800 dark:text-white mb-6">Image Compressor</h3>
      
      {!file ? (
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4 rounded-xl">
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Target Size (KB)</label>
            <input 
              type="number" 
              value={targetSizeKB}
              onChange={handleTargetSizeChange}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-slate-100"
              min="10"
              max="10000"
            />
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">Example: 50 for 50KB. The compressor will try to keep the file under this size.</p>
          </div>
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500 transition-all"
          >
            <Upload className="w-12 h-12 text-slate-500 dark:text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Click to upload JPG or PNG</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">Max file size: 10MB</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Target Size (KB)</label>
              <input 
                type="number" 
                value={targetSizeKB}
                onChange={handleTargetSizeChange}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-800 dark:text-slate-100"
                min="10"
              />
            </div>
            <button 
              onClick={recompress}
              disabled={isCompressing}
              className="w-full sm:w-auto py-2 px-6 bg-slate-800 dark:bg-indigo-600 text-white hover:bg-slate-700 dark:hover:bg-indigo-700 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Re-compress
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl">
            <div>
              <p className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Original: {formatSize(file.size)}</p>
            </div>
            {isCompressing ? (
              <div className="text-right w-1/3">
                <p className="text-sm font-medium text-[#6B81FA] dark:text-indigo-400 mb-1">{progress}%</p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#6B81FA] dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            ) : compressedFile ? (
              <div className="text-right">
                <p className="text-emerald-500 dark:text-emerald-400 font-bold text-lg">{formatSize(compressedFile.size)}</p>
                <p className="text-emerald-600/70 dark:text-emerald-500/70 text-xs">- {((1 - compressedFile.size / file.size) * 100).toFixed(0)}%</p>
              </div>
            ) : null}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => {
                setFile(null);
                setCompressedFile(null);
              }}
              className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-medium rounded-xl transition-colors"
            >
              Upload Another
            </button>
            {compressedFile && (
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(compressedFile);
                  link.download = `compressed_${file.name}`;
                  link.click();
                }}
                className="flex-1 py-3 px-4 bg-slate-800 dark:bg-indigo-600 hover:bg-slate-900 dark:hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                <Download className="w-5 h-5" /> Download
              </button>
            )}
          </div>
        </div>
      )}
      
      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
