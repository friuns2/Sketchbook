globalThis.world = new World('build/assets/world.glb');
await world.initialize();
globalThis.player = world.characters[0];
player.takeControl();
