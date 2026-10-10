const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');
code = code.replace(/<div\s+className="relative z-10 bg-white dark:bg-slate-950 rounded-\[2rem\] p-8 md:p-10 shadow-xl text-slate-900 dark:text-white dark:border dark:border-slate-800"\s*>\s*<h3 className="text-2xl font-bold text-\[#1C1D20\] dark:text-white mb-8">Send a message<\/h3>\s*<ContactForm \/>\s*<\/div>/, '<div className="relative z-10 flex flex-col justify-center"><h3 className="text-2xl font-display font-bold text-white mb-8">Send a message</h3><ContactForm /></div>');
fs.writeFileSync('src/pages/LandingPage.tsx', code);
console.log("Done");
