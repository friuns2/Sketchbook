

export { }

// IMPORTANT: Always use function AutoScale(model: any, approximateSizeInMeters: number) to scale the model
// IMPORTANT: Always use function expose(variable: any, name: string) to expose the parameters to GUI
// IMPORTANT: Assign animation names like this: animationsMapping.idle = "Idle"; animationsMapping.run = "Run"; animationsMapping.walk = "Walk"; animationsMapping.jump = "Jump";


interface Interactable {
    interact(player: Player): void;
    position: THREE.Vector3;
  }
  
  const interactableObjects: Interactable[] = [];

  
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

class Player extends Character {
    // put player code here
    update(timeStep: number): void {
        super.update(timeStep);
    }

    inputReceiverUpdate(deltaTime: number): void {
        super.inputReceiverUpdate(deltaTime);
    }
}

const player = new Player(playerModel);
expose(player.moveSpeed, "player speed");
player.setPosition(0, 0, -5);
world.add(player);

player.takeControl();


class NPC extends Character implements Interactable {
    dialog: string;

    constructor(model: GLTF, dialog: string) {
        super(model);
        this.dialog = dialog;
    }

    public interact(player: Player): void {
        Swal.fire({
            title: this.dialog,
            toast: false,
            showCancelButton: true,
            confirmButtonText: 'Follow',
        }).then((result) => {
            if (result.isConfirmed) {
                this.setBehaviour(new FollowTarget(player));
            }
        });
    }
}

const npcs: NPC[] = [];
const npcPositions: { x: number, y: number, z: number, dialog: string }[] = [
      { x: 0.99, y: -0.53, z: -0.74, dialog: "Hello, I am a friendly NPC." },
      { x: 1.5, y: 0, z: -2, dialog: "Welcome to the game!" },
      { x: -1, y: 0, z: -2, dialog: "Can you help me?" }
];

for (let i = 0; i < npcPositions.length; i++) {
    const npcModel = await loader.loadAsync('build/assets/boxman.glb');
    const npc = new NPC(npcModel, npcPositions[i].dialog);
    npc.setPosition(npcPositions[i].x, npcPositions[i].y, npcPositions[i].z);
    npcs.push(npc);
    world.add(npc);
    interactableObjects.push(npc);
}
