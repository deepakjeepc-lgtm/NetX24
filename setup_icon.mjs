import fs from 'fs';

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#ffffff" rx="112" />
  <text x="256" y="290" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="110" text-anchor="middle" letter-spacing="-2">
    <tspan fill="#0f172a">NetX</tspan><tspan fill="#dc2626">24</tspan>
  </text>
</svg>`;

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

fs.writeFileSync('public/icon.svg', svgContent);

if (fs.existsSync('public/manifest.json')) {
    const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
    manifest.icons = [
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml"
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml"
      }
    ];
    fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
}

let html = fs.readFileSync('index.html', 'utf8');
if (!html.includes('apple-touch-icon')) {
    html = html.replace(
        '<link rel="manifest" href="/manifest.json">',
        '<link rel="apple-touch-icon" href="/icon.svg">\n    <link rel="icon" type="image/svg+xml" href="/icon.svg">\n    <link rel="manifest" href="/manifest.json">'
    );
    fs.writeFileSync('index.html', html);
}

console.log("Icon setup complete!");
