globalThis.world = new World();
await world.initialize('build/assets/world.glb');
globalThis.player = world.characters[0];
player.takeControl();
