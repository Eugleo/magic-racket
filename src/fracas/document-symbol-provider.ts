import * as vscode from 'vscode'; // The module 'vscode' contains the VS Code extensibility API
import { findDocumentSymbols } from './syntax';

export class FracasDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken)
        : Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
        return findDocumentSymbols(document.uri, token);
    }
}
