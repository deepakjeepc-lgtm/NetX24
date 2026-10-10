const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

code = code.replace(
  "const { data: ignouData, loading } = useIgnouData();",
  "const { assignmentsData, projectsData, loading } = useIgnouData();\n  const ignouData = activeCategory === 'assignment' ? assignmentsData : projectsData;"
);

code = code.replace(
  "React.useEffect(() => {\n    if (ignouData.length > 0 && !activeLevelId) {\n      setActiveLevelId(ignouData[0].id);\n    }\n  }, [ignouData, activeLevelId]);",
  "React.useEffect(() => {\n    if (ignouData && ignouData.length > 0 && !activeLevelId) {\n      setActiveLevelId(ignouData[0].id);\n    }\n  }, [ignouData, activeLevelId]);\n\n  React.useEffect(() => {\n    if (ignouData && ignouData.length > 0) {\n      setActiveLevelId(ignouData[0].id);\n      setSelectedCourse(null);\n    }\n  }, [activeCategory]);"
);

// We need to check if there are other occurrences. Wait, if `ignouData` is derived, that should be mostly it. But let's verify.
fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done Notes Section");
