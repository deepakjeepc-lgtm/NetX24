const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// The exact block from the actual file
const exactOldBlock = `<div className="text-center mb-12">
              <h2 className="text-[2.5rem] md:text-[3.5rem] font-display font-extrabold text-[#1C1D20] dark:text-white leading-[1.1] tracking-tight mb-4 pr-12 md:pr-0">
                IGNOU Assignment Notes
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
                Select your program to find high-quality PDF assignment notes for Jan & Dec sessions.
              </p>
            </div>`;

const exactNewBlock = `<div className="text-center mb-8 md:mb-12 px-2">
              <h2 className="text-3xl sm:text-4xl md:text-[3.5rem] font-display font-extrabold text-[#1C1D20] dark:text-white leading-[1.15] tracking-tight mb-3 md:mb-4">
                IGNOU Notes
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-[280px] sm:max-w-md md:max-w-2xl mx-auto">
                High-quality assignment notes for Jan & Dec sessions.
              </p>
            </div>`;

code = code.replace(exactOldBlock, exactNewBlock);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
