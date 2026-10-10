import fs from 'fs';
let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// Replace overflow-hidden on main wrappers with overflow-x-hidden
content = content.replace(/className="relative w-full min-h-screen flex flex-col overflow-hidden"/g, 'className="relative w-full min-h-screen flex flex-col overflow-x-hidden"');
content = content.replace(/className="overflow-hidden"/g, 'className="overflow-x-hidden"');

fs.writeFileSync('src/pages/LandingPage.tsx', content);
console.log("Fixed overflow!");
