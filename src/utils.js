function InitVue(obj, args = {}) {
    var updatedFromHash;
    let defaultParams = _.cloneDeep(obj.params);
    const updateParamsFromHash = (event) => {
        updatedFromHash=true;
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        for (let key in obj.params) {
            if (!key.startsWith("_"))
                if (hashParams.has(key))
                    try { obj.params[key] = JSON.parse(hashParams.get(key)); } catch (e) { obj.params[key] = hashParams.get(key); }
                else
                    obj.params[key] = defaultParams[key];
        }
        requestAnimationFrame(() => {
            updatedFromHash = false;
        });
    };
    updateParamsFromHash();
    window.addEventListener('hashchange', () => {
        updateParamsFromHash();
    });
    return {
        data: () => {
            //obj = shallowClone(obj)
            for (let key in obj) {
                if (typeof obj[key] === 'function') {
                    delete obj[key];
                }
            }
            obj.data = obj;
            return obj;
        },
        ...args
        ,
        mounted() {
            Object.assign(obj, this);
            args.mounted?.call(obj);
        },
        methods: Object.keys(obj).reduce((methods, key) => {
            if (typeof obj[key] === 'function') {
                methods[key] = obj[key];
            }
            return methods;
        }, {}),
        watch: Object.keys(obj.params || {}).reduce((watchers, key) => {
            if (!key.startsWith("_"))
                watchers["params." + key] = function (newValue) {
                    const hashParams = new URLSearchParams(window.location.hash.slice(1));
                    hashParams.set(key, JSON.stringify(newValue));
                    window.location.hash = hashParams.toString();
                    //history.pushState(null, document.title, `#${hashParams.toString()}`);
                    if (updatedFromHash)
                        obj.params[key + "Changed"]?.call(obj);
                };

            return watchers;
            
        }, args.watch || {})
    };
}


async function parseFilesFromMessage(message) {
    let files = [];
    let regexHtml = /(?:^|\n)(?:(?:[#*][^\r\n]*?([\w.\-_]+)[^\r\n]*?\n)?\n?```(\w+)\n?(.*?)(?:\n```|$(?!\n)))|(?:<html.*?>.*?(?:<\/html>|$(?!\n)))/gs;
    let match;
    let messageWithoutCodeBlocks = message;
    let correctFormat=false;
    while ((match = regexHtml.exec(message)) !== null) {
        let fileName;
        let content = '';
        if (match[0].startsWith('<html') && !correctFormat) {
            fileName = "index.html";
            content = match[0];
        }
        else if (match[1]) {
            fileName = match[1].trim();
            content = match[3];
            if(!correctFormat)
                files = [];
            correctFormat=true;
        }
        else if(!correctFormat) {
            fileName = match[2] === 'css' ? "styles.css" :
                match[2] === 'javascript' ? "script.js" :
                    match[2] === 'python' ? "script.py" : "index.html";
            content = match[3];
        }
        else 
            continue;
        messageWithoutCodeBlocks = messageWithoutCodeBlocks.replace(match[0],'\n');// "# "+fileName
        if (files.find(a => a.name == fileName)?.content.length > content.length)
            continue;

        files.push({ name: fileName, content,langauge:match[2]||"html" ,hidden:false});



    }

    return { messageWithoutCodeBlocks, files };
}

function Save() {
    globalThis.snapshot = {
        graphicsWorld: world.graphicsWorld.children.slice(),
        physicsWorld: world.physicsWorld.bodies.slice(),
        updatables:world.updatables.slice()
    };
}
function Load() {
    world.graphicsWorld.children.length = 0;
    world.graphicsWorld.children.push(...globalThis.snapshot.graphicsWorld);
    world.physicsWorld.bodies.length = 0;
    world.physicsWorld.bodies.push(...globalThis.snapshot.physicsWorld);
    world.updatables.length = 0;
    world.updatables.push(...globalThis.snapshot.updatables);
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
                    position: new THREE.Vector3().copy(pos).add(center),
                    size: size,
                    friction: 0.3
                });

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

if (!navigator.serviceWorker && !window.location.hostname.startsWith('192')) {
    alert("Error: Service worker is not supported");
  } else {
    (async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.unregister();
        }
        await navigator.serviceWorker.register('service-worker.mjs');
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    })();
  }
  
