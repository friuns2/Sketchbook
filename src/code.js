globalThis.world = new World();
await world.initialize('build/assets/world.glb');
world = createProxy(world);
globalThis.player = world.characters[0];
player.takeControl();

