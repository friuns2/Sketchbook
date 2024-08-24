async function EvalWithDebug(...content) {
    try {
        await Eval(...content);
        if (chat.variant.lastError)
            throw chat.variant.lastError;
    } catch (e) {        
        console.error(e);
        await chat.switchVariant(0, false);
        chat.variants[0].lastError = e;
    }
}

let lastEvalCode = '';
async function Eval(...contentArray) 
{   
    Load();
    await new Promise(requestAnimationFrame);
    chat.variant.lastError = '';
    
    var content = contentArray.join('\n');
    
    var code = "(async () => {\n" + content
        .replace(/^.*(?:new World\(|world\.initialize).*$\n?/gm, '')
        .replace(/\b(let|const)\s+(\w+)\s*=/g, 'var $2 = globalThis.$2 =')        
        + "\n})();"
        //+ ";debugger;"
    console.log(code);
    if(content.includes("world.update = "))
        throw new Error("direct assign world.update = function(){} is not allowed, use extendMethod");
    lastEvalCode = code;
    (0, eval)(code);
    let startTime = Date.now();
    while (!chat.variant.lastError && Date.now() - startTime < 500) {
        await new Promise(requestAnimationFrame);
    }
    console.log(chat.variant.lastError ? "Execution failed" : "Execution success");
}

var originalConsoleError = console.error;
console.error = (...args) => {
    chat.variant.lastError = {
        url: args.map(arg => arg.target?.responseURL).find(a => a),
        message: args.map(arg => {
            return arg.target?.responseURL && `Not Found: ${arg.target.responseURL}. ` 
                || arg.stack && arg.message + " at " + ParseCodeLineFromError(lastEvalCode, arg)
                || arg.message
                || typeof arg === 'object' && JSON.stringify(arg)
                || String(arg);
        }).join(' '),
        toString() {
            return this.message;
        }
    }
    originalConsoleError(...args);
};
function ParseCodeLineFromError(code, error) {
    const lineWithInfo = error.stack.split('\n').find(line => line.includes('at eval'));
    const match = lineWithInfo?.match(/:(\d+):\d+/);
    return match ? code.split('\n')[parseInt(match[1], 10) - 1] : null;
}

window.addEventListener('unhandledrejection', function(event) {
    console.error(event.reason);
    event.preventDefault();
});
window.addEventListener('error', function (event) {
    console.error(event);
});