# CodeSnap

Turn any code selection into a **beautiful, shareable image** — without leaving your editor. Free and open source.

![CodeSnap](media/demo.gif)

## Why
Developers post code screenshots constantly (X, LinkedIn, blogs, docs). Today they
copy/paste into a separate website like Carbon or ray.so. CodeSnap does it
**inline**: select code → get a gorgeous image → copy or save in two clicks.

## Features
- 🎨 9 hand-tuned themes — Midnight, GitHub Dark, Dracula, Tokyo Night, Nord, Synthwave, Aurora, Ember, Paper
- 🌈 Separate **backdrop** picker (gradients) + **Transparent** for clean PNG cut-outs
- 🔤 Font + size controls, adjustable padding, optional line numbers
- 🪟 macOS-style window chrome (toggle on/off)
- 🎲 **Surprise** button to randomize the look
- 📋 One-click **copy to clipboard** (paste straight into a tweet)
- 💾 **Save PNG** up to 4x for crisp retina output
- 🔒 100% local — your code never leaves your machine. No account, no telemetry.

## Use
Select code → right-click → **CodeSnap: Capture Selection as Image** (or `Cmd/Ctrl+Alt+S`).

## Develop
```bash
npm install
npm run compile     # or: npm run watch
# then press F5 in VS Code / Cursor → "Run Extension"
```

## Publish to both stores (2x reach)
- **VS Code Marketplace** via `vsce publish`
- **Open VSX** via `ovsx publish` — this is where **Cursor** installs from.

## License
MIT.
