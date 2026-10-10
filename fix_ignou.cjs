const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// 1. Fix container width and padding to match floating bar
code = code.replace(
  /className="scroll-mt-32 w-full max-w-\[95%\] 2xl:max-w-\[1600px\] mx-auto px-4 md:px-8 mt-4 md:mt-8"/g,
  'className="scroll-mt-32 w-full max-w-[1600px] mx-auto px-4 mt-4 md:mt-8"' // using px-4 so mobile matches floating bar which uses px-4
);

// 2. Fix the grid columns for course boxes
code = code.replace(
  /className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"/g,
  'className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5"'
);

// 3. Adjust padding and text inside course boxes so they fit well in 2-col mobile view
code = code.replace(
  /className="bg-white\/60 dark:bg-slate-900\/60 backdrop-blur-md rounded-\[2rem\] p-6 border /g,
  'className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 border '
);

code = code.replace(
  /<h4 className="font-display font-bold text-\[#1C1D20\] dark:text-white text-2xl mb-1 relative z-10 tracking-tight">/g,
  '<h4 className="font-display font-bold text-[#1C1D20] dark:text-white text-lg sm:text-2xl mb-1 relative z-10 tracking-tight">'
);

code = code.replace(
  /<p className="text-sm font-medium text-slate-500 dark:text-slate-400 relative z-10 line-clamp-1">/g,
  '<p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 relative z-10 line-clamp-1">'
);

code = code.replace(
  /<div className="w-14 h-14 rounded-2xl bg-indigo-50\/80 dark:bg-indigo-900\/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all  ring-1 ring-indigo-500\/10 dark:ring-indigo-500\/20 shadow-sm relative z-10">/g,
  '<div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-indigo-50/80 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 sm:mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all ring-1 ring-indigo-500/10 dark:ring-indigo-500/20 shadow-sm relative z-10">'
);

code = code.replace(
  /<FileText className="w-7 h-7" \/>/g,
  '<FileText className="w-5 h-5 sm:w-7 sm:h-7" />'
);

code = code.replace(
  /<span className="text-sm font-bold">View Subjects<\/span>/g,
  '<span className="text-xs sm:text-sm font-bold">View Subjects</span>'
);

// We need to also check if we should do anything about the subjects grid (the notes items)
// User mentioned: "BAHDH OR ABG YE SAB KA JO BOXES HOTE HAIN WO TO PAHLE MOBILE VIEW ME EK ROW ME DO HOGA"
// Does he also want the subjects to be 2 per row? "BAHDH OR ABG YE SAB KA JO BOXES" specifically names the programs.
// Let's leave subjects as 1 per row or check if they are already multiple?
// "grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-24 md:pb-32" -> They are 1 col on mobile.
// Changing them to 2 columns might break their complex layout (price, PDF, HW buttons). The course boxes are simple so they can be 2 cols.

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
