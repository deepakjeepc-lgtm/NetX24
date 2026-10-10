import fs from 'fs';
let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

if (!content.includes('import FooterIndicator')) {
  content = content.replace("import ComingSoonModal from '../components/ComingSoonModal';", "import ComingSoonModal from '../components/ComingSoonModal';\nimport FooterIndicator from '../components/FooterIndicator';");
}

content = content.replace('{/* Footer */}', '<FooterIndicator />\n      {/* Footer */}');

fs.writeFileSync('src/pages/LandingPage.tsx', content);
console.log("Added FooterIndicator!");
