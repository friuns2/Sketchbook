var Utils = Utils || {};


function addMethodListener(object, methodName, extension) {
    methodName = methodName.name?.replaceAll("bound ", "") ?? methodName;
    const originalMethod = object[methodName]//.bind(object);
    snapshot.reset.push(() => {
        object[methodName] = originalMethod;
    });
    object[methodName] = function (...args) {
        originalMethod.call(object, ...args);
        return extension.call(object, ...args);
    };
}

let loader = new GLTFLoader();
 /**
 * @param {string} glbUrl - The 3D model of the car
 * @returns {Promise<GLTF>}
 */
async function loadAsync(glbUrl) {
    return new Promise((resolve, reject) => {
        loader.load(glbUrl, (gltf) => {
            resolve(gltf);
        }, undefined, reject);
    });
};


function SetPivotCenter(gltf) {
    const model = gltf.scene;
    const boundingBox = new THREE.Box3().setFromObject(model);
    const center = boundingBox.getCenter(new THREE.Vector3());
    model.position.x -= center.x * gltf.scene.scale.x;
    model.position.z -= center.z * gltf.scene.scale.z;
    model.position.y -= boundingBox.min.y * gltf.scene.scale.y;
    const parent = new THREE.Group();
    parent.name = "Pivot";
    parent.add(model);
    gltf.scene = parent;
}
function GetPlayerFront(distance = 2) {
    let playerLookPoint = new THREE.Vector3();

    (globalThis.player ?? world.characters[0]).getWorldPosition(playerLookPoint);
    let direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(world.camera.quaternion);
    playerLookPoint.add(direction.multiplyScalar(distance));    
    return playerLookPoint;
}
THREE.Object3D.prototype.setPosition = function (x,y,z) {
    this.position.set(x,y,z);    
}
function log(...args) {
    console.log(...args);
    return args[args.length - 1];
}
class BaseObject extends THREE.Object3D {
    updateOrder = 0;
    body;
    
    /**
     * @param {THREE.Group} model - The 3D model to be used for this object.
     * @param {number} [mass=1] - The mass of the object for physics calculations.
     * @param {CANNON.Body.Type} [type=CANNON.Body.STATIC] - The type of the physics body.
     */
    constructor(model, mass = 1, type = mass > 0 ? CANNON.Body.DYNAMIC : CANNON.Body.STATIC) {
        super();
        model =cloneGltf(model);
        
        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3()).multiplyScalar(0.5);
        const center = new THREE.Vector3();        
        bbox.getCenter(center);
        model.position.copy(center.negate());
        this.add(model);
        /**
         * The physics body of the object.
         * @type {CANNON.Body}
         */
        this.body = new CANNON.Body(log({
            mass: mass,
            position: Utils.cannonVector(center),
            shape: new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z)),
            material: defaultMaterial,
            type: type,
            
        }));
        this.body.material.friction = 0.5;
        setTimeout(() => {
            this.body.addEventListener('collide', (event)=>this.onCollide(event));
        }, 100);
    }
    onCollide(event) {
        
    }
    /**
     * Sets the position of both the 3D object and its physics body.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {number} z - The z-coordinate.
     */
    setPosition(x, y, z) {
        this.body.position.set(x, y, z);
        this.position.set(x, y, z);
        this.body.updateMassProperties();
         // Check for overlapping objects with the current box collider
    }

    detach() {
        // Keep the weapon's position, scale, and rotation the same when detaching
        const worldPosition = new THREE.Vector3();
        const worldScale = new THREE.Vector3();
        const worldQuaternion = new THREE.Quaternion();
        this.getWorldPosition(worldPosition);
        this.getWorldScale(worldScale);
        this.getWorldQuaternion(worldQuaternion);
        this.removeFromParent();
        this.position.copy(worldPosition);
        this.scale.copy(worldScale);
        this.quaternion.copy(worldQuaternion);

        world.add(this);
    };
    

    oldPosition = new THREE.Vector3();
    oldQuaternion = new THREE.Quaternion();
    executeOneTime = true;

    update(timeStep) {
        const newPosition = Utils.threeVector(this.body.position);
        const newQuaternion = Utils.threeQuat(this.body.quaternion);
        let worldPos = this.position;
        let worldRot = this.quaternion;
        if (this.executeOneTime || !worldPos.equals(this.oldPosition) || !worldRot.equals(this.oldQuaternion)) {
            this.updateWorldMatrix(true,true);
            this.body.position.copy(Utils.cannonVector(worldPos));
            this.body.quaternion.copy(Utils.cannonQuat(worldRot));            
        } else {
            this.position.copy(newPosition);
            this.quaternion.copy(newQuaternion);
        }
        this.oldPosition.copy(worldPos);
        this.oldQuaternion.copy(worldRot);
        this.executeOneTime = false;
    }

    /**
     * Adds this object to the specified world.
     * @param {World} world - The world to add this object to.
     */
    addToWorld(world) {
        world.graphicsWorld.add(this);
        world.physicsWorld.addBody(this.body);
        world.updatables.push(this);
    }

    /**
     * Removes this object from the specified world.
     * @param {World} world - The world to remove this object from.
     */
    removeFromWorld(world) {
        world.graphicsWorld.remove(this);
        world.physicsWorld.removeBody(this.body);
    }
}


