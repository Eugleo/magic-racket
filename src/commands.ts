import * as vscode from "vscode";
import {
  createTerminal,
  runFileInTerminal,
  createRepl,
  loadFileInRepl,
  executeSelectionInRepl,
} from "./repl";
import { withFilePath, withRacket, withEditor } from "./utils";

function getOrDefault<K, V>(map: Map<K, V>, key: K, getDefault: () => V): V {
  const value = map.get(key);
  if (value) {
    return value;
  }
  const def = getDefault();
  map.set(key, def);
  return def;
}

export function runInTerminal(terminals: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    withRacket((racket: string) => {
      let terminal;
      if (
        vscode.workspace
          .getConfiguration("vscode-fracas.outputTerminal")
          .get("numberOfOutputTerminals") === "one"
      ) {
        terminal = getOrDefault(terminals, "one", () => createTerminal(null));
      } else {
        terminal = getOrDefault(terminals, filePath, () => createTerminal(filePath));
      }
      runFileInTerminal(racket, filePath, terminal);
    });
  });
}

export function loadInRepl(repls: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    withRacket((racket: string) => {
      const repl = getOrDefault(repls, filePath, () => createRepl(filePath, racket));
      loadFileInRepl(filePath, repl);
    });
  });
}

export function executeSelection(repls: Map<string, vscode.Terminal>): void {
  withEditor((editor: vscode.TextEditor) => {
    withFilePath((filePath: string) => {
      withRacket((racket: string) => {
        const repl = getOrDefault(repls, filePath, () => createRepl(filePath, racket));
        executeSelectionInRepl(repl, editor);
      });
    });
  });
}

export function openRepl(repls: Map<string, vscode.Terminal>): void {
  withFilePath((filePath: string) => {
    withRacket((racket: string) => {
      const repl = getOrDefault(repls, filePath, () => createRepl(filePath, racket));
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
