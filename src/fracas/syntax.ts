import * as vscode from 'vscode';
import { flatten, mapAsync, uniqBy } from '../containers';
import { 
    findTextInFiles, 
    getRange, 
    getSelectedSymbol, 
    regexGroupDocumentLocation, 
    regexGroupUriLocation, 
    resolveSymbol, 
    searchBackward 
} from '../editor-lib';

export const KEYWORD_PREFIX = '#:';
export const RX_CHARS_OPEN_PAREN = '\\(|\\{|\\[';
export const RX_CHARS_CLOSE_PAREN = '\\)|\\}|\\]';
export const RX_CHARS_SPACE = '\\s|\\r|\\n';
export const RX_CHAR_IDENTIFIER = '[\\w\\-\\*\\.]';
export const RX_SYMBOLS_DEFINE = 'define-enum|define-game-data|define-key|define-text|define-mask|define-type-optional|define-syntax|define-type|define-variant|define';
export const RX_COMMENT = ';;?\\s*(.*)\\s*$';

export enum FracasDefinitionKind {
    enum,
    enumMember,
    gameData,
    key,
    text,
    mask,
    maskMember,
    typeOptional,
    type,
    variant,
    variantOption,
    syntax,
    define,
    keyword,
    unknown
}

export enum SearchKind {
    wholeMatch,
    partialMatch
}

export class FracasDefinition {

    /**
     * The location of the definition.
     */
    readonly location: vscode.Location;

    /**
     * The name of the type defined by this definition.
     */
    readonly symbol: string;

    /**
     * The type of definition -- enum, variant, mask, etc.
     */
    readonly kind: FracasDefinitionKind;

    readonly completionKind: vscode.CompletionItemKind;

    constructor(definition: vscode.Location, symbol: string, kind: FracasDefinitionKind) {
        this.location = definition;
        this.symbol = symbol;
        this.kind = kind;
        this.completionKind = completionKind(kind);
    }

}

function _anySymbolRx(symbol: string): string {
    return `(?<!${RX_CHAR_IDENTIFIER})(${_escapeForRegEx(symbol)})(?!${RX_CHAR_IDENTIFIER})`;
}

function _anyDefineRx(): string {
    return `(?<=[${RX_CHARS_OPEN_PAREN}])\\s*(${RX_SYMBOLS_DEFINE})\\s*[${RX_CHARS_OPEN_PAREN}]?\\s*(${RX_CHAR_IDENTIFIER}+)`;
}

function _anyDefineSymbolRx(symbol: string, searchKind = SearchKind.wholeMatch): string {
    return searchKind === SearchKind.wholeMatch ?
        `(?<=[${RX_CHARS_OPEN_PAREN}])\\s*(${RX_SYMBOLS_DEFINE})\\s*[${RX_CHARS_OPEN_PAREN}]?\\s*(${_escapeForRegEx(symbol)})(?!${RX_CHAR_IDENTIFIER})` :
        `(?<=[${RX_CHARS_OPEN_PAREN}])\\s*(${RX_SYMBOLS_DEFINE})\\s*[${RX_CHARS_OPEN_PAREN}]?\\s*(${_escapeForRegEx(symbol)}${RX_CHAR_IDENTIFIER}*)`;
}

function _anyEnumSymbolRx(symbol: string, searchKind = SearchKind.wholeMatch): string {
    return searchKind === SearchKind.wholeMatch ?
        `(?<=[${RX_CHARS_OPEN_PAREN}])\\s*(define-enum)\\s+(${_escapeForRegEx(symbol)})(?!${RX_CHAR_IDENTIFIER})` :
        `(?<=[${RX_CHARS_OPEN_PAREN}])\\s*(define-enum)\\s+(${_escapeForRegEx(symbol)}${RX_CHAR_IDENTIFIER}*)`;
}

function _anyMaskSymbolRx(symbol: string, searchKind = SearchKind.wholeMatch): string {
    return searchKind === SearchKind.wholeMatch ?
        `(?<=[${RX_CHARS_OPEN_PAREN}])\\s*(define-mask)\\s+(${_escapeForRegEx(symbol)})(?!${RX_CHAR_IDENTIFIER})` :
        `(?<=[${RX_CHARS_OPEN_PAREN}])\\s*(define-mask)\\s+(${_escapeForRegEx(symbol)}${RX_CHAR_IDENTIFIER}*)`;
}

function _enumMemberRx(): string {
    // extract the first identifier in the line, discarding leading whitespace and open parentheses
    return `^\\s*[${RX_CHARS_OPEN_PAREN}]?\\s*(${RX_CHAR_IDENTIFIER}+)`;
}
const ENUM_MEMBER_RX = new RegExp(_enumMemberRx());

function _anyConstructorRx(): string {
    return `(?<=[${RX_CHARS_OPEN_PAREN}])\\s*(${RX_CHAR_IDENTIFIER}+):`;
}

function _anyFieldSymbolDeclarationRx(fieldName: string, searchKind = SearchKind.wholeMatch): string {
    return searchKind === SearchKind.wholeMatch ?
        `(?<=^\\s*[${RX_CHARS_OPEN_PAREN}])\\s*(${_escapeForRegEx(fieldName)})(?!${RX_CHAR_IDENTIFIER})` :
        `(?<=^\\s*[${RX_CHARS_OPEN_PAREN}])\\s*(${_escapeForRegEx(fieldName)}${RX_CHAR_IDENTIFIER}*)`;
}

