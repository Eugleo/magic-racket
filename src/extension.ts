import * as vscode from "vscode";
import { LanguageClient } from 'vscode-languageclient';

let langClient: LanguageClient;

function getRacketExecutable() {
  let racket: string | undefined = vscode.workspace
    .getConfiguration("magic-racket")
    .get("racketPath");
  if (racket === "") {
    racket = undefined;
  }
  return racket;
}

function normalizeFilePath(filePath: string) {
  if (process.platform === "win32") {
    return filePath.replace(/\\/g, "/");
  }
  return filePath;
}

function makeRepl() {
  const racket = getRacketExecutable();
  if (racket !== undefined) {
    const terminal = vscode.window.createTerminal("Racket REPL");
    terminal.sendText(racket);
    return terminal;
  }
  return undefined;
}

function getCurrentRepl() {
  const currentTerminal = vscode.window.activeTerminal;
  if (currentTerminal && /Racket REPL.*/.test(currentTerminal.name)) {
    return currentTerminal;
  }
  return makeRepl();
}

function raiseMustHaveEditor(verb: string) {
  vscode.window.showErrorMessage(`You have to have a file opened to be able to ${verb} it.`);
}

function runFileInTerminal(filePath: string) {
  let terminal = vscode.window.terminals.find((t) => !/Racket REPL/.test(t.name));
  if (terminal === undefined) {
    terminal = vscode.window.createTerminal("Racket");
  }
  terminal.show();
  const racket = getRacketExecutable();
  if (racket !== undefined) {
    terminal.sendText(`racket "${normalizeFilePath(filePath)}"`);
  } else {
    vscode.window.showErrorMessage(
      "No Racket executable specified. Please add the path to the Racket executable in settings.",
    );
  }
}

function executeSelectionInRepl(repl: vscode.Terminal, editor: vscode.TextEditor) {
  editor.selections.forEach((sel) => {
    const trimmed = editor.document.getText(sel).trim();
    if (trimmed) {
      repl.show();
      repl.sendText(trimmed);
    }
  });
}

function raiseMustHaveRacketExecutable() {
  vscode.window.showErrorMessage(
    "No Racket executable specified. Please add the path to the Racket executable in settings.",
  );
}

function loadFileInRepl(repl: vscode.Terminal, filePath: string) {
  repl.show();
  repl.sendText(`(enter! (file "${normalizeFilePath(filePath)}"))`);
}

export function deactivate() {
  if (!langClient) {
		return undefined;
	}
	return langClient.stop();
}

export function activate(context: vscode.ExtensionContext) {
  //******* Language Client ********
	const executable = {
		command: 'racket',
    // args: ['--lib', 'racket-langserver'],
    args: [context.asAbsolutePath('racket-langserver/main.rkt')],
	};

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions = {
		run: executable,
		debug: executable
	};

	// Options to control the language client
	let clientOptions = {
		// Register the server for racket documents
		documentSelector: [{ scheme: 'file', language: 'racket' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	langClient = new LanguageClient(
		'magic-racket',
		'Racket Language Client',
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	langClient.start();

  //******* Language Client END ********


  let loadFileIntoCurrent = vscode.commands.registerCommand(
    "magic-racket.loadFileIntoRepl",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const filePath = editor.document.fileName;
        const repl = getCurrentRepl();
        if (repl) {
          loadFileInRepl(repl, filePath);
        } else {
          raiseMustHaveRacketExecutable();
        }
      } else {
        raiseMustHaveEditor("load");
      }
    },
  );

  const loadFileIntoNew = vscode.commands.registerCommand(
    "magic-racket.loadFileIntoNewRepl",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const filePath = editor.document.fileName;
        const repl = makeRepl();
        if (repl) {
          loadFileInRepl(repl, filePath);
        } else {
          raiseMustHaveRacketExecutable();
        }
      } else {
        raiseMustHaveEditor("load");
      }
    },
  );

  const runFile = vscode.commands.registerCommand("magic-racket.runFile", () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      runFileInTerminal(editor.document.fileName);
    } else {
      raiseMustHaveEditor("run");
    }
  });

  const executeSelection = vscode.commands.registerCommand(
    "magic-racket.executeSelectionInRepl",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const repl = getCurrentRepl();
        if (repl !== undefined) {
          executeSelectionInRepl(repl, editor);
        } else {
          raiseMustHaveRacketExecutable();
        }
      }
    },
  );

  const openRepl = vscode.commands.registerCommand("magic-racket.openRepl", () => {
    const repl = makeRepl();
    if (repl) {
      repl.show();
    } else {
      raiseMustHaveRacketExecutable();
    }
  });

  context.subscriptions.push(
    loadFileIntoNew,
    loadFileIntoCurrent,
    runFile,
    executeSelection,
    openRepl,
  );
}
