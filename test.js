

    let testObj = {
        params: {
            a: 'initial value',
            aChanged(){
                console.log('aChanged');
            }
        },
        someMethod() {
            return this.params.a;
        },
        mounted() {
            console.log('Vue instance mounted with params:', this.params.a);
        }
    };

    var vue = InitVue(testObj, {
        mounted: testObj.mounted
    });

    vue = new Vue({
        el: '#app',
        ...vue
    });
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
                    console.log(key,newValue,updatedFromHash)
                    if (updatedFromHash)
                        obj.params[key + "Changed"]?.call(obj);
                };

            return watchers;
            
        }, args.watch || {})
    };
}