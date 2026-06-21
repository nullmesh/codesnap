// Generates one HTML frame per theme+backdrop combo for the demo GIF.
// Same card, same code — only the look changes, which is exactly the pitch.
const hljs = require("highlight.js/lib/common");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const code = fs.readFileSync(path.join(root, "samples", "demo.ts"), "utf8");
const css = fs.readFileSync(path.join(root, "media", "style.css"), "utf8");
const highlighted = hljs.highlight(code, { language: "typescript", ignoreIllegals: true }).value;

const COMBOS = [
  { theme: "midnight", bg: "linear-gradient(135deg,#4f46e5,#9333ea)" },
  { theme: "dracula", bg: "linear-gradient(135deg,#f093fb,#f5576c)" },
  { theme: "tokyo", bg: "linear-gradient(135deg,#2e3192,#1bffff)" },
  { theme: "synthwave", bg: "linear-gradient(135deg,#ff6e7f,#bfe9ff)" },
  { theme: "nord", bg: "linear-gradient(135deg,#134e5e,#71b280)" },
  { theme: "github-dark", bg: "linear-gradient(135deg,#232526,#414345)" },
  { theme: "aurora", bg: "linear-gradient(135deg,#ffecd2,#fcb69f)" },
];

const injected = `code{background:rgba(255,255,255,0.1);padding:.2em .4em;border-radius:4px}`;

function frame(theme, bg) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${injected}</style>
<style>${css}
html,body{margin:0;height:100%}
body{display:flex;align-items:center;justify-content:center;background:#13141b}
.stage{padding:0}</style></head><body>
<div class="stage"><div class="frame" style="background:${bg};padding:56px">
  <div class="window theme-${theme}">
    <div class="titlebar"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="filename">demo.ts</span></div>
    <pre class="code"><code>${highlighted}</code></pre>
  </div>
</div></div>
</body></html>`;
}

const out = path.join(root, "test", "frames");
fs.mkdirSync(out, { recursive: true });
COMBOS.forEach((c, i) => {
  const f = path.join(out, `frame-${String(i).padStart(2, "0")}.html`);
  fs.writeFileSync(f, frame(c.theme, c.bg));
});
console.log(`wrote ${COMBOS.length} frames to ${out}`);
