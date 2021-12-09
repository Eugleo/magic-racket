import * as vscode from "vscode";

function normalizeFilePath(filePath: string): string {
  if (process.platform === "win32") {
    return filePath.replace(/\\/g, "/");
  }
  return filePath;
}

export function withRacket(func: (racketPath: string) => void, server = false): void {
  const racketPathKey = server ? "racketPath" : "REPLRacketPath";
  const racket = vscode.workspace
    .getConfiguration("vscode-fracas.general")
    .get<string>(racketPathKey);
  if (racket && racket !== "") {
    func(racket);
  } else {
    vscode.window.showErrorMessage(
      "No Racket executable specified. Please add the path to the Racket executable in settings",
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
