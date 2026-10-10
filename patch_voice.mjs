import fs from 'fs';

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// Add import
content = content.replace(
  "import GlobalSearch from '../components/GlobalSearch';",
  "import GlobalSearch from '../components/GlobalSearch';\nimport VoiceNavigation from '../components/VoiceNavigation';"
);

// Add component
content = content.replace(
  "<GlobalSearch />",
  `<VoiceNavigation onCommand={(section) => { setActiveSection(section); if (section === 'ignou-notes-section') setShowIgnouNotes(true); }} />\n               <GlobalSearch />`
);

fs.writeFileSync('src/pages/LandingPage.tsx', content);
console.log("Patched voice nav");
