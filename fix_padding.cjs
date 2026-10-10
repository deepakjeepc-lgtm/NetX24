const fs = require('fs');
let code = fs.readFileSync('src/components/ToolsDashboard.tsx', 'utf8');

// Fix the container padding which was breaking on mobile
code = code.replace(
  /className="bg-slate-50\/80 dark:bg-slate-900\/40 backdrop-blur-sm rounded-\[3rem\] p-8 md:p-12 border border-slate-200\/60 dark:border-slate-800\/60 shadow-sm"/g,
  'className="bg-slate-50/80 dark:bg-slate-900/40 backdrop-blur-sm rounded-[2rem] md:rounded-[3rem] p-4 sm:p-6 md:p-12 border border-slate-200/60 dark:border-slate-800/60 shadow-sm w-full overflow-hidden"'
);

fs.writeFileSync('src/components/ToolsDashboard.tsx', code);
console.log("Done");
