import fs from 'fs';
let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// Find the index of "const [isNavVisible, setIsNavVisible] = useState(true);"
// and the index of "useEffect(() => {\n    const fetchStats"
const start = content.indexOf('const [isNavVisible, setIsNavVisible] = useState(true);');
const end = content.indexOf('useEffect(() => {\n    const fetchStats');

if (start !== -1 && end !== -1) {
  content = content.substring(0, start) + content.substring(end);
  fs.writeFileSync('src/pages/LandingPage.tsx', content);
  console.log("Fixed!");
} else {
  console.log("Not found.");
}
