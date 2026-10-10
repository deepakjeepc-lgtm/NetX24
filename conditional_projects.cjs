const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// The section starting with <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
// We want to conditionally render the content based on activeCategory
const renderBlock = `<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">`;

const replacement = `{activeCategory === 'project' ? (
              <div className="w-full py-20 text-center flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4 opacity-50" />
                <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">Projects Coming Soon</h3>
                <p className="text-slate-500 dark:text-slate-400">We are currently preparing high-quality project materials. Check back later!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">`;

// Need to be careful to close this conditional block properly.
// The grid is closed right before: `</div>\n          </div>\n        )\n      </div>`
// Wait, the grid div is closed after the `activeLevel.courses.map`
// It looks like:
//           </div>
//         </div>
//       ) : (
//         <div className="relative z-10 flex flex-col">...

let lines = code.split('\n');
let replacedGridOpen = false;
let openDivs = 0;
let inGrid = false;
let insertionIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5"')) {
    lines[i] = lines[i].replace(
      '<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">',
      replacement
    );
    replacedGridOpen = true;
    inGrid = true;
    openDivs = 1;
    continue;
  }
  
  if (inGrid) {
    if (lines[i].includes('<div')) {
      openDivs += (lines[i].match(/<div/g) || []).length;
    }
    if (lines[i].includes('</div')) {
      openDivs -= (lines[i].match(/<\/div/g) || []).length;
    }
    
    if (openDivs === 0) {
      insertionIndex = i;
      break;
    }
  }
}

if (insertionIndex !== -1) {
  lines.splice(insertionIndex + 1, 0, '            )}');
}

fs.writeFileSync('src/components/IgnouNotesSection.tsx', lines.join('\n'));
console.log("Done");