function _anyFieldDeclarationRx(): string {
    return `(?<=^\\s*[${RX_CHARS_OPEN_PAREN}])\\s*(?!define)(${RX_CHAR_IDENTIFIER}+)`;
}

function _anyNamedParamSymbolDeclarationRx(paramName: string, searchKind = SearchKind.wholeMatch): string {
    return searchKind === SearchKind.wholeMatch ?
        `(?<=#:)(${_escapeForRegEx(paramName)})(?!${RX_CHAR_IDENTIFIER})` :
        `(?<=#:)(${_escapeForRegEx(paramName)}${RX_CHAR_IDENTIFIER}*)`;
}

function _anyNamedParamDeclarationRx(): string {
    return `(?<=#:)(${RX_CHAR_IDENTIFIER}+)`;
}


function _anyMaskOrEnumRx(): string {
    return `(?<=[${RX_CHARS_OPEN_PAREN}])\\s*(mask|enum)\\s+(${RX_CHAR_IDENTIFIER}+)`;
}

function _anyIdentifierRx(fieldName: string, searchKind = SearchKind.wholeMatch): string {
    if (searchKind === SearchKind.wholeMatch) {
        return `(?<!${RX_CHAR_IDENTIFIER})(${_escapeForRegEx(fieldName)})(?!${RX_CHAR_IDENTIFIER})`;
    } else {
        // if the field name isn't empty, find anything starting with the name. Otherwise, find 1 or more identifier chars.
        const fieldExpr = fieldName ? `(${_escapeForRegEx(fieldName)}${RX_CHAR_IDENTIFIER}*)` : `(${RX_CHAR_IDENTIFIER}+)`;
        // // This ensures that identifiers appear either at the very beginning of an s-expression, e.g. "(some-identifier...)"
        // // or are naked identifiers (not enclosed within an s-expression), e.g. "some-identifier another-identifier third-id"
        // return `(?:[${RX_CHARS_OPEN_PAREN}]\\s*|[^${RX_CHARS_OPEN_PAREN}]*)${fieldExpr}`;
        return fieldExpr;
    }
}

function _variantOptionRx(symbol: string, searchKind = SearchKind.wholeMatch): string {
    // a variant option has a prefix for the variant type followed by the option name.
    // e.g., (define-variant action (movement-modifier-add ... ) appears as "action-movement-modifier-add".
    // Make an rx that drops one or more prefixes, and then match the rest of the string.
    const crumbs = _escapeForRegEx(symbol)
        .split('-') // "action-movement-modifier-add" -> ["action", "movement", "modifier", "add"]
        .filter(c => c.length > 0);		// remove dangling hyphens
    const optionRx = crumbs
        .slice(1, crumbs.length - 1) 		// -> ["movement", "modifier"]
        .map(s => `(${s}-)?`) 			// -> ["(movement-)?", "(modifier-)?"]
        .join('') + crumbs[crumbs.length - 1]; // -> "(movement-)?(modifier-)?add"

    return searchKind === SearchKind.wholeMatch ?
        `(?<=[${RX_CHARS_OPEN_PAREN}])\\s*(${optionRx})(?!${RX_CHAR_IDENTIFIER})` :
        `(?<=[${RX_CHARS_OPEN_PAREN}])\\s*(${optionRx})(${RX_CHAR_IDENTIFIER}*)`;
}

export function definitionKind(defToken: string): FracasDefinitionKind {
    switch (defToken) {
        case 'define-enum':
            return FracasDefinitionKind.enum;
        case 'define-game-data':
            return FracasDefinitionKind.gameData;
        case 'define-key':
            return FracasDefinitionKind.key;
        case 'define-text':
            return FracasDefinitionKind.text;
        case 'define-mask':
            return FracasDefinitionKind.mask;
        case 'define-type-optional':
            return FracasDefinitionKind.typeOptional;
        case 'define-syntax':
            return FracasDefinitionKind.syntax;
        case 'define-type':
            return FracasDefinitionKind.type;
        case 'define-variant':
            return FracasDefinitionKind.variant;
        case 'define':
            return FracasDefinitionKind.define;
        default:
            return FracasDefinitionKind.unknown;
    }
}

export function definitionMemberKind(typeKind: FracasDefinitionKind): FracasDefinitionKind {
    switch (typeKind) {
        case FracasDefinitionKind.enum:
            return FracasDefinitionKind.enumMember;
        case FracasDefinitionKind.mask:
            return FracasDefinitionKind.maskMember;
        case FracasDefinitionKind.variant:
            return FracasDefinitionKind.variantOption;
        default:
            return FracasDefinitionKind.keyword;
    }
}

