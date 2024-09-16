// Import necessary libraries
export {};
//#region World Initialization
// Initialize the world
const world = new World();
await world.initialize('build/assets/world.glb');
//#endregion

//#region UI Elements Creation
// Create UI elements
const textPrompt = createUIElement('div', "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);");
const crosshair = createUIElement('div', "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; border: 2px solid white; border-radius: 50%;");
//#endregion

//#region Interactable Interface
interface Interactable {
  interact(player: Player): void;
  position: THREE.Vector3;
}

const interactableObjects: Interactable[] = [];
const loader = new GLTFLoader();
const playerModel = await loader.loadAsync('build/assets/boxman.glb');
expose(playerModel.scene, "player");
//#endregion

//#region Player Class
class Player extends Character {
    rhand: THREE.Object3D | null;
    lhand: THREE.Object3D | null;
    heldWeapon: Weapon | null;
    originalSensitivity: THREE.Vector2;
    aimingSpeed: number;
    aimingFOV: number;
    aimingOffset: THREE.Vector3;
    originalFOV: number;

    constructor(model: GLTF) {
        super(model);
        this.setupProperties();
        this.setupActions();
    }

    setupProperties(): void {
        this.rhand = this.modelContainer.getObjectByName("rhand");
        this.lhand = this.modelContainer.getObjectByName("lhand");
        this.remapAnimations();
        this.setupCameraSettings();
        this.heldWeapon = null;
    }

    setupActions(): void {
        this.actions.interractKey = KeyBinding.CreateKeyBinding("KeyR");
        this.actions.aim = KeyBinding.CreateMouseBinding(2);
        this.actions.dropWeapon = KeyBinding.CreateKeyBinding("KeyV");
    }

    setupCameraSettings(): void {
        this.originalSensitivity = world.cameraOperator.sensitivity.clone();
        this.aimingSpeed = 0.5;
        this.aimingFOV = 40;
        this.aimingOffset = new THREE.Vector3(-0.5, 0.3, 0.0);
        this.originalFOV = world.camera.fov;
    }

    remapAnimations(): void {
        this.animationMapping.idle = "idle";
        this.animationMapping.walk = "Walk1_InPlace";
    }

    public attachWeapon(weapon: Weapon): void {
        if (this.rhand) {
            this.rhand.attach(weapon);
            weapon.position.set(0, 0, 0);
            weapon.rotation.set(0, 0, 0);
            this.heldWeapon = weapon;
            world.remove(weapon);
        }
    }

    public detachWeapon(): void {
        if (this.heldWeapon) {
            this.heldWeapon.removeFromParent();
            this.heldWeapon = null;
        }
    }

    public inputReceiverUpdate(deltaTime: number): void {
        super.inputReceiverUpdate(deltaTime);
        this.handleInteractions();
        this.handleAiming();
        this.handleWeaponDrop();
    }

    handleInteractions(): void {
        textPrompt.textContent = "";
        for (let object of interactableObjects) {
            if (this.position.distanceTo(object.position) < 2) {
                textPrompt.textContent = "Press R to interact";
                if (this.actions.interractKey.isPressed) {
                    object.interact(this);
                    break;
                }
            }
        }
    }

    handleAiming(): void {
        if (this.actions.aim.isPressed) {
            this.enableAimMode();
        } else {
            this.disableAimMode();
        }
    }

    enableAimMode(): void {
        world.camera.fov += (this.aimingFOV - world.camera.fov) * 0.1;
        world.cameraOperator.sensitivity.set(this.aimingSpeed, this.aimingSpeed);
        const cameraDirection = world.camera.getWorldDirection(new THREE.Vector3());
        const rotatedOffset = this.aimingOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(cameraDirection.x, cameraDirection.z));
        world.cameraOperator.target.add(rotatedOffset);
        world.camera.updateProjectionMatrix();
        crosshair.style.display = 'block';
        const aimDirection = world.camera.getWorldDirection(new THREE.Vector3());
        aimDirection.y = 0;
        aimDirection.normalize();
        this.setOrientation(aimDirection, false);
    }

    disableAimMode(): void {
        world.camera.fov = this.originalFOV;
        world.camera.updateProjectionMatrix();
        world.cameraOperator.sensitivity.copy(this.originalSensitivity);
        crosshair.style.display = 'none';
    }

    handleWeaponDrop(): void {
        if (this.actions.dropWeapon.justPressed) {
            this.detachWeapon();
        }
    }

    public handleMouseButton(event: MouseEvent, code: string, pressed: boolean): void {
        super.handleMouseButton(event, code, pressed);
        if (event.button === 0 && pressed === true && this.heldWeapon) {
            this.heldWeapon.shoot();
        }
    }
}
//#endregion

//#region Player Initialization
const player = new Player(playerModel);
player.setPosition(0, 0, -5);
world.add(player);

