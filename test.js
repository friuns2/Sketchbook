globalThis.world = new World('build/assets/world.glb');
await world.initialize();

GLTFLoader.prototype.loadAsync = async function(glbUrl) {
    return new Promise((resolve, reject) => {
        this.load(glbUrl, (gltf) => {
            AutoScale(gltf, 5);
            resolve(gltf);
        }, undefined, reject);
    });
};

let loader = new GLTFLoader();

let playerModel = await loader.loadAsync('build/assets/boxman.glb');
playerModel.animations.forEach(a => {
    if (a.name === "Idle") a.name = CAnims.idle;
    if (a.name === "Run") a.name = CAnims.run;
});

let player = new Character(playerModel);
player.setPosition(-2.82, 14.86, -4.81);
world.add(player);
player.takeControl();

let teslaModel = await loader.loadAsync('build/assets/tesla.glb');
let tesla = new Car(teslaModel);
tesla.setPosition(-2.82, 14.86, -4.81);
world.add(tesla);
SkeletonUtils.SkeletonUtils.retarget