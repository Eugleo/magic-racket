import * as assert from "assert";
import path = require("path");

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { getSelectedSymbol } from "../../editor-lib";
import { 
    findDefinition,
    FracasDefinition, 
    FracasDefinitionKind 
} from "../../fracas/syntax";
// import * as myExtension from '../../extension';

async function showFracasDocument(
    fileName: string, selection?: vscode.Range
): Promise<{ document: vscode.TextDocument, editor: vscode.TextEditor }> {
    const document = await vscode.workspace.openTextDocument(fileName);
    const editor = await vscode.window.showTextDocument(document, {selection});
    return { document, editor };
}

suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");

    const rewardFrc = path.join((vscode.workspace.workspaceFolders || [])[0].uri.fsPath, 'reward.frc')

    const rewardCountTextRange = new vscode.Range(6, 9, 6, 16); // selection around "#:count"

    test("getSelectedSymbol returns word under cursor", async () => {
        await showFracasDocument(rewardFrc, new vscode.Range(6, 9, 6, 9));
        const symbol = getSelectedSymbol();
        assert.strictEqual(symbol, "#:count");
    });

    test("getSelectedSymbol returns selection range", async () => {
        await showFracasDocument(rewardFrc, new vscode.Range(6, 12, 6, 16));
        const symbol = getSelectedSymbol();
        assert.strictEqual(symbol, "ount");
    });

    test("findDefinition resolves a field def", async () => {
        const { document } = await showFracasDocument(rewardFrc);
        const defs: FracasDefinition[] = await findDefinition(document, rewardCountTextRange.start);
        assert.strictEqual(defs.length, 1, "single definition not found");
        assert.strictEqual(defs[0].kind, FracasDefinitionKind.field, "field definition kind is not 'field'");
        assert.strictEqual(defs[0].completionKind, vscode.CompletionItemKind.Field, "field completion kind is not 'field'");
        assert.strictEqual(defs[0].symbol, "count");
        assert.deepStrictEqual(defs[0].location.range, new vscode.Range(5, 9, 5, 14), "location of definition is not correct");
    });
});
