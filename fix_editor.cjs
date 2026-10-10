const fs = require('fs');
let code = fs.readFileSync('src/components/admin/IgnouEditor.tsx', 'utf8');

code = code.replace(
  "const { data: initialData, loading, updateData } = useIgnouData();",
  "const { assignmentsData, projectsData, loading, updateData } = useIgnouData();\n  const [activeCategory, setActiveCategory] = useState<'assignment' | 'project'>('assignment');\n  const initialData = activeCategory === 'assignment' ? assignmentsData : projectsData;"
);

// We also need to update handleSave
code = code.replace(
  "await updateData(data);",
  "await updateData(activeCategory, data);"
);

// And we need to inject the tab buttons inside the header
const headerMatch = `<div className="px-6 py-6 md:px-8 md:py-8 border-b border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-extrabold text-[#1C1D20] dark:text-white text-xl">Manage IGNOU Data</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Configure degrees, courses, and subjects</p>
        </div>`;

const headerWithTabs = `<div className="px-6 py-6 md:px-8 md:py-8 border-b border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-extrabold text-[#1C1D20] dark:text-white text-xl">Manage IGNOU Data</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 mb-4">Configure degrees, courses, and subjects</p>
          
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 w-fit">
            <button
              onClick={() => setActiveCategory('assignment')}
              className={\`px-6 py-2 rounded-full font-bold text-xs transition-all \${
                activeCategory === 'assignment'
                  ? 'bg-white dark:bg-slate-900 text-[#1C1D20] dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }\`}
            >
              Assignments
            </button>
            <button
              onClick={() => setActiveCategory('project')}
              className={\`px-6 py-2 rounded-full font-bold text-xs transition-all \${
                activeCategory === 'project'
                  ? 'bg-white dark:bg-slate-900 text-[#1C1D20] dark:text-white shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }\`}
            >
              Projects
            </button>
          </div>
        </div>`;

code = code.replace(headerMatch, headerWithTabs);

fs.writeFileSync('src/components/admin/IgnouEditor.tsx', code);
console.log("Done Editor");