addMethodListener(player, "inputReceiverInit", function () {
    world.cameraOperator.setRadius(1.6);
});
player.takeControl();
//#endregion

//#region Weapon Class
class Weapon extends BaseObject implements Interactable {
    shootDelay: number;
    lastShootTime: number;

    constructor(model: THREE.Group) {
        super(model, 0.1);
        this.shootDelay = 1000;
        this.lastShootTime = 0;
    }

    public interact(player: Player): void {
        player.attachWeapon(this);
        world.remove(this);
        const index = interactableObjects.indexOf(this);
        if (index > -1) {
            interactableObjects.splice(index, 1);
        }
    }

    public shoot(): void {
        if (Date.now() - this.lastShootTime > this.shootDelay) {
            this.lastShootTime = Date.now();
            this.shootGrenade();
        }
    }
    async shootGrenade(): Promise<void> {
        const grenadeModel = await loadAsync('build/assets/grenade.glb');
        AutoScale(grenadeModel.scene, 0.1);
        const grenade = new Grenade(grenadeModel.scene, .1);
        const position = this.getWorldPosition(new THREE.Vector3());
        grenade.setPosition(position.x, position.y, position.z);
        const cameraDirection = world.camera.getWorldDirection(new THREE.Vector3());
        const direction = cameraDirection.multiplyScalar(30).add(new THREE.Vector3(0, 1, 0));
        grenade.body.velocity = Utils.cannonVector(direction);

        world.add(grenade);
        grenade.body.collisionFilterMask = ~2;
        grenade.body.addEventListener('collide', (event: any) => {
            world.remove(grenade);
            explodeGrenade(grenade.position);
        });
    }
}
//#endregion

//#region Grenade Class
class Grenade extends BaseObject {
    constructor(model: THREE.Group, mass: number) {
        super(model, mass);
        this.body.collisionFilterMask = ~2; // Only collide with the world
    }
}
//#endregion

//#region Explosion Function
async function explodeGrenade(position: THREE.Vector3): Promise<void> {
    console.log("explode")
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.8 });
    const explosion = new THREE.Mesh(geometry, material);
    explosion.position.copy(position);
    world.graphicsWorld.add(explosion);

    const animateDuration = 500;

    new TWEEN.Tween(explosion.scale)
        .to({ x: 4, y: 4, z: 4 }, animateDuration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            explosion.material.opacity = 0.8 * (1 - (explosion.scale.x / 4));
        })
        .onComplete(() => {
            world.graphicsWorld.remove(explosion);
        })
        .start();
        
    // Apply explosion force to nearby objects
    world.physicsWorld.bodies.forEach(body => {
        const distance = body.position.distanceTo(Utils.cannonVector(position));
        if (distance < 10) { // Adjust the explosion radius as needed
            const force = new CANNON.Vec3();
            force.copy(body.position).vsub(Utils.cannonVector(position));
            force.normalize();
            force.scale(50 / (distance * distance), force); // Adjust the force intensity
            body.applyImpulse(force, new CANNON.Vec3());
        }
    });

    // Damage zombies in the explosion radius
    world.characters.forEach(character => {
        if (character instanceof Zombie) {
            const distance = character.position.distanceTo(position);
            const damage = Math.max(0, 100 * (1 - distance / 100)); // Calculate damage based on distance
            if (damage > 0) {
                character.takeDamage(damage); // Deal calculated damage to the zombie
                console.log("Zombie hit! Health:", character.health);
            }
        }
    });
}
//#endregion

//#region World Update Listener
addMethodListener(world,"update",function(deltaTime:number){
    TWEEN.update();
});
//#endregion

//#region Rocket Launcher Initialization
const rocketLauncherModel = await loader.loadAsync('build/assets/rocketlauncher.glb');
AutoScale(rocketLauncherModel.scene, 0.5);
const rocketLauncher = new Weapon(rocketLauncherModel.scene);
world.add(rocketLauncher);
rocketLauncher.setPosition(1, 0, -2);
expose(rocketLauncherModel.scene, "rocketlauncher");
interactableObjects.push(rocketLauncher);

//#region RandomBehaviour Class

export class RandomBehaviour implements ICharacterAI
{
	public character: Character;
	private randomFrequency: number;
	private state: 'wander' | 'chase' | 'dead' = 'wander';
	private player: Player;

	constructor(randomFrequency: number = 100)
	{
		this.randomFrequency = randomFrequency;
	}

	public update(timeStep: number): void
	{
		if (this.state === 'dead') return;

		if (this.state === 'wander') {
			this.wander(timeStep);
		} else if (this.state === 'chase') {
			this.chase(timeStep);
		}
	}

