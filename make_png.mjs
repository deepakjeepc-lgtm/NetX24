import sharp from 'sharp';
import fs from 'fs';

const svg = fs.readFileSync('public/icon.svg');

await sharp(svg)
  .resize(192, 192)
  .png()
  .toFile('public/icon-192.png');

await sharp(svg)
  .resize(512, 512)
  .png()
  .toFile('public/icon-512.png');

await sharp(svg)
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png');

// Update manifest
const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
manifest.icons = [
  {
    "src": "/icon-192.png",
    "sizes": "192x192",
    "type": "image/png"
  },
  {
    "src": "/icon-512.png",
    "sizes": "512x512",
    "type": "image/png"
  },
  {
    "src": "/icon.svg",
    "sizes": "512x512",
    "type": "image/svg+xml"
  }
];
fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));

// Update index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('<link rel="apple-touch-icon" href="/icon.svg">', '<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
fs.writeFileSync('index.html', html);

console.log("PNG icons created!");
