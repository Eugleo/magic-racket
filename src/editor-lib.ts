import * as vscode from 'vscode';
import { workspace } from 'vscode';
import { normalizeFilePath } from './utils';

export function withEditor(func: (vscodeEditor: vscode.TextEditor) => void): void {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        func(editor);
    } else {
        vscode.window.showErrorMessage("A file must be opened before you can do that");
    }
}

export function getFilePath(): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        return normalizeFilePath(editor.document.fileName);
    }
    return undefined;
}

export function withFilePath(func: (filePath: string) => void): void {
    withEditor((editor: vscode.TextEditor) => func(normalizeFilePath(editor.document.fileName)));
}

export function getRange(ranges: (vscode.Range | vscode.Range[])): vscode.Range {
    return Array.isArray(ranges) ? ranges[0] : ranges;
}

export async function findTextInFiles(
    searchRx: string,
    token?: vscode.CancellationToken,
    include: vscode.GlobPattern = '**/*.frc'
): Promise<vscode.TextSearchMatch[]> {
    console.log(searchRx);
    const results: vscode.TextSearchMatch[] = [];
    try {
        await workspace.findTextInFiles(
            { pattern: searchRx, isRegExp: true },
            {
                include: include,
                previewOptions: {
                    matchLines: 1,
                    charsPerLine: 100
                }
            },
            result => {
                const match = result as vscode.TextSearchMatch;
                if (match) {
                    results.push(match);
                }
            },
            token);
    } catch (error) {
        console.error(error);
    }
    return results;
}

export function getSelectedSymbol(
    document?: vscode.TextDocument, where?: vscode.Range | vscode.Position
): string {
    const resolvedSymbol = resolveSymbol(document, where);
    if (resolvedSymbol) {
        let word = resolvedSymbol.document.getText(resolvedSymbol.range);
        if (word.endsWith(':')) { // strip trailing ':' for fracas constructors (hacky)
            word = word.substring(0, word.length - 1);
        }
        return word;
    } else {
        console.error("Tried to search for definition, but no text was highlighted nor could a phrase be determined from cursor position");
        return "";
    }
}

export function resolveSymbol(
    document?: vscode.TextDocument, where?: (vscode.Range | vscode.Position)
): { document: vscode.TextDocument, range: vscode.Range } | undefined {
    // default to current editor selection if no document or range is provided
    const activeEditor = vscode.window.activeTextEditor;
    where = where || activeEditor?.selection;
    document = document || activeEditor?.document;

    if (document && where) {
        // default to the word under the cursor if no range is provided
        let range: vscode.Range | undefined = where as vscode.Range;
        if (!range?.start || range.isEmpty) {
            range = document.getWordRangeAtPosition(
                range?.start || where as vscode.Position, /[#:\w\-+*.>]+/);
        }

        // where is now a range, so get the text from it
        if (range) {
            return { document, range };
        }
    }

    return undefined;
}

export async function searchForward(uri: vscode.Uri, pos: vscode.Position, searchRx: RegExp)
    : Promise<[vscode.TextLine, RegExpExecArray] | null> {
    const doc = await vscode.workspace.openTextDocument(uri);
    let lineNo = pos.line;
    let line = doc.lineAt(lineNo);
    let lineText = line.text.substring(pos.character);
    while (lineNo < doc.lineCount) {
        const match = searchRx.exec(lineText);
        if (match) {
            return [line, match];
        }

        line = doc.lineAt(lineNo);
        lineText = line.text;
        lineNo += 1;
    }
    return null;
}

export async function searchBackward(uri: vscode.Uri, pos: vscode.Position, searchRx: RegExp)
    : Promise<[vscode.TextLine, RegExpExecArray] | null> {
    const doc = await vscode.workspace.openTextDocument(uri);
    let lineNo = pos.line;
    let line = doc.lineAt(lineNo);
    let lineText = line.text.substring(0, pos.character);
    while (lineNo >= 0) {
        const match = _lastMatch(searchRx, lineText);
        if (match) {
            return [line, match];
        }

        line = doc.lineAt(lineNo);
        lineText = line.text;
        lineNo -= 1;
    }
    return null;
}

function _lastMatch(searchRx: RegExp, text: string): RegExpExecArray | null {
    let match = searchRx.exec(text);
    let prevMatch = null;
    if (searchRx.global) {
        while (match) {
            prevMatch = match;
            match = searchRx.exec(text);
        }
    }
    return match || prevMatch;
}
