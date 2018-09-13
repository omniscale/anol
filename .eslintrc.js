module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node" : true,
        "jquery": true
    },
    "extends": ["angular", "eslint:recommended"],
    "parserOptions": {
        "ecmaVersion": 2015,
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            4
        ],
        "angular/di": [2, "array"],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ]
    }
};