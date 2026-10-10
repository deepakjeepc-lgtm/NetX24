const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

code = code.replace(
  "const { assignmentsData, projectsData, loading } = useIgnouData();\n  const ignouData = activeCategory === 'assignment' ? assignmentsData : projectsData;\n  const [activeLevelId, setActiveLevelId] = useState('');\n  const [activeCategory, setActiveCategory] = useState<'assignment' | 'project'>('assignment');",
  "const { assignmentsData, projectsData, loading } = useIgnouData();\n  const [activeCategory, setActiveCategory] = useState<'assignment' | 'project'>('assignment');\n  const ignouData = activeCategory === 'assignment' ? assignmentsData : projectsData;\n  const [activeLevelId, setActiveLevelId] = useState('');"
);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
