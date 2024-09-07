### User:  
I want to create a new `World` object from a glb file and initialize it. Then I need to display a text prompt at the center of the screen.  

### AI:  
Create a new world object and initialize it using the `World` class. Then, create a `div` for the text prompt, position it in the center of the screen, and append it to the body of the document.

```js
globalThis.world = new World();
await world.initialize('build/assets/world.glb');

var textPrompt = globalThis.textPrompt = document.createElement('div');
textPrompt.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);";
document.body.appendChild(textPrompt);
```

---

### User:  
I want a crosshair in the center of the screen.  

### AI:  
Add a `div` to act as a crosshair, style it to be centered, and append it to the body.  

```js
var crosshair = globalThis.crosshair = document.createElement('div');
crosshair.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; border: 2px solid white; border-radius: 50%;";
document.body.appendChild(crosshair);
```

---

### User:  
I want to load a player model using GLTFLoader and set its hands.  

### AI:  
Use the `GLTFLoader` to load the player model. After loading, expose the player's right and left hands for further interaction.

```js
var loader = globalThis.loader = new GLTFLoader();
var playerModel = globalThis.playerModel = await loader.loadAsync('build/assets/boxman.glb');
expose(playerModel.scene, "player");

class Player extends Character {
    constructor(model) {
        super(model);
        this.rhand = model.scene.getObjectByName("rhand");
        this.lhand = model.scene.getObjectByName("lhand");
        this.remapAnimations(model.animations);
    }
    remapAnimations(animations) {
        animations.forEach(a => {
            if (a.name === "Idle") a.name = CAnims.idle;
            if (a.name === "Run") a.name = CAnims.run;
        });
    }
}
```

---

### User:  
I want to add actions like aiming, interacting, and dropping weapons.  

### AI:  
Add key bindings for interacting (`R`), aiming (right mouse button), and dropping weapons (`V`). Set camera sensitivity and field of view adjustments when aiming.

```js
class Player extends Character {
    constructor(model) {
        super(model);
        this.actions.interract = KeyBinding.CreateKeyBinding("R");
        this.actions.aim = KeyBinding.CreateMouseBinding(2);
        this.actions.dropWeapon = KeyBinding.CreateKeyBinding("V");
        this.originalSensitivity = world.cameraOperator.sensitivity.clone();
        this.aimingSpeed = 0.5;
        this.aimingFOV = 40;
        this.aimingOffset = new THREE.Vector3(-0.5, 0.3, 0.0);
        this.originalFOV = world.camera.fov;
        this.heldWeapon = null;
    }

    inputReceiverUpdate(deltaTime) {
        super.inputReceiverUpdate(deltaTime);
        // Handle aiming and interaction
    }
}
```

---

### User:  
How do I attach and detach weapons for the player?  

### AI:  
Create methods to attach and detach weapons to the player’s right hand. Attach the weapon and remove it from the world when picked up.

```js
class Player extends Character {
    attachWeapon(weapon) {
        if (this.rhand) {
            this.rhand.attach(weapon);
            weapon.position.set(0, 0, 0);
            weapon.rotation.set(0, 0, 0);
            this.heldWeapon = weapon;
            world.remove(weapon);
        }
    }

    detachWeapon() {
        if (this.heldWeapon) {
            this.heldWeapon.removeFromParent();
            this.heldWeapon = null;
        }
    }
}
```

---

### User:  
I want to implement shooting for the weapons.  

### AI:  
Add a `shoot` method for the weapon, which triggers every second. Implement logic to create a grenade as a projectile.

```js
class Weapon extends BaseObject {
    constructor(model) {
        super(model, 0.1);
        this.shootDelay = 1000;
        this.lastShootTime = 0;
    }

    shoot() {
        if (Date.now() - this.lastShootTime > this.shootDelay) {
            this.lastShootTime = Date.now();
            this.shootGrenade();
        }
    }

    shootGrenade() {
        var grenadeModel = globalThis.grenadeModel = loader.loadAsync('build/assets/grenade.glb').then(gltf => {
            return gltf.scene;
        });
        grenadeModel.then(grenadeModel => {
            AutoScale(grenadeModel, 0.1);
            var grenade = new BaseObject(grenadeModel, 0.1);
            grenade.setPosition(this.getWorldPosition().clone());

            // Implement shooting direction and force
        });
    }
}
```

---

### User:  
How do I create an explosion when the grenade hits something?  

### AI:  
Detect collisions with other objects and create a visual explosion effect using `Tween`.

```js
async function explodeGrenade(position) {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.8 });
    const explosion = new THREE.Mesh(geometry, material);
    explosion.position.copy(position);
    world.graphicsWorld.add(explosion);

    new TWEEN.Tween(explosion.scale)
        .to({ x: 4, y: 4, z: 4 }, 500)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => {
            world.graphicsWorld.remove(explosion);
        })
        .start();
}
```

---

### User:  
I want NPCs that interact with the player and follow them.  

### AI:  
Create NPCs that can interact with the player and follow them upon interaction.

```js
class NPC extends Character {
    constructor(model, dialog) {
        super(model);
        this.dialog = dialog;
    }

    interract(player) {
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
```