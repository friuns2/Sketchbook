let code = '';
let abortController = new AbortController();

fetch('src/code.js').then(response => response.text()).then(a => code = a);
Vue.config.silent = true;
new Vue({
    el: '#app',
    data: {
        inputText: '',
        isLoading: false,
        suggestions: ['Add a red cube', 'Create a bouncing ball', 'Generate a 3D tree']
    },
    methods: {
        selectSuggestion(suggestion) {
            this.inputText = suggestion;
        },
        async sendInput() {
            if (this.inputText.trim() === '') return;
            let playerLookPoint = new THREE.Vector3();
            player.getWorldPosition(playerLookPoint);
            let direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(world.camera.quaternion);
            playerLookPoint.add(direction.multiplyScalar(2));
            playerLookPoint = JSON.stringify(playerLookPoint, (key, value) => typeof value === 'number' ? Number(value.toFixed(2)) : value);
            this.isLoading = true;
            const floatingCode = document.getElementById('floating-code');
            floatingCode.textContent = '';
            abortController.abort();
            abortController = new AbortController();
            try {
                const worldDtsContent = await fetch('build/types/world/World.d.ts').then(response => response.text());
                const response = await getChatGPTResponse({
                    messages: [
                        { role: "system", content: settings.rules },
                        { role: "user", content: `World.d.ts file:\n${worldDtsContent}\n\nCurrent code:\n${code}\n\nUpdate code below, Use position: ${playerLookPoint}, Write JavaScript code that will; ${this.inputText}` }
                    ],
                    signal: abortController.signal
                });

                for await (const chunk of response) {
                    floatingCode.textContent = chunk.message.content;
                }
                console.log(floatingCode.textContent);
                let files = await parseFilesFromMessage(floatingCode.textContent);
                let content = files.files[0].content.substring(files.files[0].content.indexOf('player.takeControl();'));
                console.log(content);
                eval(content);
            } finally {
                this.isLoading = false;
                this.inputText = '';
            }
        }
    }
});
