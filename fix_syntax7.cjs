const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

let lines = code.split('\n');
for (let i = 280; i < 310; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
