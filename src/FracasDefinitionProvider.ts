import * as vscode from 'vscode'; // The module 'vscode' contains the VS Code extensibility API
import {
	getSelectedSymbol,
} from './FracasEditorLib';
import {
	findDefinition,
} from './FracasSyntax';

export class FracasDefinitionProvider implements vscode.DefinitionProvider {
	public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken)
	: Promise<vscode.Definition> {
		const symbol = getSelectedSymbol();
		if (!symbol)
		{
			vscode.window.showErrorMessage("No symbol found at cursor position");
			return Promise.resolve([]);
		}

		return this._findDefinition(symbol, token);
	}

	private async _findDefinition(symbol: string, token: vscode.CancellationToken)
	: Promise<vscode.Location[]> {
		const results = await findDefinition(symbol, token);
		return results.map(result => result.location);
	}
}
