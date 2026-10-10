const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// I introduced a syntax error when trying to fix my earlier conditional logic script.
// Let's just fix the mismatched brackets in the main `!selectedCourse` branch.
// Let's count the ternary operators.
// The main rendering is:
// {isCartOpen ? (...) : !selectedCourse ? (...) : (...)}
// I probably messed up the `!selectedCourse ?` branch.
// Let's dump the file with line numbers to see where it is exactly.
let lines = code.split('\n');
for (let i = 270; i < 300; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