export function completionKind(fracasKind: FracasDefinitionKind): vscode.CompletionItemKind {
    switch (fracasKind) {
        case (FracasDefinitionKind.enum):
        case (FracasDefinitionKind.mask):
                return vscode.CompletionItemKind.Enum;
        case (FracasDefinitionKind.enumMember):
        case (FracasDefinitionKind.maskMember):
                return vscode.CompletionItemKind.EnumMember;
        case (FracasDefinitionKind.gameData):
            return vscode.CompletionItemKind.Module;
        case (FracasDefinitionKind.key):
        case (FracasDefinitionKind.text):
            return vscode.CompletionItemKind.Variable;
        case (FracasDefinitionKind.typeOptional):
        case (FracasDefinitionKind.type):
        case (FracasDefinitionKind.variant):
        case (FracasDefinitionKind.variantOption):
            return vscode.CompletionItemKind.Struct;
        case (FracasDefinitionKind.syntax):
            return vscode.CompletionItemKind.Unit;
        case (FracasDefinitionKind.define):
            return vscode.CompletionItemKind.Function;
        case (FracasDefinitionKind.keyword):
            return vscode.CompletionItemKind.Keyword;
        case (FracasDefinitionKind.unknown):
        default:
            return vscode.CompletionItemKind.Unit;
    }
}

export function symbolKind(fracasKind: FracasDefinitionKind): vscode.SymbolKind {
    switch (fracasKind) {
        case (FracasDefinitionKind.enum):
        case (FracasDefinitionKind.mask):
                return vscode.SymbolKind.Enum;
        case (FracasDefinitionKind.enumMember):
        case (FracasDefinitionKind.maskMember):
                return vscode.SymbolKind.EnumMember;
        case (FracasDefinitionKind.gameData):
            return vscode.SymbolKind.Module;
        case (FracasDefinitionKind.key):
        case (FracasDefinitionKind.text):
            return vscode.SymbolKind.Variable;
        case (FracasDefinitionKind.typeOptional):
        case (FracasDefinitionKind.type):
        case (FracasDefinitionKind.variant):
        case (FracasDefinitionKind.variantOption):
            return vscode.SymbolKind.Struct;
        case (FracasDefinitionKind.syntax):
            return vscode.SymbolKind.Operator;
        case (FracasDefinitionKind.define):
            return vscode.SymbolKind.Function;
        case (FracasDefinitionKind.keyword):
            return vscode.SymbolKind.Field;
        case (FracasDefinitionKind.unknown):
        default:
            return vscode.SymbolKind.Null;
    }
}


/**
 * Get the nesting depth at which members are declared for a fracas type definition (e.g., enum, variant, type, etc.).
 * For example, the following fracas type definition has two open parens before the first member, max-targets:
 * (define-type targeting-data
 *   ((max-targets int #:default -1)
 *    (gather targeting-gather)
 *    ; snip
 *   )
 * )
 * ... but a variant definition has only one open paren:
 * (define-variant action (movement-modifier-add ... ))
 * @param fracasKind The fracas type in which members are declared.
 * @returns The nesting depth at which to search for member declarations.
 */
function _memberScopeDepth(fracasKind: FracasDefinitionKind): vscode.CompletionItemKind {
    switch (fracasKind) {
        case (FracasDefinitionKind.define):
            return 0;
        case (FracasDefinitionKind.syntax):
        case (FracasDefinitionKind.variant):
        case (FracasDefinitionKind.key):
        case (FracasDefinitionKind.text):
        case (FracasDefinitionKind.enum):
        case (FracasDefinitionKind.mask):
            return 1;
        case (FracasDefinitionKind.variantOption):
        case (FracasDefinitionKind.gameData):
        case (FracasDefinitionKind.typeOptional):
        case (FracasDefinitionKind.type):
        case (FracasDefinitionKind.keyword):
        case (FracasDefinitionKind.unknown):
        default:
            return 2;
    }
}

function _memberDeclRx(
    fracasKind: FracasDefinitionKind,
    memberName: string,
    searchKind: SearchKind = SearchKind.wholeMatch
): RegExp {
    switch (fracasKind) {
        case (FracasDefinitionKind.define):
            return new RegExp(memberName ? 
                _anyNamedParamSymbolDeclarationRx(memberName, searchKind) :
                _anyNamedParamDeclarationRx(), 
                "g");
        case (FracasDefinitionKind.key):
        case (FracasDefinitionKind.text):
        case (FracasDefinitionKind.enum):
        case (FracasDefinitionKind.mask):
            return new RegExp(_anyIdentifierRx(memberName, searchKind), "g");
        case (FracasDefinitionKind.syntax):
        case (FracasDefinitionKind.variant):
        case (FracasDefinitionKind.variantOption):
        case (FracasDefinitionKind.gameData):
        case (FracasDefinitionKind.typeOptional):
        case (FracasDefinitionKind.type):
        case (FracasDefinitionKind.keyword):
        case (FracasDefinitionKind.unknown):
        default:
            return new RegExp(memberName ?
                _anyFieldSymbolDeclarationRx(memberName, searchKind) :
                _anyFieldDeclarationRx());
    }
}

