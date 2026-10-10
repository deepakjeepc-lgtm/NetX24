const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// I need to add `)}` at the end of the `selectedCourse` block.
// Let's see lines 390-415 to know where to add it.
