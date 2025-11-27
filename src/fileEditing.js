
// Helper to remove strings and comments to avoid false positives in brace counting
function stripCommentsAndStrings(code) {
    // Includes support for template literals (backticks)
    return code.replace(/\/\/.*|\/\*[\s\S]*?\*\/|(["'`])(?:(?=(\\?))\2.)*?\1/g, match => {
        // Replace strings and comments with spaces of same length
        return ' '.repeat(match.length);
    });
}

function find_symbol(symbol_name, file_path, contextVariant) {
    // contextVariant: The Variant object (e.g. BotMessage) we are working on.

    let files = contextVariant ? contextVariant.files : (chat.variant ? chat.variant.files : []);

    let content = "";
    if (file_path) {
        const file = files.find(f => f.name === file_path);
        if (file) {
            content = file.content;
        } else {
             return "File not found: " + file_path;
        }
    } else {
        // Default to the first file
        content = files[0]?.content || "";
    }

    const lines = content.split('\n');
    let result = "";

    // Improved regex to handle 'export', 'async', and class methods without 'function' keyword
    // Matches:
    // class X
    // function X
    // const/let/var X
    // X() { ... } inside class (heuristically, looks like 'identifier(')
    // async X
    // public/private/protected X

    const regex = new RegExp(`(?:export\\s+)?(?:async\\s+)?(?:public\\s+|private\\s+|protected\\s+)?(?:class|function|const|let|var|\\b${symbol_name}\\s*\\()\\s*${symbol_name}\\b|\\b${symbol_name}\\s*\\(`);
    // Actually, for class methods like 'update()', the line looks like 'update() {' or 'async update() {'
    // The previous regex expected a keyword before it.

    // Let's broaden the search but filter carefully.
    // We look for the symbol followed by '(', '=', or space?

    for (let i = 0; i < lines.length; i++) {
        // Strip comments/strings before checking
        const cleanLine = stripCommentsAndStrings(lines[i]);

        // Check for definition patterns
        // 1. Keyword definition: (class|function|const|let|var) name
        // 2. Class method: name(args) {
        // 3. Arrow function: const name = ...

        const keywordPattern = new RegExp(`\\b(?:class|function|const|let|var)\\s+${symbol_name}\\b`);
        const methodPattern = new RegExp(`\\b${symbol_name}\\s*\\(`);

        if (keywordPattern.test(cleanLine) || (methodPattern.test(cleanLine) && cleanLine.includes('{'))) {
             // Avoid matching calls like 'foo()' by ensuring it has '{' on the same line OR we might need to check if it's a definition.
             // But inside a class, 'foo() {' is a definition. 'foo();' is a call. 'this.foo()' is a call.
             // If it starts with 'this.', it's likely a call.

             if (methodPattern.test(cleanLine) && cleanLine.trim().startsWith('this.')) continue;
             if (methodPattern.test(cleanLine) && cleanLine.trim().startsWith('super.')) continue;
             // Also avoid 'new Name()'
             if (new RegExp(`new\\s+${symbol_name}\\s*\\(`).test(cleanLine)) continue;

             result += `Found definition of '${symbol_name}' at line ${i + 1}:\n${lines[i]}\n`;
        }
    }

    if (!result) {
        return `Symbol '${symbol_name}' not found.`;
    }

    return result;
}

function find_referencing_symbols(symbol_name, file_path, contextVariant) {
    let files = contextVariant ? contextVariant.files : (chat.variant ? chat.variant.files : []);

    let content = "";
    if (file_path) {
        const file = files.find(f => f.name === file_path);
        if (file) {
            content = file.content;
        } else {
             return "File not found: " + file_path;
        }
    } else {
        content = files[0]?.content || "";
    }

    const lines = content.split('\n');
    let result = "";

    const regex = new RegExp(`\\b${symbol_name}\\b`);

    for (let i = 0; i < lines.length; i++) {
        const cleanLine = stripCommentsAndStrings(lines[i]);
        if (regex.test(cleanLine)) {
             // Exclude simple definitions
             const keywordPattern = new RegExp(`\\b(?:class|function|const|let|var)\\s+${symbol_name}\\b`);
             if (!keywordPattern.test(cleanLine)) {
                 result += `Reference to '${symbol_name}' at line ${i + 1}:\n${lines[i]}\n`;
             }
        }
    }
     if (!result) {
        return `No references to '${symbol_name}' found.`;
    }
    return result;
}


function insert_after_symbol(symbol_name, code_to_insert, file_path, contextVariant) {
    let files = contextVariant ? contextVariant.files : (chat.variant ? chat.variant.files : []);
    let file = null;

    if (file_path) {
        file = files.find(f => f.name === file_path);
    } else {
        file = files[0];
    }

    if (!file) return "File not found.";

    let content = file.content;
    const lines = content.split('\n');
    let insertLineIndex = -1;

    let foundStart = false;
    let braceCount = 0;
    let startedCounting = false;

    for (let i = 0; i < lines.length; i++) {
        const cleanLine = stripCommentsAndStrings(lines[i]);

        // Logic to find the start of the symbol definition
        const keywordPattern = new RegExp(`\\b(?:class|function|const|let|var)\\s+${symbol_name}\\b`);
        const methodPattern = new RegExp(`\\b${symbol_name}\\s*\\(`);

        let isDef = false;
        if (!foundStart) {
            if (keywordPattern.test(cleanLine)) isDef = true;
            else if (methodPattern.test(cleanLine) && cleanLine.includes('{')) {
                if (!cleanLine.trim().startsWith('this.') && !cleanLine.trim().startsWith('super.') && !new RegExp(`new\\s+${symbol_name}\\s*\\(`).test(cleanLine)) {
                    isDef = true;
                }
            }

            if (isDef) foundStart = true;
        }

        if (foundStart) {
            const openBraces = (cleanLine.match(/{/g) || []).length;
            const closeBraces = (cleanLine.match(/}/g) || []).length;

            if (openBraces > 0) startedCounting = true;

            braceCount += openBraces - closeBraces;

            if (startedCounting && braceCount === 0) {
                insertLineIndex = i;
                break;
            }
            // If it's a variable declaration without braces (e.g. const x = 1;)
            if (!startedCounting && cleanLine.includes(';')) {
                 insertLineIndex = i;
                 break;
            }
        }
    }

    if (insertLineIndex !== -1) {
        lines.splice(insertLineIndex + 1, 0, code_to_insert);
        file.content = lines.join('\n');
        return `Successfully inserted code after symbol '${symbol_name}'.`;
    } else if (foundStart) {
         lines.push(code_to_insert);
         file.content = lines.join('\n');
         return `Symbol found but end of block not detected. Appended to end of file.`;
    }

    return `Symbol '${symbol_name}' not found.`;
}

// Expose tools to global scope so they can be used
globalThis.fileEditingTools = {
    find_symbol,
    find_referencing_symbols,
    insert_after_symbol
};
