globalThis.isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
        this.lastError = null;
        /** @type {Array<VariantFile>} */
        this.files = [];
        this.processing = false;
        Vue.observable(this);
    }

}

let chat = {

    abortController: null,
    inputText: '',
    window: window,
    globalThis: globalThis,
    document: document,
    suggestions: ['Add a red cube', 'Create a bouncing ball', 'make pistol shoot, bullets, kill zombie when hit'],
    isLoading: false,
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
    async sendInput() {

        this.params.lastText = this.inputText || this.params.lastText;
        if (!this.inputText) {
            this.inputText = this.params.lastText;
            return;
        }
        Say(this.params.lastText)
        this.inputText = '';
        this.abortController?.abort();
        this.abortController = new AbortController();
        this.isLoading = true;
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
                'src/main/helpers/MyCar.ts',
                'src/main/examples/rocketLauncher.ts',
                'src/main/examples/minecraft.ts',
                'src/main/examples/dialog.ts',
                'src/main/examples/pistol.ts',
                'src/main/examples/carExample.ts',
                'src/ts/vehicles/MyCar.ts',
                'src/main/examples/carBazooka.ts',
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
            let code = this.variant.files[0].content;
            this.variants[0] = this.variant;
            this.currentVariant = 0;
            this.variants.length = 1;
            let updateLock = Promise.resolve();
            let abort = false;
            await Promise.all([1, 2, 3, 4, 5].map(async (i) => {
                const response = await getChatGPTResponse({
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
                    signal: this.abortController.signal
                });
                this.currentVariant = i;
                let botMessage = new BotMessage();
                botMessage.processing = true;
                this.variants[i] = botMessage;
                for await (const chunk of response) {
                    botMessage.content = chunk.message.content;
                    if (this.currentVariant == i)
                        this.floatingCode = botMessage.content;
                }
                botMessage.processing = false;
                console.log(botMessage.content);


                updateLock = updateLock.then(async () => {

                    if (abort)
                        return;
                    let variant = this.variants[i];
                    await this.switchVariant(i);
                    let startTime = Date.now();
                    while (!variant.lastError && Date.now() - startTime < 1500) {
                        await new Promise(requestAnimationFrame);
                    }
                    if (!variant.lastError)
                        abort = true;
                });

            }));

            console.log(chat.floatingCode)
            if (this.messageLog[this.messageLog.length - 1]?.user != this.params.lastText) {
                this.messageLog.push({ user: this.params.lastText });
            }
        } catch (e) {
            if (e.name != 'AbortError')
                console.error(e);
            this.switchVariant(0);
        } finally {
            this.abortController = null;
            this.isLoading = false;
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