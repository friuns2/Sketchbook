
function extendMethod(object, methodName, extension) {
    const originalMethod = object[methodName];
    object[methodName] = function (...args) {
        const result = originalMethod.apply(this, args);
        extension.apply(this, args);
        return result;
    };
}

 function CreateCar(carModel) {
    

    /**
 * Initializes a car with its model
 * @param {CarPrototype} car - The car object to initialize
 * @param {THREE.Object3D} carModel - The 3D model of the car
 * @returns {void}
 */
    carModel.initCar = function (car, carModel) {
        initCar(car, carModel);
    }
    var car = new Car(carModel);
    world.add(car);    
    return car;
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
function fixPivotCenter(gltf) {
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



function loadModelWithPhysics({ glbUrl, pos, mass = 1 }) {
    return new Promise((resolve, reject) => {
        new GLTFLoader().load(glbUrl, (gltf) => {
            const model = gltf.scene;

            const boundingBox = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3().copy(boundingBox.getSize(new THREE.Vector3())).multiplyScalar(0.5);
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);

            class ModelWrapper extends THREE.Object3D {
                updateOrder = 0;
                collider = new BoxCollider({
                    mass: mass,                    
                    size: size,
                    friction: 0.3
                });
                setPosition(pos) {
                    this.collider.body.position.copy(Utils.cannonVector(pos));
                }
                update() {
                    this.position.copy(Utils.threeVector(this.collider.body.position));
                    this.quaternion.copy(Utils.threeQuat(this.collider.body.quaternion));
                }
            }

            const modelWrapper = new ModelWrapper();
       
            model.position.copy(center.negate());
            modelWrapper.add(model);
            
            world.graphicsWorld.add(modelWrapper);
            world.physicsWorld.add(modelWrapper.collider.body);
            world.registerUpdatable(modelWrapper);

            resolve(modelWrapper);
        }, undefined, (error) => {
            reject(error);
        });
    });
}
THREE.Object3D.prototype.setParent = function (child) {
    const worldScale = child.getWorldScale(new THREE.Vector3());
  
    this.add(child);
    child.scale.copy(worldScale.divide(this.getWorldScale(new THREE.Vector3())));
};
