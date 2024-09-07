//IMPORTANT: Always use AutoScale(model, scale) to scale the model
//IMPORTANT: Always use expose(variable, name) to expose the parameters to GUI


globalThis.world = new World();
await world.initialize('build/assets/world.glb');


var textPrompt = globalThis.textPrompt = document.createElement('div');
textPrompt.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);";
document.body.appendChild(textPrompt);



var loader = globalThis.loader = new GLTFLoader();

var playerModel = globalThis.playerModel = await loader.loadAsync('build/assets/boxman.glb');
expose(playerModel.scene, "player");
AutoScale(playerModel.scene, 1.7);
addMethodListener(world, world.update, function () {
    TWEEN.update();
});
class Player extends Character
{
    //put player code here
    update(timeStep) {
        super.update(timeStep);
    }
    
    inputReceiverUpdate(deltaTime) {
        super.inputReceiverUpdate(deltaTime);
    }
}
var player = globalThis.player = new Player(playerModel); 
expose(player.moveSpeed, "player speed");
player.setPosition(0, 0, -5);
world.add(player);

player.takeControl();

world.startRenderAndUpdatePhysics?.();
