import * as vscode from "vscode";

function fileName(filePath: string) {
  const match = filePath.match(/^.*\/([^/]+\.[^/]+)$/);
  if (match) {
    return match[1];
  }
  vscode.window.showErrorMessage("Invalid file name.");
  return "";
}

export function executeSelectionInRepl(repl: vscode.Terminal, editor: vscode.TextEditor) {
  editor.selections.forEach((sel) => {
    const trimmed = editor.document.getText(sel).trim();
    if (trimmed) {
      repl.show();
      repl.sendText(trimmed);
    }
  });
}

export function runFileInTerminal(racket: string, filePath: string, terminal: vscode.Terminal) {
  terminal.show();
  const shell: string | undefined = vscode.workspace
    .getConfiguration("terminal.integrated.shell")
    .get("windows");
  if (process.platform === "win32" && shell && /cmd\.exe$/.test(shell)) {
    // cmd.exe doesn't recognize single quotes
    terminal.sendText(`${racket} "${filePath}"`);
  } else {
    terminal.sendText(`${racket} '${filePath}'`);
  }
}

export function loadFileInRepl(filePath: string, repl: vscode.Terminal) {
  repl.show();
  repl.sendText(`(enter! (file "${filePath}"))`);
}

export function createTerminal(filePath: string | null) {
  let terminal;
  if (filePath) {
    const templateSetting: string | undefined = vscode.workspace
      .getConfiguration("magic-racket.outputTerminal")
      .get("outputTerminalTitle");
    const template = templateSetting && templateSetting !== "" ? templateSetting : "Output ($name)";
    terminal = vscode.window.createTerminal(template.replace("$name", fileName(filePath)));
  } else {
    const templateSetting: string | undefined = vscode.workspace
      .getConfiguration("magic-racket.outputTerminal")
      .get("sharedOutputTerminalTitle");
    const template = templateSetting && templateSetting !== "" ? templateSetting : "Racket Output";
    terminal = vscode.window.createTerminal(template);
  }
  terminal.show();
  return terminal;
}

export function createRepl(filePath: string, racket: string) {
  const templateSetting: string | undefined = vscode.workspace
    .getConfiguration("magic-racket.repl")
    .get("replTitle");
  const template = templateSetting && templateSetting !== "" ? templateSetting : "REPL ($name)";
  const repl = vscode.window.createTerminal(template.replace("$name", fileName(filePath)));
  repl.show();
  repl.sendText(racket);
  return repl;
}
