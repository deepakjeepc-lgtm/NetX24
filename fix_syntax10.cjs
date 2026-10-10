const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// The original file had the syntax error introduced around line 290.
// Let's completely rewrite the boundaries of these branches.
// Cart branch ends at `</div>\n          </div>\n        ) : !selectedCourse ? (`
// Wait... The cart branch ends and THEN we check !selectedCourse.
// Let's look for `) : !selectedCourse ? (` in the file.
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('!selectedCourse')) {
    console.log(`${i+1}: ${lines[i]}`);
  }
  if (lines[i].includes('isCartOpen')) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
