
globalThis.world = new World('build/assets/world.glb');
await world.initialize();
globalThis.properties = {};
globalThis.player = world.characters[0];
world.registerUpdatable({
    update: () => {
    }
});
player.addToWorld(world);
player.takeControl();

