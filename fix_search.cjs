const fs = require('fs');
let code = fs.readFileSync('src/components/GlobalSearch.tsx', 'utf8');

code = code.replace(
  "const { data: ignouLevels } = useIgnouData();",
  "const { assignmentsData: ignouLevels } = useIgnouData();"
);

fs.writeFileSync('src/components/GlobalSearch.tsx', code);
console.log("Done Fix Search");
