import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(crcData), 8 + len);
  return chunk;
}

function generateIconPNG(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));
  
  const primaryR = 0x25, primaryG = 0x63, primaryB = 0xEB; // #2563EB
  const accentR = 0x16, accentG = 0xA3, accentB = 0x4A;   // #16A34A (shield)
  const whiteR = 0xFF, whiteG = 0xFF, whiteB = 0xFF;
  
  let rawIdx = 0;
  for (let y = 0; y < height; y++) {
    rawData[rawIdx++] = 0; // Filter type 0: None
    for (let x = 0; x < width; x++) {
      // Coordinates normalized -1 to 1
      const nx = (x / width) * 2 - 1;
      const ny = (y / height) * 2 - 1;
      const r = Math.sqrt(nx * nx + ny * ny);

      // Background rounded rect
      let inCard = false;
      if (isMaskable) {
        inCard = true; // full bleed for maskable
      } else {
        // Rounded squircle
        const p = 4;
        const squircle = Math.pow(Math.abs(nx), p) + Math.pow(Math.abs(ny), p);
        inCard = squircle <= 0.85;
      }

      if (!inCard) {
        // Transparent
        rawData[rawIdx++] = 0;
        rawData[rawIdx++] = 0;
        rawData[rawIdx++] = 0;
        rawData[rawIdx++] = 0;
        continue;
      }

      // Check if inside shopping cart basket or wheels
      // Cart basket: y in [-0.25, 0.25], x in [-0.35, 0.35]
      let isCart = false;
      // Top bar & handle
      if (ny >= -0.35 && ny <= -0.28 && nx >= -0.45 && nx <= 0.35) isCart = true;
      if (nx >= -0.45 && nx <= -0.38 && ny >= -0.35 && ny <= 0.15) isCart = true;
      // Basket
      if (ny >= -0.25 && ny <= 0.15 && nx >= -0.35 && nx <= 0.35) {
        // hollow inside
        const border = 0.07;
        const inside = (ny >= -0.25 + border && ny <= 0.15 - border && nx >= -0.35 + border && nx <= 0.35 - border);
        if (!inside) isCart = true;
      }
      // Wheels
      const w1Dist = Math.hypot(nx - (-0.2), ny - 0.32);
      const w2Dist = Math.hypot(nx - 0.2, ny - 0.32);
      if (w1Dist <= 0.08 || w2Dist <= 0.08) isCart = true;

      // Shield badge in the center
      const shieldDist = Math.hypot(nx, ny - (-0.05));
      let isShield = false;
      if (shieldDist <= 0.18) {
        isShield = true;
      }

      if (isShield) {
        rawData[rawIdx++] = accentR;
        rawData[rawIdx++] = accentG;
        rawData[rawIdx++] = accentB;
        rawData[rawIdx++] = 255;
      } else if (isCart) {
        rawData[rawIdx++] = whiteR;
        rawData[rawIdx++] = whiteG;
        rawData[rawIdx++] = whiteB;
        rawData[rawIdx++] = 255;
      } else {
        // Gradient blue background
        const grad = Math.min(1, Math.max(0, (ny + 1) / 2));
        rawData[rawIdx++] = Math.round(primaryR * (0.85 + grad * 0.25));
        rawData[rawIdx++] = Math.round(primaryG * (0.85 + grad * 0.25));
        rawData[rawIdx++] = Math.round(primaryB * (0.85 + grad * 0.25));
        rawData[rawIdx++] = 255;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idatData = zlib.deflateSync(rawData);

  const pngBuffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    createChunk('IHDR', ihdr),
    createChunk('IDAT', idatData),
    createChunk('IEND', Buffer.alloc(0))
  ]);

  return pngBuffer;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateIconPNG(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateIconPNG(512));
fs.writeFileSync(path.join(publicDir, 'maskable-icon.png'), generateIconPNG(512, true));
console.log('Successfully generated PWA icons in public directory!');
