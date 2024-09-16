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
 /**
 * Initializes a car with its model
 * @param {THREE.Object3D} carModel - The 3D model of the car
 * @returns {void}
 */
function CreateCar(carModel) {
    

   
    carModel.initCar = function (car, carModel) {
        initCar(car, carModel);
    }
    var car = new Car(carModel);
    world.add(car);    
    return car;
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
    const parent = new THREE.Object3D();
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
            type: type
        }));
        this.body.material.friction = 0.5;
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
    }   

    oldPosition = new THREE.Vector3();
    oldQuaternion = new THREE.Quaternion();
    executeOneTime = true;

    /**
     * Updates the object's position and rotation based on its physics body.
     */
    update(timeStep) {
        const newPosition = Utils.threeVector(this.body.position);
        const newQuaternion = Utils.threeQuat(this.body.quaternion);

        if (this.executeOneTime || !this.position.equals(this.oldPosition) || !this.quaternion.equals(this.oldQuaternion)) {
            this.body.position.copy(Utils.cannonVector(this.position));
            this.body.quaternion.copy(Utils.cannonQuat(this.quaternion));            
        } else {
            this.position.copy(newPosition);
            this.quaternion.copy(newQuaternion);
        }
        this.oldPosition.copy(this.position);
        this.oldQuaternion.copy(this.quaternion);
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

THREE.Object3D.prototype.removeFromParent = function () {
    //removeFromParentPreserveScaleAndKeepWorldPosition
    if (!this.parent) return;
    
    this.updateWorldMatrix(true, true);
    const worldScale = this.getWorldScale(new THREE.Vector3());
    const worldPosition = this.getWorldPosition(new THREE.Vector3());
    const worldQuaternion = this.getWorldQuaternion(new THREE.Quaternion());
    
    this.parent.remove(this);
    this.updateWorldMatrix(true, true);
    world.add(this);
    this.scale.copy(worldScale);
    this.setPosition(worldPosition);  
    this.quaternion.copy(worldQuaternion);
};

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

        
    
}
function initCar(car, carModel, h = 0.45) {
    // Set up wheels
    car.wheels = [];
    const wheelPositions = [
        [0.53, -0.12 + h, 0.86],
        [0.53, -0.12 + h, -0.79],
        [-0.53, -0.12 + h, 0.86],
        [-0.53, -0.12 + h, -0.79]
    ];

    for (let i = 0; i < 4; i++) {
        const wheelObject = new THREE.Object3D();
        wheelObject.position.set(...wheelPositions[i]);
        car.add(wheelObject);
        car.wheels.push(new Wheel(wheelObject));
    }

    // Set wheel properties
    car.wheels[0].steering = true;
    car.wheels[0].drive = 'fwd';
    car.wheels[1].drive = 'rwd';
    car.wheels[2].steering = true;
    car.wheels[2].drive = 'fwd';
    car.wheels[3].drive = 'rwd';

    // Set up seats
    car.seats = [];
    const seatPositions = [
        [0.25, 0.06 + h, 0.09],
        [-0.25, 0.06 + h, 0.09],
        [0.25, 0.06 + h, -0.45],
        [-0.25, 0.06 + h, -0.45]
    ];

    // Set up entry points
    const entryPointPositions = [
        [1.00, -0.36 + h, -0.03],
        [-1.00, -0.36 + h, -0.03],
        [1.00, -0.36 + h, -0.60],
        [-1.00, -0.36 + h, -0.60]
    ];

    for (let i = 0; i < 4; i++) {
        const seatObject = new THREE.Object3D();
        seatObject.position.set(...seatPositions[i]);
        car.add(seatObject);

        const entryPoint = new THREE.Object3D();
        entryPoint.position.set(...entryPointPositions[i]);
        car.add(entryPoint);

        const seat = new VehicleSeat(car, seatObject, carModel);
        seat.entryPoints.push(entryPoint);
        car.seats.push(seat);
    }

    // Set up doors
    const doorPositions = [
        [0.57, 0.13 + h, 0.21],
        [-0.57, 0.13 + h, 0.21],
        [0.57, 0.13 + h, -0.43],
        [-0.57, 0.13 + h, -0.43]
    ];

    for (let i = 0; i < 4; i++) {
        const doorObject = new THREE.Object3D();
        doorObject.position.set(...doorPositions[i]);
        car.add(doorObject);
        car.seats[i].door = new VehicleDoor(car.seats[i], doorObject);
    }

    // Connect seats
    car.seats[0].connectedSeats = [car.seats[1]];
    car.seats[1].connectedSeats = [car.seats[0]];
    car.seats[2].connectedSeats = [car.seats[3]];
    car.seats[3].connectedSeats = [car.seats[2]];
    car.seats[0].type = SeatType.Driver;
    car.seats[1].type = SeatType.Passenger;
    car.seats[2].type = SeatType.Passenger;
    car.seats[3].type = SeatType.Passenger;

    // Set up camera
    car.camera = new THREE.Object3D();
    car.camera.position.set(0.24, 0.52 + h, -0.01);
    car.add(car.camera);

    // Set up collision
    const bodyShape = new CANNON.Box(new CANNON.Vec3(0.64, 0.53, 1.245));
    bodyShape.collisionFilterMask = ~CollisionGroups.TrimeshColliders;
    car.collision.addShape(bodyShape, new CANNON.Vec3(0, 0.37 + h, 0.04));

    const lowerBodyShape = new CANNON.Box(new CANNON.Vec3(0.61, 0.25, 1.21));
    car.collision.addShape(lowerBodyShape, new CANNON.Vec3(0, 0.09 + h, 0.04));

    const cabinShape = new CANNON.Box(new CANNON.Vec3(0.54, 0.28, 0.535));
    car.collision.addShape(cabinShape, new CANNON.Vec3(0, 0.62 + h, -0.26));

    const wheelShape = new CANNON.Cylinder(0.235, 0.235, 0.15, 32);
    for (let i = 0; i < 4; i++) {
        car.collision.addShape(wheelShape, new CANNON.Vec3(...wheelPositions[i]));
    }

    // Set up materials
    car.traverse((child) => {
        if (child.isMesh) {
            Utils.setupMeshProperties(child);

            if (child.material !== undefined) {
                car.materials.push(child.material);
            }
        }
    });
}


function createUIElement(type, style) {
    const element = document.createElement(type);
    element.style.cssText = style;
    document.body.appendChild(element);
    return element;
}