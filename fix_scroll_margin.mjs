import fs from 'fs';

let content1 = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');
content1 = content1.replace(/id="services" className="w-full/g, 'id="services" className="scroll-mt-32 w-full');
content1 = content1.replace(/id="tools" className="w-full/g, 'id="tools" className="scroll-mt-32 w-full');
content1 = content1.replace(/id="contact" className="w-full/g, 'id="contact" className="scroll-mt-32 w-full');
fs.writeFileSync('src/pages/LandingPage.tsx', content1);

let content2 = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');
content2 = content2.replace(/id="ignou-notes-section" className="w-full/g, 'id="ignou-notes-section" className="scroll-mt-32 w-full');
fs.writeFileSync('src/components/IgnouNotesSection.tsx', content2);

console.log("Fixed scroll margin!");
