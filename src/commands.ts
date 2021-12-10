import * as vscode from "vscode";
import { getOrDefault } from "./collections";
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
import { fileName, withRacket } from "./utils";

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

export const FRACAS_COMPILE_TERMINAL = "Fracas Compile";
export async function compileFracasObject(repls: Map<string, vscode.Terminal>): Promise<void> {
    const fracasObject = getSelectedSymbol();
    const filePath = getFilePath();
    if (fracasObject && filePath) {
        await withRepl(repls, FRACAS_COMPILE_TERMINAL, (repl, _) => {
            repl.show();
            repl.sendText(
`(require fracas/make-asset-json)
(enter! (file "${filePath}"))
(define-asset-impl: #:value ${fracasObject} #:value-name '${fracasObject} #:key (key: ${fracasObject}))`);
        });
    }
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
