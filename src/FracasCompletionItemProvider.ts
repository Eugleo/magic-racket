import * as vscode from 'vscode'; // The module 'vscode' contains the VS Code extensibility API
import { findCompletions } from './FracasSyntax';

export class FracasCompletionItemProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext)
        : Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem> | null> {
        return findCompletions(document, position, token);
    }
}
