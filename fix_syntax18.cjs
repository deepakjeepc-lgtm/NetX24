const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

const badBlock = `            <button 
              onClick={() => setSelectedCourse(null)}
              className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium mb-8 w-fit transition-colors"
            >

            <div className="mb-10 pr-12">`;

const goodBlock = `            <button 
              onClick={() => setSelectedCourse(null)}
              className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium mb-8 w-fit transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Programs
            </button>

            <div className="mb-10 pr-12">`;

code = code.replace(badBlock, goodBlock);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
