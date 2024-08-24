//Vue.config.silent = true;
let variantTemplate = {
    content: '',
    lastError: null,
    files: []
}
let chat = {

    abortController: null,
    inputText: '',
    window: window,
    document: document,
    suggestions: ['Add a red cube', 'Create a bouncing ball', 'Generate a 3D tree'],

    isLoading: false,
    params: {
        chatId: '',
        chatIdChanged: function(){
            console.log('codeChanged');
            //Eval(chat.params.code);
        },
        lastText: ''        
    },
    isCursorLocked:false,
    messages:[],
    get isMobile(){
        return window.innerWidth < 768;
    },
    variants: [variantTemplate],
    currentVariant: 0,
    get variant(){
        return this.variants[this.currentVariant];
    },

    async init() {
        this.variant = structuredClone(variantTemplate);
        document.addEventListener('pointerlockchange', () => this.isCursorLocked = !!document.pointerLockElement);
        globalThis.world = new World();
        await world.initialize('build/assets/world.glb');        
        Save();
        if (!this.variant.content)
            await this.Clear();
        
        Eval(this.variant.files[0].content);
        vue.$watch(() => this.params.lastText, (newValue) => {
            document.title = newValue;
        });
        
    },
    onClickError(){
        this.inputText = this.params.lastText + ' \nPrevious attempt Error: ' + this.variant.lastError + ", do not make it again!";
    },
    async undoLastAction() {

        this.messages.pop();
        this.inputText = this.messages[this.messages.length - 1]?.user || '';
    },
    async Clear(){
        this.variant.content='';
        this.variant.files = [{ name: 'script.js', content: await fetch('src/code.js').then(response => response.text()) }];
        Load();
    },
    floatingCode: '',
    async sendInput() {

        let playerLookPoint = VectorToString(GetPlayerFront());
        
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
                'build/types/vehicles/Car.d.ts',
                'src/ts/enums/CharacterAnimations.ts',
                'src/ts/characters/character_ai/FollowTarget.ts',
                'src/ts/characters/character_ai/RandomBehaviour.ts',
                'src/helpers.js',                
            ];
            
            const fetchPromises = fileNames.map(path => 
                fetch(path).then(response => response.text()).catch(e => {
                    alert("Error fetching file: " + e + " " + path);
                    return '';
                }).then(content => ({ name: path.split('/').pop(), content: content.replace(/^.*\bprivate\b.*$/gm, '') }))
            );
            
            const filesMessage = (await Promise.all(fetchPromises)).map(file => `${file.name} file for reference:\`\`\`javascript\n${file.content}\n\`\`\``).join('\n\n');
            
            // Create a string with previous user messages
            const previousUserMessages = chat.messages.length && ("<Previous_messages>\n" + chat.messages
                .map(msg => msg.user)
                .join('\n') + "\n</Previous_messages>");
            let code = this.variant.files[0].content;
            this.variants[0] = this.variant;
            this.currentVariant = 0;
            this.variants.length = 1;
            let updateLock = Promise.resolve();
            await Promise.all([1,2,3,4,5].map(async (i) => {
                const response = await getChatGPTResponse({
                    messages: [
                        { role: "system", content: settings.rules },
                        { role: "system", content: filesMessage },
                        { role: "user", content: `${previousUserMessages}\n\nCurrent code:\n\`\`\`javascript\n${code}\n\`\`\`\n\nUpdate code below, spawn position: ${playerLookPoint}, Rewrite JavaScript code that will; ${this.params.lastText}` }
                    ],
                    signal: this.abortController.signal
                });
                this.currentVariant = i;
                let botMessage = structuredClone(variantTemplate);                
                this.variants[i] = botMessage;
                for await (const chunk of response) {
                    botMessage.content = chunk.message.content;                   
                    if(this.currentVariant == i)
                        this.floatingCode = botMessage.content;
                }
                
                console.log(botMessage.content);
          

                updateLock = updateLock.then(async () =>{
                    let data = parseFilesFromMessage(botMessage.content);
                    this.variants[i].files = data.files;
                    await this.switchVariant(i);
                });
                
            }));
            

            if (this.messages[this.messages.length - 1]?.user != this.params.lastText) {
                this.messages.push({ user: this.params.lastText });
            }
        } catch (e) {
            if(e.name == 'AbortError')
                return;
        } finally {
            this.abortController = null;
            this.isLoading = false;
        }

    },
  
    async switchVariant(index, debug = true) {
        console.log('switchVariant', index);
        this.currentVariant = index;
        let content = this.variants[this.currentVariant].content;
        this.floatingCode = content;    
        if(this.variant.files.length > 0){
            var code = this.variant.files[0].content;
            await EvalWithDebug(code);
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

globalThis.FollowTarget = CharacterAI.FollowTarget;
globalThis.FollowPath = CharacterAI.FollowPath;
globalThis.RandomBehaviour = CharacterAI.RandomBehaviour;