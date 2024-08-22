
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
            Eval(chat.params.code);
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

        let playerLookPoint = GetPlayerFront();
        const floatingCode = document.getElementById('floating-code');
        this.params.lastText = this.inputText || this.params.lastText;
        this.inputText = '';
        this.abortController?.abort();
        this.abortController = new AbortController();
        this.isLoading = true;
        try {
            const fileNames = [
                'build/types/world/World.d.ts',
                'build/types/characters/Character.d.ts',
                'build/types/interfaces/ICharacterAI.d.ts',
                'build/types/interfaces/ICollider.d.ts',
                'src/ts/characters/character_ai/FollowTarget.ts',
                'src/helpers.js',                
            ];
            
            const fetchPromises = fileNames.map(path => 
                fetch(path).then(response => response.text()).catch(e => {
                    console.error("Error fetching file:", e);
                    return '';
                })
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
            if(e.name == 'AbortError')
                return;
           

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





LoadComponent('3dPicker.html');


/*
// Assuming you have a dat.GUI instance called 'gui'
world.gui.add({ clear: function() { 
    // Call your Clear function here
    chat.Clear(); 
}}, 'clear').name('Clear Canvas');
*/