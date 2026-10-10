import fs from 'fs';
let content = fs.readFileSync('src/components/VoiceNavigation.tsx', 'utf8');

content = content.replace(/showToast\('Voice command recognized: ' \+ transcript, 'success'\);/g, "showToast({ message: 'Voice command recognized: ' + transcript, type: 'success' });");
content = content.replace(/showToast\('Microphone access denied.', 'error'\);/g, "showToast({ message: 'Microphone access denied.', type: 'error' });");
content = content.replace(/showToast\('Voice navigation activated. Say "services", "tools", or "home".', 'info'\);/g, "showToast({ message: 'Voice navigation activated. Say \"services\", \"tools\", or \"home\".', type: 'info' });");

fs.writeFileSync('src/components/VoiceNavigation.tsx', content);
console.log("Fixed showToast calls");
