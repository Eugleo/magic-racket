import * as vscode from 'vscode'; // The module 'vscode' contains the VS Code extensibility API
import { findReferences } from './syntax';

export class FracasReferenceProvider implements vscode.ReferenceProvider {
    provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): Promise<vscode.Location[]> {
        return findReferences(document, position, token);
    }

}