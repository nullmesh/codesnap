// Reproduce the CodeSnap card as a static HTML file so we can screenshot it
// headlessly and SEE what's drawing the band — no editor/webview/selection involved.
const hljs = require("highlight.js/lib/common");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const code = fs.readFileSync(path.join(root, "samples", "demo.ts"), "utf8");
const css = fs.readFileSync(path.join(root, "media", "style.css"), "utf8");
const highlighted = hljs.highlight(code, { language: "typescript", ignoreIllegals: true }).value;

// Simulate VS Code's injected webview default that caused the band:
const injected = `code{background:rgba(255,255,255,0.1);padding:.2em .4em;border-radius:4px}`;
const theme = process.env.THEME || "dracula";
const backdrop = process.env.BACKDROP || "linear-gradient(135deg,#f093fb,#f5576c)";
const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>${injected}</style>
<style>${css}
body{padding:0;background:#15171f}</style></head><body>
<div class="stage"><div class="frame" style="background:${backdrop};padding:64px">
  <div class="window theme-${theme}">
    <div class="titlebar"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="filename">demo.ts</span></div>
    <pre class="code"><code>${highlighted}</code></pre>
  </div>
</div></div>
</body></html>`;

const out = path.join(root, "test");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "card.html"), html);
console.log("wrote", path.join(out, "card.html"));
