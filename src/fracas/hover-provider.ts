import * as vscode from 'vscode'; // The module 'vscode' contains the VS Code extensibility API
import { mapAsync } from '../containers';
import { resolveSymbol } from '../editor-lib';
import {
    findComment,
    findDefinition,
} from './syntax';

export class FracasHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken)
        : Promise<vscode.Hover | null> {
        return this._searchComment(document, position, token);
    }

    private async _searchComment(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        // search for comments preceding the definition for the symbol at the cursor
        const definitions = await findDefinition(document, position, token);
        const commentsRaw = await mapAsync(definitions, async (definition) => {
            return await findComment(definition.location.uri, definition.location.range.end);
        });
        const comments = commentsRaw.join("\n").trim();

        // return a hover containing the comments, if any.
        const positionAsRange = new vscode.Range(position, position);
        if (comments.length > 0) {
            const resolvedSymbol = resolveSymbol(document, position);
            return new vscode.Hover(comments, resolvedSymbol?.range || positionAsRange);
        } else {
            return new vscode.Hover("No code comments found.", positionAsRange);;
        }
    }
}