export async function findComment(uri: vscode.Uri, position: vscode.Position): Promise<string> {
    const document = await vscode.workspace.openTextDocument(uri);

    // find comment at the end of the current line
    const line = document.lineAt(position.line);
    let match = line.text.match(RX_COMMENT);
    let comment = '';
    if (match) {
        comment = match[1];
    }

    // search backward for full-line comments, prepending to the existing comment.
    const lineCommentRx = new RegExp(`^\\s*${RX_COMMENT}`);
    for (let lineNo = position.line - 1; lineNo >= 0; --lineNo) {
        const lineText = document.lineAt(lineNo).text;
        match = lineCommentRx.exec(lineText);
        if (match) {
            comment = match[1] + '\n' + comment;
        } else if (/\S/.test(lineText)) {
            break; // found non-comment, non-whitespace, so stop searching
        }
    }

    return comment;
}

export function findOpenBracket(
    document: vscode.TextDocument,
    pos: vscode.Position,
    includeBrackets = true
): vscode.Position {
    // first rewind to opening bracket
    let nesting = 0;
    for (let lineNo = pos.line; lineNo >= 0; --lineNo) {
        const line = document.lineAt(lineNo);

        // pre-strip comments as we'll be scanning the string from end to start
        const nonCommentMatch = /([^;])*/.exec(line.text);
        const textBeforeComment = nonCommentMatch ? nonCommentMatch[0] : line.text;

        // scan backward from end of line to find opening bracket
        for (let charNo = (lineNo === pos.line ? pos.character : line.range.end.character); charNo >= line.range.start.character; --charNo) {
            const c = textBeforeComment[charNo];
            if (c === '(' || c === '[' || c === '{') {
                nesting += 1;
                if (nesting >= 1) {
                    const openParen = new vscode.Position(lineNo, charNo);
                    if (includeBrackets) {
                        return openParen;
                    } else {
                        return document.positionAt(document.offsetAt(openParen) + 1);
                    }
                }
            } else if (c === ')' || c === ']' || c === '}') {
                nesting -= 1;
            }
        }
    }
    return new vscode.Position(0, 0);
}

export function findBracketPair(
    document: vscode.TextDocument,
    pos: vscode.Position,
    includeBrackets = true
): vscode.Range {
    // first rewind to opening bracket
    const openParen = findOpenBracket(document, pos, includeBrackets);
    let nesting = includeBrackets ? 0 : 1; // if we're not including the brackets, we're already one nesting deep

    // scan forward from opening bracket to closing bracket
    for (let lineNo = openParen.line; lineNo < document.lineCount; ++lineNo) {
        const line = document.lineAt(lineNo);
        for (let charNo = (lineNo === openParen.line ? openParen.character : line.range.start.character); charNo <= line.range.end.character; ++charNo) {
            const c = line.text[charNo];
            if (c === ';') {
                break; // skip comment
            } else if (c === '(' || c === '[' || c === '{') {
                nesting += 1;
            } else if (c === ')' || c === ']' || c === '}') {
                nesting -= 1;
                if (nesting <= 0) {
                    let closeParen = new vscode.Position(lineNo, charNo);
                    if (!includeBrackets) {
                        closeParen = document.positionAt(document.offsetAt(closeParen) - 1);
                    }
                }
            }
        }
    }
    return new vscode.Range(openParen, new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).range.end.character));
}

function _rangesAtScope(
    document: vscode.TextDocument,
    pos: vscode.Position,
    scopeNestingDepth: number
): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    // first rewind to opening bracket
    const startPos = findOpenBracket(document, pos, false);
    let topExprPos = startPos;
    let nesting = 1; // if we're not including the brackets, we're already one nesting deep

    // scan forward looking for s-expressions with an opening bracket at the right nesting depth.
    for (let lineNo = startPos.line; lineNo < document.lineCount; ++lineNo) {
        const line = document.lineAt(lineNo);
        for (let charNo = (lineNo === startPos.line ? startPos.character : line.range.start.character); charNo < line.range.end.character; ++charNo) {
            const c = line.text[charNo];
            if (c === ';') {
                break; // skip comment
            } else if (c === '(' || c === '[' || c === '{') {
                if (nesting === scopeNestingDepth) { // only include lines that appear at top-level scope.
                    topExprPos = new vscode.Position(lineNo, charNo);
                }
                nesting += 1;
            } else if (c === ')' || c === ']' || c === '}') {
                nesting -= 1;
                if (nesting === scopeNestingDepth) { // only include lines that appear at top-level scope.
                    ranges.push(new vscode.Range(topExprPos, new vscode.Position(lineNo, charNo)));
                } else if (nesting <= 0) {
                    return ranges;
                }
            }
        }
    }
    return ranges;
}

export async function findEnclosingDefine(uri: vscode.Uri, pos: vscode.Position
): Promise<FracasDefinition | undefined> {
    const searchRx = new RegExp(_anyDefineRx(), "g");
    const result = await searchBackward(uri, pos, searchRx);
    if (result) {
        const {line, match} = result;
        const [_, defToken, symbol] = match;
        const defineLoc = await regexGroupUriLocation(uri, match, line.range.start, 2 /* rx group for the symbol */);
        return new FracasDefinition(defineLoc, symbol, definitionKind(defToken));
    }
    return undefined;
}

