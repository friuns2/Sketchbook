const debugPanel = createUIElement('div', "position: absolute;");

function watch(propAccessor, elementId) {
    const displayElement = createUIElement('div', "font-size: 14px; margin-bottom: 5px;");
    displayElement.id = elementId;
    debugPanel.appendChild(displayElement);
    
    function update() {
        const currentValue = propAccessor();        
        displayElement.textContent = `${propAccessor}: ${JSON.stringify(currentValue)}`;
        requestAnimationFrame(update);
    }
    
    update();
}



function InitVue(obj, args = {}) {
    var updatedFromHash;
    let defaultParams = globalThis._?.cloneDeep(obj.params)??{};
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
    window.addEventListener('hashchange', updateParamsFromHash);
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
                    obj.params[key + "Changed"]?.call(obj.params, updatedFromHash);
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
        else if (match[1]?.includes(".")) {
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
function ResetState(){}
function SaveState() {
    snapshot = {
        reset: [],
        graphicsWorld: world.graphicsWorld.children.slice(),
        physicsWorld: world.physicsWorld.bodies.slice(),
        updatables:world.updatables.slice(),
        characters:world.characters.slice(),
        vehicles:world.vehicles.slice(),
        folders: {...world.gui.__folders}
//        player:player
    };
    const appendedElements = new Set();
    const originalAppendChild = document.body.appendChild;
    document.body.appendChild = function (...args) {
        const element = originalAppendChild.apply(this, args);
        appendedElements.add(element);
        return element;
    };
    
    const originalSetInterval = window.setInterval;
    const setIntervals = new Set();
    
    window.setInterval = function(...args) {
        const id = originalSetInterval.apply(this, args);
        setIntervals.add(id);
        return id;
    };    

    globalThis.ResetState =function() {    
        appendedElements.forEach(element => element.parentNode?.removeChild(element));
        appendedElements.clear();
        world.graphicsWorld.children.length = 0;
        world.graphicsWorld.children.push(...snapshot.graphicsWorld);
        [...world.physicsWorld.bodies].forEach(body => world.physicsWorld.removeBody(body));
        snapshot.physicsWorld.forEach(body => world.physicsWorld.addBody(body));
        world.updatables.length = 0;
        world.updatables.push(...snapshot.updatables);
        world.characters.length = 0;
        world.characters.push(...snapshot.characters);
        world.vehicles.length = 0;
        world.vehicles.push(...snapshot.vehicles);
        world.timeScaleTarget=1;
        Object.keys(world.gui.__folders).forEach(key => {
            if (!snapshot.folders[key]) {
                world.gui.removeFolder(world.gui.__folders[key]);
            }
        });
        snapshot.reset.reverse().forEach(reset => reset());
        snapshot.reset = [];
    
        setIntervals.forEach(id => clearInterval(id));
        setIntervals.clear();
    }
        
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


async function fetchFilesFromDir(dir,fileType) {
    const response = await fetch(dir);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const fileLinks = doc.querySelectorAll('a');

    const files = Array.from(fileLinks).map(link => {
        const path = link.getAttribute('href');
        return path.endsWith(fileType) ? path : null;
    }).filter(file => file); // Filter out any null values

    return files;
}

function compileTypeScript(code) {
    const result = ts.transpileModule(code, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2015,
            inlineSourceMap: true,
            inlineSources: true
        }
    });

    return result.outputText;
}