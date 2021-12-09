import * as vscode from 'vscode';
import { workspace } from 'vscode';


export function getRange(ranges : (vscode.Range | vscode.Range[])) {
    return Array.isArray(ranges) ? ranges[0] : ranges;
}

export async function findTextInFiles(
    searchRx: string,
    token: vscode.CancellationToken,
    include: vscode.GlobPattern = '**/*.frc') 
: Promise<vscode.TextSearchMatch[]> {
    console.log(include);
    const results: vscode.TextSearchMatch[] = [];
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
    return results;
}

export function getSelectedSymbol(document: vscode.TextDocument | null = null, range: vscode.Range | null = null): string {
    return getSelectedSymbolRange(document, range)[0];
}

export function getSelectedSymbolRange(document: vscode.TextDocument | null = null, range: vscode.Range | null = null)
: [string, vscode.Range] {
    const activeEditor = vscode.window.activeTextEditor;

    if (document === null) {
        if (!activeEditor) {
            console.log("Tried to search for text, but no active editor");
            return ['', new vscode.Range(0, 0, 0, 0)];
        }
        document = activeEditor.document;
    }

    if (range === null) {
        if (!activeEditor) {
            console.log("Tried to search for text, but no active editor");
            return ['', new vscode.Range(0, 0, 0, 0)];
        }
        range = activeEditor.selection;
    }

    let highlightedText = document.getText(range);
    if (highlightedText) {
        return [highlightedText, range];
    } else {
        const wordRange = document.getWordRangeAtPosition(range.start, /[#:\w\-+*.]+/);
        if (wordRange) {
            let word = document.getText(wordRange);
            if (word.endsWith(':')) { // strip trailing ':' for fracas constructors (hacky)
                word = word.substr(0, word.length - 1);
            }
            return [word, wordRange];
        }

    }
    console.log("Tried to search for definition, but no text was highlighted nor could a phrase be determined from cursor position");
    return ['', new vscode.Range(0, 0, 0, 0)];
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

function _lastMatch(searchRx: RegExp, text: string) : RegExpExecArray | null {
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
