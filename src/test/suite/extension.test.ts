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

const testFixtureDir = (vscode.workspace.workspaceFolders || [])[0].uri.fsPath;
const rewardFrc = path.join(testFixtureDir, 'reward.frc');
const factionsFrc = path.join(testFixtureDir, 'factions.frc');
const abilityFrc = path.join(testFixtureDir, 'ability.frc');
const abilityActionDefinesFrc = path.join(testFixtureDir, 'ability-action-defines.frc');

suite("Editor Lib Tests", () => {
    vscode.window.showInformationMessage("Start editor lib tests.");

    test("getSelectedSymbol returns word under cursor", async () => {
        await showFracasDocument(rewardFrc, new vscode.Range(6, 9, 6, 9));
        const symbol = getSelectedSymbol();
        assert.strictEqual(symbol, "#:count");
    });

    test("getSelectedSymbol returns selection range", async () => {
        await showFracasDocument(rewardFrc, new vscode.Range(6, 12, 6, 16)); // selection around "ount"
        const symbol = getSelectedSymbol();
        assert.strictEqual(symbol, "ount");
    });
});

suite("Find Definition Tests", () => {
    vscode.window.showInformationMessage("Start findDefinition tests.");

    test("findDefinition resolves an enum member at scope depth 1", async () => {
        const { document } = await showFracasDocument(factionsFrc);
        const defs: FracasDefinition[] = await findDefinition(document, new vscode.Position(79, 46)); // cursor within "friendly" faction-stance
        assert.strictEqual(defs.length, 1, "single definition not found");
        assert.strictEqual(defs[0].kind, FracasDefinitionKind.enumMember, "type definition kind is not 'enum'");
        assert.strictEqual(defs[0].completionKind, vscode.CompletionItemKind.EnumMember, "type completion kind is not 'EnumMember'");
        assert.strictEqual(defs[0].symbol, "friendly");
        assert.strictEqual(defs[0].location.uri.fsPath, factionsFrc);
        assert.deepStrictEqual(defs[0].location.range, new vscode.Range(25, 3, 25, 11), "location of enum member is not correct");
    });

    test("findDefinition resolves an enum definition", async () => {
        const { document } = await showFracasDocument(factionsFrc);
        const defs: FracasDefinition[] = await findDefinition(document, new vscode.Position(59, 63)); // cursor within "faction-type"
        assert.strictEqual(defs.length, 1, "single definition not found");
        assert.strictEqual(defs[0].kind, FracasDefinitionKind.enum, "type definition kind is not 'enum'");
        assert.strictEqual(defs[0].completionKind, vscode.CompletionItemKind.Enum, "type completion kind is not 'Enum'");
        assert.strictEqual(defs[0].symbol, "faction-type");
        assert.strictEqual(defs[0].location.uri.fsPath, factionsFrc);
        assert.deepStrictEqual(defs[0].location.range, new vscode.Range(8, 13, 8, 25), "location of enum type is not correct");
    });

    test("findDefinition resolves a mask definition", async () => {
        const { document } = await showFracasDocument(factionsFrc);
        const defs: FracasDefinition[] = await findDefinition(document, new vscode.Position(59, 63)); // cursor within "faction-type"
        assert.strictEqual(defs.length, 1, "single definition not found");
        assert.strictEqual(defs[0].kind, FracasDefinitionKind.enum, "type definition kind is not 'enum'");
        assert.strictEqual(defs[0].completionKind, vscode.CompletionItemKind.Enum, "type completion kind is not 'Enum'");
        assert.strictEqual(defs[0].symbol, "faction-type");
        assert.strictEqual(defs[0].location.uri.fsPath, factionsFrc);
        assert.deepStrictEqual(defs[0].location.range, new vscode.Range(8, 13, 8, 25), "location of enum type is not correct");
    });

    test("findDefinition resolves a named parameter", async () => {
        const { document } = await showFracasDocument(abilityFrc);
        const defs: FracasDefinition[] = await findDefinition(document, new vscode.Position(42, 38)); // cursor within "#:net-playback-mode"
        assert.strictEqual(defs.length, 1, "single definition not found");
        assert.strictEqual(defs[0].kind, FracasDefinitionKind.keyword, "type definition kind is not 'parameter'");
        assert.strictEqual(defs[0].completionKind, vscode.CompletionItemKind.Keyword, "type completion kind is not 'Keyword'");
        assert.strictEqual(defs[0].symbol, "net-playback-mode");
        assert.strictEqual(defs[0].location.uri.fsPath, abilityActionDefinesFrc);
        assert.deepStrictEqual(defs[0].location.range, new vscode.Range(26, 32, 26, 49), "location of named parameter is not correct");
    });

    test("findDefinition resolves a field def", async () => {
        const { document } = await showFracasDocument(rewardFrc);
        const defs: FracasDefinition[] = await findDefinition(document, new vscode.Position(6, 9)); // selection at "#:count");
        assert.strictEqual(defs.length, 1, "single definition not found");
        assert.strictEqual(defs[0].kind, FracasDefinitionKind.keyword, "field definition kind is not 'field'");
        assert.strictEqual(defs[0].completionKind, vscode.CompletionItemKind.Keyword, "field completion kind is not 'Keyword'");
        assert.strictEqual(defs[0].symbol, "count");
        assert.strictEqual(defs[0].location.uri.fsPath, rewardFrc);
        assert.deepStrictEqual(defs[0].location.range, new vscode.Range(5, 9, 5, 14), "location of definition is not correct");
    });

    test("findDefinition resolves a type def", async () => {
        const { document } = await showFracasDocument(rewardFrc);
        const defs: FracasDefinition[] = await findDefinition(document, new vscode.Position(6, 21)); // cursor within "(range-int: ..."
        assert.strictEqual(defs.length, 1, "single definition not found");
        assert.strictEqual(defs[0].kind, FracasDefinitionKind.type, "type definition kind is not 'type'");
        assert.strictEqual(defs[0].completionKind, vscode.CompletionItemKind.Struct, "type completion kind is not 'Struct'");
        assert.strictEqual(defs[0].symbol, "range-int");
        assert.strictEqual(defs[0].location.uri.fsPath, rewardFrc);
        assert.deepStrictEqual(defs[0].location.range, new vscode.Range(1, 13, 1, 22), "location of definition is not correct");
    });

    test("findDefinition resolves a variant", async () => {
        const { document } = await showFracasDocument(abilityFrc);
        const defs: FracasDefinition[] = await findDefinition(document, new vscode.Position(4, 62)); // cursor within "action-block"
        assert.strictEqual(defs.length, 1, "single definition not found");
        assert.strictEqual(defs[0].kind, FracasDefinitionKind.variant, "type definition kind is not 'variant'");
        assert.strictEqual(defs[0].completionKind, vscode.CompletionItemKind.Struct, "type completion kind is not 'Struct'");
        assert.strictEqual(defs[0].symbol, "action-block");
        assert.strictEqual(defs[0].location.uri.fsPath, abilityActionDefinesFrc);
        assert.deepStrictEqual(defs[0].location.range, new vscode.Range(3, 16, 3, 28), "location of definition is not correct");
    });

    test("findDefinition resolves a variant option", async () => {
        const { document } = await showFracasDocument(abilityFrc);
        const defs: FracasDefinition[] = await findDefinition(document, new vscode.Position(4, 12)); // cursor within "action-block-targeted:"
        assert.strictEqual(defs.length, 1, "single definition not found");
        assert.strictEqual(defs[0].kind, FracasDefinitionKind.variantOption, "type definition kind is not 'variantOption'");
        assert.strictEqual(defs[0].completionKind, vscode.CompletionItemKind.Struct, "type completion kind is not 'Struct'");
        assert.strictEqual(defs[0].symbol, "action-block-targeted");
        assert.strictEqual(defs[0].location.uri.fsPath, abilityActionDefinesFrc);
        assert.deepStrictEqual(defs[0].location.range, new vscode.Range(5, 3, 5, 11), "location of definition is not correct");
    });

});
