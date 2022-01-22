import * as vscode from 'vscode'; // The module 'vscode' contains the VS Code extensibility API
import {
    findDefinition,
} from './syntax';

export class FracasDefinitionProvider implements vscode.DefinitionProvider {
    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken)
        : Promise<vscode.Definition> {
        return this._findDefinition(document, position, token);
    }

    private async _findDefinition(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken
    ): Promise<vscode.Location[]> {
        const results = await findDefinition(document, position, token);
        return results.map(result => result.location);
    }
}
