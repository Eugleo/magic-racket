import { quote } from "shell-quote";
import * as vscode from "vscode";

function fileName(filePath: string) {
  const match = filePath.match(/^.*\/([^/]+\.[^/]+)$/);
  if (match) {
    return match[1];
  }
  vscode.window.showErrorMessage("Invalid file name.");
  return "";
}

export function executeSelectionInRepl(repl: vscode.Terminal, editor: vscode.TextEditor): void {
  editor.selections.forEach((sel) => {
    const trimmed = editor.document.getText(sel).trim();
    if (trimmed) {
      repl.show();
      repl.sendText(trimmed);
    }
  });
}

export function runFileInTerminal(
  command: string[],
  filePath: string,
  terminal: vscode.Terminal,
): void {
  terminal.show();
  terminal.sendText(`clear`);
  terminal.sendText(quote([...command, filePath]));

  // Leaving this here if we ever need to fix cmd.exe again
  // const shell: string | undefined = vscode.workspace
  //   .getConfiguration("terminal.integrated.shell")
  //   .get("windows");
  // if (process.platform === "win32" && shell && /cmd\.exe$/.test(shell)) {
  //   // cmd.exe doesn't recognize single quotes
  //   terminal.sendText(`${racket} "${filePath}"`);
  // } else {
  //   terminal.sendText(`${racket} '${filePath}'`);
  // }
}

export function loadFileInRepl(filePath: string, repl: vscode.Terminal): void {
  repl.show();
  repl.sendText(`(enter! (file "${filePath}"))`);
}

export function createTerminal(filePath: string | null): vscode.Terminal {
  let terminal;
  if (filePath) {
    const templateSetting: string | undefined = vscode.workspace
      .getConfiguration("magicRacket.outputTerminal")
      .get("outputTerminalTitle");
    const template = templateSetting && templateSetting !== "" ? templateSetting : "Output ($name)";
    terminal = vscode.window.createTerminal(template.replace("$name", fileName(filePath)));
  } else {
    const templateSetting: string | undefined = vscode.workspace
      .getConfiguration("magicRacket.outputTerminal")
      .get("sharedOutputTerminalTitle");
    const template = templateSetting && templateSetting !== "" ? templateSetting : "Racket Output";
    terminal = vscode.window.createTerminal(template);
  }
  terminal.show();
  return terminal;
}

export function createRepl(filePath: string, command: string[]): vscode.Terminal {
  const templateSetting: string | undefined = vscode.workspace
    .getConfiguration("magicRacket.REPL")
    .get("title");
  const template = templateSetting && templateSetting !== "" ? templateSetting : "REPL ($name)";
  const repl = vscode.window.createTerminal(template.replace("$name", fileName(filePath)));
  repl.show();
  repl.sendText(quote([...command, "--eval", `(enter! (file "${filePath}"))`]));
  return repl;
}
