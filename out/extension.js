"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function activate(context) {
    let loadFileIntoCurrent = vscode.commands.registerCommand("magic-racket.loadFileIntoRepl", () => {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let filePath = editor.document.fileName;
            let repl = getCurrentRepl();
            if (repl) {
                loadFileInRepl(repl, filePath);
            }
            else {
                raiseMustHaveRacketExecutable();
            }
        }
        else {
            raiseMustHaveEditor("load");
        }
    });
    let loadFileIntoNew = vscode.commands.registerCommand("magic-racket.loadFileIntoNewRepl", () => {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let filePath = editor.document.fileName;
            let repl = makeRepl();
            if (repl) {
                loadFileInRepl(repl, filePath);
            }
            else {
                raiseMustHaveRacketExecutable();
            }
        }
        else {
            raiseMustHaveEditor("load");
        }
    });
    let runFile = vscode.commands.registerCommand("magic-racket.runFile", () => {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            runFileInTerminal(editor.document.fileName);
        }
        else {
            raiseMustHaveEditor("run");
        }
    });
    let executeSelection = vscode.commands.registerCommand("magic-racket.executeSelectionInRepl", () => {
        let editor = vscode.window.activeTextEditor;
        if (editor) {
            let filePath = editor.document.fileName;
            let repl = getCurrentRepl();
            if (repl !== undefined) {
                executeSelectionInRepl(repl, editor);
            }
            else {
                raiseMustHaveRacketExecutable();
            }
        }
    });
    let openRepl = vscode.commands.registerCommand("magic-racket.openRepl", () => {
        let repl = makeRepl();
        if (repl) {
            repl.show();
        }
        else {
            raiseMustHaveRacketExecutable();
        }
    });
    context.subscriptions.push(loadFileIntoNew, loadFileIntoCurrent, runFile, executeSelection, openRepl);
}
exports.activate = activate;
function makeRepl() {
    let racket = getRacketExecutable();
    if (racket !== undefined) {
        let terminal = vscode.window.createTerminal("Racket REPL");
        terminal.sendText(racket);
        return terminal;
    }
    else {
        return undefined;
    }
}
function getCurrentRepl() {
    let currentTerminal = vscode.window.activeTerminal;
    if (currentTerminal && /Racket REPL.*/.test(currentTerminal.name)) {
        return currentTerminal;
    }
    else {
        return makeRepl();
    }
}
function raiseMustHaveEditor(verb) {
    vscode.window.showErrorMessage(`You have to have a file opened to be able to ${verb} it.`);
}
function getRacketExecutable() {
    let racket = vscode.workspace
        .getConfiguration("magic-racket")
        .get("racketPath");
    if (racket === "") {
        racket = undefined;
    }
    return racket;
}
function runFileInTerminal(filePath) {
    let terminal = vscode.window.terminals.find(t => !/Racket REPL/.test(t.name));
    if (terminal === undefined) {
        terminal = vscode.window.createTerminal("Racket");
    }
    terminal.show();
    let racket = getRacketExecutable();
    if (racket !== undefined) {
        terminal.sendText(`racket "${filePath}"`);
    }
    else {
        vscode.window.showErrorMessage("No Racket executable specified. Please add the path to the Racket executable in settings.");
    }
}
function executeSelectionInRepl(repl, editor) {
    for (const selection of editor.selections) {
        let selectedText = editor.document.getText(selection);
        if (!/^\s*$/.test(selectedText)) {
            let command = selectedText.replace(/^\s+|\s+$/g, "");
            repl.show();
            repl.sendText(command);
        }
    }
}
function raiseMustHaveRacketExecutable() {
    vscode.window.showErrorMessage("No Racket executable specified. Please add the path to the Racket executable in settings.");
}
function loadFileInRepl(repl, filePath) {
    repl.show();
    repl.sendText(`(enter! (file "${filePath}"))`);
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map