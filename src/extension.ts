import * as vscode from "vscode";
// eslint-disable-next-line no-unused-vars
import { LanguageClient, LanguageClientOptions } from "vscode-languageclient/node";
import * as com from "./commands";
import { TaskProvider } from "./tasks";
import { withLanguageServer, withRacket } from "./utils";

let langClient: LanguageClient;
let isLangClientRunning = false;

let taskProvider: vscode.Disposable | undefined;

export function deactivate(): Promise<void> {
  if (taskProvider) {
    taskProvider.dispose();
  }

  if (!langClient) {
    return Promise.reject(new Error("There is no language server client to be deactivated"));
  }
  return langClient.stop();
}

function setupLSP() {
  withLanguageServer((command: string, args: string[]) => {
    const executable = {
      command: command,
      args: args,
    };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
      run: executable,
      debug: executable,
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
      // Register the server for racket documents
      documentSelector: [{ scheme: "file", language: "racket" }],
      synchronize: {
        // Notify the server about file changes to '.clientrc files contained in the workspace
        fileEvents: vscode.workspace.createFileSystemWatcher("**/.clientrc"),
      },
      uriConverters: {
        code2Protocol: (uri) => uri.toString(true),
        protocol2Code: (str) => vscode.Uri.parse(str),
      },
    };

    // Create the language client and start the client.
    langClient = new LanguageClient(
      "magic-racket",
      "Racket Language Client",
      serverOptions,
      clientOptions,
    );
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reg(name: string, func: (...args: any[]) => any) {
  return vscode.commands.registerCommand(`magic-racket.${name}`, func);
}

function configurationChanged() {
  const enableLSP: boolean = vscode.workspace
    .getConfiguration("magic-racket.lsp")
    .get("enabled", true);

  if (langClient) {
    if (enableLSP && !isLangClientRunning) {
      langClient.start();
      isLangClientRunning = true;
    } else if (!enableLSP && isLangClientRunning) {
      langClient.stop();
      isLangClientRunning = false;
    }
  }
}

export function activate(context: vscode.ExtensionContext): void {
  setupLSP();
  configurationChanged();

  // Each file has one output terminal and one repl
  // Those two are saved in terminals and repls, respectively
  // The file is _ran_ in the terminal and _loaded_ into a repl
  const terminals: Map<string, vscode.Terminal> = new Map();
  const repls: Map<string, vscode.Terminal> = new Map();

  vscode.workspace.onDidChangeConfiguration(configurationChanged);

  taskProvider = vscode.tasks.registerTaskProvider(TaskProvider.runTaskType, new TaskProvider());

  vscode.window.onDidCloseTerminal((terminal) => {
    terminals.forEach((val, key) => val === terminal && terminals.delete(key) && val.dispose());
    repls.forEach((val, key) => val === terminal && repls.delete(key) && val.dispose());
  });

  const loadInRepl = reg("loadFileInRepl", () => com.loadInRepl(repls));
  const runInTerminal = reg("runFile", () => com.runInTerminal(terminals));
  const executeSelection = reg("executeSelectionInRepl", () => com.executeSelection(repls));
  const openRepl = reg("openRepl", () => com.openRepl(repls));
  const showOutput = reg("showOutputTerminal", () => com.showOutput(terminals));

  context.subscriptions.push(loadInRepl, runInTerminal, executeSelection, openRepl, showOutput);
}
