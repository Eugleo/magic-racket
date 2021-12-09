import * as vscode from 'vscode'; // The module 'vscode' contains the VS Code extensibility API
import {
    getSelectedSymbol
} from './FracasEditorLib';
import { findReferences } from './FracasSyntax';

export class FracasReferenceProvider implements vscode.ReferenceProvider {
    provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken)
    : Promise<vscode.Location[]> {
        const symbol = getSelectedSymbol();
		if (!symbol)
		{
			vscode.window.showErrorMessage("No symbol found at cursor position");
			return Promise.resolve([]);
		}

        return findReferences(symbol, token);
    }

}