export {};
// IMPORTANT: Always use function AutoScale(model: any, approximateSizeInMeters: number) to scale the model
// IMPORTANT: Always use function expose(variable: any, name: string) to expose the parameters to GUI

//#region World Setup
const world = new World();
await world.initialize('build/assets/world.glb');

const textPrompt: HTMLDivElement = document.createElement('div');
textPrompt.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);";
document.body.appendChild(textPrompt);

const crosshair: HTMLDivElement = document.createElement('div');
crosshair.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; border: 2px solid white; border-radius: 50%; display: none;"; // Initially hidden
document.body.appendChild(crosshair);

const playerModel = await loadAsync('build/assets/boxman.glb');
expose(playerModel.scene, "player");
AutoScale(playerModel.scene, 1.7);
addMethodListener(world, world.update, () => {
    TWEEN.update();
});
//#endregion

//#region Player Class
class Player extends Character {
    // put player code here
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
        this.rhand = this.modelContainer.getObjectByName("rhand");
        this.lhand = this.modelContainer.getObjectByName("lhand");
        this.heldWeapon = null;
        this.remapAnimations();
        this.setupActions();
        this.setupCameraSettings();
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

    setupActions(): void {
        this.actions.interractKey = KeyBinding.CreateKeyBinding("KeyR");
        this.actions.aim = KeyBinding.CreateMouseBinding(2);
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

    update(timeStep: number): void {
        super.update(timeStep);
    }

    inputReceiverUpdate(deltaTime: number): void {
        super.inputReceiverUpdate(deltaTime);
        this.handleInteractions();
        this.handleAiming();
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
        crosshair.style.display = 'block'; // Show crosshair
        
        // Look in aiming direction
        this.setOrientation(cameraDirection.clone().normalize(), false);
    }

    disableAimMode(): void {
        world.camera.fov = this.originalFOV;
        world.camera.updateProjectionMatrix();
        world.cameraOperator.sensitivity.copy(this.originalSensitivity);
        crosshair.style.display = 'none'; // Hide crosshair
    }

    public handleMouseButton(event: MouseEvent, code: string, pressed: boolean): void {
        super.handleMouseButton(event, code, pressed);
        if (event.button === 0 && this.heldWeapon) {
            if (pressed) {
                this.startShooting();
            } else {
                this.stopShooting();
            }
        }
    }

    private shootingInterval: number | null = null;

    private startShooting(): void {
        if (this.heldWeapon && this.heldWeapon.isAutomatic) {
            this.shootingInterval = setInterval(() => {
                this.heldWeapon?.shoot();
            }, this.heldWeapon.shootDelay) as unknown as number;
        }
    }

    private stopShooting(): void {
        if (this.shootingInterval !== null) {
            clearInterval(this.shootingInterval);
            this.shootingInterval = null;
        }
    }
}
//#endregion

//#region Player Setup
const player = new Player(playerModel);
expose(player.moveSpeed, "player speed");
player.setPosition(0, 0, -5);
world.add(player);

player.takeControl();
//#endregion

//#region Interactable Interface
interface Interactable {
    interact(player: Player): void;
    position: THREE.Vector3;
}

const interactableObjects: Interactable[] = [];
//#endregion

//#region Weapon Class
class Weapon extends BaseObject implements Interactable {
    shootDelay: number;
    lastShootTime: number;
    isAutomatic: boolean;
    spread: number;

    constructor(model: THREE.Group) {
        super(model, 0.1);
        this.shootDelay = 100;
        this.lastShootTime = 0;
        this.isAutomatic = true;
        this.spread = 0.05;
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
            this.shootBullet();
        }
    }

    shootBullet(): void {
        const bullet = new Bullet();
        bullet.position.copy(this.getWorldPosition(new THREE.Vector3()));
        
        // Apply spread
        const spread = new THREE.Vector3(
            (Math.random() - 0.5) * this.spread,
            (Math.random() - 0.5) * this.spread,
            (Math.random() - 0.5) * this.spread
        );
        bullet.direction.copy(world.camera.getWorldDirection(new THREE.Vector3())).add(spread).normalize();
        
        world.add(bullet);
        bullet.body.velocity = Utils.cannonVector(bullet.direction.multiplyScalar(20)); // Increased velocity
    }
}
//#endregion

