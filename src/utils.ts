import * as vscode from "vscode";

function normalizeFilePath(filePath: string): string {
  if (process.platform === "win32") {
    return filePath.replace(/\\/g, "/");
  }
  return filePath;
}

export function withLanguageServer(func: (command: string, args: string[]) => void): void {
  const command = vscode.workspace
    .getConfiguration("magicRacket.languageServer")
    .get<string>("command");
  const args = vscode.workspace
    .getConfiguration("magicRacket.languageServer")
    .get<string[]>("arguments");
  if (command !== undefined && command !== "" && args !== undefined) {
    func(command, args);
  } else {
    vscode.window.showErrorMessage(
      `Invalid command for launching the language server. Please set the command in settings.`,
    );
  }
}

export function withRacket(func: (command: string[]) => void): void {
  const racket = vscode.workspace.getConfiguration("magicRacket.general").get<string>("racketPath");
  if (racket !== undefined && racket !== "") {
    func([racket]);
  } else {
    vscode.window.showErrorMessage(
      "Please configure the path to the Racket executable in settings.",
    );
  }
}

export function withREPL(func: (command: string[]) => void): void {
  const racket = vscode.workspace.getConfiguration("magicRacket.general").get<string>("racketPath");
  const args = vscode.workspace.getConfiguration("magicRacket.REPL").get<string[]>("arguments");
  if (racket !== undefined && racket !== "" && args !== undefined) {
    func([racket, ...args]);
  } else {
    vscode.window.showErrorMessage(
      "Please configure the path to the Racket executable and the arguments for launching a REPL in settings.",
    );
  }
}

export function withEditor(func: (vscodeEditor: vscode.TextEditor) => void): void {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    func(editor);
  } else {
    vscode.window.showErrorMessage("A file must be opened before you can do that");
  }
}

export function withFilePath(func: (filePath: string) => void): void {
  withEditor((editor: vscode.TextEditor) => func(normalizeFilePath(editor.document.fileName)));
}
