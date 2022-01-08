import { parse } from "path";
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
        withRacket((racket: string, racketArgs: string[]) => {
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
            runFileInTerminal(racket, racketArgs, filePath, terminal);
        });
    });
}

export function loadInRepl(repls: Map<string, vscode.Terminal>): void {
    withFilePath((filePath: string) => {
        withRacket((racket: string, racketArgs: string[]) => {
            const repl = getOrDefault(repls, filePath, () => createRepl(fileName(filePath), racket, racketArgs));
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

export function compileFracasObject(filePath: string, fracasObject: string): void {
    const [racket, racketArgs] = getRacket();
    if (fracasObject && filePath && racket) {
        vscode.window.activeTextEditor?.document?.save();
        const cmd = `(require fracas/make-asset-json) (enter! (file "${filePath}")) (define-asset-impl: #:value ${fracasObject} #:value-name (quote ${fracasObject}) #:key (key: ${fracasObject}))`;
        execShell(`${racket} ${racketArgs.join(" ")} -e "${cmd.replace(/"/g, '\\"')}"`);
    }
}

let lastFracasObject = "";
let lastFracasFile = "";
export function compileSelectedFracasObject(): void {
    lastFracasFile = getFilePath() || "";
    lastFracasObject = getSelectedSymbol();
    compileFracasObject(lastFracasFile, lastFracasObject);
}

export function recompileFracasObject(): void {
    compileFracasObject(lastFracasFile, lastFracasObject);
}

export function precompileFracasFile(frcDoc: vscode.TextDocument | undefined = undefined): void {
    // use the open document if none is provided
    if (frcDoc === undefined) {
        frcDoc = vscode.window.activeTextEditor?.document;
    }

    // if there is a fracas document, precompile it
    if (frcDoc && frcDoc.languageId === "fracas") {
        frcDoc.save(); // save the document before precompiling
        
        const ninja = vscode.workspace
            .getConfiguration("vscode-fracas.general")
            .get<string>("ninjaPath") || "ninja";
        
        // determine the .zo file from the fracas file
        const frcPath = parse(normalizeFilePath(frcDoc.fileName));
        const upperRoot = frcPath.root.toUpperCase(); // ninja requires that the drive letter be uppercase
        const zoFile = `${upperRoot}${frcPath.dir.substring(upperRoot.length)}/compiled/${frcPath.name}_frc.zo`;

        // invoke ninja to precompile the fracas file
        const ninjaCmd = `${ninja} -f ./build/build_precompile.ninja ${zoFile}`;
        console.log(ninjaCmd);
        execShell(ninjaCmd, "C:/proj/ws/tdp1/wslib");
    }
}

export function openRepl(repls: Map<string, vscode.Terminal>): void {
    withFilePath((filePath: string) => {
        withRacket((racket: string, racketArgs: string[]) => {
            const repl = getOrDefault(repls, filePath, () => createRepl(fileName(filePath), racket, racketArgs));
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
