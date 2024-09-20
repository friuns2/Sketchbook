var defaultMaterial = new CANNON.Material('defaultMaterial');
defaultMaterial.friction = 0.3;

// Extend CANNON.Body to include default material
CANNON.Body = (function(Body) {
    function ExtendedBody(options) {
        // Call the original constructor
        Body.call(this, options);
        
        // Set default material if not provided
        if (!this.material) {            
            this.material = defaultMaterial;
        }
    }
    
    // Inherit prototype methods
    ExtendedBody.prototype = Object.create(Body.prototype);
    ExtendedBody.prototype.constructor = ExtendedBody;

    return ExtendedBody;
})(CANNON.Body);

CANNON.Body.prototype.addEventListener = (function(originalAddEventListener) {

    return function(type, listener) {
        let animationFrameId;
        originalAddEventListener.call(this, type, ()=>{
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(() => {
                listener.apply(this, arguments);
            });
        });
        
    };
})(CANNON.Body.prototype.addEventListener);

class GLTFMaterialsPbrSpecularGlossinessExtension {
    constructor(parser) {
        this.parser = parser;
        this.name = 'KHR_materials_pbrSpecularGlossiness';
    }

    extendMaterialParams(materialIndex, materialParams) {
        const parser = this.parser;
        const materialDef = parser.json.materials[materialIndex];

        if (!materialDef.extensions || !materialDef.extensions[this.name]) {
            return Promise.resolve();
        }

        const pbrSpecularGlossiness = materialDef.extensions[this.name];

        materialParams.color = new THREE.Color(1, 1, 1);
        materialParams.opacity = (pbrSpecularGlossiness.diffuseFactor !== undefined) ? pbrSpecularGlossiness.diffuseFactor[3] : 1.0;

        materialParams.roughness = 1.0 - (pbrSpecularGlossiness.glossinessFactor !== undefined ? pbrSpecularGlossiness.glossinessFactor : 1.0);
        materialParams.metalness = 0.0;

        return Promise.all([
            pbrSpecularGlossiness.diffuseTexture !== undefined ?
                parser.assignTexture(materialParams, 'map', pbrSpecularGlossiness.diffuseTexture) :
                Promise.resolve(),
            pbrSpecularGlossiness.specularGlossinessTexture !== undefined ?
                parser.assignTexture(materialParams, 'glossinessMap', pbrSpecularGlossiness.specularGlossinessTexture) :
                Promise.resolve()
        ]);
    }
}



(function GLTFLoader_LoadCache() {
    const gltfCache = new Map();
    const originalLoad = GLTFLoader.prototype.load;
    
    
    GLTFLoader.prototype.load = function (url, onLoad, onProgress, onError) {
        if(!this.registered)
        {
            this.registered=true;
            this.register(parser => new GLTFMaterialsPbrSpecularGlossinessExtension(parser));
        }

        if (gltfCache.has(url)) {
            const gltf = gltfCache.get(url);
            if (onLoad) onLoad(Utils.cloneGltf(gltf));
            return;
        }

        originalLoad.call(this, url,
            (gltf) => {
                gltfCache.set(url, gltf);
                if (onLoad) onLoad(Utils.cloneGltf(gltf));
            },
            onProgress,
            onError
        );
    };
})();

THREE.Cache.enabled=true;
var glbFiles = {};

(function GLTFLoader_LoadNotFound() {
    const originalLoad = GLTFLoader.prototype.load;
    GLTFLoader.prototype.load = function (url, onLoad, onProgress, onError) {
        originalLoad.call(this, url, (gltf) => {

          //  const animations = gltf.animations?.length>0 ? `\nAnimation names:`+gltf.animations.map(animation => animation.name).join(', ') : '';
            let content = 
                GetSpawnGLBCode(gltf,url);
                //Object3DToHierarchy(gltf) + (animations || '');

            if (!/(airplane|boxman|car|heli|world|airplane|notfound)\.glb/.test(url))
                glbFiles[url] = { name: url, content: content };
            // Call the original onLoad with the modified gltf
            if (onLoad) onLoad(gltf);

        }, onProgress, (error) => {            
            
            originalLoad.call(this, 'notfound.glb', onLoad, onProgress, onError);
            let variant = chat.currentVariant;
            const fileName = url.split('/').pop().split('.')[0];
            picker.openModelPicker(fileName, async (downloadUrl) => {
                const response = await fetch(downloadUrl);
                const arrayBuffer = await response.arrayBuffer();
                navigator.serviceWorker.controller.postMessage({
                    action: 'uploadFiles',
                    files: [{ name: url, buffer: arrayBuffer }]
                });
                await new Promise(resolve => setTimeout(resolve, 100));
                chat.switchVariant(variant);
            });
        });
    };
})();
/*

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
*/