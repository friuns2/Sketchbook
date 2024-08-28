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
var snapshot;
function SaveReset() {
    snapshot = {
        graphicsWorld: world.graphicsWorld.children.slice(),
        physicsWorld: world.physicsWorld.bodies.slice(),
        updatables:world.updatables.slice(),
        characters:world.characters.slice(),
        vehicles:world.vehicles.slice(),
        player:player
    };
}
function Reset() {    
    world.graphicsWorld.children.length = 0;
    world.graphicsWorld.children.push(...snapshot.graphicsWorld);
    [...world.physicsWorld.bodies].forEach(body => world.physicsWorld.remove(body));
    snapshot.physicsWorld.forEach(body => world.physicsWorld.addBody(body));
    world.updatables.length = 0;
    world.updatables.push(...snapshot.updatables);
    world.characters.length = 0;
    world.characters.push(...snapshot.characters);
    world.vehicles.length = 0;
    world.vehicles.push(...snapshot.vehicles);
    world.timeScaleTarget=1;
    globalThis.player = snapshot.player;    
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
    if(!str1||!str2)
        return 0;
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

(function () {

    const gltfCache = new Map();

    // Now, let's override the GLTFLoader.prototype.load function
    const originalLoad2 = GLTFLoader.prototype.load;
    GLTFLoader.prototype.load = function (url, onLoad, onProgress, onError) {
        // Check if the model is already in the cache
        if (gltfCache.has(url)) {
            const cachedModel = gltfCache.get(url);
            // Clone the cached model to avoid modifying the original
            
            const clonedModel = {...cachedModel, scene: SkeletonUtils.SkeletonUtils.clone(cachedModel.scene)};
            // Call the onLoad callback with the cloned model
            if (onLoad) onLoad(clonedModel);
            return;
        }

        // If not in cache, use the original load method
        originalLoad2.call(this, url,
            (gltf) => {
                // Store the loaded model in the cache
                gltfCache.set(url, gltf);
                // Call the original onLoad callback
                if (onLoad) onLoad({...gltf, scene: SkeletonUtils.SkeletonUtils.clone(gltf.scene)});
            },
            onProgress,
            onError
        );
    };
})();

THREE.Cache.enabled=true;

(function () {
    // Override GLTFLoader.prototype.load to handle fallback
    const originalLoad = GLTFLoader.prototype.load;
    GLTFLoader.prototype.load = function (url, onLoad, onProgress, onError) {
        originalLoad.call(this, url, onLoad, onProgress, (error) => {
            console.warn(`Failed to load ${url}, attempting to load fallback.`);
            originalLoad.call(this, 'notfound.glb', onLoad, onProgress, onError);

            // Show picker for GLB file
            const fileName = url.split('/').pop().split('.')[0];
            picker.openModelPicker(fileName, async (downloadUrl) => {
                const response = await fetch(downloadUrl);
                const arrayBuffer = await response.arrayBuffer();
                navigator.serviceWorker.controller.postMessage({
                    action: 'uploadFiles',
                    files: [{ name: url, buffer: arrayBuffer }]
                });
                await new Promise(resolve => setTimeout(resolve, 100));
                chat.switchVariant(chat.currentVariant);
            });
        });
    };
})();

function AutoScale({ gltfScene, approximateScaleInMeters = 5}) {
    const model = gltfScene;
    const boundingBox = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    const maxDimension = Math.max(size.x, size.y, size.z);

    let scaleFactor = approximateScaleInMeters / maxDimension;

    // Determine if we need to scale by 1, 100, or 1000
    if (maxDimension > approximateScaleInMeters * 100 * 3) {
        scaleFactor = 0.001;
    } else if (maxDimension > approximateScaleInMeters * 10 * 3) {
        scaleFactor = 0.01;
    } else if (maxDimension > approximateScaleInMeters * 3) {
        scaleFactor = 0.1;
    } else {
        scaleFactor = 1;
    }

    // Apply the calculated scale to the model
    model.scale.setScalar(scaleFactor);

    world.render(world);
}


function Object3DToHierarchy(gltf) {
    function buildHierarchy(object, indent = '') {
        const boundingBox = new THREE.Box3().setFromObject(object);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        
        
        let result = `\n${indent}${object.name} `;
        result +=  `(${object.position.x.toFixed(2)}, ${object.position.y.toFixed(2)}, ${object.position.z.toFixed(2)})`
             
        if (size.x !== 0 || size.y !== 0 || size.z !== 0) {
            result += ` Center: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`;
            result += ` Size: (${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})`;
        }
        
        
        //if (Object.keys(object.userData).length > 0)  result += `\n${indent}  UserData: ${JSON.stringify(object.userData, null, 2).replace(/\n/g, '\n' + indent + '  ')}`;
        
        
        if (object.children && object.children.length > 0) {
            indent += '  ';
            object.children.forEach(child => {
                result += buildHierarchy(child, indent);
            });
        }
        
        return result;
    }

    let rootObject = gltf.scene;
    return buildHierarchy(rootObject);
}

