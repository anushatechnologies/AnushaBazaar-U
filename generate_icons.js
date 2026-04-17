const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_PATH = path.join(__dirname, 'assets', 'icon.png');

const SIZES = {
  'mipmap-mdpi': { launcher: 48, foreground: 108 },
  'mipmap-hdpi': { launcher: 72, foreground: 162 },
  'mipmap-xhdpi': { launcher: 96, foreground: 216 },
  'mipmap-xxhdpi': { launcher: 144, foreground: 324 },
  'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
};

async function generateIcons() {
  if (!fs.existsSync(ICON_PATH)) {
    console.error('Icon not found:', ICON_PATH);
    return;
  }

  for (const [folder, sizes] of Object.entries(SIZES)) {
    const dir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // ic_launcher.webp
    await sharp(ICON_PATH)
      .resize(sizes.launcher, sizes.launcher)
      .webp({ quality: 100 })
      .toFile(path.join(dir, 'ic_launcher.webp'));
      
    // ic_launcher_round.webp
    // (create a rounded circle version mask)
    const circleSvg = Buffer.from(
      `<svg width="${sizes.launcher}" height="${sizes.launcher}"><circle cx="${sizes.launcher/2}" cy="${sizes.launcher/2}" r="${sizes.launcher/2}"/></svg>`
    );
    await sharp(ICON_PATH)
      .resize(sizes.launcher, sizes.launcher)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .webp({ quality: 100 })
      .toFile(path.join(dir, 'ic_launcher_round.webp'));

    // ic_launcher_foreground.webp
    // Add some padding to make it fit within adaptive icon bounds
    await sharp(ICON_PATH)
      .resize(Math.floor(sizes.foreground * 0.65), Math.floor(sizes.foreground * 0.65), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: Math.floor(sizes.foreground * 0.175),
        bottom: Math.floor(sizes.foreground * 0.175),
        left: Math.floor(sizes.foreground * 0.175),
        right: Math.floor(sizes.foreground * 0.175),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .resize(sizes.foreground, sizes.foreground)
      .webp({ quality: 100 })
      .toFile(path.join(dir, 'ic_launcher_foreground.webp'));

    console.log('Generated icons for', folder);
  }
}

generateIcons().catch(console.error);
