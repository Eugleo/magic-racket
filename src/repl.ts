import { quote } from "shell-quote";
import * as vscode from "vscode";
import { isCmdExeShell, isPowershellShell, isWindowsOS, quoteWindowsPath } from "./utils";

function fileName(filePath: string) {
  const match = filePath.match(/^.*\/([^/]+\.[^/]+)$/);
  if (match) {
    return match[1];
  }
  vscode.window.showErrorMessage("Invalid file name.");
  return "";
}

export function executeSelectionInRepl(repl: vscode.Terminal, editor: vscode.TextEditor): void {
  const send = (s: string) => {
    const trimmed = s.trim();
    if(trimmed) {
      repl.show(true);
      repl.sendText(trimmed);
    }
  };

  if(editor.selections.length === 1 && editor.selection.isEmpty) {
    send(editor.document.lineAt(editor.selection.active.line).text);
    return;
  }

  editor.selections.forEach((sel) =>
    send(editor.document.getText(sel))
  );
}

export function runFileInTerminal(
  command: string[],
  filePath: string,
  terminal: vscode.Terminal,
): void {
  terminal.show();

  if (isWindowsOS()) {
    terminal.sendText(isPowershellShell() || isCmdExeShell() ? `cls` : `clear`);
    const racketExePath = quoteWindowsPath(command[0], true);
    filePath = quoteWindowsPath(filePath, false);
    terminal.sendText(`${racketExePath} ${command.slice(1).join(' ')} ${filePath}`);
  } else {
    terminal.sendText(`clear`);
    terminal.sendText(quote([...command, filePath]));
  }
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

  if (isWindowsOS()) {
    const racketExePath = quoteWindowsPath(command[0], true);
    let fullCommand = `${racketExePath} ${command.slice(1).join(' ')}`;
    if (isCmdExeShell()) {
      fullCommand += ` --eval ^"(enter! (file \\^"${filePath}\\^"))^"`;
    } else if (isPowershellShell()) {
      fullCommand += ` --eval '(enter! (file "${filePath}"))'`;
    } else {
      fullCommand += ` --eval '(enter! (file "${filePath}"))'`;
    }
    repl.sendText(fullCommand);
  } else {
    repl.sendText(quote([...command, "--eval", `(enter! (file "${filePath}"))`]));
  }

  return repl;
}
