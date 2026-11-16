// Génère public/textures/grain.png : bruit monochrome 512×512, déterministe.
// Uniquement des modules Node intégrés (zlib) : aucun paquet à installer.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const W = 512, H = 512;
let seed = 1337;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

// Gris + alpha : grain clair et sombre, centré sur le gris moyen.
const raw = Buffer.alloc((W * 2 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 2 + 1)] = 0;
  for (let x = 0; x < W; x++) {
    const v = Math.round(rand() * 255);
    const o = y * (W * 2 + 1) + 1 + x * 2;
    raw[o] = v;
    raw[o + 1] = 255;
  }
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 4; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
mkdirSync("public/textures", { recursive: true });
writeFileSync("public/textures/grain.png", png);
console.log("grain.png", png.length, "octets");
