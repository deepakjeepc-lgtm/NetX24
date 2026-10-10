import fs from 'fs';

// 1. Create manifest.json
const manifest = {
  "name": "NetX24 Cyber Cafe",
  "short_name": "NetX24",
  "description": "Cyber cafe services and free online tools",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    {
      "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZmZmZiIvPjx0ZXh0IHk9IjUwIiB4PSI1MCIgZm9udC1zaXplPSI1MCIgZmlsbD0iIzAwMDAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk48L3RleHQ+PC9zdmc+",
      "sizes": "192x192",
      "type": "image/svg+xml"
    },
    {
      "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZmZmZiIvPjx0ZXh0IHk9IjUwIiB4PSI1MCIgZm9udC1zaXplPSI1MCIgZmlsbD0iIzAwMDAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk48L3RleHQ+PC9zdmc+",
      "sizes": "512x512",
      "type": "image/svg+xml"
    }
  ]
};

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}
fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));

// 2. Update index.html
let html = fs.readFileSync('index.html', 'utf8');

// Update viewport
html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />'
);

// Add PWA tags
const pwaTags = `
    <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="mobile-web-app-capable" content="yes">
    <link rel="manifest" href="/manifest.json">
    <title>NetX24</title>`;

html = html.replace('    <title>NetX24</title>', pwaTags);

fs.writeFileSync('index.html', html);
console.log('PWA setup complete');
