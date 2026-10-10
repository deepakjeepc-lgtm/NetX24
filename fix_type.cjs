const fs = require('fs');
let code = fs.readFileSync('src/components/admin/IgnouEditor.tsx', 'utf8');

code = code.replace(
  "await updateData(activeCategory, data);",
  "await updateData(activeCategory === 'assignment' ? 'assignments' : 'projects', data);"
);

fs.writeFileSync('src/components/admin/IgnouEditor.tsx', code);
console.log("Done Fix Type");
