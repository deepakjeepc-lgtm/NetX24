const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

const badBlock = `              ))}
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col">
            <button 
              onClick={() => setSelectedCourse(null)}`;

const goodBlock = `              ))}
            </div>
          </div>
        ) : !selectedCourse ? (
          <div className="relative z-10 flex flex-col">
            <button 
              onClick={() => setSelectedCourse(null)}`;

// Wait, I actually NEED TO REVERSE the order to make logical sense.
// If the cart is open, show cart.
// Else if !selectedCourse, show courses.
// Else show details.

// So the courses block ends, and then we say `) : (` for the selected course branch.
// My previous script DID EXACTLY THAT, but where did `!selectedCourse ?` go?
// Let's check line 207!
