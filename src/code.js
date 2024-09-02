globalThis.world = new World();
await world.initialize('build/assets/world.glb');

GLTFLoader.prototype.loadAsync = async function (glbUrl) {
    return new Promise((resolve, reject) => {
        this.load(glbUrl, (gltf) => {
            resolve(gltf);
        }, undefined, reject);
    });
};

const textPrompt = document.createElement('div');
textPrompt.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);";
document.body.appendChild(textPrompt);

const loader = new GLTFLoader();

const playerModel = await loader.loadAsync('build/assets/boxman.glb');
expose(playerModel.scene, "player");

class Player extends Character {
    constructor(model) {
        super(model);
        this.rhand = model.scene.getObjectByName("rhand");
        this.lhand = model.scene.getObjectByName("lhand");
        this.remapAnimations(model.animations);
        this.actions.interract = new KeyBinding("KeyR");
        this.actions.throwPistol = new KeyBinding("KeyG");
        this.lastCubePosition = null;
        this.attachedPistol = null;
    }

    remapAnimations(animations) {
        animations.forEach(a => {
            if (a.name === "Idle") a.name = CAnims.idle;
            if (a.name === "Run") a.name = CAnims.run;
        });
    }

    attachPistolToHand(pistol) {
        if (this.rhand) {
            this.rhand.addWithPreservedScale(pistol);            
            this.attachedPistol = pistol;
            world.remove(pistol);
        }
    }

    throwPistol() {
        if (this.attachedPistol) {
            this.attachedPistol.body.velocity.copy(
                this.velocity.clone().multiplyScalar(2) // Throw the pistol with twice the player's velocity
            );
            this.attachedPistol.removeFromParent();            
            this.attachedPistol = null;
        }
    }

    update(deltaTime) {
        super.update(deltaTime);

        textPrompt.textContent = "";
        // Check for interactable objects within range
        for (let updatable of world.updatables) {
            if (updatable.interract && this.position.distanceTo(updatable.position) < 2) {
                textPrompt.textContent = "Press R to interact";
                if (this.actions.interract.isPressed) {
                    updatable.interract(this);
                
                    break;
                }
            }
        }

        if (this.actions.throwPistol.isPressed) {
            this.throwPistol();
        }
    }

    handleMouseButton(event, code, pressed) {
        super.handleMouseButton(event, code, pressed);
        if (event.button === 0 && pressed === true) {
            // Shoot the pistol
        } else if (event.button === 2 && pressed === true) {
            // Perform another action
        }
    }
}

const player = new Player(playerModel);
player.setPosition(0, 0, -5);
world.add(player);

addMethodListener(player, "inputReceiverInit", function () {
    world.cameraOperator.setRadius(1.6)
});
player.takeControl();

class Pistol extends BaseObject {
    constructor(model) {
        super(model);        
    }
    interract(player) {
        player.attachPistolToHand(this);
        world.remove(this);
    }
}

var pistol = await new GLTFLoader().loadAsync("-3_9mm-pistol-gun-weapon-series-260nw-515302792-3.glb").then(gltf => {
    const pistolObject = new Pistol(gltf.scene);
    world.add(pistolObject);
    expose(gltf.scene, "pistol");
    return pistolObject;
});
pistol.setPosition(1.81, -0.53, -1.76);
pistol.scale.set(0.3, 0.3, 0.3);

world.startRenderAndUpdatePhysics?.();