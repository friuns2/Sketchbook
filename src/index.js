globalThis.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
let variantTemplate = {
    content: '',
    lastError: null,
    files: [],
    processing: false
}

let chat = {

    abortController: null,
    inputText: '',
    window: window,
    globalThis: globalThis,
    document: document,
    suggestions: ['Add a red cube', 'Create a bouncing ball', 'make pistol shoot, bullets, kill zombie when hit'],
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
    messageLog:[],
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
        globalThis.world = new World();
        await world.initialize('build/assets/world.glb');        

        //while (!globalThis.player) { await new Promise(resolve => setTimeout(resolve, 100));}

		//globalThis.SaveReset?.();



        if (!this.variant.content)
            this.Clear();


        setTimeout(() => {
            vue.$watch(() => this.params.lastText, (newValue) => {
                document.title = newValue;
            });



            world.gui.add({ enableBreakpoints: settings.enableBreakpoints }, 'enableBreakpoints').name('Enable Breakpoints').onChange((value) => {
                settings.enableBreakpoints = value;
            });


            //world.timeScaleTarget=0
            Eval(this.variant.files[0].content);
        }, 500);
        
        // Add this new event listener
        document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
        document.addEventListener('click', this.hideContextMenu.bind(this));

    },
    async SetSuggestion(suggestion) {
        this.inputText = '';
        for (let char of suggestion) {
            this.inputText += char;
            await new Promise(resolve => setTimeout(resolve, 30)); // Adjust the delay as needed for typing effect
        }
    },
    UploadFile(){
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*'; // Only accept image files
        input.style.display = 'none';
        document.body.appendChild(input);

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                const dropEvent = new DragEvent('drop', {
                    dataTransfer: dataTransfer
                });
                document.body.dispatchEvent(dropEvent);
            }
            document.body.removeChild(input);
        });

        input.click();
    },
    copyCodeToClipboard(variant){
        navigator.clipboard.writeText(variant.files[0].content)
    },
    onClickError(){
        this.inputText = this.params.lastText + ' \nPrevious attempt Error: ' + this.lastError.message + ", do not make it again!";
    },
    async undoLastAction() {

        this.messageLog.pop();
        this.inputText = this.messageLog[this.messageLog.length - 1]?.user || '';
    },
    async Clear(){
        this.variant.content='';
        this.variant.files = [{ name: 'script.js', content: await fetch("src/"+codeFile).then(response => response.text()) }];
        
    },
    floatingCode: '',
    async sendInput() {
        
        this.params.lastText = this.inputText || this.params.lastText;
        if(!this.inputText)
        {
            this.inputText = this.params.lastText;
            return;
        }
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
                'build/types/interfaces/IInputReceiver.d.ts',
                'build/types/core/CameraOperator.d.ts',
                'build/types/vehicles/Car.d.ts',
                'build/types/core/KeyBinding.d.ts',
                'src/ts/enums/CharacterAnimations.ts',                
                'src/ts/characters/character_ai/FollowTarget.ts',
                'src/ts/characters/character_ai/RandomBehaviour.ts',
             //   'node_modules/three/src/core/Object3D.d.ts',
                //'src/ts/core/InputManager.ts',
                'src/examples/helpers.js',                
                //'src/examples/rocketLauncher.md',
                //...(await fetchFilesFromDir('src/examples','js')),                
                //  ...(await fetchFilesFromDir('src/examples', 'md'))
                'src/examples/rocketLauncher.ts',
                'src/examples/minecraft.ts',
                'src/examples/pistol.ts',                
            ];
            
            const fetchPromises = fileNames.map(path => 
                fetch(path).then(response => response.text()).catch(e => {
                    alert("Error fetching file: " + e + " " + path);
                    return '';
                }).then(content => { 
                    if (path.includes("example") && path.includes(".js"))
                        content = content.split('\n').map(line => `// ${line}`).join('\n');
                    //  content = `/* ${content} */`; 
                    content = content.replace(/^.*\bprivate\b.*$/gm, '');
                    return { name: path, content: content };
                 })
            );
            
            let filesMessage = (await Promise.all(fetchPromises)).map(file => `<file name="${file.name}">\n${file.content}\n</file>`).join('\n\n');

            filesMessage += Object.entries(files).map(([name, file]) => `<file name="${name}">\n${file.content}\n</file>`).join('\n\n');
            
            // Create a string with previous user messages
            const previousUserMessages = chat.messageLog.length && ("<Previous_user_messages>\n" + chat.messageLog
                .map(msg => msg.user)
                .join('\n') + "\n</Previous_user_messages>");
            let code = this.variant.files[0].content;
            this.variants[0] = this.variant;
            this.currentVariant = 0;
            this.variants.length = 1;
            let updateLock = Promise.resolve();
            let abort = false;
            await Promise.all([1,2,3,4,5].map(async (i) => {
                const response = await getChatGPTResponse({
                    messages: [
                    //    { role: "system", content: settings.rules  },
                        //{ role: "assistant", content: `When user says: spawn or add object, then spawn it at near player position: ${playerLookPoint}` },
                        { role: "system", content: filesMessage },
                        { role: "user", content: `${previousUserMessages}\n\nCurrent code:\n\`\`\`typescript\n${code}\n\`\`\`\n\n${settings.importantRules}Rewrite current code to accomplish user complain: ${this.params.lastText}` }
                    ],
                    signal: this.abortController.signal
                });
                this.currentVariant = i;
                let botMessage = structuredClone(variantTemplate);   
                botMessage.processing=true;             
                this.variants[i] = botMessage;
                for await (const chunk of response) {
                    botMessage.content = chunk.message.content;                   
                    if(this.currentVariant == i)
                        this.floatingCode = botMessage.content;
                }
                botMessage.processing=false;
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
            if (this.messageLog[this.messageLog.length - 1]?.user != this.params.lastText) {
                this.messageLog.push({ user: this.params.lastText });
            }
        } catch (e) {
            if(e.name == 'AbortError')
                return;
            this.switchVariant(0);
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
        
        if (codeEditor)
            SetCode(variant.files[0].content);
        if(variant.files.length > 0){
            var code = variant.files[0].content;
            ResetState();
            await new Promise(resolve => setTimeout(resolve, 100));
            await Eval(code);            
        }
    },

    // Add these new methods
    handleContextMenu(e) {
        e.preventDefault();
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;

        const copyCoordinates = document.getElementById('copyCoordinates');
        copyCoordinates.onclick = () => {
            const coordinates = this.get3DCoordinates(e);
            this.inputText += ` ${coordinates}`;
            this.hideContextMenu();
        };
    },

    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'none';
    },

    // Add this new method for 3D raycasting
    get3DCoordinates(event) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the raycaster
        raycaster.setFromCamera(mouse, world.camera);

        // Perform the raycast
        const intersects = raycaster.intersectObjects(world.graphicsWorld.children, true);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            return ` at (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`;
        }
    },

}

globalThis.chat = chat;
let vue = InitVue(chat, { mounted: chat.init, watch: chat.watch });

vue = chat = new Vue({
    el: '#app',
    data:vue.data,
    methods:vue.methods,
    watch:vue.watch,
    mounted:vue.mounted
});





LoadComponent('3dPicker.html');


globalThis.FollowTarget = CharacterAI.FollowTarget;
globalThis.FollowPath = CharacterAI.FollowPath;
globalThis.RandomBehaviour = CharacterAI.RandomBehaviour;