
async function EvalWithDebug(...content) {
    try {
        await Eval(...content);
        if(chat.lastError)
            throw chat.lastError;
    } catch (e) {
        if (e.url && e.url.endsWith('.glb')) {
            if (e.url.toLowerCase().endsWith('.glb')) {
                // Show picker for GLB file
                const fileName = e.url.split('/').pop().split('.')[0];
                picker.openModelPicker(fileName, async (downloadUrl) => {
                    const response = await fetch(downloadUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    navigator.serviceWorker.controller.postMessage({
                        action: 'uploadFiles',
                        files: [{ name: e.url, buffer: arrayBuffer }]
                    });
                    await new Promise(resolve => setTimeout(resolve, 100));
                    Eval(content)
                });
            }
        }
        console.error(e);
        await Eval(chat.params.code);
        chat.lastError = e;
    }
}


let lastEvalCode = '';
async function Eval(...contentArray) {
    
    Load();
    await new Promise(requestAnimationFrame);
    chat.lastError = '';
    
    var content = contentArray.join('\n');
    if(content.includes("world.update = "))
        throw new Error("direct assign world.update = function(){} is not allowed, use extendMethod");
    var code = "(async () => {\n" + content
        .replace(/^.*(?:new World\(|world\.initialize).*$\n?/gm, '')
        .replace(/\b(let|const)\s+(\w+)\s*=/g, 'var $2 = globalThis.$2 =')        
        + "\n})();"
        //+ ";debugger;"
    console.log(code);
    lastEvalCode = code;
    (0, eval)(code);
    let startTime = Date.now();
    while (!chat.lastError && Date.now() - startTime < 500) {
        await new Promise(requestAnimationFrame);
    }
    if (!chat.lastError){
        console.log("Execution success");
        chat.params.code = content;
    }
}

var originalConsoleError = console.error;
console.error = (...args) => {
    chat.lastError = {
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

