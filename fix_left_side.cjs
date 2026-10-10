const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPage.tsx', 'utf8');

// Replace the Ready to get started heading
code = code.replace(
  /className="text-\[3rem\] md:text-\[4rem\] font-display font-extrabold text-white leading-\[1\.1\] tracking-tight mb-8"/g,
  'className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.1] tracking-tight mb-6"'
);

// Replace paragraph
code = code.replace(
  /className="text-lg text-slate-400 font-medium leading-relaxed mb-16 max-w-md"/g,
  'className="text-base md:text-lg text-slate-400 font-medium leading-relaxed mb-10 max-w-md"'
);

// Replace space-y-8 mt-auto
code = code.replace(
  /className="space-y-8 mt-auto"/g,
  'className="flex flex-col gap-6"'
);

// Replace w-14 h-14 with w-12 h-12
code = code.replace(/w-14 h-14/g, 'w-12 h-12');

// Replace text-lg for values with text-base
code = code.replace(/text-lg text-slate-200/g, 'text-base text-slate-200');
code = code.replace(/text-lg text-white/g, 'text-base text-white');

fs.writeFileSync('src/pages/LandingPage.tsx', code);
console.log("Done");
