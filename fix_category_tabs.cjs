const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

const oldTabs = `<div className="flex flex-wrap justify-center gap-3 mb-8 md:mb-12 pt-2 md:pt-4">
              <button
                onClick={() => setActiveCategory('assignment')}
                className={\`px-8 py-3.5 rounded-full font-bold text-sm transition-all \${
                  activeCategory === 'assignment'
                    ? 'bg-[#1C1D20] dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-black/20 dark:shadow-white/10 scale-105 ring-1 ring-slate-900/5 dark:ring-white/10'
                    : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:-translate-y-0.5'
                }\`}
              >
                Assignment
              </button>
              <button
                onClick={() => setActiveCategory('project')}
                className={\`px-8 py-3.5 rounded-full font-bold text-sm transition-all \${
                  activeCategory === 'project'
                    ? 'bg-[#1C1D20] dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-black/20 dark:shadow-white/10 scale-105 ring-1 ring-slate-900/5 dark:ring-white/10'
                    : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md hover:-translate-y-0.5'
                }\`}
              >
                Project
              </button>
            </div>`;

const newTabs = `<div className="flex justify-center mb-8 md:mb-12 pt-2 md:pt-4">
              <div className="flex items-center gap-1 p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
                <button
                  onClick={() => setActiveCategory('assignment')}
                  className={\`px-8 py-3 rounded-full font-bold text-sm transition-all \${
                    activeCategory === 'assignment'
                      ? 'bg-white dark:bg-slate-900 text-[#1C1D20] dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                  }\`}
                >
                  Assignment
                </button>
                <button
                  onClick={() => setActiveCategory('project')}
                  className={\`px-8 py-3 rounded-full font-bold text-sm transition-all \${
                    activeCategory === 'project'
                      ? 'bg-white dark:bg-slate-900 text-[#1C1D20] dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                  }\`}
                >
                  Project
                </button>
              </div>
            </div>`;

code = code.replace(oldTabs, newTabs);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
