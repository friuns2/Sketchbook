
//Vue.config.silent = true;
let chat = {

    abortController: null,
    inputText: '',
    window: window,
    document: document,
    isLoading: false,
    params: {
        messages: [],
        code: '',
        codeChanged: function(){
            console.log('codeChanged');
            EvalWithDebug(chat.params.code);
        },
        lastText: ''        
    },
    isCursorLocked:false,
    get messages(){
        return this.params.messages;
    },
    get isMobile(){
        return window.innerWidth < 768;
    },
    lastError: '',
    suggestions: ['Add a red cube', 'Create a bouncing ball', 'Generate a 3D tree'],
    async init() {
        document.addEventListener('pointerlockchange', () => this.isCursorLocked = !!document.pointerLockElement);
        globalThis.world = new World();
        await world.initialize('build/assets/world.glb');
        globalThis.player = world.characters[0];
        Save();
        player.takeControl();
        if (!this.params.code)
            await this.Clear();
        
        Eval(this.params.code);
        vue.$watch(() => this.params.lastText, (newValue) => {
            document.title = newValue;
        });
        
    },
    onClickError(){
        this.inputText = this.params.lastText + ' \nPrevious atempt Error: ' + this.lastError+", do not make it again!";
    },
    async undoLastAction() {

        this.messages.pop();
        this.inputText = this.messages[this.messages.length - 1]?.user || '';
    },
    async Clear(){
        this.params.code = await fetch('src/code.js').then(response => response.text());
        Load();
    },
    async sendInput() {

        let playerLookPoint = new THREE.Vector3();
        player.getWorldPosition(playerLookPoint);
        let direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(world.camera.quaternion);
        playerLookPoint.add(direction.multiplyScalar(2));
        playerLookPoint = JSON.stringify(playerLookPoint, (key, value) => typeof value === 'number' ? Number(value.toFixed(2)) : value);
        const floatingCode = document.getElementById('floating-code');
        this.params.lastText = this.inputText || this.params.lastText;
        this.inputText = '';
        this.abortController?.abort();
        this.abortController = new AbortController();
        this.isLoading = true;
        try {
            const fileNames = [
                'build/types/world/World.d.ts',
//                'build/types/characters/Character.d.ts',
                'src/helpers.js'
            ];
            
            const fetchPromises = fileNames.map(path => 
                fetch(path).then(response => response.text())
                    .then(content => ({ name: path.split('/').pop(), content }))
            );
            
            const filesMessage = (await Promise.all(fetchPromises)).map(file => `${file.name} file for reference:\`\`\`javascript\n${file.content}\n\`\`\``).join('\n\n');
            
            // Create a string with previous user messages
            const previousUserMessages = chat.messages.length && ("<Previous_messages>\n" + chat.messages
                .map(msg => msg.user)
                .join('\n') + "\n</Previous_messages>");
            
            const response = await getChatGPTResponse({
                messages: [
                    { role: "system", content: settings.rules },
                    { role: "system", content: filesMessage },
                    { role: "user", content: `${previousUserMessages}\n\nCurrent code:\n\`\`\`javascript\n${this.params.code}\n\`\`\`\n\nUpdate code below, spawn position: ${playerLookPoint}, Rewrite JavaScript code that will; ${this.params.lastText}` }
                ],
                signal: this.abortController.signal
            });

            for await (const chunk of response) {
                floatingCode.textContent = chunk.message.content;
            }
            console.log(floatingCode.textContent);
            let files = await parseFilesFromMessage(floatingCode.textContent);
            var content = files.files[0].content;
            if (this.messages[this.messages.length - 1]?.user != this.params.lastText) {
                this.messages.push({ user: this.params.lastText });
            }
            await EvalWithDebug(content);
        } catch (e) {
            var err = e.constructor('Error in Evaled Script: ' + e.message);
            let lineNumber = e.lineNumber - err.lineNumber + 3;
            console.error("Error executing code:", e, lineNumber);
            Eval(this.params.code);
            this.lastError = `${e.message}`;//`"Error:"+${e.message}\n\`\`\`javascript\n${content}\n\`\`\`\n`;


        } finally {
            this.abortController = null;
            this.isLoading = false;
        }

    }

}
const { data, methods, mounted, watch } = InitVue(chat, { mounted: chat.init, watch: chat.watch });

let vue = chat = new Vue({
    el: '#app',
    data,
    methods,
    watch,
    mounted
});
var originalConsoleError = console.error;
console.error = (...args) => {
    chat.lastError = args.join(' ');
    originalConsoleError(...args);
};
window.addEventListener('unhandledrejection', function(event) {
    console.error('Caught unhandled promise rejection:', event.reason);
    if (event.reason instanceof Error) {
        chat.lastError = `${event.reason.name}: ${event.reason.message}`;
    } else {
        chat.lastError = String(event.reason);
    }
    event.preventDefault();
});
window.addEventListener('error', function (event) {
    chat.lastError = event.error.message;
    console.error(chat.lastError);
});



async function EvalWithDebug(...content) {
    await Eval(...content);    
    if (chat.lastError)
        throw new Error(chat.lastError);
}

async function Eval(...contentArray) {
    chat.lastError = '';
    Load();
    
    
    var content = contentArray.join('\n');
    if(content.includes("world.update = "))
        throw new Error("direct assign world.update = function(){} is not allowed, use extendMethod");
    var code = "(async () => {\n" + content
        .replace(/^[\s\S]*?(await world\.initialize|player\.takeControl)\(\);/, '')
        .replace(/\b(let|const)\s+(\w+)\s*=/g, 'var $2 = globalThis.$2 =')        
        + "\n})();"
        //+ ";debugger;"
    console.log(code);
    (0, eval)(code);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!chat.lastError){
        console.log("Execution success");
        chat.params.code = content;
    }
}

async function inject3DPicker() {
    try {
        const response = await fetch('3dPicker.html');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();
        
        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div);

        const scripts = div.getElementsByTagName('script');
        Array.from(scripts).forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
        });

        console.log('3D Picker injected successfully');
    } catch (error) {
        console.error('Error injecting 3D Picker:', error);
    }
}

inject3DPicker();



// Assuming you have a dat.GUI instance called 'gui'
world.gui.add({ clear: function() { 
    // Call your Clear function here
    chat.Clear(); 
}}, 'clear').name('Clear Canvas');