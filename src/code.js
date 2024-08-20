globalThis.world = new World('build/assets/world.glb');
await world.initialize();
globalThis.properties = {}
globalThis.player = world.characters[0];
player.takeControl();