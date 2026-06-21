import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("codesnap.capture", () => capture(context))
  );
}

export function deactivate() {}

async function capture(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("Open a file and select some code first.");
    return;
  }

  const selection = editor.selection;
  const text = selection.isEmpty
    ? editor.document.getText()
    : editor.document.getText(selection);

  if (!text.trim()) {
    vscode.window.showWarningMessage("Nothing to capture — select some code.");
    return;
  }

  const fileName = editor.document.fileName.split(/[\\/]/).pop() ?? "snippet";
  const language = editor.document.languageId;

  const panel = vscode.window.createWebviewPanel(
    "codesnap.preview",
    "CodeSnap Studio",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, "out"),
        vscode.Uri.joinPath(context.extensionUri, "media"),
      ],
    }
  );

  panel.webview.html = getHtml(panel.webview, context.extensionUri);

  panel.webview.onDidReceiveMessage(async (msg) => {
    switch (msg?.type) {
      case "ready":
        panel.webview.postMessage({ type: "load", code: text, language, fileName });
        break;
      case "savePng":
        await savePng(msg.dataUrl, fileName);
        break;
      case "info":
        vscode.window.showInformationMessage(msg.message);
        break;
    }
  });
}

async function savePng(dataUrl: string, baseName: string) {
  const b64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const bytes = Buffer.from(b64, "base64");
  const defaultName = baseName.replace(/\.[^.]+$/, "") + ".png";

  const target = await vscode.window.showSaveDialog({
    saveLabel: "Save CodeSnap",
    filters: { Images: ["png"] },
    defaultUri: vscode.Uri.file(defaultName),
  });
  if (!target) {
    return;
  }
  await vscode.workspace.fs.writeFile(target, bytes);
  const open = await vscode.window.showInformationMessage(
    `Saved ${target.path.split("/").pop()}`,
    "Reveal"
  );
  if (open === "Reveal") {
    vscode.commands.executeCommand("revealFileInOS", target);
  }
}

function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  // Cache-bust: VS Code caches webview resources globally by URL, so a per-open
  // version guarantees the latest build is loaded.
  const v = `v=${Date.now()}`;
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "out", "webview.js").with({ query: v })
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "style.css").with({ query: v })
  );
  const nonce = getNonce();

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data: blob:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${styleUri}" rel="stylesheet" />
  <style nonce="${nonce}">
    /* VS Code injects a default code { background } into webviews — kill it here,
       inlined so it always wins regardless of resource caching. */
    pre.code code { background: transparent !important; padding: 0 !important; }
  </style>
  <title>CodeSnap Studio</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

function getNonce(): string {
  let text = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
