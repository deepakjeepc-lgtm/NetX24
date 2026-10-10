const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');
let lines = code.split('\n');

// Since there is a missing `)}` at the end, I need to look at line 410.
for (let i = 390; i < 415; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
