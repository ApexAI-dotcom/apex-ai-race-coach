import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');
const svgBuffer = readFileSync(resolve(publicDir, 'favicon.svg'));

// Ensure icons directory exists
mkdirSync(resolve(publicDir, 'icons'), { recursive: true });

const sizes = [
  { name: 'favicon-16x16.png', size: 16, dir: publicDir },
  { name: 'favicon-32x32.png', size: 32, dir: publicDir },
  { name: 'apple-touch-icon.png', size: 180, dir: publicDir },
  { name: 'icon-192x192.png', size: 192, dir: resolve(publicDir, 'icons') },
  { name: 'icon-512x512.png', size: 512, dir: resolve(publicDir, 'icons') },
];

// Generate favicon.ico (multi-size ICO via 48px PNG)
const icoSizes = [16, 32, 48];

async function generateAll() {
  // Generate PNG files
  for (const { name, size, dir } of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(resolve(dir, name));
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  // Generate favicon.ico from 48px PNG (simple single-image ICO)
  // ICO format: header + directory entry + PNG data
  const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();

  const images = [png16, png32, png48];
  const imageSizes = [16, 32, 48];

  // ICO file structure
  const headerSize = 6;
  const dirEntrySize = 16;
  const totalDirSize = headerSize + dirEntrySize * images.length;

  let offset = totalDirSize;
  const dirEntries = [];
  for (let i = 0; i < images.length; i++) {
    const buf = Buffer.alloc(dirEntrySize);
    buf.writeUInt8(imageSizes[i] < 256 ? imageSizes[i] : 0, 0); // width
    buf.writeUInt8(imageSizes[i] < 256 ? imageSizes[i] : 0, 1); // height
    buf.writeUInt8(0, 2); // color palette
    buf.writeUInt8(0, 3); // reserved
    buf.writeUInt16LE(1, 4); // color planes
    buf.writeUInt16LE(32, 6); // bits per pixel
    buf.writeUInt32LE(images[i].length, 8); // image size
    buf.writeUInt32LE(offset, 12); // offset
    dirEntries.push(buf);
    offset += images[i].length;
  }

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(images.length, 4); // number of images

  const ico = Buffer.concat([header, ...dirEntries, ...images]);
  const { writeFileSync } = await import('fs');
  writeFileSync(resolve(publicDir, 'favicon.ico'), ico);
  console.log(`✓ Generated favicon.ico (16+32+48)`);

  console.log('\n✅ All favicons generated successfully!');
}

generateAll().catch(console.error);
