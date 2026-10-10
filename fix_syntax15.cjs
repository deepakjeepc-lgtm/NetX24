const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

const badBlock = `              ))}
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col">
            <button `;

const goodBlock = `              ))}
            </div>
            )}
          </div>
        ) : (
          <div className="relative z-10 flex flex-col">
            <button `;

code = code.replace(badBlock, goodBlock);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
