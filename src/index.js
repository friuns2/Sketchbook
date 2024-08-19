
fetch('src/code.js').then(response => response.text()).then(a => code = a);
Vue.config.silent = true;
let chat = new Vue({
    el: '#app',
  
    data: {
        abortController: null,
        inputText: '',
        lastText: '',
        messages: [],        
        isLoading: false,
        snapshots: [],
        suggestions: ['Add a red cube', 'Create a bouncing ball', 'Generate a 3D tree'],
        async sendInput() {
            
            let playerLookPoint = new THREE.Vector3();
            player.getWorldPosition(playerLookPoint);
            let direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(world.camera.quaternion);
            playerLookPoint.add(direction.multiplyScalar(2));
            playerLookPoint = JSON.stringify(playerLookPoint, (key, value) => typeof value === 'number' ? Number(value.toFixed(2)) : value);
            const floatingCode = document.getElementById('floating-code');
            this.lastText = this.inputText||this.lastText ;
            this.inputText = '';
            this.abortController?.abort();
            this.abortController = new AbortController();
            this.isLoading = true;
            try {

                const worldDtsContent = await fetch('build/types/world/World.d.ts').then(response => response.text());
                const response = await getChatGPTResponse({
                    messages: [
                        { role: "system", content: settings.rules },
                        { role: "user", content: `world.d.ts file for reference:\n${worldDtsContent}\n\nCurrent code:\n${code}\n\nUpdate code below, sample position: ${playerLookPoint}, Rewrite JavaScript code that will; ${this.lastText}` }
                    ],
                    signal: this.abortController.signal
                });

                for await (const chunk of response) {
                    floatingCode.textContent = chunk.message.content;
                }
                console.log(floatingCode.textContent);
                let files = await parseFilesFromMessage(floatingCode.textContent);
                let content = files.files[0].content.substring(files.files[0].content.indexOf('player.takeControl();'));
                console.log(content);
                (0,eval)(content.replace(/\b(const|let)\b/g, 'var'));
                code = content;
                if (this.messages[this.messages.length - 1] != this.lastText) {
                    this.messages.push(this.lastText);
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
});


function cleanup() {
    // Remove all objects from the graphics world
    while (world.graphicsWorld.children.length > 0) {
        const object = world.graphicsWorld.children[0];
        world.graphicsWorld.remove(object);
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
            } else {
                object.material.dispose();
            }
        }
    }

    // Remove all bodies from the physics world
    while (world.physicsWorld.bodies.length > 0) {
        const body = world.physicsWorld.bodies[0];
        world.physicsWorld.remove(body);
    }

}
