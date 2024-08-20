
Vue.config.silent = true;
let chat = {

    abortController: null,
    inputText: '',
    lastText: '',
    messages: [],
    isLoading: false,
    params: {
        code: '',
    },
    suggestions: ['Add a red cube', 'Create a bouncing ball', 'Generate a 3D tree'],
    async init() {
        globalThis.world = new World();
        await world.initialize('build/assets/world.glb');
        globalThis.player = world.characters[0];
        Save();
        player.takeControl();
        if (!this.params.code)
            this.params.code = await fetch('src/code.js').then(response => response.text());
        
        Eval(this.params.code);
    },
    async undoLastAction() {

        this.messages.pop();
        this.inputText = this.messages[this.messages.length - 1]?.user || '';
    },
    async sendInput() {

        let playerLookPoint = new THREE.Vector3();
        player.getWorldPosition(playerLookPoint);
        let direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(world.camera.quaternion);
        playerLookPoint.add(direction.multiplyScalar(2));
        playerLookPoint = JSON.stringify(playerLookPoint, (key, value) => typeof value === 'number' ? Number(value.toFixed(2)) : value);
        const floatingCode = document.getElementById('floating-code');
        this.lastText = this.inputText || this.lastText;
        this.inputText = '';
        this.abortController?.abort();
        this.abortController = new AbortController();
        this.isLoading = true;
        try {

            const worldDtsContent = await fetch('build/types/world/World.d.ts').then(response => response.text());
            const playerDtsContent = await fetch('build/types/characters/Character.d.ts').then(response => response.text());
            const response = await getChatGPTResponse({
                messages: [
                    { role: "system", content: settings.rules },
                    { role: "system", content: `world.d.ts file for reference:\`\`\`javascript\n${worldDtsContent}\n\`\`\`\n\nplayer.d.ts file for reference:\`\`\`javascript\n${playerDtsContent}\n\`\`\`` },
                    { role: "user", content: `Current code:\n\`\`\`javascript\n${this.params.code}\n\`\`\`\n\nUpdate code below, spawn position: ${playerLookPoint}, Rewrite JavaScript code that will; ${this.lastText}` }
                ],
                signal: this.abortController.signal
            });

            for await (const chunk of response) {
                floatingCode.textContent = chunk.message.content;
            }
            console.log(floatingCode.textContent);
            let files = await parseFilesFromMessage(floatingCode.textContent);
            let content = files.files[0].content;
            Eval(content);
            this.params.code = content;
            if (this.messages[this.messages.length - 1] != this.lastText) {
                this.messages.push({ user: this.lastText, ai: content });
            }
        } catch (e) {

            var err = e.constructor('Error in Evaled Script: ' + e.message);
            // +3 because `err` has the line number of the `eval` line plus two.
            let lineNumber = e.lineNumber - err.lineNumber + 3;

            console.error("Error executing code:", e, lineNumber);


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

function Eval(content) {
    Load();
    if(content.includes("world.update = "))
        throw new Error("world.update = function(){} is not allowed");
    
    let code = content.substring(content.indexOf('player.takeControl();')).replace(/\b(const|let)\b/g, 'var');
    console.log(code);
    (0, eval)(code);
}

