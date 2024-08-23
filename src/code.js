
globalThis.world = new World('build/assets/world.glb');
await world.initialize();
world.registerUpdatable({
    update: () => {
    }
});

let playerModel = await new Promise((resolve, reject) => {
    new GLTFLoader().load('build/assets/boxman.glb', (gltf) => {
        let retarget = Object.fromEntries(gltf.animations.map(a => [a.name, a]));
        Object.assign(retarget, { idle: CAnims.idle, walk: CAnims.run, run: CAnims.sprint });
        resolve(gltf);
    });
});
let player = new Character(playerModel);


world.add(player);
player.takeControl();

