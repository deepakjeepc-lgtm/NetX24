const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// The class structure was slightly different in the grep output. Let's match it correctly.
code = code.replace(
  /<div className="mt-auto flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all  transform translate-y-2 group-hover:translate-y-0 relative z-10">/g,
  '<div className="hidden sm:flex mt-auto items-center text-indigo-600 dark:text-indigo-400 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 relative z-10">'
);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done fixing view subjects");
