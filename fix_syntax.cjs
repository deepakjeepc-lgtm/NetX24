const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

const badBlock = `            </div>
          </div>
            )}
        ) : (`;

const goodBlock = `            </div>
            )}
          </div>
        ) : (!selectedCourse ? (`; // Wait, let's look at the original correctly.

code = code.replace(
  /            <\/div>\n          <\/div>\n            \)}\n        \) : \(/,
  '            </div>\n            )}\n          </div>\n        ) : !selectedCourse ? ('
);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
