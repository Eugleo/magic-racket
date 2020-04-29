import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient";
import * as com from "./commands";

let langClient: LanguageClient;

export function deactivate() {
  if (!langClient) {
    return undefined;
  }
  return langClient.stop();
}

function setupLSP(context: vscode.ExtensionContext) {
  const executable = {
    command: "racket",
    // args: ['--lib', 'racket-langserver'],
    args: [context.asAbsolutePath("racket-langserver/main.rkt")],
    // args: [context.asAbsolutePath('racket-language-server/main.rkt')],
  };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions = {
    run: executable,
    debug: executable,
  };

  // Options to control the language client
  const clientOptions = {
    // Register the server for racket documents
    documentSelector: [{ scheme: "file", language: "racket" }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: vscode.workspace.createFileSystemWatcher("**/.clientrc"),
    },
  };

  // Create the language client and start the client.
  langClient = new LanguageClient(
    "magic-racket",
    "Racket Language Client",
    serverOptions,
    clientOptions,
  );

  // Start the client. This will also launch the server
  langClient.start();
}

function reg(name: string, func: (...args: any[]) => any) {
  return vscode.commands.registerCommand(`magic-racket.${name}`, func);
}

export function activate(context: vscode.ExtensionContext) {
  setupLSP(context);

  // Each file has one output terminal and one repl
  // Those two are saved in terminals and repls, respectively
  // The file is _ran_ in the terminal and _loaded_ into a repl
  const terminals: Map<string, vscode.Terminal> = new Map();
  const repls: Map<string, vscode.Terminal> = new Map();

  const loadInRepl = reg("loadFileIntoRepl", () => com.loadInRepl(repls));
  const runInTerminal = reg("runFile", () => com.runInTerminal(terminals));
  const executeSelection = reg("executeSelectionInRepl", () => com.executeSelection(repls));
  const openRepl = reg("openRepl", () => com.openRepl(repls));
  const showOutput = reg("showOutput", () => com.showOutput(terminals));

  context.subscriptions.push(loadInRepl, runInTerminal, executeSelection, openRepl, showOutput);
}
