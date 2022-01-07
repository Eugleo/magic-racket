import * as vscode from "vscode";
import * as cp from "child_process";

export function execShell(cmd: string) : Promise<string> {
    return new Promise<string>((resolve, reject) => {
        cp.exec(cmd, (err, out) => {
            if (err) {
                vscode.window.showErrorMessage(err.message);
                return reject(err);
            }
            return resolve(out);
        });
    });
}

export function openRacketReference(symbol: string): void {
    vscode.env.openExternal(vscode.Uri.parse(`https://docs.racket-lang.org/search/index.html?q=${encodeURI(symbol)}`));
}

export function fileName(filePath: string): string {
    const match = filePath.match(/^.*\/([^/]+\.[^/]+)$/);
    if (match) {
        return match[1];
    }
    vscode.window.showErrorMessage("Invalid file name.");
    return "";
}

export function normalizeFilePath(filePath: string): string {
    if (process.platform === "win32") {
        return filePath.replace(/\\/g, "/");
    }
    return filePath;
}

export function delay(ms: number) : Promise<void> {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export function getRacket(server = false) : [string,string[]] {
    const racketPathKey = server ? "racketPath" : "REPLRacketPath";
    const racket = vscode.workspace
        .getConfiguration("vscode-fracas.general")
        .get<string>(racketPathKey) || "racket";
    if (!racket) {
        vscode.window.showErrorMessage(
            "No Racket executable specified. Please add the path to the Racket executable in settings",
        );
    }
    const collectPaths = vscode.workspace
        .getConfiguration("vscode-fracas.general")
        .get<string[]>("racketCollectionPaths") || [];
    const racketArgs = [];
    for (const path of collectPaths) {
        racketArgs.push("-S", path);
    }
    return [racket, racketArgs];
}

export function withRacket(func: (racketPath: string, racketArgs: string[]) => void, server = false): void {
    const [racket, racketArgs] = getRacket(server);
    if (racket) {
        func(racket, racketArgs);
    }
}
