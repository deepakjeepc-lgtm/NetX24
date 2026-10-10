const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

code = code.replace(
  /className=\{\`px-8 py-3 rounded-full font-bold text-sm transition-all/g,
  'className={`w-[130px] sm:w-[140px] py-3 rounded-full font-bold text-sm transition-all text-center'
);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
