(() => {

    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        document.body.style.background = '#e1e1e1';
    });

    document.body.addEventListener('dragleave', () => {
        document.body.style.background = '';
    });

    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        document.body.style.background = '';
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.glb')) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const arrayBuffer = event.target.result;
                const fileName = file.name;
                navigator.serviceWorker.controller.postMessage({
                    action: 'uploadFiles',
                    files: [{ name: fileName, buffer: arrayBuffer }]
                });
                await new Promise(resolve => setTimeout(resolve, 100));

                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, world.camera);
                const intersects = raycaster.intersectObjects(world.graphicsWorld.children, true);
                const intersectionPoint = intersects[0].point;
                var code = await GetSpawnGLBCode(fileName,intersectionPoint );
                chat.variant.files[0].content += code;
                Eval(chat.variant.files[0].content);

            };
            reader.readAsArrayBuffer(file);
        } else if (file && file.name.endsWith('.js')) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                await Eval(chat.params.code, event.target.result);
            };
            reader.readAsText(file);
            reader.readAsText(file);
        } else if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => applyImageTexture(event.target.result);
            reader.readAsDataURL(file);
        } else {
            alert('Please drop a valid GLB, JS, or image file.');
        }
    });
    var mouse = new THREE.Vector2();

    // Update mouse position
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });



    var applyImageTexture = (imageUrl) => {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, world.camera);
        const intersects = raycaster.intersectObjects(world.graphicsWorld.children, true);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;

            // Load the image as a texture
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(imageUrl, (texture) => {
                // Make the texture repeating
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(2, 2); // Adjust these values to control the repetition

                // Create a new material with the loaded texture
                const material = new THREE.MeshStandardMaterial({ map: texture });

                // Apply the new material to the intersected object
                intersectedObject.material = material;
            });
        } else {
            console.log("No object intersected for texture application");
        }
    };

    
})();

async function GetSpawnGLBCode(fileName, intersectionPoint) {
    const gltf = await new Promise((resolve, reject) => {
        new GLTFLoader().load(fileName, (gltf) => resolve(gltf), undefined, (error) => reject(error));
    });
    const animations = gltf.animations;
    let animationsCode = '';
    const modelName = fileName.split('.').slice(0, -1).join('_').replace(/[^a-zA-Z0-9_]/g, '');
    if (animations && animations.length > 0) {
        animationsCode += `gltf.mixer = new THREE.AnimationMixer(gltf.scene);\n`;
        animations.forEach((clip, index) => {
            animationsCode += `gltf["${clip.name}"] = gltf.mixer.clipAction(gltf.animations.find(a => a.name === "${clip.name}"));\n`;
        });
    }
    return `
let ${modelName} = await new Promise((resolve, reject) => { 
    new GLTFLoader().load("${fileName}", 
        gltf => { 
            ${animationsCode}
            resolve(gltf); 
        }, 
        undefined, 
        reject 
    ); 
});

${modelName}.scene.position.copy(${VectorToString(intersectionPoint)});
world.graphicsWorld.add(${modelName}.scene);

    `;
    //return `\nlet ${modelName} = await ${loadGLB.name}({ glbUrl: "${fileName}"});\n${animationsCode}\n${modelName}.scene.position.copy(${VectorToString(intersectionPoint)});\n\n`;

}
function VectorToString(intersectionPoint) {
    return JSON.stringify(intersectionPoint, (key, value) => typeof value === 'number' ? Number(value.toFixed(2)) : value);
}