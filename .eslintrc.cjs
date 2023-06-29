const config = {
    env: {
        es2022: true,
        node: true,
        "vitest-globals/env": true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:prettier/recommended",
        "plugin:vitest-globals/recommended",
        "plugin:import/typescript"
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
    },
    plugins: ["@typescript-eslint", "simple-import-sort"],
    rules: {
        complexity: ["error", { max: 10 }],
        "import/first": "error",
        "import/newline-after-import": "error",
        "import/no-duplicates": "error",
        "simple-import-sort/imports": "error",
        "sort-imports": "off"
    },
    settings: {
        "import/resolver": {
            typescript: {}
        }
    }
};

module.exports = config;
