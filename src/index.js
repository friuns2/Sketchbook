globalThis.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.userAgent.includes('Android');
console.log("chatMore.js loaded");

class VariantFile {
    constructor(name, content) {
        this.name = name;
        this.content = content;
        Vue.observable(this);
    }
}

class BotMessage {
    constructor() {
        this.content = '';
        this.model = '';
        this.lastError = null;
        /** @type {Array<VariantFile>} */
        this.files = [];
        this.processing = false;
        Vue.observable(this);
    }

}

let chat = {

    abortController:null,
    inputText: '',
    window: window,
    globalThis: globalThis,
    document: document,
    suggestions: [
        ['Add a red cube'],
        ['Add a pistol', 'Add aiming mechanics for better shooting'],
        ['spawn zombies randomly', 'Make zombies that can chase and attack the player', 'Make the zombies take damage and die'],
        ['add football','add goal','add npc that tries to get ball into goal'],
        ['add mickey mouse','make so i can talk to using dialog boxes'],
        ['place trees','place grass','add cows','make cows eat grass'],
        ['add lambourgini', 'setup car doors and wheels'],
        ['add second player','make the second player use different keys', 'make the second player shoot'],
        ['create car with rocket launcher on top', 'create the bullets that the launcher shoots', 'make the bullets explode on impact'],
        ['I want the player to shoot bullets from the rocket launcher.','bullets should explode when they hit something','change the explosion to be more visually impressive.'], 
        ['create cubes with left mouse button', 'remove cubes with right mouse button','add physics to cubes'], 'make pistol shoot, bullets, kill zombie when hit'],
    get isLoading(){ 
        return this.abortController && !this.abortController.signal.aborted
     },
    params: {
        chatId: '',
        chatIdChanged: function () {
            console.log('codeChanged');
            //Eval(chat.params.code);
        },
        lastText: ''
    },
    isCursorLocked: false,
    messageLog: [],
    get isMobile() {
        return window.innerWidth < 768;
    },
    variants: [new BotMessage(), new BotMessage()],
    currentVariant: 0,
    get variant() {
        return this.variants[this.currentVariant];
    },

    async init() {
        document.addEventListener('pointerlockchange', () => this.isCursorLocked = !!document.pointerLockElement);
        globalThis.world = new World();
        await world.initialize('build/assets/world.glb');

        //while (!globalThis.player) { await new Promise(resolve => setTimeout(resolve, 100));}

        //globalThis.SaveReset?.();



        if (!this.variant.content)
            await this.Clear();


        setTimeout(() => {
            vue.$watch(() => this.params.lastText, (newValue) => {
                document.title = newValue;
            });



            world.gui.add({ enableBreakpoints: settings.enableBreakpoints }, 'enableBreakpoints').name('Enable Breakpoints').onChange((value) => {
                settings.enableBreakpoints = value;
            });

            world.gui.add({ showAPIRequestXML: settings.showAPIRequestXML }, 'showAPIRequestXML').name('Show API Request XML').onChange((value) => {
                settings.showAPIRequestXML = value;
            });

            const aiFolder = world.gui.addFolder('AI Settings');
            aiFolder.add(settings, 'apiKey').name('API Key');

            const apiUrlController = aiFolder.add(settings, 'apiUrl').name('API URL');

            const updateApiUrl = () => {
                if (settings.provider === 'openrouter') {
                    settings.apiUrl = 'https://openrouter.ai/api/v1';
                } else if (settings.provider === 'custom') {
                     if (settings.apiUrl === 'https://openrouter.ai/api/v1') {
                         settings.apiUrl = "https://opencode-cors-proxy.brutal.workers.dev";
                     }
                }
                apiUrlController.updateDisplay();
            };

            aiFolder.add(settings, 'provider', ['custom', 'openrouter']).name('Provider').onChange(updateApiUrl);

            let modelController = null;

            const modelSettings = {
                fetchModels: async () => {
                    let url = settings.apiUrl;
                    if (url.endsWith('/')) url = url.slice(0, -1);
                    url = url + '/models';

                    try {
                        const response = await fetch(url, {
                            headers: {
                                'Authorization': `Bearer ${settings.apiKey}`
                            }
                        });

                        if (!response.ok) {
                             throw new Error(await response.text());
                        }

                        const data = await response.json();
                        if (data.data && Array.isArray(data.data)) {
                             settings.availableModels = data.data.map(m => m.id).sort();
                             updateModelController();
                        } else {
                            alert('No models found in response');
                        }
                    } catch (e) {
                        alert('Error fetching models: ' + e.message);
                    }
                }
            };

            aiFolder.add(modelSettings, 'fetchModels').name('Fetch Models');

            function updateModelController() {
                if (modelController) {
                    aiFolder.remove(modelController);
                }

                if (settings.availableModels.length > 0) {
                     modelController = aiFolder.add(settings, 'selectedModel', settings.availableModels).name('Model').onChange(value => {
                         settings.batchRequests = [value];
                     });
                } else {
                    modelController = aiFolder.add(settings, 'selectedModel').name('Model').onChange(value => {
                        settings.batchRequests = [value];
                    });
                }
            }

            updateModelController();


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
    UploadFile() {
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
    copyCodeToClipboard(variant) {
        navigator.clipboard.writeText(replaceImports(variant.files[0].content))
    },
    onClickError() {
        this.inputText = this.params.lastText + ' \nPrevious attempt Error: ' + this.variant.lastError.message + ", do not make it again!";
    },
    async Clear() {
        this.variant.content = '';
        const scriptContent = await fetch("src/" + settings.codeFile).then(response => response.text());
        this.variant.files = [new VariantFile('script.js', scriptContent)];
    },
    floatingCode: '',
    //#region sendInput
    async sendInput() {
        let index = this.suggestions.findIndex(s => Array.isArray(s) && s.includes(this.inputText));
        if(index != -1)
        {
            this.suggestions[index].shift();
            this.suggestions.push(this.suggestions[index]);
            this.suggestions.splice(index, 1);
        }
        

        this.params.lastText = this.inputText || this.params.lastText;
        if (!this.inputText) {
            document.activeElement?.blur?.();
            this.inputText = this.params.lastText;
            return;
        }
        Say(this.params.lastText)
        requestAnimationFrame(() => {
            this.inputText = '';
        });
        this.abortController?.abort();
        let abortController = this.abortController = new AbortController();
        
        if (this.variant == this.variants[0])
            this.messageLog.pop();

        // Read file names from paths.txt that start with src\ts
        const response = await fetch('paths.txt');

        const pathsContent = await response.text();
        const srcTsFiles = pathsContent.split('\n')
            .filter(path => path.trim().startsWith('src\\ts'))
            .map(path => path.trim());


        try {
            const srcFiles = [
                'build/types/world/World.d.ts',
                'build/types/characters/Character.d.ts',
                'build/types/interfaces/ICharacterAI.d.ts',
                'build/types/interfaces/ICollider.d.ts',
                'build/types/interfaces/IInputReceiver.d.ts',
                'build/types/core/CameraOperator.d.ts',
                'build/types/vehicles/Car.d.ts',
                'build/types/core/KeyBinding.d.ts',
                //'src/ts/enums/CharacterAnimations.ts',                
                'src/ts/characters/character_ai/FollowTarget.ts',
                'src/ts/characters/character_ai/RandomBehaviour.ts',
            ]

            const examples = [
                //   'node_modules/three/src/core/Object3D.d.ts',
                //'src/ts/core/InputManager.ts',

                //'src/examples/rocketLauncher.md',
                //...(await fetchFilesFromDir('src/examples','js')),                
                //  ...(await fetchFilesFromDir('src/examples', 'md'))
                'src/main/helpers/helpers.js',
                'src/main/examples/rocketLauncher.ts',
                'src/main/examples/minecraft.ts',
                'src/main/examples/dialog.ts',
                'src/main/examples/pistol.ts',
                'src/main/examples/carExample.ts',
                'src/ts/vehicles/MyCar.ts',
                'src/main/examples/2player.ts',
                'src/main/examples/carBazooka.ts',
                'src/main/examples/trees.ts',
            ];
            async function fetchAndProcessFiles(fileNames) {
                const fetchPromises = fileNames.map(async path => {
                    try {
                        const response = await fetch(path);
                        let content = await response.text();


                        if (path.includes("example") && !path.includes("helpers.js") && (path.endsWith(".js") || path.endsWith(".ts"))) {
                            content = content.split('\n').map(line => `// ${line}`).join('\n');
                        }

                        content = content.replace(/^.*\bprivate\b.*$/gm, '');
                        return { name: path, content: content };
                    } catch (e) {
                        alert("Error fetching file: " + e + " " + path);
                        return { name: path, content: '' };
                    }
                });

                const files = await Promise.all(fetchPromises);
                return files;
            }

            async function fetchAndProcessFilesCombined(fileNames) {
                let files = await fetchAndProcessFiles(fileNames);
                return files.map(file => `<file name="${file.name}">\n${file.content}\n</file>`).join('\n\n');
            }





            // Create a string with previous user messages
            const previousUserMessages = chat.messageLog.length && ("<Previous_user_messages>\n" + chat.messageLog
                .map(msg => msg.user)
                .join('\n') + "\n</Previous_user_messages>");
            
            this.variants[0] = this.variant;
            this.currentVariant = 0;
            this.variants.length = 1;
            let updateLock = Promise.resolve();
            let abort = false;
            this.floatingCode = '';
            //#region SendMessage
            let SendMessage = async (model,i) => {
                i++;
                let code = i == 1 ? this.variants[0].files[0].content : this.variant.files[0].content;
                let botMessage = new BotMessage();
                    botMessage.model = model;
                    botMessage.processing = true;
                    this.variants[i] = botMessage;
                for (let retry = 0; retry < 5; retry++)
                {
                    const response = await getChatGPTResponse({
                        model,
                        apiKey: settings.apiKey,
                        apiUrl: settings.apiUrl,
                        messages: [
                            //    { role: "system", content: settings.rules  },
                            //{ role: "assistant", content: `When user says: spawn or add object, then spawn it at near player position: ${playerLookPoint}` },
                            { role: "system", content: "Note: examples are not included in source code\n" + await fetchAndProcessFilesCombined(examples) },
                            {
                                role: "system", content:
                                    await fetchAndProcessFilesCombined(srcFiles) +
                                    //  "\nNote: examples are not included in source code\n"+
                                    //  await fetchAndProcessFiles(examples) +
                                    Object.entries(glbFiles).map(([name, file]) => `<file name="${name}">\n${file.content}\n</file>`).join('\n\n')
                            },
                            //...(await fetchAndProcessFiles(srcTsFiles)).map(a => ({ role: "system", content: `<file name="${a.name}">\n${a.content}\n</file>` })),                        
                            { role: "user", content: `${previousUserMessages}\n\nCurrent code:\n\`\`\`typescript\n${code}\n\`\`\`\n\n${settings.importantRules}Rewrite current code to accomplish user complain: ${this.params.lastText}` },
                            //{ role: "user", content: `Improve last user complain create plan how you would implement it` },
                            //{ role: "user", content: `Reflect write chain of though how you failed to implement code and what you need to implement it correctly` },

                            //Understanding the Problem,Thinking through a Solution, breakdown of the challenges
                        ],
                        signal: abortController.signal
                    });

                    try {
                        for await (const chunk of response) {
                            botMessage.content = chunk.message.content;
                            if (this.currentVariant ==1)
                                this.floatingCode = botMessage.content;
                        }
                        if(!botMessage.content) continue;
                    } catch (e) {
                        console.log(e);
                        continue;
                        botMessage.lastError = e;
                        return;
                    }
                    break;
                }
                botMessage.processing = false;
                console.log(botMessage.content);


                updateLock = updateLock.then(async () => {

                    if (abort)
                        return;
                    
                    let variant = this.variants[i];
                    //#region SwitchVariant
                    try{
                        await this.switchVariant(i);
                    }
                    catch(e)
                    {
                        console.error(e);
                        
                    }
                    //#endregion
                    let startTime = Date.now();
                    while (!variant.lastError && Date.now() - startTime < 1500) {
                        await new Promise(requestAnimationFrame);
                    }
                    if (!variant.lastError)
                        abort = true;
                });

            };
            //#endregion
            //#region SendMessages
            await Promise.all(settings.batchRequests.map((model,i) => SendMessage(model, i)));
            //#endregion

            console.log(chat.floatingCode)
            if (this.messageLog[this.messageLog.length - 1]?.user != this.params.lastText) {
                this.messageLog.push({ user: this.params.lastText });
            }
        } catch (e) {

            this.switchVariant(0);
        } finally {
            abortController.abort();
        }

    },

    async switchVariant(index) {
        console.log('switchVariant', index);
        this.currentVariant = index;
        let variant = this.variants[this.currentVariant];
        let content = variant.content;
        if (!variant.files.length) {
            let data = parseFilesFromMessage(content);
            variant.files = data.files.map(file => new VariantFile(file.name, file.content));
        }
        this.floatingCode = content;

        const code = variant.files[0]?.content;
        ResetState();
        await new Promise(resolve => setTimeout(resolve, 100));
        await Eval(code);
        console.log(content);
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
    data: vue.data,
    methods: vue.methods,
    watch: vue.watch,
    mounted: vue.mounted
});





LoadComponent('3dPicker.html');


globalThis.FollowTarget = CharacterAI.FollowTarget;
globalThis.FollowPath = CharacterAI.FollowPath;
globalThis.RandomBehaviour = CharacterAI.RandomBehaviour;