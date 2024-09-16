import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as TWEEN from '@tweenjs/tween.js';

const world = new World();
await world.initialize('build/assets/world.glb');

const textPrompt = document.createElement('div');
textPrompt.style.cssText = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);";
document.body.appendChild(textPrompt);

const loader = new GLTFLoader();

const playerModel = await loader.loadAsync('build/assets/boxman.glb');
expose(playerModel.scene, "player");

class MinecraftPlayer extends Character {
    rhand: THREE.Object3D | null;
    lhand: THREE.Object3D | null;
    lastCubePosition: THREE.Vector3 | null;

    constructor(model: GLTF) {
        super(model);
        this.rhand = model.scene.getObjectByName("rhand");
        this.lhand = model.scene.getObjectByName("lhand");
        this.remapAnimations(model.animations);
        this.lastCubePosition = null;
    }


    handleMouseButton(event: MouseEvent, code: string, pressed: boolean): void {
        super.handleMouseButton(event, code, pressed);
        if (event.button === 0 && pressed === true) {
            this.removeCube();
        } else if (event.button === 2 && pressed === true) {
            this.placeNewCube();
        }
    }

    removeCube(): void {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), world.camera);
        const intersects = raycaster.intersectObjects(world.graphicsWorld.children, true);

        if (intersects.length > 0) {
            const intersection = intersects[0].object?.parent;
            if (intersection instanceof BaseObject) {
                world.remove(intersection);
            }
        }
    }

    placeNewCube(): void {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), world.camera);
        const intersects = raycaster.intersectObjects(world.graphicsWorld.children, true);

        const cubeScale = 0.7;
        const cubescalex2 = 1 / cubeScale;
        if (intersects.length > 0) {
            const intersection = intersects[0];
            const cubePosition = new THREE.Vector3(
                Math.floor(intersection.point.x * cubescalex2) / cubescalex2 + cubeScale / 2,
                Math.floor(intersection.point.y * cubescalex2) / cubescalex2 + cubeScale - (1 - cubeScale) / 2,
                Math.floor(intersection.point.z * cubescalex2) / cubescalex2 + cubeScale / 2
            );

            if (this.lastCubePosition === null || !cubePosition.equals(this.lastCubePosition)) {
                const textureLoader = new THREE.TextureLoader();
                const texture = textureLoader.load('build/assets/crate_diffuse.jpg');
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);

                const newCubeModel = new THREE.Mesh(
                    new THREE.BoxGeometry(cubeScale, cubeScale, cubeScale),
                    new THREE.MeshStandardMaterial({ map: texture })
                );
                const newCube = new BaseObject(newCubeModel, 0);
                newCube.setPosition(cubePosition.x, cubePosition.y, cubePosition.z);
                newCube.addToWorld(world);

                this.lastCubePosition = cubePosition;
            }
        }
    }
}

const player = new MinecraftPlayer(playerModel);
player.setPosition(0, 0, -5);
world.add(player);

addMethodListener(player, "inputReceiverInit", function () {
    world.cameraOperator.setRadius(1.6);
});
player.takeControl();



