export {};

// IMPORTANT: Always use function AutoScale(model: any, approximateSizeInMeters: number) to scale the model
// IMPORTANT: Always exoise  expose(variable: any, name: string) to expose the parameters to GUI
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
    world.gui.add(player, "moveSpeed").name("Player Speed").min(0).max(10).step(0.1);
    player.setPosition(0, 0, -5);
    world.add(player);

    player.takeControl();

    // Add random size trees
    const treeModel = await loadAsync('build/assets/tree.glb'); // Replace 'build/assets/tree.glb' with the actual path to your tree model

    const numTrees = 10; // Adjust the number of trees as needed
    
    let treeSizeControl = world.gui.add({treeSize: 1}, 'treeSize', 0.1, 10).name("Tree Size").step(.1); // Add GUI control for tree size

    for (let i = 0; i < numTrees; i++) {

        const randomX = Math.random() * 50 - 25; // Adjust the range for X position
        const randomZ = Math.random() * 50 - 25; // Adjust the range for Z position
        const randomScale = Math.random() + 0.5; // Adjust the range for tree size based on treeSize
        

        const treeClone = treeModel.scene.clone();
        AutoScale(treeClone, treeSizeControl.getValue()); // Scale tree based on treeSize


        let tree = new BaseObject(treeClone, 0, 'none', CANNON.Body.STATIC); // No mass for the trees
        // closure to apply random scale when tree size is changed in the GUI
        (function(tree: BaseObject, randomScale: number) {
            treeSizeControl.onChange(function(value: number) { // When the tree size is changed in the GUI
                tree.scale.setScalar(randomScale * value); // Apply random scale
            });
        })(tree, randomScale);
        tree.scale.setScalar(randomScale * treeSizeControl.getValue()); // Apply random scale
        tree.setPosition(randomX, 0, randomZ); // Set the random position
        world.add(tree);
    }


}
//#endregion

main();