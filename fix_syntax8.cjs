const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// I'm just going to completely rewrite lines 280-300 to what they should be.
// The courses grid closes, then the !selectedCourse branch closes, then the else branch opens.
let lines = code.split('\n');
// Let's find the closing of the courses grid.
let gridIndex = -1;
for (let i = 270; i < 300; i++) {
  if (lines[i].includes('View Subjects <ChevronRight')) {
    gridIndex = i + 3; // line 284 is View Subjects, 285 is </div>, 286 is </motion.button>, 287 is ))}
    break;
  }
}

if (gridIndex !== -1) {
  // We expect:
  // 287:               ))}
  // 288:             </div>
  // 289:           </div>
  // 290:         ) : (
  // 291:           <div className="relative z-10 flex flex-col">
  // 292:             <button onClick={() => setSelectedCourse(null)}
  
  lines.splice(gridIndex + 1, 15, 
    '            </div>',
    '          </div>',
    '        ) : (',
    '          <div className="relative z-10 flex flex-col">',
    '            <button ',
    '              onClick={() => setSelectedCourse(null)}',
    '              className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-medium mb-8 w-fit transition-colors"',
    '            >'
  );
}

fs.writeFileSync('src/components/IgnouNotesSection.tsx', lines.join('\n'));
console.log("Done");
