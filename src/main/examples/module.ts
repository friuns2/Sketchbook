export {};

// IMPORTANT: Always use function AutoScale(model: any, approximateSizeInMeters: number) to scale the model
// IMPORTANT: Always use function expose(variable: any, name: string) to expose the parameters to GUI
// IMPORTANT: Assign animation names like this: animationsMapping.idle = Idle animation name from glb etc...

//#region Player Class
class Player extends Character {
    // put player code here
    update(timeStep: number): void {
        super.update(timeStep);
    }

    inputReceiverUpdate(deltaTime: number): void {
        super.inputReceiverUpdate(deltaTime);
    }
}
//#endregion

//#region Cow Class
class Cow extends Character {

}
//#endregion

//#region Main Function
async function main() {
    const world = new World();
    await world.initialize('build/assets/world.glb');

    const textPrompt: HTMLDivElement = document.createElement('div');
    textPrompt.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);";
    document.body.appendChild(textPrompt);

    const playerModel = await loadAsync('build/assets/boxman.glb');
    expose(playerModel.scene, "player");
    AutoScale(playerModel.scene, 1.7);
    addMethodListener(world, world.update, () => {
        TWEEN.update();
    });
    const player = new Player(playerModel);
    expose(player.moveSpeed, "player speed");
    player.setPosition(0, 0, -5);
    world.add(player);
    player.takeControl();

    const cowModel = await loadAsync('build/assets/cow.glb');
    AutoScale(cowModel.scene, 1);
    
    for (let i = 0; i < 3; i++) {
        let cow =  Utils.cloneGltf(cowModel);
        expose(cow.scene, "cow");    
        const cowInstance = new Cow(cow);
        cowInstance.setPosition(Math.random() * 10 - 5, 0, Math.random() * 10 - 5);
        world.add(cowInstance);
    }
}
//#endregion

main();