const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

const target = `<div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-6 py-4 shadow-lg shadow-black/5 dark:shadow-black/20">
                <LucideIcons.Search className="w-5 h-5 text-slate-400 mr-3" />
                <div className="flex-grow text-left">
                  <span className="text-slate-400 text-lg font-medium">Explore our services...</span>
                </div>
                <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm whitespace-nowrap ml-2">
                  Get Started
                </button>
              </div>`;

const replacement = `<div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 md:px-6 py-3 md:py-4 shadow-lg shadow-black/5 dark:shadow-black/20">
                <LucideIcons.Search className="w-5 h-5 text-slate-400 mr-2 md:mr-3 shrink-0" />
                <div className="flex-grow text-left overflow-hidden">
                  <span className="text-slate-400 text-sm md:text-lg font-medium truncate block">Explore our services...</span>
                </div>
                <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 md:px-5 py-2 rounded-full font-bold text-xs md:text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm whitespace-nowrap ml-2 shrink-0">
                  Get Started
                </button>
              </div>`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/pages/LandingPage.tsx', code);
    console.log("Done");
} else {
    console.log("Target not found!");
}