export async function findEnclosingConstructor(document: vscode.TextDocument, pos: vscode.Position
): Promise<{location: vscode.Location, typeName: string} | undefined> {
    const openParen = findOpenBracket(document, pos);
    const searchRx = new RegExp(_anyConstructorRx());
    const result = searchRx.exec(document.getText(new vscode.Range(openParen, pos)));
    if (result) {
        const [_, typeName] = result;
        const location = new vscode.Location(document.uri, openParen.translate({ characterDelta: result.index }));
        return {location, typeName};
    }
    return undefined;
}

export async function findEnclosingEnumOrMask(document: vscode.TextDocument, pos: vscode.Position
): Promise<FracasDefinition | undefined> {
    const openParen = findOpenBracket(document, pos);
    const searchRx = new RegExp(_anyMaskOrEnumRx());
    const result = searchRx.exec(document.getText(new vscode.Range(openParen, pos)));
    if (result) {
        const [_, typeDecl, typeName] = result;
        const fracasKind = typeDecl === "enum" ? FracasDefinitionKind.enum : FracasDefinitionKind.mask;
        const location = regexGroupDocumentLocation(document, result, openParen, 2 /* rx group for the enum name */);
        return new FracasDefinition(location, typeName, fracasKind);
    }
    return undefined;
}

export async function isWithinVariant(
    uri: vscode.Uri, pos: vscode.Position, variantName: string
): Promise<boolean> {
    const fracasDef = await findEnclosingDefine(uri, pos);
    return fracasDef !== undefined
        && fracasDef.kind === FracasDefinitionKind.variant
        && fracasDef.symbol === variantName;
}

export async function findSymbolDefinition(
    typeName: string,
    token?: vscode.CancellationToken,
    searchKind = SearchKind.wholeMatch
): Promise<FracasDefinition[]> {
    typeName = typeName.replace(/(^-)|(-$)/g, ''); // trim leading/trailing hyphen
    const defineRxStr = _anyDefineSymbolRx(typeName, searchKind);
    return _findDefinition(defineRxStr, token);
}

export async function findEnumDefinition(
    typeName: string,
    token?: vscode.CancellationToken,
    searchKind = SearchKind.wholeMatch
): Promise<FracasDefinition[]> {
    const defineRxStr = _anyEnumSymbolRx(typeName, searchKind);
    return _findDefinition(defineRxStr, token);
}

export async function findMaskDefinition(
    typeName: string,
    token?: vscode.CancellationToken,
    searchKind = SearchKind.wholeMatch
): Promise<FracasDefinition[]> {
    const defineRxStr = _anyMaskSymbolRx(typeName, searchKind);
    return _findDefinition(defineRxStr, token);
}

async function _findDefinition(
    defineRxStr: string,
    token?: vscode.CancellationToken
): Promise<FracasDefinition[]> {
    // search for an explicit define-xxx matching the token, e.g., given "module-db" find "(define-type module-db"
    const textMatches = await findTextInFiles(defineRxStr, token);
    console.debug(`Found ${textMatches.length} matches for ${defineRxStr}`);
    const defs = await mapAsync(textMatches, async textMatch => {
        // extract the symbol name substring, e.g. get "range-int" from "(define-type range-int"
        const rxMatch = new RegExp(defineRxStr).exec(textMatch.preview.text);
        if (rxMatch) {
            const [_, defToken, symbol] = rxMatch;
            const location = await regexGroupUriLocation(textMatch.uri, rxMatch, getRange(textMatch.ranges).start, 2);
            return new FracasDefinition(location, symbol, definitionKind(defToken));
        } else {
            console.warn(`Failed to extract symbol name from ${textMatch.preview.text} using regex '${defineRxStr}'. An engineer should check that the regex is correct.`);
            const location = new vscode.Location(textMatch.uri, getRange(textMatch.ranges));
            return new FracasDefinition(location, textMatch.preview.text, definitionKind("define"));
        }
    });
    return defs;
}

export async function findVariantOptionDefinition(
    qualifiedVariant: string,
    token?: vscode.CancellationToken,
    searchKind = SearchKind.wholeMatch
): Promise<FracasDefinition[]> {
    // given a fully qualified "action-movement-modifier-add" find "(movement-modifier-add ... )"
    const variantOptionRxStr = _variantOptionRx(qualifiedVariant, searchKind);
    const variantRx = new RegExp(variantOptionRxStr);
    const textMatches = await findTextInFiles(variantOptionRxStr, token);

    // discard results that are not within a define-variant that matches the remainder of the symbol.
    // i.e. check that a "(saved-actor ...)" variant option found when searching for "targeting-saved-actor"
    // is enclosed within  (define-variant targeting ...)
    const variantDefs = await mapAsync(textMatches, async result => {
        let bMatchingVariant = false;
        // extract the variant option name from the match, e.g. "action-movement-modifier-add" -> "movement-modifier-add"
        const variantRxMatch = variantRx.exec(result.preview.text);
        if (variantRxMatch) {
            // extract the variant name from the option, e.g. "action-movement-modifier-add" -> "action"
            const [variantOptionName, variantPartialMatch] = variantRxMatch;
            const variantName = qualifiedVariant.substring(0, qualifiedVariant.length - (variantPartialMatch.length + 1));
            const startPos = getRange(result.ranges).start;
            bMatchingVariant = await isWithinVariant(result.uri, startPos, variantName);
            if (bMatchingVariant) {
                const location = new vscode.Location(result.uri, getRange(result.ranges));
                return new FracasDefinition(location, `${variantName}-${variantOptionName}`, FracasDefinitionKind.variantOption);
            }
            // console.log(`"${variantName}" ${bMatchingVariant ? "FOUND in" : "not found in "} ${result.uri.path.substring(result.uri.path.lastIndexOf('/')+1)}:${startPos.line}: ${result.preview.text}`);
        }
        return undefined;
    });
    // console.log(results);

    return variantDefs.filter(x => x !== undefined) as FracasDefinition[];
}

