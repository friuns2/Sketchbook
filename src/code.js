
globalThis.world = new World();
await world.initialize('build/assets/world.glb');

GLTFLoader.prototype.loadAsync = async function (glbUrl) {
    return new Promise((resolve, reject) => {
        this.load(glbUrl, (gltf) => {
            resolve(gltf);
        }, undefined, reject);
    });
};

globalThis.loader = new GLTFLoader();
globalThis.player = world.characters[0];

/*
globalThis.playerModel = await loader.loadAsync('build/assets/shrek.glb');
globalThis.player = new Character(playerModel);
world.add(player);
playerModel.animations.forEach(a => {
    if (a.name === "Idle") a.name = CAnims.idle;
    if (a.name === "Run") a.name = CAnims.run;
});
*/
player.takeControl();
/*
    var kitchen_knifeModel = globalThis.kitchen_knifeModel = await new Promise((resolve, reject) => { 
        new GLTFLoader().load("kitchen_knife.glb", 
            gltf => {
                resolve(gltf);
            },
            undefined,
            reject
        );
    });
 
    kitchen_knifeModel.scene.position.copy({"x":0,"y":14.86,"z":-1.93});
    world.graphicsWorld.add(kitchen_knifeModel.scene);
    AutoScale({gltfScene:kitchen_knifeModel.scene, approximateScaleInMeters: .2});
 
    player.rhand = kitchen_knifeModel.scene.getObjectByName("Object_2");
    
    
    player.rhand.position.set(0.1, -0.1, 0.1);
    player.rhand.rotation.set(0, Math.PI / 2, 0);
    const playerRightHand = player.getObjectByName("rhand");
    playerRightHand.setParent(player.rhand);
 
    */

world.startRenderAndUpdate?.();
