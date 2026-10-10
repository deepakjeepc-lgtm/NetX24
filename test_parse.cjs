const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// Using babel to parse the file would reveal the exact syntax error. Let's just fix it by downloading the original from the file history if possible or finding the extra brackets.
