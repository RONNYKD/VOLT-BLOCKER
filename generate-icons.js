const fs = require('fs');
const path = require('path');

// Create a simple SVG VOLT logo
const createVoltLogo = () => {
  const svgContent = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#1E3A8A" rx="150"/>
  <text x="512" y="580" font-family="Arial, sans-serif" font-size="300" font-weight="bold" text-anchor="middle" fill="white">VOLT</text>
  <circle cx="512" cy="350" r="80" fill="#FCD34D"/>
  <path d="M472 310 L552 310 L512 390 Z" fill="#1E3A8A"/>
</svg>
  `.trim();
  
  fs.writeFileSync('volt-icon.svg', svgContent);
  console.log('Created volt-icon.svg');
  return svgContent;
};

// Android icon sizes
const androidSizes = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 }
];

// iOS icon sizes
const iosSizes = [
  { name: 'icon-20.png', size: 20 },
  { name: 'icon-20@2x.png', size: 40 },
  { name: 'icon-20@3x.png', size: 60 },
  { name: 'icon-29.png', size: 29 },
  { name: 'icon-29@2x.png', size: 58 },
  { name: 'icon-29@3x.png', size: 87 },
  { name: 'icon-40.png', size: 40 },
  { name: 'icon-40@2x.png', size: 80 },
  { name: 'icon-40@3x.png', size: 120 },
  { name: 'icon-60@2x.png', size: 120 },
  { name: 'icon-60@3x.png', size: 180 },
  { name: 'icon-76.png', size: 76 },
  { name: 'icon-76@2x.png', size: 152 },
  { name: 'icon-83.5@2x.png', size: 167 },
  { name: 'icon-1024.png', size: 1024 }
];

console.log('Icon generation script ready!');
console.log('Run this after installing sharp: npm install sharp');

module.exports = { createVoltLogo, androidSizes, iosSizes };
