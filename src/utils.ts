import * as vscode from "vscode";

function normalizeFilePath(filePath: string): string {
  if (process.platform === "win32") {
    return filePath.replace(/\\/g, "/");
  }
  return filePath;
}

export function withRacket(func: Function) {
  const racket = vscode.workspace.getConfiguration("magic-racket.general").get("racketPath");
  if (racket !== "") {
    func(racket);
  } else {
    vscode.window.showErrorMessage(
      "No Racket executable specified. Please add the path to the Racket executable in settings",
    );
  }
}

export function withEditor(func: Function) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    func(editor);
  } else {
    vscode.window.showErrorMessage("A file must be opened before you can do that");
  }
}

export function withFilePath(func: Function) {
  withEditor((editor: vscode.TextEditor) => func(normalizeFilePath(editor.document.fileName)));
}
