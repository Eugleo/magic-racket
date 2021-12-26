import * as vscode from "vscode";
import {
  createTerminal,
  runFileInTerminal,
  createRepl,
  loadFileInRepl,
  executeSelectionInRepl,
} from "./repl";
import { withFilePath, withRacket, withEditor, withREPL } from "./utils";

function getOrDefault<K, V>(map: Map<K, V>, key: K, getDefault: () => V): V {
  const value = map.get(key);
  if (value) {
    return value;
  }
  const def = getDefault();
  map.set(key, def);
  return def;
}

function saveActiveTextEditorAndRun(f: () => void) {
  vscode.window.activeTextEditor?.document?.save().then(() => f());
}

export function runInTerminal(terminals: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    withRacket((command: string[]) => {
      let terminal: vscode.Terminal;
      if (
        vscode.workspace
          .getConfiguration("magicRacket.outputTerminal")
          .get("numberOfOutputTerminals") === "one"
      ) {
        terminal = getOrDefault(terminals, "one", () => createTerminal(null));
      } else {
        terminal = getOrDefault(terminals, filePath, () => createTerminal(filePath));
      }
      saveActiveTextEditorAndRun(() => runFileInTerminal(command, filePath, terminal));
    });
  });
}

export function loadInRepl(repls: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    withREPL((command: string[]) => {
      let loaded = true;
      const repl = getOrDefault(repls, filePath, () => {
        loaded = false;
        return createRepl(filePath, command);
      });
      if (loaded) {
        saveActiveTextEditorAndRun(() => loadFileInRepl(filePath, repl));
      }
    });
  });
}

export function executeSelection(repls: Map<string, vscode.Terminal>): void {
  withEditor((editor: vscode.TextEditor) => {
    withFilePath((filePath: string) => {
      withREPL((command: string[]) => {
        const repl = getOrDefault(repls, filePath, () => createRepl(filePath, command));
        executeSelectionInRepl(repl, editor);
      });
    });
  });
}

export function openRepl(repls: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    withREPL((command: string[]) => {
      const repl = getOrDefault(repls, filePath, () => createRepl(filePath, command));
      repl.show();
    });
  });
}

export function showOutput(terminals: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    const terminal = terminals.get(filePath);
    if (terminal) {
      terminal.show();
    } else {
      vscode.window.showErrorMessage("No output terminal exists for this file");
    }
  });
}
