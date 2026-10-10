import fs from 'fs';
let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// Fix the duplicate className in ignou-notes-section
content = content.replace(
  /        \{activeSection === 'ignou-notes-section' && showIgnouNotes && \(\n          <div className="pt-24"\n            \n            \n            \n            \n            className="overflow-hidden"\n          >/g,
  `        {activeSection === 'ignou-notes-section' && showIgnouNotes && (\n          <div className="pt-32 pb-24 min-h-screen overflow-hidden">`
);

// If the regex didn't match (because of formatting), try a looser match
content = content.replace(
  /<div className="pt-24"\s+className="overflow-hidden"\s*>/g,
  `<div className="pt-32 pb-24 min-h-screen overflow-hidden">`
);

fs.writeFileSync('src/pages/LandingPage.tsx', content);
console.log("Fixed!");
