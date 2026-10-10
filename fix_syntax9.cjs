const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

// The file currently has:
// 287:               ))}
// 288:             </div>
// 289:             )}
// 290:           </div>
// 291:         ) : !selectedCourse ? (
// 292:           <div 
// 293:              
// 294:              
// 295:             className="relative z-10 flex flex-col"
// 296:           >
// 297:             <button 

// I will just use string replace for this specific block:
const badBlock = `              ))}
            </div>
            )}
          </div>
        ) : !selectedCourse ? (
          <div 
             
             
            className="relative z-10 flex flex-col"
          >
            <button 
              onClick={() => setSelectedCourse(null)}`;

const goodBlock = `              ))}
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col">
            <button 
              onClick={() => setSelectedCourse(null)}`;

code = code.replace(badBlock, goodBlock);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done");
