import * as vscode from "vscode";
import { getOrDefault } from "./containers";
import { getFilePath, getSelectedSymbol, withFilePath } from "./editor-lib";
import {
    createTerminal,
    runFileInTerminal,
    createRepl,
    loadFileInRepl,
    executeSelectionInRepl,
    withRepl,
} from "./repl";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { execShell, fileName, getRacket, normalizeFilePath, openRacketReference, withRacket } from "./utils";

export function helpWithSelectedSymbol(): void {
    const fracasObject = getSelectedSymbol();
    if (fracasObject) {
        openRacketReference(fracasObject);
    }
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
            const repl = getOrDefault(repls, filePath, () => createRepl(fileName(filePath), racket));
            loadFileInRepl(filePath, repl);
        });
    });
}

export async function executeSelection(repls: Map<string, vscode.Terminal>): Promise<void> {
    const filePath = getFilePath();
    if (filePath) {
        await withRepl(repls, filePath, executeSelectionInRepl);
    }
}

export async function compileFracasObject(filePath: string, fracasObject: string): Promise<void> {
    const racket = getRacket();
    if (fracasObject && filePath && racket) {
        vscode.window.activeTextEditor?.document?.save();
        const cmd = `(require fracas/make-asset-json) (enter! (file "${filePath}")) (define-asset-impl: #:value ${fracasObject} #:value-name (quote ${fracasObject}) #:key (key: ${fracasObject}))`;
        execShell(`${racket} -e "${cmd.replace(/"/g, '\\"')}"`);
    }
}

let lastFracasObject = "";
let lastFracasFile = "";
export async function compileSelectedFracasObject(): Promise<void> {
    lastFracasFile = getFilePath() || "";
    lastFracasObject = getSelectedSymbol();
    compileFracasObject(lastFracasFile, lastFracasObject);
}

export async function recompileFracasObject(): Promise<void> {
    compileFracasObject(lastFracasFile, lastFracasObject);
}

export function openRepl(repls: Map<string, vscode.Terminal>): void {
    withFilePath((filePath: string) => {
        withRacket((racket: string) => {
            const repl = getOrDefault(repls, filePath, () => createRepl(fileName(filePath), racket));
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
