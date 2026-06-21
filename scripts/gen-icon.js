// Generates media/icon.png (256x256) with no external deps.
// Diagonal gradient + a little window with traffic-light dots — echoes the product.
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const S = 256;
const buf = Buffer.alloc(S * S * 4);

function set(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
}
function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

// background gradient: deep indigo -> magenta -> amber (the "Ember/synthwave" vibe)
const c0 = [15, 12, 41], c1 = [120, 30, 90], c2 = [245, 175, 25];
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    const t = (x + y) / (2 * S);
    let r, g, b;
    if (t < 0.5) { const u = t / 0.5; r = lerp(c0[0], c1[0], u); g = lerp(c0[1], c1[1], u); b = lerp(c0[2], c1[2], u); }
    else { const u = (t - 0.5) / 0.5; r = lerp(c1[0], c2[0], u); g = lerp(c1[1], c2[1], u); b = lerp(c1[2], c2[2], u); }
    set(x, y, r, g, b);
  }
}

// rounded window card
const x0 = 54, y0 = 70, x1 = 202, y1 = 186, rad = 16;
function inRounded(x, y) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + rad), x1 - rad);
  const cy = Math.min(Math.max(y, y0 + rad), y1 - rad);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= rad * rad || (x > x0 + rad && x < x1 - rad) || (y > y0 + rad && y < y1 - rad);
}
for (let y = y0 - 3; y <= y1 + 3; y++) {
  for (let x = x0 - 3; x <= x1 + 3; x++) {
    if (inRounded(x, y)) {
      const titlebar = y < y0 + 26;
      if (titlebar) set(x, y, 30, 25, 46);
      else set(x, y, 18, 16, 30);
    }
  }
}
// traffic lights
function disc(cx, cy, r, col) {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) set(x, y, col[0], col[1], col[2]);
}
disc(x0 + 14, y0 + 13, 5, [255, 95, 86]);
disc(x0 + 30, y0 + 13, 5, [255, 189, 46]);
disc(x0 + 46, y0 + 13, 5, [39, 201, 63]);
// fake code lines
const lines = [[70, 120, [199, 146, 234]], [90, 70, [195, 232, 141]], [70, 100, [130, 170, 255]], [110, 60, [255, 203, 107]]];
let ly = y0 + 44;
for (const [lx, lw, col] of lines) {
  for (let y = ly; y < ly + 8; y++) for (let x = x0 + 16; x < x0 + 16 + (lw); x++) set(x, y, col[0], col[1], col[2], 235);
  ly += 22;
}

// encode PNG
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, data])) >>> 0, 0);
  return Buffer.concat([len, t, data, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
const raw = Buffer.alloc((S * 4 + 1) * S);
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0;
  buf.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
}
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
const out = path.join(__dirname, "..", "media", "icon.png");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log("wrote", out, png.length, "bytes");
