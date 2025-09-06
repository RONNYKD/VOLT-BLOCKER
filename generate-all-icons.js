const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const main = async () => {
  const svgFile = 'volt-icon.svg';
  
  if (!fs.existsSync(svgFile)) {
    console.error('volt-icon.svg not found!');
    return;
  }

  console.log('🚀 Generating app icons...');

  // Android sizes
  const androidSizes = [
    { folder: 'mipmap-mdpi', size: 48 },
    { folder: 'mipmap-hdpi', size: 72 },
    { folder: 'mipmap-xhdpi', size: 96 },
    { folder: 'mipmap-xxhdpi', size: 144 },
    { folder: 'mipmap-xxxhdpi', size: 192 }
  ];

  // Generate Android icons
  for (const iconSize of androidSizes) {
    const outputDir = `android/app/src/main/res/${iconSize.folder}`;
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate regular icon
    await sharp(svgFile)
      .resize(iconSize.size, iconSize.size)
      .png()
      .toFile(`${outputDir}/ic_launcher.png`);

    // Generate round icon (same as regular for now)
    await sharp(svgFile)
      .resize(iconSize.size, iconSize.size)
      .png()
      .toFile(`${outputDir}/ic_launcher_round.png`);

    console.log(`✅ Generated Android ${iconSize.folder} (${iconSize.size}x${iconSize.size})`);
  }

  // iOS sizes - generate to a temp directory first
  const iosIconsDir = 'ios-icons-temp';
  if (!fs.existsSync(iosIconsDir)) {
    fs.mkdirSync(iosIconsDir, { recursive: true });
  }

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

  // Generate iOS icons
  for (const iconSize of iosSizes) {
    await sharp(svgFile)
      .resize(iconSize.size, iconSize.size)
      .png()
      .toFile(`${iosIconsDir}/${iconSize.name}`);

    console.log(`✅ Generated iOS ${iconSize.name} (${iconSize.size}x${iconSize.size})`);
  }

  console.log('✨ All icons generated successfully!');
  console.log(`📁 Android icons: Updated in android/app/src/main/res/mipmap-* folders`);
  console.log(`📁 iOS icons: Generated in ${iosIconsDir}/ (copy to iOS project manually)`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Copy iOS icons to ios/VOLT/Images.xcassets/AppIcon.appiconset/');
  console.log('2. Clean build caches');
  console.log('3. Uninstall app from device');
  console.log('4. Rebuild and install app');
};

main().catch(console.error);