/**
 * Automatically scales a model to a specified size.
 * @param {THREE.Group} model - The model to be scaled.
 * @param {number} [approximateSizeInMeters=5] - The approximate size in meters to scale the model to.
 */
function AutoScale(model, approximateSizeInMeters = 5) {
    
      // Create a single bounding box for all objects combined
      const boundingBox = new THREE.Box3();

      model.traverse(function (object) {
          if (object.isMesh) {
              object.geometry.computeBoundingBox();
              boundingBox.expandByObject(object);
          }
      });
    
    const size = new THREE.Vector3();
    console.log(model, boundingBox.getSize(size));
    boundingBox.getSize(size);

    const maxDimension = Math.max(size.x, size.y, size.z);

    let scaleFactor = approximateSizeInMeters / maxDimension;

    // Determine if we need to scale by 1, 100, or 1000
    if (maxDimension > approximateSizeInMeters * 100 * 3) {
        scaleFactor = 0.001;
    } else if (maxDimension > approximateSizeInMeters * 10 * 3) {
        scaleFactor = 0.01;
    } else if (maxDimension > approximateSizeInMeters * 3) {
        scaleFactor = 0.1;
    } else {
        scaleFactor = 1;
    }

    // Apply the calculated scale to the model
    model.scale.setScalar(scaleFactor);

}

function expose(obj, name = obj.name) {
    requestAnimationFrame(() => {
        try {
            const folder = world.gui.addFolder(name);
            const storageKey = `${name}_transform`;
            const savedValues = JSON.parse(localStorage.getItem(storageKey) || '{}');

            ['position', 'rotation', 'scale'].forEach(prop => {
                ['x', 'y', 'z'].forEach(axis => {
                    const name = `${prop.charAt(0).toUpperCase() + prop.slice(1)} ${axis.toUpperCase()}`;
                    const controller = folder.add(obj[prop], axis, -10.0, 10.0, 0.01).name(name);

                    if (savedValues[name] !== undefined) {
                        obj[prop][axis] = savedValues[name];
                        controller.updateDisplay();
                    }

                    controller.onChange(value => {
                        savedValues[name] = value;
                        localStorage.setItem(storageKey, JSON.stringify(savedValues));
                    });
                });
            });
        }
        catch (e) {
            console.log(e);
        }
    });
    return obj;
        
    
}


function createUIElement(type, style) {
    const element = document.createElement(type);
    element.style.cssText = style;
    document.body.appendChild(element);
    return element;
}


import('https://esm.sh/@huggingface/inference').then(({ HfInference }) => globalThis.HfInference = HfInference);

async function GenerateResponse(prompt) {

    const hf = new HfInference('YOUR_HUGGINGFACE_TOKEN_HERE');
    const messages = [
        { role: 'user', content: prompt }
    ];
    const response = await hf.chatCompletion({
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.1,
        seed: 0,
    });
    const aiResponse = response.choices[0].message.content;
    return aiResponse;
}