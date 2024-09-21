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
    colliderMeshType;
    
    /**
     * @param {THREE.Group} model - The 3D model to be used for this object.
     * @param {number} [mass=1] - The mass of the object for physics calculations.
     * @param {('box'|'sphere'|'convex'|'concave'|'none')} [colliderMeshType='box'] - The type of collider and mesh to use.
     * @param {CANNON.Body.Type} [type=CANNON.Body.STATIC] - The type of the physics body.
     */
    constructor(model, mass = 1, colliderMeshType = 'box', type = mass > 0 ? CANNON.Body.DYNAMIC : CANNON.Body.STATIC) {
        super();
        const bbox = new THREE.Box3().setFromObject(model);

        const size = bbox.getSize(new THREE.Vector3()).multiplyScalar(0.5);
        this.centerOffset = new THREE.Vector3();        
        bbox.getCenter(this.centerOffset);
        
        this.add(model);
        this.colliderMeshType = colliderMeshType;

        let shape;
        switch (colliderMeshType) {
            case 'sphere':
                const radius = Math.max(size.x, size.y, size.z);
                shape = new CANNON.Sphere(radius);
                break;
            case 'convex':
            case 'concave':

            case 'none':
                colliderMeshType = 'none';
                shape = null;
                break;

            case 'box':
            default:
                shape = new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z));
                break;
        }

        /**
         * The physics body of the object.
         * @type {CANNON.Body}
         */
        if (colliderMeshType === 'none') {
            this.body = null;
        } else {
            this.body = new CANNON.Body({
                mass: mass,
                type: type,
                material: defaultMaterial,
            });
            
            // Add shape with offset
            this.body.addShape(shape, new CANNON.Vec3(this.centerOffset.x, this.centerOffset.y, this.centerOffset.z));
            
            this.body.material.friction = 0.5;
            setTimeout(() => {
                this.body.addEventListener('collide', (event) => this.onCollide(event));
            }, 100);
        }
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
        if (this.body) {
            this.body.position.set(x, y, z);
            this.body.updateMassProperties();
        }
        this.position.set(x, y, z);
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
        if (!this.body) return;

        let position = this.position;
        let rotation = this.quaternion;

        if (this.executeOneTime || !position.equals(this.oldPosition) || !rotation.equals(this.oldQuaternion)) {
            // Object has been moved externally, update the physics body
            this.body.position.copy(Utils.cannonVector(position));
            this.body.quaternion.copy(Utils.cannonQuat(rotation));
            this.body.updateMassProperties();
        } else {
            // Update object based on physics body
            this.position.copy(Utils.threeVector(this.body.position));
            this.quaternion.copy(Utils.threeQuat(this.body.quaternion));
        }

        this.oldPosition.copy(position);
        this.oldQuaternion.copy(rotation);
        this.executeOneTime = false;
    }

    /**
     * Adds this object to the specified world.
     * @param {World} world - The world to add this object to.
     */
    addToWorld(world) {
        world.graphicsWorld.add(this);
        if (this.body) {
            world.physicsWorld.addBody(this.body);
        }
        world.updatables.push(this);
    }

    /**
     * Removes this object from the specified world.
     * @param {World} world - The world to remove this object from.
     */
    removeFromWorld(world) {
        world.graphicsWorld.remove(this);
        if (this.body) {
            world.physicsWorld.removeBody(this.body);
        }
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