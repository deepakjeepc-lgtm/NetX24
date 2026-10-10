const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

const target = `            </div>
          </div>
            )}
        ) : (`;

const good = `            </div>
            )}
          </div>
        ) : (`;

code = code.replace(target, good);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
