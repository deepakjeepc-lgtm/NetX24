const fs = require('fs');
let code = fs.readFileSync('src/components/IgnouNotesSection.tsx', 'utf8');

code = code.replace(
  `  if (loading || !ignouData || ignouData.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-32 min-h-[600px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }`,
  `  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-32 min-h-[600px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!ignouData || ignouData.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-32 min-h-[600px] flex items-center justify-center">
        <p className="text-slate-500">No {activeCategory} data found. Please add data from the admin panel.</p>
      </div>
    );
  }`
);

fs.writeFileSync('src/components/IgnouNotesSection.tsx', code);
console.log("Done Loading Fix");
