export {};








{ }

// IMPORTANT: Always use function AutoScale(model: any, approximateSizeInMeters: number) to scale the model
// IMPORTANT: Always use function expose(variable: any, name: string) to expose the parameters to GUI
// IMPORTANT: Assign animation names like this: animations.forEach(a => { if (a.name === "Idle") a.name = CAnims.idle; if (a.name === "Run") a.name = CAnims.sprint; });

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
    jetpackEnabled: boolean;
    jetpackThrust: number;
    jetpackFuel: number;
    jetpackFuelMax: number;
    jetpackFuelConsumption: number;
    lastJetpackActivation: number;
    jetpackCooldown: number;

    constructor(model: GLTF) {
        super(model);
        this.jetpackEnabled = false;
        this.jetpackThrust = 10;
        this.jetpackFuel = 100;
        this.jetpackFuelMax = 100;
        this.jetpackFuelConsumption = 1.1;
        this.lastJetpackActivation = 0;
        this.jetpackCooldown = 1000;
        this.setupActions();
    }

    setupActions(): void {
        this.actions.jetpack = KeyBinding.CreateKeyBinding("Space");
    }

    update(timeStep: number): void {
        super.update(timeStep);
        this.updateJetpack(timeStep);
    }

    updateJetpack(timeStep: number): void {
        if (this.actions.jetpack.isPressed) {
            this.lastJetpackActivation = Date.now();
            this.jetpackEnabled = true;
        } else {
            this.jetpackEnabled = false;
        }

        if (this.jetpackEnabled) {
            this.jetpackFuel -= this.jetpackFuelConsumption * timeStep;
            this.characterCapsule.body.velocity.y += this.jetpackThrust * timeStep;
        }

        if (this.jetpackFuel <= 0) {
            this.jetpackEnabled = false;
        }
    }

    inputReceiverUpdate(deltaTime: number): void {
        super.inputReceiverUpdate(deltaTime);
        textPrompt.textContent = `Jetpack Fuel: ${Math.floor(this.jetpackFuel)}%`;
    }
}

const player = new Player(playerModel);

expose(player.moveSpeed, "player speed");
expose(player.jetpackThrust, "jetpack thrust");
expose(player.jetpackFuelMax, "jetpack fuel max");
expose(player.jetpackFuelConsumption, "jetpack fuel consumption");
expose(player.jetpackCooldown, "jetpack cooldown");

player.setPosition(0, 0, -5);
world.add(player);

player.takeControl();