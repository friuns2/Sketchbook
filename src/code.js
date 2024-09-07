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

class Pistol extends THREE.Object3D {
    constructor(parent) {
        super();
        parent.attach(this);
        this.bulletSpeed = 10;
        this.bullets = [];
        this.reloadTime = 0.5;
        this.lastShotTime = 0;
    }

    update(timeStep) {
        this.bullets.forEach((bullet, index) => {
            bullet.position.add(bullet.direction.clone().multiplyScalar(this.bulletSpeed * timeStep));
            if (bullet.position.distanceTo(this.parent.position) > 20) {
                this.bullets.splice(index, 1);
                world.remove(bullet);
            }
        });
    }

    shoot() {
        if (Date.now() - this.lastShotTime > this.reloadTime * 1000) {
            this.lastShotTime = Date.now();
            const bullet = new Bullet();
            bullet.position.copy(this.parent.getWorldPosition());
            bullet.direction.copy(world.camera.getWorldDirection());
            world.add(bullet);
            this.bullets.push(bullet);
        }
    }
}

class Bullet extends THREE.Mesh {
    constructor() {
        super(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({ color: 'red' }));
        this.direction = new THREE.Vector3();
    }
}

class Player extends Character
{
    //put player code here
    constructor(model) {
        super(model);
        this.rhand = model.scene.getObjectByName("rhand");
        
        // Load the pistol model
        const pistolModel = loader.loadAsync('build/assets/pistol.glb').then(gltf => {
            return gltf.scene;
        });

        // Add pistol to hand when model loads
        pistolModel.then(pistolModel => {
            this.pistol = new Pistol(this.rhand);
            this.pistol.attach(pistolModel); // Attach the loaded model to the pistol object
            this.pistol.position.set(0.1, -0.1, 0.1);
            this.pistol.rotation.set(0, Math.PI / 2, 0); // Adjust rotation as needed
        });
    }

    update(timeStep) {
        super.update(timeStep);
        if (this.pistol) { // Check if the pistol has been loaded
            this.pistol.update(timeStep);
        }
    }
    
    inputReceiverUpdate(deltaTime) {
        super.inputReceiverUpdate(deltaTime);
    }

    handleMouseButton(event, code, pressed) {
        super.handleMouseButton(event, code, pressed);
        if (event.button === 0 && pressed === true && this.pistol) { // Check if the pistol is loaded
            this.pistol.shoot();
        }
    }
}

var player = globalThis.player = new Player(playerModel); 
expose(player.speed, "player speed");
player.setPosition(0, 0, -5);
world.add(player);

player.takeControl();

world.startRenderAndUpdatePhysics?.();