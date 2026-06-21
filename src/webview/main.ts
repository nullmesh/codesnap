import hljs from "highlight.js/lib/common";
import { toPng, toBlob } from "html-to-image";

// ---- VS Code webview bridge -------------------------------------------------
declare function acquireVsCodeApi(): { postMessage(msg: unknown): void };
const vscode = acquireVsCodeApi();

// ---- Catalogs (everything free) ---------------------------------------------
// Theme = window background + syntax token colors.
interface Theme { id: string; name: string; }
const THEMES: Theme[] = [
  { id: "midnight", name: "Midnight" },
  { id: "github-dark", name: "GitHub Dark" },
  { id: "dracula", name: "Dracula" },
  { id: "tokyo", name: "Tokyo Night" },
  { id: "nord", name: "Nord" },
  { id: "synthwave", name: "Synthwave" },
  { id: "aurora", name: "Aurora" },
  { id: "ember", name: "Ember" },
  { id: "paper", name: "Paper" },
];

// Backdrop = the area behind the window (independent of theme).
interface Backdrop { id: string; name: string; css: string; }
const BACKDROPS: Backdrop[] = [
  { id: "indigo", name: "Indigo", css: "linear-gradient(135deg,#4f46e5,#9333ea)" },
  { id: "sunset", name: "Sunset", css: "linear-gradient(135deg,#ff6e7f,#bfe9ff)" },
  { id: "aurora", name: "Aurora", css: "linear-gradient(135deg,#00c9ff,#92fe9d)" },
  { id: "ocean", name: "Ocean", css: "linear-gradient(135deg,#2e3192,#1bffff)" },
  { id: "peach", name: "Peach", css: "linear-gradient(135deg,#ffecd2,#fcb69f)" },
  { id: "flamingo", name: "Flamingo", css: "linear-gradient(135deg,#f093fb,#f5576c)" },
  { id: "forest", name: "Forest", css: "linear-gradient(135deg,#134e5e,#71b280)" },
  { id: "graphite", name: "Graphite", css: "linear-gradient(135deg,#232526,#414345)" },
  { id: "none", name: "Transparent", css: "transparent" },
];

interface Font { id: string; name: string; css: string; }
const FONTS: Font[] = [
  { id: "jetbrains", name: "JetBrains Mono", css: "'JetBrains Mono', ui-monospace, monospace" },
  { id: "fira", name: "Fira Code", css: "'Fira Code', ui-monospace, monospace" },
  { id: "sfmono", name: "SF Mono", css: "'SF Mono', ui-monospace, monospace" },
  { id: "cascadia", name: "Cascadia Code", css: "'Cascadia Code', ui-monospace, monospace" },
  { id: "menlo", name: "Menlo", css: "Menlo, ui-monospace, monospace" },
];

const PADDINGS = [32, 64, 96, 128];
const SIZES = [12, 13, 14, 16, 18];
const SCALES = [1, 2, 3, 4];

// ---- State ------------------------------------------------------------------
const state = {
  code: "",
  language: "plaintext",
  fileName: "snippet",
  themeId: "midnight",
  backdropId: "indigo",
  fontId: "jetbrains",
  fontSize: 14,
  padding: 64,
  showChrome: true,
  showLineNumbers: false,
  scale: 2,
};

// ---- DOM build --------------------------------------------------------------
const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="toolbar">
    <div class="group"><label>Theme</label><select id="theme"></select></div>
    <div class="group"><label>Backdrop</label><select id="backdrop"></select></div>
    <div class="group"><label>Font</label><select id="font"></select></div>
    <div class="group"><label>Size</label><select id="size"></select></div>
    <div class="group"><label>Pad</label><select id="padding"></select></div>
    <div class="group toggle">
      <label><input type="checkbox" id="chrome" checked /> Window</label>
      <label><input type="checkbox" id="lineNumbers" /> Line #</label>
    </div>
    <div class="group"><label>Scale</label><select id="scale"></select></div>
    <div class="spacer"></div>
    <button id="surprise" class="btn" title="Randomize theme + backdrop">🎲 Surprise</button>
    <button id="copy" class="btn">Copy</button>
    <button id="save" class="btn primary">Save PNG</button>
  </div>
  <div class="stage" id="stage">
    <div class="frame" id="frame">
      <div class="window" id="window">
        <div class="titlebar" id="titlebar">
          <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
          <span class="filename" id="fileLabel"></span>
        </div>
        <pre class="code"><code id="code"></code></pre>
      </div>
    </div>
  </div>
  <div class="hint">Tip: tweak the look, then <b>Copy</b> straight into a tweet or <b>Save PNG</b>. Try <b>Transparent</b> backdrop for a clean cut-out.</div>
  <div class="toast" id="toast"></div>
