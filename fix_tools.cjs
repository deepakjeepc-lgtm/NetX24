const fs = require('fs');
let code = fs.readFileSync('src/components/ToolsDashboard.tsx', 'utf8');

// Add import
if (!code.includes('import ImageUpscaler')) {
    code = code.replace(
        "import ImageResizeCompress from '../tools/ImageResizeCompress';",
        "import ImageResizeCompress from '../tools/ImageResizeCompress';\nimport ImageUpscaler from '../tools/ImageUpscaler';"
    );
}

// Add ArrowUpRight icon to lucide-react imports if missing
if (!code.includes('ArrowUpRight')) {
    code = code.replace(
        'ArrowRight,',
        'ArrowRight,\n  ArrowUpRight,'
    );
} else if (code.includes('LucideIcons.ArrowUpRight')) {
    // maybe we can just use ArrowUpRight
}

// Add to tools array
const newTool = `    { 
      id: 'img-upscale', 
      title: 'Increase Image Size', 
      desc: 'Upscale image resolution and file size (KB/MB).',
      icon: LucideIcons.ArrowUpRight,
      color: 'text-orange-500 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-500/10',
      hoverColor: 'group-hover:bg-orange-500',
    },
`;

if (!code.includes("id: 'img-upscale'")) {
    code = code.replace(
        "const tools = [",
        "const tools = [\n" + newTool
    );
}

// Add to render map
const renderMap = "{activeTool === 'img-upscale' && <ImageUpscaler onComplete={handleToolUsed} />}";
if (!code.includes(renderMap)) {
    code = code.replace(
        "{activeTool === 'img-compress' && <ImageCompressor onComplete={handleToolUsed} />}",
        "{activeTool === 'img-compress' && <ImageCompressor onComplete={handleToolUsed} />}\n            " + renderMap
    );
}

fs.writeFileSync('src/components/ToolsDashboard.tsx', code);
console.log("Done");
