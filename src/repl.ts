import * as vscode from "vscode";

function fileName(filePath: string) {
  const match = filePath.match(".*/[^/]\\.[^/]$");
  if (match) {
    return match[0];
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
  terminal.sendText(`${racket} '${filePath}'`);
}

export function loadFileInRepl(filePath: string, repl: vscode.Terminal) {
  repl.show();
  repl.sendText(`(enter! (file "${filePath}"))`);
}

export function createTerminal(filePath: string) {
  const terminal = vscode.window.createTerminal(`Output (${fileName(filePath)})`);
  terminal.show();
  return terminal;
}

export function createRepl(filePath: string, racket: string) {
  const repl = vscode.window.createTerminal(`REPL (${fileName(filePath)})`);
  repl.show();
  repl.sendText(racket);
  return repl;
}
