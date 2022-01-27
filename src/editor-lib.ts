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
    document?: vscode.TextDocument, where?: vscode.Range | vscode.Position, stripTrailingColon = false
): string {
    const resolvedSymbol = resolveSymbol(document, where);
    if (resolvedSymbol) {
        let word = resolvedSymbol.document.getText(resolvedSymbol.range);
        if (stripTrailingColon && word.endsWith(':')) { // strip trailing ':' for fracas constructors (hacky)
            word = word.substring(0, word.length - 1);
        }
        return word;
    } else {
        console.error("Tried to search for definition, but no text was highlighted nor could a phrase be determined from cursor position");
        return "";
    }
}

/**
 * Given a position or a range, ensure that the value is a range.
 * @param where A position or range to convert to a range.
 * @returns if where is a range, return he given range. If where is a position,
 * return an empty range located at the given position.
 */
export function resolveRange(where: vscode.Range | vscode.Position): vscode.Range {
    const range: vscode.Range = where as vscode.Range;
    return range?.start ? range : new vscode.Range(where as vscode.Position, where as vscode.Position);
}

/**
 * Find the range of the word under the cursor at the `where` position in the given document.
 * If no document or position is given, use the selection in the active text editor.
 * @param document (optional) the document containing the text. If not given, use the active editor's document.
 * @param where (optional) the position or range within the document at which
 * to find a symbol. If not given, the cursor position is used.
 * @returns The symbol at the `where` location, or undefined if no document was given
 * and there is no active editor, or the active editor has no word at the given position.
 */
export function resolveSymbol(
    document?: vscode.TextDocument, where?: vscode.Range | vscode.Position
): { document: vscode.TextDocument, range: vscode.Range } | undefined {
    // default to current editor selection if no document or range is provided
    const activeEditor = vscode.window.activeTextEditor;
    document = document || activeEditor?.document;
    
    if (document) {
        // default to the word under the cursor if no range is provided
        let range: vscode.Range | undefined = // use the given value or the active editor selection
            resolveRange(where || activeEditor?.selection || new vscode.Position(0, 0));
        if (range.isEmpty) {
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

/**
 * Find the first occurrence of a regex match within a document starting at the given position.
 * @param uri The document to search
 * @param pos The position at which to begin searching
 * @param searchRx The regular expression to search for
 * @returns The position of the first match, or undefined if no match was found.
 */
export async function searchForward(uri: vscode.Uri, pos: vscode.Position, searchRx: RegExp)
    : Promise<{line: vscode.TextLine, match: RegExpExecArray} | undefined> {
    const doc = await vscode.workspace.openTextDocument(uri);
    let lineNo = pos.line;
    let line = doc.lineAt(lineNo);
    let lineText = line.text.substring(pos.character);
    while (lineNo < doc.lineCount) {
        const match = searchRx.exec(lineText);
        if (match) {
            return {line, match};
        }

        line = doc.lineAt(lineNo);
        lineText = line.text;
        lineNo += 1;
    }
    return undefined;
}

/**
 * Search each line of a document in reverse from the given position for the first occurrence 
 * of a regex match.
 * @param uri The document to search
 * @param pos The position before which to begin searching
 * @param searchRx The regular expression to search for
 * @returns The position of the first match preceding pos, or undefined if no match was found.
 */
export async function searchBackward(uri: vscode.Uri, pos: vscode.Position, searchRx: RegExp)
    : Promise<{line: vscode.TextLine, match: RegExpExecArray} | undefined> {
    const doc = await vscode.workspace.openTextDocument(uri);
    let lineNo = pos.line;
    let line = doc.lineAt(lineNo);
    let lineText = line.text.substring(0, pos.character);
    while (lineNo >= 0) {
        const match = _lastMatch(searchRx, lineText);
        if (match) {
            return {line, match};
        }

        line = doc.lineAt(lineNo);
        lineText = line.text;
        lineNo -= 1;
    }
    return undefined;
}


// REGEXP UTILS /////////////////////////////////////////////////////////////////

/**
 * Find the range covering a group within a regex match. For example, given /\((define-type)\s*(cool-stuff))/,
 * calculate the range around "cool-stuff".
 * @param match The expression containing a group to locate.
 * @param matchPosition The document position at which the match starts.
 * @param group The index of the group within the regex match array.
 * @returns The range of the group
 */
export function regexGroupDocumentLocation(
    document: vscode.TextDocument,
    match: RegExpExecArray,
    matchPosition: vscode.Position,
    group: number
): vscode.Location {
    // calculate the offset of the regex group within the match
    let groupOffset = match.index;
    for (let i = 1; i < group; ++i) {
        groupOffset += match[i].length;
    }

    // convert the match offsets to a document range
    const matchOffset = document.offsetAt(matchPosition);
    const memberStart = document.positionAt(matchOffset + groupOffset);
    const memberEnd = document.positionAt(matchOffset + groupOffset + match[group].length);
    return new vscode.Location(document.uri, new vscode.Range(memberStart, memberEnd));
}

export async function regexGroupUriLocation(
    uri: vscode.Uri,
    match: RegExpExecArray,
    matchPosition: vscode.Position,
    group: number
): Promise<vscode.Location> {
    const document = await vscode.workspace.openTextDocument(uri);
    return regexGroupDocumentLocation(document, match, matchPosition, group);
}

/**
 * Find the last occurrence of a regex match within a string.
 * @param searchRx The regular expression to search for, probably with the "global" search flag set.
 * @param text The text within which to search for matches.
 * @returns The final matching instance of the regex, or undefined if no match was found. If the regex
 * is not a global search, the first match is returned.
 */
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
