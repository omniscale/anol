anol.helper = {
    /**
     * Returns v or d if v undefined
     */
    getValue: function(v, d) {
        return v === undefined ? d : v;
    },
    /**
     * Returns a without elements of b
     */
    excludeList: function(a, b) {
        var r = a.filter(function(e) {
            return b.indexOf(e) < 0;
        });
        return r;
    },
    /**
     * Returns true when all elements of b in a otherwise false
     */
    allInList: function(a, b) {
        if(b.length === 0) {
            return false;
        }
        for(var i = 0; i < b.length; i++) {
            if(a.indexOf(b[i]) < 0) {
                return false;
            }
        }
        return true;
    },
    /**
     * Returns distinct list of a and b
     */
    concatDistinct: function(a, b) {
        r = a.slice();
        for(var i = 0; i < b.length; i++) {
            if(r.indexOf(b[i]) < 0) {
                r.push(b[i]);
            }
        }
        return r;
    },
    /**
     * Inserts content of array by into array a starting at position at.
     * When at is undefined, append b to a
     */
    concat: function(a, b, at) {
        if(at !== undefined) {
            a.splice.apply(a, [at, 0].concat(b));
        } else {
            a = a.concat(b);
        }
        return a;
    },
    /**
     * Returns string splitted into parts but prevents list with empty string
     */
    stringSplit: function(v, s) {
        var r = v.split(s);
        if(r.length === 1 && r[0] === "") {
            return [];
        }
        return r;
    },
    mergeObjects: function(a, b) {
        var keys = Object.keys(b);
        for(var i = 0; i < keys.length; i++) {
            var key  = keys[i];
            if(a[key] === undefined) {
                a[key] = b[key];
                continue;
            }
            if(a[key] instanceof Array) {
                a[key] = anol.helper.concat(a[key], b[key]);
                continue;
            }
            if(a[key] instanceof Object) {
                a[key] = anol.helper.mergeObjects(a[key], b[key]);
                continue;
            }
            a[key] = b[key];
        }
        return a;
    }
};
