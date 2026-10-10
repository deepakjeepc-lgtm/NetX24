import fs from 'fs';

const content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

const targetStr = `<div className="flex flex-col sm:flex-row items-center gap-4">
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowIgnouNotes(true);
                setTimeout(() => {
                  document.getElementById('ignou-notes-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="bg-[#1C1D20] dark:bg-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 text-white px-8 py-4 rounded-full font-medium text-lg transition-all shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1"
            >
              IGNOU Notes
            </button>
            <a href="#tools" className="bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 dark:hover:bg-slate-800/60 text-slate-900 dark:text-white border border-slate-900/10 dark:border-white/10 px-8 py-4 rounded-full font-medium text-lg transition-all backdrop-blur-sm">
              View Local Tools
            </a>
          </div>`;

const replacement = `<div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 mt-4">
            <div className="flex flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-transform hover:scale-105">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cafe Open</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-transform hover:scale-105">
                <Printer className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Printers Available</span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-transform hover:scale-105">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">High-Speed WiFi</span>
              </div>
            </div>

            <div className="relative w-full max-w-lg group cursor-pointer" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-orange-400 to-indigo-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-6 py-4 shadow-lg shadow-black/5 dark:shadow-black/20">
                <LucideIcons.Search className="w-5 h-5 text-slate-400 mr-3" />
                <div className="flex-grow text-left">
                  <span className="text-slate-400 text-lg font-medium">Explore our services...</span>
                </div>
                <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2 rounded-full font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm whitespace-nowrap ml-2">
                  Get Started
                </button>
              </div>
            </div>
          </div>`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/pages/LandingPage.tsx', content.replace(targetStr, replacement));
  console.log("Success");
} else {
  console.log("Target string not found, trying fallback...");
}
