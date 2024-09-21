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
        let image = file && file.type.startsWith('image/')
        if (file && file.name.endsWith('.glb')|| image) {
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

                if (image) {
                    const hashCode = fileName.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0).toString(16).substring(0, 2);
                    const glbFileName = `${hashCode}_${fileName.replace(/\.[^/.]+$/, hashCode+".glb")}`;
                    let glbUrl;
                    try {
                        const response = await fetch(glbFileName);
                        if (response.ok)
                            glbUrl = response.url;
                    }
                    catch { }
                    if(!glbUrl)
                        glbUrl = await GenerateGLB(file);

                    if (glbUrl) {
                        const glbResponse = await fetch(glbUrl);
                        const glbBlob = await glbResponse.blob();
                        const glbArrayBuffer = await glbBlob.arrayBuffer();
                        
                        
                        navigator.serviceWorker.controller.postMessage({
                            action: 'uploadFiles',
                            files: [{ name: glbFileName, buffer: glbArrayBuffer }]
                        });
                        await new Promise(resolve => setTimeout(resolve, 100));

                        var code = await GetSpawnGLBCodeFromFile(glbFileName, intersectionPoint, true);
                        chat.variant.files[0].content += code;
                        Eval(code);
                    } else {
                        console.error('Failed to generate GLB URL');
                    }
                } else {
                    var code = await GetSpawnGLBCodeFromFile(fileName, intersectionPoint);
                    chat.variant.files[0].content += code;
                    Eval(code);
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (file && file.name.endsWith('.js')) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                chat.variant.files[0].content += event.target.result;
                await Eval(event.target.result);
            };
            reader.readAsText(file);
        } else {
        //    alert('Please drop a valid GLB, JS, or image file.');
        }
    });
    var mouse = new THREE.Vector2();

    // Update mouse position
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });



   

    
})();
async function GetSpawnGLBCodeFromFile(fileName, intersectionPoint=null, setPivot = false) {
    const gltf = await new Promise((resolve, reject) => {
        new GLTFLoader().load(fileName, (gltf) => resolve(gltf), undefined, (error) => reject(error));
    });
    return GetSpawnGLBCode(gltf, fileName, intersectionPoint, setPivot,false);
}
function GetSpawnGLBCode(gltf,fileName, intersectionPoint=null, setPivot = false,full=true) {
    
    const animations = gltf.animations;
    let isSkinnedMesh = false;
    gltf.scene.traverse(a => isSkinnedMesh ||= a instanceof THREE.SkinnedMesh);
    
    const modelName = "a"+fileName.split('.').slice(0, -1).join('_').replace(/[^a-zA-Z0-9_]/g, '_').substr(-6);
    let animationsCode = animations && animations.length > 0 ? `
            
/* CRITICAL: Uncomment and replace "???" with correct aniamtion name!
${animations.map((clip, index) => `${modelName}.animationsMapping.??? = "${clip.name}";`).join('\n')}
*/
            
        ` : '';
        
    let code = `    
${full ? "/* " + modelName + " hierarchy:" + Object3DToHierarchy(gltf) + "*/" : ''}
let ${modelName}Model = await new GLTFLoader().loadAsync("${fileName}");
`;
    if (isSkinnedMesh) code += `
let ${modelName} = new Character(${modelName}Model);
//CRITICAL: Uncomment and assign hands immediately! Use ${modelName}Model hierarchy to find the correct bones
//${modelName}.lhand = 
//${modelName}.rhand = 
${animationsCode}
world.add(${modelName});
`;

    else code += `
//CRITICAL: Uncomment and assign correct scale immediately!
//AutoScale(${modelName}Model.scene, 5);
${setPivot ? `SetPivotCenter(${modelName}Model);` : ''}
let ${modelName} = new BaseObject(${modelName}Model.scene,0,'concave');
world.add(${modelName});
`;

    code += `\n${intersectionPoint ? `${modelName}.setPosition(${intersectionPoint.x.toFixed(2)}, ${intersectionPoint.y.toFixed(2)}, ${intersectionPoint.z.toFixed(2)});` : ''}`

    return code;
}
function VectorToString(intersectionPoint) {
    return JSON.stringify(intersectionPoint, (key, value) => typeof value === 'number' ? Number(value.toFixed(2)) : value);
}