//#region Bullet Class
class Bullet extends BaseObject {
    direction: THREE.Vector3;
    raycaster: THREE.Raycaster;
    maxDistance: number;
    distanceTraveled: number;

    constructor() {
        const bulletModel = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshBasicMaterial({ color: 'red' })
        );
        super(bulletModel, 0.1);
        this.direction = new THREE.Vector3();
        this.body.collisionFilterMask = ~2;
        this.raycaster = new THREE.Raycaster();
        this.maxDistance = 100;
        this.distanceTraveled = 0;
    }

    update(timeStep: number) {
        super.update(timeStep);
        
        const oldPosition = this.position.clone();
        this.position.add(Utils.threeVector(this.body.velocity).multiplyScalar(timeStep));
        
        const distanceThisFrame = oldPosition.distanceTo(this.position);
        this.distanceTraveled += distanceThisFrame;
        
        if (this.distanceTraveled >= this.maxDistance) {
            world.remove(this);
            return;
        }
        
        this.raycaster.set(oldPosition, this.direction.normalize());
        const intersects = this.raycaster.intersectObjects(world.graphicsWorld.children, true);
        
        if (intersects.length > 0 && intersects[0].distance < distanceThisFrame) {
            this.handleCollision(intersects[0].object);
        }
    }

    handleCollision(object: THREE.Object3D) {
        // Check if the hit object is the player or part of the player
        if (this.isPartOfPlayer(object)) {
            // Ignore collisions with the shooting player
            return;
        }
        
        const zombie = world.updatables.find(updatable => 
            updatable instanceof Zombie && updatable.modelContainer.getObjectById(object.id)
        ) as Zombie | undefined;

        if (zombie) {
            zombie.takeDamage(20); // Deal 20 damage to the zombie
            console.log("Zombie hit! Health:", zombie.health);
        } else {
            console.log("Hit object:", object);
        }

        world.remove(this);
    }

    isPartOfPlayer(object: THREE.Object3D): boolean {
        let current: THREE.Object3D | null = object;
        while (current) {
            if (current === player.modelContainer) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }
}
//#endregion

//#region Weapon Setup
const pistolModel = await loadAsync('build/assets/pistol.glb');
const pistol = new Weapon(pistolModel.scene);
world.add(pistol);
pistol.setPosition(1, 0, -2);
expose(pistolModel.scene, "pistol");
interactableObjects.push(pistol);
//#endregion

//#region Zombie Class
class Zombie extends Character {
    health: number = 100;
    healthBar: THREE.Mesh;
    attackDelay: number = 2000;
    lastAttackTime: number = 0;
    attackRange: number = 2;
    isAttacking: boolean = false;
    state: 'idle' | 'wander' | 'chase' | 'attack' | 'dead' = 'idle';
    wanderTarget: THREE.Vector3 | null = null;
    wanderRadius: number = 5;
    wanderSpeed: number = 0.5;
    chaseSpeed: number = 1;
    chaseDistance: number = 10;
    chaseDuration: number = 5000;
    chaseStartTime: number = 0;

    constructor(model: GLTF) {
        super(model);
        this.setupHealthBar();
        this.setupAnimations();
    }

    setupAnimations(): void {
        this.animationMapping = {
            idle: "Idle",
            walk: "Walk_InPlace",
            run: "Run_InPlace",
            attack: "Attack",
            dead: "FallingBack"
        };
    }
    
    setupHealthBar(): void {
        const healthBarGeometry = new THREE.BoxGeometry(1, 0.1, 0.2);
        const healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        this.healthBar.position.set(0, 1.5, 0);
        this.add(this.healthBar);
    }

    update(timeStep: number): void {
        super.update(timeStep);
        this.updateHealthBar();
        this.updateBehavior(timeStep);
    }

    updateHealthBar(): void {
        const healthPercentage = this.health / 100;
        this.healthBar.scale.x = healthPercentage;
        if (this.healthBar.material instanceof THREE.Material) {
            this.healthBar.material.color.setHex(healthPercentage > 0.5 ? 0x00ff00 : 0xff0000);
        }
    }

