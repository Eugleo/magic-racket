import * as vscode from "vscode";

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

export function getRacket(server = false) : string | undefined {
    const racketPathKey = server ? "racketPath" : "REPLRacketPath";
    const racket = vscode.workspace
        .getConfiguration("vscode-fracas.general")
        .get<string>(racketPathKey);
    if (!racket) {
        vscode.window.showErrorMessage(
            "No Racket executable specified. Please add the path to the Racket executable in settings",
        );
    }
    return racket;
}

export function withRacket(func: (racketPath: string) => void, server = false): void {
    const racket = getRacket(server);
    if (racket) {
        func(racket);
    }
}
