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
        reader.onload = (event) => loadModel(event.target.result);
        reader.readAsDataURL(file);
    } else if (file && file.name.endsWith('.js')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                
                await EvalWithDebug(chat.params.code,event.target.result);
            } catch (error) {
                chat.lastError = error.message;
            }
        };
        reader.readAsText(file);
    } else if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => applyImageTexture(event.target.result);
        reader.readAsDataURL(file);
    } else {
        alert('Please drop a valid GLB, JS, or image file.');
    }
});
const mouse = new THREE.Vector2();
        
// Update mouse position
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

const loadModel = (glbUrl) => {
    let player = world.characters[0];
    new GLTFLoader().load(glbUrl, (gltf) => {
        const model = gltf.scene;
        const boundingBox = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3().copy(boundingBox.getSize(new THREE.Vector3())).multiplyScalar(0.5);
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        
        // Raycast from mouse cursor position
        const raycaster = new THREE.Raycaster();
        
        // Perform raycast and place model
        raycaster.setFromCamera(mouse, world.camera);
        const intersects = raycaster.intersectObjects(world.graphicsWorld.children, true);
        
        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;
            
            const boxCollider = new BoxCollider({
                mass: 1,
                position: new THREE.Vector3().copy(intersectionPoint).add(center),
                size: size,
                friction: 0.3
            });

            model.position.copy(intersectionPoint);
            world.graphicsWorld.add(model);
            world.physicsWorld.add(boxCollider.body);            

            const modelWrapper = new THREE.Object3D();
            modelWrapper.add(model);
            model.position.copy(center.negate());
            world.graphicsWorld.add(modelWrapper);

            world.registerUpdatable({
                updateOrder: 0,
                update: () => {
                    modelWrapper.position.copy(Utils.threeVector(boxCollider.body.position));
                    modelWrapper.quaternion.copy(Utils.threeQuat(boxCollider.body.quaternion));
                }
            });
        } else {
            console.log("No intersection found");
        }
    });
};

const applyImageTexture = (imageUrl) => {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, world.camera);
    const intersects = raycaster.intersectObjects(world.graphicsWorld.children, true);
    
    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        
        // Load the image as a texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(imageUrl, (texture) => {
            // Make the texture repeat
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2); // Adjust repeat values as needed

            // Function to apply material to an object or its children
            const applyMaterialToObject = (object) => {
                if (object.isMesh) {
                    // Create a new material with the loaded texture
                    const newMaterial = new THREE.MeshStandardMaterial({
                        map: texture,
                        skinning: object.material.skinning // Preserve skinning if it exists
                    });
                    
                    // Copy other relevant properties from the original material
                    newMaterial.color.copy(object.material.color);
                    newMaterial.roughness = object.material.roughness;
                    newMaterial.metalness = object.material.metalness;

                    // Apply the new material
                    object.material = newMaterial;
                }
            };

            // Apply material to the intersected object and its children
            intersectedObject.traverse(applyMaterialToObject);
        });
    } else {
        console.log("No object intersected for texture application");
    }
};

/*
const input = document.createElement('input');
input.type = 'text';
document.body.appendChild(input);

const downloadButton = document.createElement('button');
downloadButton.textContent = 'Generate 3D Model';
document.body.appendChild(downloadButton);

downloadButton.addEventListener('click', async () => {
    const v = input.value || 'trump';
    input.value = '';
    const glbUrl = await GenerateGLB(v);
    if (glbUrl) loadModel(glbUrl);
    else console.error('Failed to generate GLB URL');
});
*/