export async function findKeywordDefinition(
    referencingDocument?: vscode.TextDocument,
    documentSelection?: vscode.Range,
    token?: vscode.CancellationToken,
    searchKind: SearchKind = SearchKind.wholeMatch
): Promise<FracasDefinition[]> {
    const activeEditor = vscode.window.activeTextEditor;
    referencingDocument = referencingDocument || activeEditor?.document;
    documentSelection = documentSelection || activeEditor?.selection;
    if (!referencingDocument || !documentSelection) {
        return [];
    }

    const keyword = referencingDocument.getText(documentSelection);
    if (!keyword.startsWith(KEYWORD_PREFIX)) {
        return [];
    }

    // find the constructor in which this field is declared
    const constructorMatch = await findEnclosingConstructor(referencingDocument, documentSelection.start);
    if (!constructorMatch) {
        return [];
    }

    // find the type definition matching the constructor
    const {typeName} = constructorMatch;
    let symbolDefs = await findSymbolDefinition(typeName, token);
    if (symbolDefs.length === 0) {
        symbolDefs = await findVariantOptionDefinition(typeName, token);
    }

    // find the field declarations in the type definition
    const fieldDecls = await mapAsync(symbolDefs, async typeDef => {
        return await findMembers(typeDef, token, keyword.substring(KEYWORD_PREFIX.length), searchKind);
    });
    return flatten(fieldDecls);
}

export async function findEnumOrMaskMembers(
    referencingDocument?: vscode.TextDocument,
    documentPosition?: vscode.Position,
    enumMemberOrTypeName?: string,
    token?: vscode.CancellationToken,
    searchKind: SearchKind = SearchKind.wholeMatch
): Promise<FracasDefinition[]> {
    const activeEditor = vscode.window.activeTextEditor;
    referencingDocument = referencingDocument || activeEditor?.document;
    documentPosition = documentPosition || activeEditor?.selection?.active;
    if (!referencingDocument || !documentPosition) {
        return [];
    }

    // if the symbol is the beginning of (mask foo thing... or (enum bar thing...
    // then try to auto-complete from the enum/mask definition
    const enclosingEnum = await findEnclosingEnumOrMask(referencingDocument, documentPosition);
    if (!enclosingEnum) {
        return [];
    }

    const results: FracasDefinition[] = [];
    // find the definition of the enum/mask
    const enumDefs = enclosingEnum.kind === FracasDefinitionKind.enum ?
        await findEnumDefinition(enclosingEnum.symbol, token, SearchKind.partialMatch) :
        await findMaskDefinition(enclosingEnum.symbol, token, SearchKind.partialMatch);
    await mapAsync(enumDefs, async enumDef => {
        // add matching enum values to the list
        const enumMembers = await findMembers(enumDef, token, enumMemberOrTypeName, searchKind);

        // add the define-enum type definition to the results if it matches.
        if (enumMemberOrTypeName && _symbolsMatch(enumMemberOrTypeName, enumDef.symbol, searchKind)) {
            results.push(enumDef);
        }
        results.push(...enumMembers);
    });

    return results;
}

function _symbolsMatch(partialSymbol: string | undefined, symbolToMatch: string, searchKind: SearchKind): boolean {
    if (searchKind === SearchKind.wholeMatch) {
        return partialSymbol === symbolToMatch;
    } else {
        // "undefined" matches anything, otherwise match on the beginning of the symbol
        return !partialSymbol || symbolToMatch.startsWith(partialSymbol);
    }
}

export async function findDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token?: vscode.CancellationToken,
    searchKind: SearchKind = SearchKind.wholeMatch
): Promise<FracasDefinition[]> {
    const keywords: FracasDefinition[] = await findKeywordDefinition(
        document, new vscode.Range(position, position), token, searchKind);
    if (keywords.length > 0) {
        return keywords;
    }

    // git the symbol at the cursor
    const symbol = getSelectedSymbol(document, position);

    // if the cursor is within a (mask ...) or (enum ...) declaration, search for matching enum members
    const enumMembers = await findEnumOrMaskMembers(document, position, symbol, token, searchKind);
    if (enumMembers.length > 0) {
        return enumMembers;
    }

    // search for an explicit define-xxx matching the token, e.g., given "module-db" find "(define-type module-db"
    const symbolDefs = await findSymbolDefinition(symbol, token, searchKind);
    if (symbolDefs.length > 0) {
        return symbolDefs;
    }

    // search for a variant option matching the symbol
    // given a fully qualified "action-movement-modifier-add" find "(movement-modifier-add ... )"
    const variantOptionDefs = await findVariantOptionDefinition(symbol, token, searchKind);

    return variantOptionDefs;
}

