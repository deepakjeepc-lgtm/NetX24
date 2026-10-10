const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// I need to find the `selectedCourse` block and clean up the bottom of it.
// Let's print out lines 395 to 420.
let lines = code.split('\n');
for (let i = 395; i < 415; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