    updateBehavior(timeStep: number): void {
        const distanceToPlayer = this.position.distanceTo(player.position);

        if (distanceToPlayer <= this.attackRange && Date.now() - this.lastAttackTime > this.attackDelay) {
            this.lastAttackTime = Date.now();
            this.attack();
        }

        switch (this.state) {
            case 'idle':
                if (Math.random() < 0.01) {
                    this.state = 'wander';
                    this.setNewWanderTarget();
                } else if (distanceToPlayer <= this.chaseDistance) { // Start chasing if close enough
                    this.state = 'chase';
                    this.chaseStartTime = Date.now();
                }
                break;
            case 'wander':
                if (this.wanderTarget) {
                    this.moveTowards(this.wanderTarget, this.wanderSpeed * timeStep);
                    if (this.position.distanceTo(this.wanderTarget) < 0.5) {
                        this.state = 'idle';
                    }
                } else if (distanceToPlayer <= this.chaseDistance) {
                    this.state = 'chase';
                    this.chaseStartTime = Date.now();
                }
                break;
            case 'chase':
                this.moveTowards(player.position, this.chaseSpeed * timeStep);

                // If player is too far, go back to wandering
                if (distanceToPlayer > this.chaseDistance) {
                    this.state = 'wander';
                    this.setNewWanderTarget();
                } else if (distanceToPlayer <= this.attackRange) { // Attack if close enough
                    this.state = 'attack';
                    this.attack();
                }
                break;
            case 'attack':
                if (distanceToPlayer > this.attackRange) {
                    this.state = 'chase';
                }
                break;
            case 'dead':
                // Do nothing while in the dead state
                break;
        }

        this.updateAnimation();

        if (this.state === 'chase' && Date.now() - this.chaseStartTime > this.chaseDuration) {
            this.state = 'wander';
            this.setNewWanderTarget();
        }
    }

    updateAnimation(): void {
        switch (this.state) {
            case 'idle':
                this.setAnimation('Idle', 0);
                break;
            case 'wander':
                this.setAnimation('Walk_InPlace', 0); 
                break;
            case 'chase':
                this.setAnimation('Run_InPlace', 0);
                break;
            case 'attack':
                this.setAnimation('attack', 0, false);
                break;
            case 'dead':
                this.setAnimation('dead', 0, false); 
                break;
        }
    }

    setNewWanderTarget(): void {
        const randomAngle = Math.random() * 2 * Math.PI;
        const randomRadius = Math.random() * this.wanderRadius;
        const offset = new THREE.Vector3(
            Math.cos(randomAngle) * randomRadius,
            0,
            Math.sin(randomAngle) * randomRadius
        );
        this.wanderTarget = this.position.clone().add(offset);
    }

    moveTowards(target: THREE.Vector3, speed: number): void {
        const direction = new THREE.Vector3().subVectors(target, this.position).normalize();
        const newPosition = this.position.clone().add(direction.multiplyScalar(speed));
        this.setPosition(newPosition.x, newPosition.y, newPosition.z);
        this.setOrientation(direction);
    }

    takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health <= 0) {
            this.state = 'dead';
            this.startDeathAnimation();
        } else {
            this.playHitAnimation();
            this.state = 'chase';
            this.chaseStartTime = Date.now();
        }
    }

    playHitAnimation(): void {
        const zombieMesh = this.modelContainer.children[0];
        if (zombieMesh instanceof THREE.Mesh && zombieMesh.material instanceof THREE.Material) {
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
                this.setAnimation("Idle", 0);
            });
        }
    }

    startDeathAnimation(): void {
        this.setAnimation("dead", 0, false);
        this.mixer.addEventListener('finished', () => {
            console.log("DEAD FINISHED")
            world.unregisterUpdatable(this);
        });
    }
}
//#endregion

//#region Zombie Setup
// Create multiple zombies
const numZombies = 5;
const zombieModels: GLTF[] = [];
const zombies: Zombie[] = [];
for (let i = 0; i < numZombies; i++) {
    zombieModels.push(await loadAsync('build/assets/zombie.glb'));
    zombies.push(new Zombie(zombieModels[i]));
    AutoScale(zombieModels[i].scene, 1.7);
    zombies[i].setPosition(5 + i * 2, 0, 0); // Distribute zombies
    world.add(zombies[i]);
}
//#endregion