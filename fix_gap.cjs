const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// fix padding and gap
code = code.replace(
  /className="bg-\[#1C1D20\] dark:bg-slate-900 rounded-\[3rem\] p-10 md:p-16 lg:p-20 text-white relative overflow-hidden shadow-2xl grid lg:grid-cols-2 gap-16 dark:border dark:border-slate-800"/g,
  'className="bg-[#1C1D20] dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 lg:p-16 text-white relative overflow-hidden shadow-2xl grid lg:grid-cols-2 gap-12 lg:gap-16 dark:border dark:border-slate-800"'
);

fs.writeFileSync('src/pages/LandingPage.tsx', code);
console.log("Done");