`;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const themeSel = $<HTMLSelectElement>("theme");
const backdropSel = $<HTMLSelectElement>("backdrop");
const fontSel = $<HTMLSelectElement>("font");
const sizeSel = $<HTMLSelectElement>("size");
const paddingSel = $<HTMLSelectElement>("padding");
const scaleSel = $<HTMLSelectElement>("scale");
const chromeChk = $<HTMLInputElement>("chrome");
const lineNumChk = $<HTMLInputElement>("lineNumbers");
const stage = $<HTMLDivElement>("stage");
const frame = $<HTMLDivElement>("frame");
const windowEl = $<HTMLDivElement>("window");
const titlebar = $<HTMLDivElement>("titlebar");
const preEl = $<HTMLPreElement>("code").parentElement as HTMLPreElement;
const codeEl = $<HTMLElement>("code");
const fileLabel = $<HTMLSpanElement>("fileLabel");
const toast = $<HTMLDivElement>("toast");

// ---- Populate controls ------------------------------------------------------
function fill(sel: HTMLSelectElement, items: { value: string; label: string }[], current: string) {
  sel.innerHTML = "";
  for (const it of items) {
    const opt = document.createElement("option");
    opt.value = it.value;
    opt.textContent = it.label;
    sel.appendChild(opt);
  }
  sel.value = current;
}
fill(themeSel, THEMES.map((t) => ({ value: t.id, label: t.name })), state.themeId);
fill(backdropSel, BACKDROPS.map((b) => ({ value: b.id, label: b.name })), state.backdropId);
fill(fontSel, FONTS.map((f) => ({ value: f.id, label: f.name })), state.fontId);
fill(sizeSel, SIZES.map((s) => ({ value: String(s), label: `${s}px` })), String(state.fontSize));
fill(paddingSel, PADDINGS.map((p) => ({ value: String(p), label: `${p}px` })), String(state.padding));
fill(scaleSel, SCALES.map((s) => ({ value: String(s), label: `${s}x` })), String(state.scale));

// ---- Rendering --------------------------------------------------------------
function render() {
  const backdrop = BACKDROPS.find((b) => b.id === state.backdropId) ?? BACKDROPS[0];
  const font = FONTS.find((f) => f.id === state.fontId) ?? FONTS[0];

  frame.style.background = backdrop.css;
  frame.style.padding = `${state.padding}px`;
  stage.classList.toggle("checker", backdrop.id === "none");

  windowEl.className = `window theme-${state.themeId}`;
  titlebar.style.display = state.showChrome ? "flex" : "none";
  fileLabel.textContent = state.fileName;

  preEl.style.fontFamily = font.css;
  preEl.style.fontSize = `${state.fontSize}px`;

  let highlighted: string;
  try {
    highlighted = hljs.highlight(state.code, {
      language: hljs.getLanguage(state.language) ? state.language : "plaintext",
      ignoreIllegals: true,
    }).value;
  } catch {
    highlighted = escapeHtml(state.code);
  }

  if (state.showLineNumbers) {
    const lines = highlighted.split("\n");
    codeEl.innerHTML = lines
      .map((l, i) => `<span class="ln" data-ln="${i + 1}">${l || " "}</span>`)
      .join("\n");
    codeEl.classList.add("with-lines");
  } else {
    codeEl.innerHTML = highlighted;
    codeEl.classList.remove("with-lines");
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

function clearSelection() {
  window.getSelection()?.removeAllRanges();
}

let toastTimer: number | undefined;
function showToast(msg: string) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1600);
}

function bounce() {
  windowEl.classList.remove("pop");
  void windowEl.offsetWidth; // reflow to restart the animation
  windowEl.classList.add("pop");
}

// ---- Controls wiring --------------------------------------------------------
themeSel.addEventListener("change", () => { state.themeId = themeSel.value; render(); });
backdropSel.addEventListener("change", () => { state.backdropId = backdropSel.value; render(); });
fontSel.addEventListener("change", () => { state.fontId = fontSel.value; render(); });
sizeSel.addEventListener("change", () => { state.fontSize = Number(sizeSel.value); render(); });
paddingSel.addEventListener("change", () => { state.padding = Number(paddingSel.value); render(); });
scaleSel.addEventListener("change", () => { state.scale = Number(scaleSel.value); });
chromeChk.addEventListener("change", () => { state.showChrome = chromeChk.checked; render(); });
lineNumChk.addEventListener("change", () => { state.showLineNumbers = lineNumChk.checked; render(); });

$("surprise").addEventListener("click", () => {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  state.themeId = pick(THEMES).id;
  // Avoid landing on Transparent randomly — keep the surprise punchy.
  state.backdropId = pick(BACKDROPS.filter((b) => b.id !== "none")).id;
  state.fontId = pick(FONTS).id;
  themeSel.value = state.themeId;
  backdropSel.value = state.backdropId;
  fontSel.value = state.fontId;
  render();
  bounce();
});

// backgroundColor stays undefined so a Transparent backdrop keeps its alpha;
// for gradient backdrops the .frame already paints the background.
function exportOptions() {
  return { pixelRatio: state.scale, cacheBust: true };
}

$("copy").addEventListener("click", async () => {
  try {
    clearSelection();
    const blob = await toBlob(frame, exportOptions());
    if (!blob) throw new Error("no blob");
    // @ts-ignore — ClipboardItem exists in the webview's Chromium
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    showToast("📋 Copied to clipboard");
  } catch {
    showToast("Couldn't copy here — use Save PNG");
  }
});

$("save").addEventListener("click", async () => {
  try {
    clearSelection();
    const dataUrl = await toPng(frame, exportOptions());
    vscode.postMessage({ type: "savePng", dataUrl });
    showToast("💾 Saving…");
  } catch (e) {
    vscode.postMessage({ type: "info", message: "Export failed: " + String(e) });
  }
});

// ---- Messages from the extension --------------------------------------------
window.addEventListener("message", (event) => {
  const msg = event.data;
  if (msg.type === "load") {
    state.code = msg.code;
    state.language = msg.language;
    state.fileName = msg.fileName;
    render();
    clearSelection();
    bounce();
  }
});

render();
vscode.postMessage({ type: "ready" });
