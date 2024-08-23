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


 function parseFilesFromMessage(message) {
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
        updatables:world.updatables.slice(),
        characters:world.characters.slice()
    };
}
function Load() {
    world.graphicsWorld.children.length = 0;
    world.graphicsWorld.children.push(...globalThis.snapshot.graphicsWorld);
    world.physicsWorld.bodies.length = 0;
    world.physicsWorld.bodies.push(...globalThis.snapshot.physicsWorld);
    world.updatables.length = 0;
    world.updatables.push(...globalThis.snapshot.updatables);
    world.characters.length = 0;
    world.characters.push(...globalThis.snapshot.characters);
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
  
  (function() {
    const OriginalXMLHttpRequest = XMLHttpRequest;
    XMLHttpRequest = function() {
      const xhr = new OriginalXMLHttpRequest();
      let requestURL = '';
      const originalOpen = xhr.open;
      xhr.open = function(method, url) {
        requestURL = url;
        originalOpen.apply(xhr, arguments);
      };
      Object.defineProperty(xhr, 'responseURL', {
        get: () => requestURL || '',
        configurable: true
      });
      return xhr;
    };
    Object.assign(XMLHttpRequest, OriginalXMLHttpRequest);
  })();
  async function LoadComponent(file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove the head content
        doc.head.innerHTML = '';
        
        const div = document.createElement('div');
        div.innerHTML = doc.body.innerHTML;
        document.body.appendChild(div);

        const scripts = div.getElementsByTagName('script');
        Array.from(scripts).forEach(script => {
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            document.body.appendChild(newScript);
        });

        console.log('3D Picker injected successfully');
       
    } catch (error) {
        console.error('Error injecting 3D Picker:', error);
    }
}
function GetPlayerFront() {
    let playerLookPoint = new THREE.Vector3();
    player.getWorldPosition(playerLookPoint);
    let direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(world.camera.quaternion);
    playerLookPoint.add(direction.multiplyScalar(2));    
    return playerLookPoint;
}





const originalFindByName = THREE.AnimationClip.findByName;
THREE.AnimationClip.findByName = (clipArray, name) => {
    const clip = originalFindByName(clipArray, name);
    if (clip === null && clipArray.length > 0) {
        let bestMatch = null;
        let bestScore = 0;
        for (let i = 0; i < clipArray.length; i++) {
            const score = getSimilarityScore(name, clipArray[i].name);
            if (score > bestScore && score > 0.4) {
                bestScore = score;
                bestMatch = clipArray[i];
            }
        }
        console.warn(`Animation clip "${name}" not found, returning the first clip as fallback.`);
        return bestMatch;
    }
    return clip;
};

function getSimilarityScore(str1, str2) {
    function levenshteinDistance(a, b) {
        const matrix = Array(a.length + 1).fill(null).map(() =>
            Array(b.length + 1).fill(null));

        for (let i = 0; i <= a.length; i += 1) {
            matrix[i][0] = i;
        }

        for (let j = 0; j <= b.length; j += 1) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= a.length; i += 1) {
            for (let j = 1; j <= b.length; j += 1) {
                const indicator = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1, // deletion
                    matrix[i - 1][j - 1] + indicator // substitution
                );
            }
        }

        return matrix[a.length][b.length];
    }

    const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLen = Math.max(str1.length, str2.length);

    if (maxLen === 0) {
        return 1; // Both strings are empty
    }

    return (1 - distance / maxLen);
}



