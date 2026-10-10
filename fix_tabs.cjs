const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// Add the state variable
code = code.replace(
  /const \[activeLevelId, setActiveLevelId\] = useState\(''\);/,
  "const [activeLevelId, setActiveLevelId] = useState('');\n  const [activeCategory, setActiveCategory] = useState<'assignment' | 'project'>('assignment');"
);

// Replace the title block with the new toggle tabs
const oldTitleBlock = `<div className="text-center mb-8 md:mb-12 px-2">
              <h2 className="text-3xl sm:text-4xl md:text-[3.5rem] font-display font-extrabold text-[#1C1D20] dark:text-white leading-[1.15] tracking-tight mb-3 md:mb-4">
                IGNOU Notes
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-[280px] sm:max-w-md md:max-w-2xl mx-auto">
                High-quality assignment notes for Jan & Dec sessions.
              </p>
            </div>`;

const newCategoryTabs = `<div className="flex flex-wrap justify-center gap-3 mb-8 md:mb-12 pt-2 md:pt-4">
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

code = code.replace(oldTitleBlock, newCategoryTabs);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