export async function findReferences(
    referencingDocument?: vscode.TextDocument,
    referencingPosition?: vscode.Position,
    token?: vscode.CancellationToken
): Promise<vscode.Location[]> {
    const activeEditor = vscode.window.activeTextEditor;
    referencingDocument = referencingDocument || activeEditor?.document;
    referencingPosition = referencingPosition || activeEditor?.selection.anchor;
    if (!referencingDocument || !referencingPosition) {
        return [];
    }
    
    const symbol = getSelectedSymbol(referencingDocument, referencingPosition);
        // Do a dumb search for all text matching the symbol
    const symbolRx = _anySymbolRx(symbol);
    const results = await findTextInFiles(symbolRx, token);

    // if the symbol is part of a variant, search for the full variant option name. E.g. if the cursor is
    // on (combat-focus ()) within (define-variant targeting-gather ...), search for "targeting-gather-combat-focus"
    const fracasDef = await findEnclosingDefine(referencingDocument.uri, referencingPosition);
    if (fracasDef?.kind === FracasDefinitionKind.variant) {
        const variantOption = `${fracasDef.symbol}-${symbol}`;
        const variantResults = await findTextInFiles(_anySymbolRx(variantOption), token);
        results.push(...variantResults);
    }

    // convert results from TextSearchMatch to Location
    const links = results.map(result =>
        new vscode.Location(result.uri, getRange(result.ranges)));
    return links;
}

export async function findDocumentSymbols(
    uri: vscode.Uri, token?: vscode.CancellationToken
): Promise<vscode.DocumentSymbol[]> {
    const defineRxStr = _anyDefineRx();
    const defineRx = new RegExp(defineRxStr);
    const textMatches = await findTextInFiles(defineRxStr, token, uri.fsPath);
    const symbols = textMatches.map(searchMatch => {
        const rxMatch = defineRx.exec(searchMatch.preview.text);
        const [_, defToken, typeName] = rxMatch || [undefined, undefined, searchMatch.preview.text];
        const symbol = new vscode.DocumentSymbol(
            typeName || 'unknown',
            searchMatch.preview.text,
            symbolKind(definitionKind(defToken || 'define')),
            getRange(searchMatch.ranges),
            getRange(searchMatch.ranges)
        );
        return symbol;
    });
    return symbols;
}

export async function findCompletions(
    document: vscode.TextDocument,
    position: vscode.Position,
    token?: vscode.CancellationToken
): Promise<vscode.CompletionItem[] | null> {
    const completions = await _findCompletionsNonUnique(document, position, token);
    return completions ? uniqBy(completions, c => c.label) : null; // .sort((a, b) => Number(a > b)) : null;
}
async function _findCompletionsNonUnique(
    document: vscode.TextDocument,
    position: vscode.Position,
    token?: vscode.CancellationToken
): Promise<vscode.CompletionItem[] | null> {
        // get the word at the cursor
    const resolvedSymbol = resolveSymbol(document, position);
    if (!resolvedSymbol) {
        return null;
    }

    // truncate the partial word at the cursor position
    const symbolRange = new vscode.Range(resolvedSymbol.range.start, position);
    const symbol = resolvedSymbol.document.getText(symbolRange);

    // if the symbol is the beginning of (mask foo thing... or (enum bar thing...
    // then try to auto-complete from the enum/mask definition
    const enumMatches = await findEnumOrMaskMembers(document, position, symbol, token, SearchKind.partialMatch);
    if (enumMatches.length > 0) {
        const enumCompletions = await _toCompletionItems(enumMatches, '', resolvedSymbol.range);
        return enumCompletions;
    } 

    // try to auto-complete a member field name
    if (symbol.startsWith(KEYWORD_PREFIX)) {
        // do a partial match of all field definitions matching the symbol under the cursor
        const keywordDefs = await findKeywordDefinition(
            resolvedSymbol.document, symbolRange, token, SearchKind.partialMatch);
        if (keywordDefs.length === 0) {
            return null;
        }

        const keywordCompletions = await _toCompletionItems(
            keywordDefs, KEYWORD_PREFIX, resolvedSymbol.range);
        console.debug(`Found ${keywordCompletions.length} keywords for ${symbol}`);
        return keywordCompletions;
    } 

    // don't try to complete type definitions until at least three characters are typed
    if (position.character - resolvedSymbol.range.start.character < 3) {
        return null;
    }

    const completionItems: vscode.CompletionItem[] = [];
    // search for an explicit define-xxx matching the token, e.g., given "module-db" find "(define-type module-db"
    const typeDefs = await findSymbolDefinition(symbol, token, SearchKind.partialMatch);
    if (typeDefs.length === 0) {
        return null;
    }
    
    // add the type definitions as completion items, e.g. "targeting-ga" => "targeting-gather"
    const typeCompletions = await _toCompletionItems(typeDefs, '', resolvedSymbol.range);

    // also suggest variant options as completions for matching variant types.
    // e.g., targeting-gat => targeting-gather-self, targeting-gather-saved-actor, etc.
    const variantDefs = typeDefs.filter(x => x.kind === FracasDefinitionKind.variant);
    const variantOptionCompletions = flatten(await mapAsync(variantDefs, async variantDef => {
        const options = await findMembers(variantDef, token);
        const optionCompletions = await _toCompletionItems(options, `${variantDef.symbol}-`, resolvedSymbol.range);
        return optionCompletions;
    }));

    console.debug(`Found ${typeDefs.length} types and ${variantOptionCompletions.length} variant options for ${symbol}`);
    completionItems.push(...typeCompletions);
    completionItems.push(...variantOptionCompletions);

    // find variant options matching the symbol, e.g. targeting-gather-sa => targeting-gather-saved-actor
    const variantOptions = await findVariantOptionDefinition(symbol, token, SearchKind.partialMatch);
    const variantCompletions = await _toCompletionItems(variantOptions, '', resolvedSymbol.range);
    console.debug(`Found ${variantOptionCompletions.length} variant options for ${symbol}`);

    completionItems.push(...variantCompletions);
    return completionItems;
}

