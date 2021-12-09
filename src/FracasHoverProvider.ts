import * as vscode from 'vscode'; // The module 'vscode' contains the VS Code extensibility API
import { mapAsync } from './Collections';
import {
    getSelectedSymbolRange
} from './FracasEditorLib';
import {
    findComment,
    findDefinition,
} from './FracasSyntax';

export class FracasHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken)
        : Promise<vscode.Hover | null> {
        return this._searchComment(document, position, token);
    }

    private async _searchComment(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken)
        : Promise<vscode.Hover | null> {
        const [symbol, range] = getSelectedSymbolRange(document, new vscode.Range(position, position));
        const definitions = await findDefinition(symbol, token);
        const comments = await mapAsync(definitions, async (definition) => {
            return await findComment(definition.location.uri, definition.location.range.end);
        });
        return comments.length === 0 ? null : new vscode.Hover(comments.join("\n"), range);
    }
}
