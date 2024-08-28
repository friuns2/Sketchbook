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
    lastError: null,
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
    variants: [structuredClone(variantTemplate),structuredClone(variantTemplate)],
    currentVariant: 0,
    get variant(){
        return this.variants[this.currentVariant];
    },

    async init() {
        document.addEventListener('pointerlockchange', () => this.isCursorLocked = !!document.pointerLockElement);
        //globalThis.world = new World();
        //await world.initialize('build/assets/world.glb');        
        while (!globalThis.player) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
		SaveReset();

        if (!this.variant.content)
            this.Clear();

        vue.$watch(() => this.params.lastText, (newValue) => {
            document.title = newValue;
        });



        world.gui.add({ enableBreakpoints: settings.enableBreakpoints }, 'enableBreakpoints').name('Enable Breakpoints').onChange((value) => {
            settings.enableBreakpoints = value;
        });


        //world.timeScaleTarget=0
        //Eval(this.variant.files[0].content);
        
        
    },
    async SetSuggestion(suggestion) {
        this.inputText = '';
        for (let char of suggestion) {
            this.inputText += char;
            await new Promise(resolve => setTimeout(resolve, 30)); // Adjust the delay as needed for typing effect
        }
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
        
    },
    floatingCode: '',
    async sendInput() {

        let playerLookPoint = VectorToString(GetPlayerFront());
        
        this.params.lastText = this.inputText || this.params.lastText;
        Say(this.params.lastText)
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
            let abort = false;
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
                    
                    if(abort)
                        return;        
                    let variant = this.variants[i];
                    await this.switchVariant(i);
                    let startTime = Date.now();
                    while (!variant.lastError && Date.now() - startTime < 1500) {
                        await new Promise(requestAnimationFrame);
                    }
                    if(!variant.lastError)
                        abort = true;
                });
                
            }));
            
            console.log(chat.floatingCode)
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
  
    async switchVariant(index) {
        this.lastError = null;
        console.log('switchVariant', index);
        this.currentVariant = index;
        let variant = this.variants[this.currentVariant];
        let content = variant.content;
        let data = parseFilesFromMessage(content);
        if(data.files.length>0)
            variant.files = data.files;
        this.floatingCode = content;    
        if(variant.files.length > 0){
            var code = variant.files[0].content;
            Reset();
            await new Promise(resolve => setTimeout(resolve, 100));
            await Eval(code);            
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


globalThis.FollowTarget = CharacterAI.FollowTarget;
globalThis.FollowPath = CharacterAI.FollowPath;
globalThis.RandomBehaviour = CharacterAI.RandomBehaviour;