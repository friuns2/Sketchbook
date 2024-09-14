

let lastEvalCode = '';
async function Eval(content) 
{   
    if(!content.trim())
    {
        console.error("empty code");
        return;
    }
    chat.variant.lastError = '';
    
    content = content.replace(/export |import .*?;/gs, ""); 

    let compiledCode = compileTypeScript(content+(settings.enableBreakpoints ? "\n;debugger;" : ";console.log('executed');"));


    var code = compiledCode
        .replace(/^.*(?:new World\().*$\n?/gm, '')
        .replace(/^.*(?:world\.initialize).*$\n?/gm, '')
        .replace(/world\.render\(world\);/g, '')
        .replace(/\b(let|const)\s+(\w+)\s*=/g, 'var $2 = globalThis.$2 =')       
        
            
    
    if (chat.currentVariant!=0)
        console.log(content);
    if(content.includes("world.update = "))
        throw new Error("direct assign world.update = function(){} is not allowed, use addMethodListener");
    lastEvalCode = code;
    try
    {
        const script = document.createElement('script');
        script.type = 'module';
        script.textContent = code;
        document.body.appendChild(script);
        //(0, eval)(code);    
    }
    catch(e)
    {
        console.error(e);
    }
}

var originalConsoleError = console.error;
console.error = (...args) => {
    if (args[0].message === "The user has exited the lock before this request was completed.")
        return;
    //wwwwif(args[0].message.includes("Uncaught TypeError: Cannot read properties of undefined (reading '_wakeUpAfterNarrowphase')")) return;
    if(args[0]?.message?.includes("Cannot read properties of undefined (reading '_wakeUpAfterNarrowphase')"))
        return;

    if (globalThis.chat) {
     //   if (settings?.enableBreakpoints)
         //   debugger;
        let error = chat.variant.lastError = {
            args: args,
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
        ResetState();
        /*
        if (chat.currentVariant != 0) {
            chat.switchVariant(0).then(() => {
                chat.lastError = error;
            });

        }
        */
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

