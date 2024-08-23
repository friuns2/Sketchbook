function loadGLB({ glbUrl }) {
    return new Promise((resolve, reject) => new GLTFLoader().load(glbUrl, gltf => (world.graphicsWorld.add(gltf.scene), resolve(gltf)), undefined, reject));
}
function extendMethod(object, methodName, extension) {
    const originalMethod = object[methodName];
    object[methodName] = function(...args) {
        const result = originalMethod.apply(this, args);
        extension.apply(this, args);
        return result;
    };
}

