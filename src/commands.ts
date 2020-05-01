import * as vscode from "vscode";
import {
  createTerminal,
  runFileInTerminal,
  createRepl,
  loadFileInRepl,
  executeSelectionInRepl,
} from "./repl";

function getOrDefault<K, V>(map: Map<K, V>, key: K, getDefault: Function) {
  if (!map.has(key)) {
    map.set(key, getDefault());
  }
  return map.get(key)!;
}

function normalizeFilePath(filePath: string): string {
  if (process.platform === "win32") {
    return filePath.replace(/\\/g, "/");
  }
  return filePath;
}

function withRacket(func: Function) {
  const racket = vscode.workspace.getConfiguration("magic-racket.general").get("racketPath");
  if (racket !== "") {
    func(racket);
  } else {
    vscode.window.showErrorMessage(
      "No Racket executable specified. Please add the path to the Racket executable in settings",
    );
  }
}

function withEditor(func: Function) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    func(editor);
  } else {
    vscode.window.showErrorMessage("A file must be opened before you can do that");
  }
}

function withFilePath(func: Function) {
  withEditor((editor: vscode.TextEditor) => func(normalizeFilePath(editor.document.fileName)));
}

export function runInTerminal(terminals: Map<string, vscode.Terminal>) {
  withFilePath((filePath: string) => {
    withRacket((racket: string) => {
      let terminal;
      if (
        vscode.workspace
          .getConfiguration("magic-racket.outputTerminal")
          .get("numberOfOutputTerminals") === "one"
      ) {
        terminal = getOrDefault(terminals, "one", () => createTerminal(null));
      } else {
        terminal = getOrDefault(terminals, filePath, () => createTerminal(filePath));
      }
      console.log(terminal);
      runFileInTerminal(racket, filePath, terminal);
    });
  });
}

export function loadInRepl(repls: Map<string, vscode.Terminal>) {
  withFilePath((filePath: string) => {
    withRacket((racket: string) => {
      const repl = getOrDefault(repls, filePath, () => createRepl(filePath, racket));
      loadFileInRepl(filePath, repl);
    });
  });
}

export function executeSelection(repls: Map<string, vscode.Terminal>) {
  withEditor((editor: vscode.TextEditor) => {
    withFilePath((filePath: string) => {
      withRacket((racket: string) => {
        const repl = getOrDefault(repls, filePath, () => createRepl(filePath, racket));
        executeSelectionInRepl(repl, editor);
      });
    });
  });
}

export function openRepl(repls: Map<string, vscode.Terminal>) {
  withFilePath((filePath: string) => {
    withRacket((racket: string) => {
      const repl = getOrDefault(repls, filePath, () => createRepl(filePath, racket));
      repl.show();
    });
  });
}

export function showOutput(terminals: Map<string, vscode.Terminal>) {
  withFilePath((filePath: string) => {
    const terminal = terminals.get(filePath);
    if (terminal) {
      terminal.show();
    } else {
      vscode.window.showErrorMessage("No output terminal exists for this file");
    }
  });
}
