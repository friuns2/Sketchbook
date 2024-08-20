function cloneDepth3(obj, depth = 3, clonedMap = new Map()) {
    if (depth === 0 || obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (clonedMap.has(obj)) {
        return clonedMap.get(obj);
    }

    const clonedObj = Array.isArray(obj) ? [] : {};
    clonedMap.set(obj, clonedObj);

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = cloneDepth3(obj[key], depth - 1, clonedMap);
        }
    }

    return clonedObj;
}
function mergeSnapshot(target, source, depth = 3) {//try use lodash
    if (depth === 0 || target === null || typeof target !== 'object' || source === null || typeof source !== 'object') {
        return target;
    }

    for (let key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] === null) {
                target[key] = null;
            } else if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (target[key] && typeof target[key] === 'object') {
                    mergeSnapshot(target[key], source[key], depth - 1);
                } else {
                    target[key] = source[key];
                }
            } else if (Array.isArray(source[key])) {
                if (Array.isArray(target[key])) {
                    target[key].length = source[key].length;
                    for (let i = 0; i < source[key].length; i++) {
                        if (typeof source[key][i] === 'object' && source[key][i] !== null && typeof target[key][i] === 'object') {
                            mergeSnapshot(target[key][i], source[key][i], depth - 1);
                        } else {
                            target[key][i] = source[key][i];
                        }
                    }
                } else {
                    target[key] = source[key];
                }
            } else {
                target[key] = source[key];
            }
        }
    }

    return target;
}


const originalObject = {
    a: [{a: 1}, {b: 2}, {c: 3}],
    b: {
        b1: null,
        b2: {
            b21: 3,
            
        },
    },
};
let b2 = originalObject.a[1];

console.log('Original:', JSON.stringify(originalObject));
const s = cloneDepth3(originalObject);
console.log('Snapshot:', JSON.stringify(s));
mergeSnapshot(originalObject, s);
console.log('Merged:', JSON.stringify(originalObject));
console.log(b2 === originalObject.a[1]);
