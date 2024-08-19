let test = {
    a: 1,
    b: 2,
    d: [1, {a: 2}, 3],
    f: {
        g: 1,
        h: 2
    }
};
let recordChange = true;
let snapshot = {};
let changes = [];

function createProxy(obj, path = '', depth = 2) {
    if (typeof obj !== 'object' || obj === null || depth <= 0) {
        return obj;
    }

    return new Proxy(obj, {
        set(target, property, value) {
            if (!recordChange) return true;
            try {
                const fullPath = path ? `${path}.${property}` : property;
                if (Array.isArray(target)) {
                    if (property === 'length') {
                        return true;
                    } else {
                        snapshot[path + ".length"] = target.length;
                        if (!target[property]) return true;
                    }
                }
                if (!(fullPath in snapshot)) {
                    snapshot[fullPath] = target[property];
                }
                changes.push({ property: fullPath, value });

                return true;
            } finally {
                target[property] = value;
            }
        },
        get(target, property) {
            if (property === 'push') {
                return function(...args) {
                    if (recordChange) {
                        snapshot[path + ".length"] = this.length;
                    }
                    return Array.prototype.push.apply(this, args);
                };
            } else if (property === 'pop') {
                return function() {
                    if(recordChange){
                        snapshot[path + ".length"] = this.length;
                        snapshot[path + "." + (this.length - 1)] = this[this.length - 1];
                    }
                    const result = Array.prototype.pop.apply(this);
                    return result;
                };
            }

            const value = target[property];
            if (typeof value === 'object' && value !== null && depth > 1) {
                const fullPath = path ? `${path}.${property}` : property;
                return createProxy(value, fullPath, depth - 1);
            }
            return value;
        }
    });
}
const testProxy = createProxy(test, '', 2); // Limit depth to 2 levels

function undoChanges() {
    console.log("undoChanges", snapshot);
    for (const key in snapshot) {
        const parts = key.split('.');
        let obj = test;
        for (let i = 0; i < parts.length - 1; i++) {
            obj = obj[parts[i]];
        }
        let v = parts[parts.length - 1];

        obj[v] = snapshot[key];

    }
    //test["d"].length = 3
}

// Example usage:
console.log("Original:", JSON.stringify(testProxy));
//testProxy.d.push(5); // Add a new element to the array
testProxy.d[1].a = 3;
testProxy.d.pop(); // Remove the last element from the array

console.log("After changes:", JSON.stringify(testProxy));
undoChanges();
console.log("After undo:", JSON.stringify(testProxy));