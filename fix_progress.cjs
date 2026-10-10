const fs = require('fs');
let code = fs.readFileSync('src/tools/ImageUpscaler.tsx', 'utf8');

// Increase timeout to give browser more time to paint smooth transitions
code = code.replace(
  /await new Promise\(r => setTimeout\(r, 40\)\);/g,
  'await new Promise(r => setTimeout(r, 150));'
);

// Replace the button JSX with smoother transitions
const oldButton = `<button 
                onClick={handleUpscale}
                disabled={isProcessing || (mode === 'target' && (!targetValue || Number(targetValue) <= 0))}
                className="w-full py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-80 disabled:cursor-not-allowed flex flex-col items-center justify-center shadow-md hover:shadow-lg shadow-indigo-500/20 text-sm md:text-base relative overflow-hidden"
              >
                {/* Progress Bar Background */}
                {isProcessing && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-indigo-500/50 transition-all duration-300 ease-out" 
                    style={{ width: \`\${progress}%\` }}
                  />
                )}
                
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 shrink-0 animate-spin" />
                      Processing... {progress}%
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                      Increase Image Size
                    </>
                  )}
                </div>
              </button>`;

const newButton = `<button 
                onClick={handleUpscale}
                disabled={isProcessing || (mode === 'target' && (!targetValue || Number(targetValue) <= 0))}
                className="w-full py-3 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all disabled:opacity-90 disabled:cursor-not-allowed flex flex-col items-center justify-center shadow-md hover:shadow-lg shadow-indigo-500/20 text-sm md:text-base relative overflow-hidden"
              >
                {/* Progress Bar Background */}
                {isProcessing && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-black/20 dark:bg-black/30 transition-all duration-[800ms] ease-out pointer-events-none" 
                    style={{ width: \`\${progress}%\` }}
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
              </button>`;

code = code.replace(oldButton, newButton);
fs.writeFileSync('src/tools/ImageUpscaler.tsx', code);
console.log("Done fixing progress");