	private wander(timeStep: number): void {
		let rndInt = Math.floor(Math.random() * this.randomFrequency);
		let rndBool = Math.random() > 0.5 ? true : false;

		if (rndInt === 0)
		{
			this.character.setViewVector(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5));

			this.character.triggerAction('up', true);
			this.character.charState.update(timeStep);
			this.character.triggerAction('up', false);
		}
		else if (rndInt === 1)
		{
			this.character.triggerAction('up', rndBool);
		}
		else if (rndInt === 2)
		{
			this.character.triggerAction('run', rndBool);
		}
		else if (rndInt === 3)
		{
			this.character.triggerAction('jump', rndBool);
		}
	}

	private chase(timeStep: number): void {
		if (this.player) {
			const direction = new THREE.Vector3().subVectors(this.player.position, this.character.position).normalize();
			this.character.setViewVector(direction);
			this.character.triggerAction('up', true);
			this.character.charState.update(timeStep);
		}
	}

	public setState(state: 'wander' | 'chase' | 'dead'): void {
		this.state = state;
	}

    setPlayer(player: Player): void {
        this.player = player;
    }
}
//#endregion

//#region Zombie Class
class Zombie extends Character {
    health: number = 100;
    healthBar: THREE.Mesh;
    attackDelay: number = 2000; // 2 seconds
    lastAttackTime: number = 0;
    attackRange: number = 2; // Distance to player for attack
    isAttacking: boolean = false;
    wanderRadius: number = 5;
    wanderSpeed: number = 0.5;
    chaseSpeed: number = 1;
    chaseDistance: number = 10; // Distance to player to start chasing
    chaseDuration: number = 5000; // Duration of chase after getting hit (in milliseconds)
    chaseStartTime: number = 0;
    behavior: RandomBehaviour;

    constructor(model: GLTF, player: Player) {
        super(model);
        this.setupHealthBar();
        this.setupAnimations();
        this.behavior = new RandomBehaviour(100);
        this.behavior.setPlayer(player);
        this.behavior.character = this;
    }

    setupAnimations(): void {
        this.animationMapping.idle = "Idle";
        this.animationMapping.walk = "Walk_InPlace";
        this.animationMapping.run = "Run_InPlace";
        this.animationMapping.attack = "Attack";
        this.animationMapping.dead = "FallingBack";
    }

    setupHealthBar(): void {
        const healthBarGeometry = new THREE.BoxGeometry(1, 0.1, 0.2);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        this.healthBar.position.set(0, 1.2, 0);
        this.add(this.healthBar);
    }

    update(timeStep: number): void {
        super.update(timeStep);
        this.updateHealthBar();
        this.behavior.update(timeStep);
    }

    updateHealthBar(): void {
        const healthPercentage = this.health / 100;
        this.healthBar.scale.x = healthPercentage;
        if (this.healthBar.material instanceof THREE.MeshBasicMaterial) {
            this.healthBar.material.color.setHex(healthPercentage > 0.5 ? 0x00ff00 : 0xff0000);
        }
    }

    takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.behavior.setState('dead');
            this.startDeathAnimation();
        } else {
            this.playHitAnimation();
            this.behavior.setState('chase');
            this.chaseStartTime = Date.now();
        }
    }

    playHitAnimation(): void {
        const zombieMesh = this.modelContainer.children[0];
        if (zombieMesh instanceof THREE.Mesh && zombieMesh.material instanceof THREE.MeshStandardMaterial) {
            const originalColor = zombieMesh.material.color.clone();
            zombieMesh.material.color.setHex(0xff0000);
            setTimeout(() => {
                zombieMesh.material.color.copy(originalColor);
            }, 100);
        }
    }

    attack(): void {
        if (!this.isAttacking) {
            this.isAttacking = true;
            this.setAnimation("attack", 0, false);
            this.mixer.addEventListener('finished', () => {
                this.isAttacking = false;
                this.setAnimation("idle", 0);
            });
        }
    }

    startDeathAnimation(): void {
        this.setAnimation("dead", 0, false);
        this.mixer.addEventListener('finished', () => {
            world.unregisterUpdatable(this);
        });
    }
}
//#endregion

//#region Create the cube stack
const cubeScale = 0.7;

for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
        for (let z = 0; z < 3; z++) {
            const cubePosition = new THREE.Vector3(
                x * cubeScale + cubeScale / 2,
                y * cubeScale + cubeScale / 2,
                z * cubeScale + cubeScale / 2
            );

            // Create the cube
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load('build/assets/crate_diffuse.jpg');
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);

            const cubeModel = new THREE.Mesh(
                new THREE.BoxGeometry(cubeScale, cubeScale, cubeScale),
                new THREE.MeshStandardMaterial({ map: texture })
            );
            const cube = new BaseObject(cubeModel, 1); // Give the cube some mass
            cube.setPosition(cubePosition.x, cubePosition.y, cubePosition.z);
            cube.addToWorld(world);
        }
    }
}
//#endregion

//#region Zombie Initialization
const zombieModel = await loader.loadAsync('build/assets/zombie.glb');
const zombie = new Zombie(zombieModel, player);
zombie.setPosition(5, 0, 0);
world.add(zombie);
//#endregion