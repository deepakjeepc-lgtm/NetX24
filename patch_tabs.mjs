import fs from 'fs';

let content = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// Remove auto-hide useEffect
content = content.replace(/  useEffect\(\(\) => \{\n    let timeoutId: NodeJS\.Timeout;\n    const handleInteraction = \(\) => \{\n      setIsNavVisible\(true\);\n      clearTimeout\(timeoutId\);\n      timeoutId = setTimeout\(\(\) => \{\n        if \(window\.scrollY > 100\) \{\n          setIsNavVisible\(false\);\n        \}\n      \}, 3000\);\n    \};\n\n    window\.addEventListener\('scroll', handleInteraction\);\n    window\.addEventListener\('touchmove', handleInteraction\);\n    window\.addEventListener\('mousemove', handleInteraction\);\n\n    return \(\) => \{\n      window\.removeEventListener\('scroll', handleInteraction\);\n      window\.removeEventListener\('touchmove', handleInteraction\);\n      window\.removeEventListener\('mousemove', handleInteraction\);\n      clearTimeout\(timeoutId\);\n    \};\n  \}, \[\]\);\n/g, '');

// Remove IntersectionObserver useEffect
content = content.replace(/  useEffect\(\(\) => \{\n    const observer = new IntersectionObserver\(\(entries\) => \{\n      entries\.forEach\(entry => \{\n        if \(entry\.isIntersecting\) \{\n          setActiveSection\(entry\.target\.id || 'home'\);\n        \}\n      \}\);\n    \}, \{ threshold: 0\.2, rootMargin: "-100px 0px -100px 0px" \}\);\n    const sections = document\.querySelectorAll\('div\[id\]'\);\n    sections\.forEach\(section => observer\.observe\(section\)\);\n    return \(\) => \{\n      sections\.forEach\(section => observer\.unobserve\(section\)\);\n    \};\n  \}, \[\]\);\n/g, '');

// Update Navigation Links
// Services
content = content.replace(
  /<a href="#services" className=\{`px-5 py-1\.5 rounded-full text-\[14px\] font-semibold transition-all duration-300 \$\{activeSection === 'services' \? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-900\/5 dark:hover:bg-white\/5'\} `\}>Services<\/a>/g,
  `<button onClick={() => setActiveSection('services')} className={\`px-5 py-1.5 rounded-full text-[14px] font-semibold transition-all duration-300 \${activeSection === 'services' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5'}\`}>Services</button>`
);

// IGNOU (this one has a complex onClick)
content = content.replace(
  /<a\s+href="#ignou-notes-section"\s+onClick=\{\(e\) => \{\s+e\.preventDefault\(\);\s+setShowIgnouNotes\(true\);\s+setTimeout\(\(\) => \{\s+document\.getElementById\('ignou-notes-section'\)\?\.scrollIntoView\(\{ behavior: 'smooth' \}\);\s+\}, 100\);\s+\}\}\s+className=\{`px-5 py-1\.5 rounded-full text-\[14px\] font-semibold transition-all duration-300 \$\{activeSection === 'ignou-notes-section' \? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-900\/5 dark:hover:bg-white\/5'\}`\}\s*>\s*IGNOU\s*<\/a>/g,
  `<button onClick={() => { setActiveSection('ignou-notes-section'); setShowIgnouNotes(true); }} className={\`px-5 py-1.5 rounded-full text-[14px] font-semibold transition-all duration-300 \${activeSection === 'ignou-notes-section' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5'}\`}>IGNOU</button>`
);

// Tools
content = content.replace(
  /<a href="#tools" className=\{`px-5 py-1\.5 rounded-full text-\[14px\] font-semibold transition-all duration-300 \$\{activeSection === 'tools' \? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-900\/5 dark:hover:bg-white\/5'\}`\}>Tools<\/a>/g,
  `<button onClick={() => setActiveSection('tools')} className={\`px-5 py-1.5 rounded-full text-[14px] font-semibold transition-all duration-300 \${activeSection === 'tools' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5'}\`}>Tools</button>`
);

// Also change the Logo NetX24 to switch to home
content = content.replace(
  /<span className="font-display font-bold text-2xl md:text-xl text-\[#1C1D20\] dark:text-white tracking-tight">NetX<span className="text-transparent bg-clip-text bg-gradient-to-br from-red-800 to-red-500">24<\/span><\/span>/g,
  `<button onClick={() => setActiveSection('home')} className="font-display font-bold text-2xl md:text-xl text-[#1C1D20] dark:text-white tracking-tight cursor-pointer">NetX<span className="text-transparent bg-clip-text bg-gradient-to-br from-red-800 to-red-500">24</span></button>`
);


// Now wrap the sections
// Let's replace the sections with conditional rendering
// 1. Hero Content
content = content.replace(
  /\{\/\* Hero Content \*\/\}/g,
  `{activeSection === 'home' && (\n        <>\n        {/* Hero Content */}`
);

// We need to close the home section just before Services Section
content = content.replace(
  /\{\/\* Services Section \*\/\}/g,
  `        </>\n      )}\n\n      {activeSection === 'services' && (\n        <div className="pt-24">\n        {/* Services Section */}`
);

// Close services before IGNOU Notes Section
content = content.replace(
  /      <AnimatePresence>\n        \{showIgnouNotes && \(\n          <div/g,
  `        </div>\n      )}\n\n      <AnimatePresence>\n        {activeSection === 'ignou-notes-section' && showIgnouNotes && (\n          <div className="pt-24"`
);

// Close IGNOU before Tools Section
content = content.replace(
  /      \{\/\* Tools Section \*\/\}/g,
  `      {activeSection === 'tools' && (\n        <div className="pt-24">\n        {/* Tools Section */}`
);

// Close tools before Contact Section
content = content.replace(
  /      \{\/\* Contact Section \*\/\}/g,
  `        </div>\n      )}\n\n      {activeSection === 'home' && (\n        <>\n      {/* Contact Section */}`
);

// And Contact Section ends before Footer
content = content.replace(
  /      \{\/\* Footer \*\/\}/g,
  `        </>\n      )}\n\n      {/* Footer */}`
);

// The get started button in home should switch to services
content = content.replace(
  /<div className="relative w-full max-w-lg group cursor-pointer" onClick=\{\(\) => document\.getElementById\('services'\)\?\.scrollIntoView\(\{ behavior: 'smooth' \}\)\}>/g,
  `<div className="relative w-full max-w-lg group cursor-pointer" onClick={() => setActiveSection('services')}>`
);

// Remove pointer-events-none from floating nav and use isNavVisible correctly
content = content.replace(
  /className=\{`fixed top-4 md:top-6 left-0 w-full z-\[100\] px-4 pointer-events-none transition-all duration-500 ease-in-out transform \$\{isNavVisible \? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0'\}`\}/g,
  `className={\`fixed top-4 md:top-6 left-0 w-full z-[100] px-4 transition-all duration-500 ease-in-out transform\`}`
);


fs.writeFileSync('src/pages/LandingPage.tsx', content);
console.log("Success");
