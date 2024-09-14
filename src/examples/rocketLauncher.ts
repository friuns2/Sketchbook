import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as TWEEN from '@tweenjs/tween.js';

// Initialize the world
const world = new World();
await world.initialize('build/assets/world.glb');

// Create UI elements
const textPrompt = createUIElement('div', "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);");
const crosshair = createUIElement('div', "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; border: 2px solid white; border-radius: 50%;");

interface Interactable {
  interact(player: Player): void;
  position: THREE.Vector3;
}

const interactableObjects: Interactable[] = [];
const loader = new GLTFLoader();
const playerModel = await loader.loadAsync('build/assets/boxman.glb');
expose(playerModel.scene, "player");

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
        this.remapAnimations(this.animations);
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

    remapAnimations(animations: THREE.AnimationClip[]): void {
        animations.forEach(a => {
            if (a.name === "Idle") a.name = CAnims.idle;
            if (a.name === "Run") a.name = CAnims.run;
        });
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

const player = new Player(playerModel);
player.setPosition(0, 0, -5);
world.add(player);

addMethodListener(player, "inputReceiverInit", function () {
    world.cameraOperator.setRadius(1.6);
});
player.takeControl();


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
        const grenade = new BaseObject(grenadeModel.scene, .1);
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
        }
    }
}

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

}
addMethodListener(world,"update",function(deltaTime:number){
    TWEEN.update();
});
const rocketLauncherModel = await loader.loadAsync('build/assets/rocketlauncher.glb');
const rocketLauncher = new Weapon(rocketLauncherModel.scene);
world.add(rocketLauncher);
rocketLauncher.setPosition(1, 0, -2);
expose(rocketLauncherModel.scene, "rocketlauncher");
interactableObjects.push(rocketLauncher);

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
    //{ x: 0.99, y: -0.53, z: -0.74, dialog: "Hello, I am a friendly NPC." },
    //{ x: 1.5, y: 0, z: -2, dialog: "Welcome to the game!" },
   // { x: -1, y: 0, z: -2, dialog: "Can you help me?" }
];

for (let i = 0; i < npcPositions.length; i++) {
    const npcModel = await loader.loadAsync('build/assets/boxman.glb');
    const npc = new NPC(npcModel, npcPositions[i].dialog);
    npc.setPosition(npcPositions[i].x, npcPositions[i].y, npcPositions[i].z);
    npcs.push(npc);
    world.add(npc);
    interactableObjects.push(npc);
}

function createUIElement(type: string, style: string): HTMLElement {
    const element = document.createElement(type);
    element.style.cssText = style;
    document.body.appendChild(element);
    return element;
}
