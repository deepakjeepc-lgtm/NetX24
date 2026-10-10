import fs from 'fs';
let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// Insert the useEffect for scroll reset
const effectStr = `
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeSection]);
`;

content = content.replace('const [isContactModalOpen, setIsContactModalOpen] = useState(false);', `const [isContactModalOpen, setIsContactModalOpen] = useState(false);\n${effectStr}`);

fs.writeFileSync('src/pages/LandingPage.tsx', content);
console.log("Fixed scroll reset!");
