import fs from 'fs';
let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// The activeSection === 'home' should wrap the entire `div id="home"`
content = content.replace(
  /\{\/\* Hero Section \*\/\}/g,
  `{activeSection === 'home' && (\n      <>\n      {/* Hero Section */}`
);

// We need to remove the wrong conditional wrapper
content = content.replace(
  /        \{activeSection === 'home' && \(\n        <>\n        \{\/\* Hero Content \*\/\}/g,
  `        {/* Hero Content */}`
);

fs.writeFileSync('src/pages/LandingPage.tsx', content);
console.log("Fixed structure!");
