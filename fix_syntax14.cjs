const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');
let lines = code.split('\n');
let divCount = 0;

for (let i = 207; i <= 290; i++) {
  let line = lines[i];
  if (line.includes('<div') && !line.includes('</div>')) {
    divCount += (line.match(/<div/g) || []).length;
  }
  if (line.includes('</div')) {
    divCount -= (line.match(/<\/div/g) || []).length;
    if (line.includes('<div')) {
      divCount += (line.match(/<div/g) || []).length;
    }
  }
  console.log(`${i+1}: [${divCount}] ${line}`);
}
