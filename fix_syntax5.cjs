const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// I will look around line 413
let lines = code.split('\n');
console.log(lines.slice(400, 420).join('\n'));