async function _toCompletionItems(
    definitions: FracasDefinition[], prefix: string, replaceRange: vscode.Range
): Promise<vscode.CompletionItem[]> {
    const completionItems: vscode.CompletionItem[] = await mapAsync(definitions, async definition => {
        const item = new vscode.CompletionItem(`${prefix}${definition.symbol}`, definition.completionKind);
        item.documentation = await findComment(definition.location.uri, definition.location.range.start);
        item.range = replaceRange;
        return item;
    });
    return completionItems;
}

export async function findMembers(
    fracasDef: FracasDefinition,
    token?: vscode.CancellationToken,
    memberName?: string,
    searchKind: SearchKind = SearchKind.wholeMatch
): Promise<FracasDefinition[]> {
    const document = await vscode.workspace.openTextDocument(fracasDef.location.uri);
    
    // find the text ranges of all member declarations 
    const scopeNestingDepth = _memberScopeDepth(fracasDef.kind);
    const ranges = await _rangesAtScope(document, fracasDef.location.range.start, scopeNestingDepth);

    // Only the first s-expression in a function definition contains members, e.g.
    // (define (some-function #:first-param (...) #:second-param (...)) (|# function-body #|))
    // the rest of the s-expressions are just the function body.
    if (fracasDef.kind === FracasDefinitionKind.define) {
        ranges.splice(1); // drop all but the first s-expression
    }

    // find members that match the given name
    const members: FracasDefinition[] = [];
    if (fracasDef.kind === FracasDefinitionKind.enum || fracasDef.kind === FracasDefinitionKind.mask) 
    {
        // short-circuit for enum and mask members: this is a hacky workaround because mask 
        // members may be naked identifiers, or may be s-expressions that contain a single identifier with 
        // metadata. It's impossible to write a single regexp that handles both.
        for (const range of ranges) {
            const enumMembers = _findEnumMembers(
                document, range, definitionMemberKind(fracasDef.kind), searchKind, memberName);
            members.push(...enumMembers);
        }
    } else { // for types other than enums and masks, use the regexp to find members
        const fieldRx = _memberDeclRx(fracasDef.kind, memberName || '', searchKind);
        for (const range of ranges) {
            // search at this scope for members
            const expr = document.getText(range);
            for (let match = fieldRx.exec(expr); match; match = fieldRx.global ? fieldRx.exec(expr) : null) {
                const rxGroupIndex = 1;
                const memberName = match[rxGroupIndex];
                const loc = regexGroupDocumentLocation(document, match, range.start, rxGroupIndex);
                members.push(new FracasDefinition(loc, memberName, definitionMemberKind(fracasDef.kind)));
            }
        }
    }

    return members;
}

function _findEnumMembers(
    document: vscode.TextDocument,
    enumBodyRange: vscode.Range,
    enumMemberKind: FracasDefinitionKind,
    searchKind: SearchKind,
    nameToSearchFor?: string
): FracasDefinition[] {
    const enumBody = document.getText(enumBodyRange);
    const newlineRx = /\r?\n/g;
    const enumMembers = [];
    let lineMatch;
    let lineStartPos = 0;
    do {
        // extract the next line
        lineMatch = newlineRx.exec(enumBody);
        const lineEndPos = lineMatch ? (lineMatch.index + lineMatch[0].length) : enumBody.length;
        const line = enumBody.substring(lineStartPos, lineEndPos);
        
        // extract first identifier from the line. Discard leading space and parentheses
        const enumMemberMatch = ENUM_MEMBER_RX.exec(line);
        
        // if the enum member matches the given memberName, add it to the list of members
        if (enumMemberMatch && _symbolsMatch(nameToSearchFor, enumMemberMatch[1], searchKind)) {
            const enumMemberName = enumMemberMatch[1];
            const enumMemberPos = document.positionAt(document.offsetAt(enumBodyRange.start) + lineStartPos + line.indexOf(enumMemberName));
            const loc = new vscode.Location(document.uri, new vscode.Range(enumMemberPos, enumMemberPos.translate(0, enumMemberName.length)));
            enumMembers.push(new FracasDefinition(loc, enumMemberName, enumMemberKind));
        }

        lineStartPos = lineEndPos;
    } while (lineMatch);

    return enumMembers;
}

function _escapeForRegEx(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
