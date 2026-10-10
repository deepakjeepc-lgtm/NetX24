const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// The current title block looks like:
/*
          <div className="text-center max-w-2xl mx-auto mb-16 relative z-10">
            <h2 className="text-[3rem] md:text-[4rem] font-display font-extrabold text-[#1C1D20] dark:text-white leading-[1.05] tracking-tight mb-6">
              IGNOU Assignment Notes
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium">
              Select your program to find high-quality PDF assignment notes for Jan & Dec sessions.
            </p>
          </div>
*/

// Let's replace it with a more compact, polished version that isn't centered incorrectly on mobile
const oldBlock = `<div className="text-center max-w-2xl mx-auto mb-16 relative z-10">
            <h2 className="text-[3rem] md:text-[4rem] font-display font-extrabold text-[#1C1D20] dark:text-white leading-[1.05] tracking-tight mb-6">
              IGNOU Assignment Notes
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium">
              Select your program to find high-quality PDF assignment notes for Jan & Dec sessions.
            </p>
          </div>`;

const newBlock = `<div className="text-center max-w-2xl mx-auto mb-8 md:mb-12 relative z-10 px-2">
            <h2 className="text-3xl sm:text-4xl md:text-[3.5rem] font-display font-extrabold text-[#1C1D20] dark:text-white leading-[1.1] tracking-tight mb-3 md:mb-4">
              IGNOU Notes
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium max-w-[280px] sm:max-w-md md:max-w-lg mx-auto">
              Find high-quality assignment notes for Jan & Dec sessions.
            </p>
          </div>`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
