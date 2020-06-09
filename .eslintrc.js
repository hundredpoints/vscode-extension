module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json", // Used by typescript
    tsconfigRootDir: __dirname, // Used by typescript
  },
  ignorePatterns: [
    "coverage/",
    "next-env.d.ts",
    "next.config.js",
    ".eslintrc.js",
    "babel.config.js",
    "*.graphqls.d.ts",
    "*.graphql.d.ts",
  ],
  settings: {
    react: {
      version: "detect",
    },
    "import/resolver": {
      typescript: {}, // this loads <rootdir>/tsconfig.json to eslint
    },
  },
  plugins: [
    "@typescript-eslint",
    "eslint-plugin-tsdoc",
    "eslint-plugin-react",
    "eslint-plugin-react-hooks",
    "eslint-plugin-jest",
    "eslint-plugin-import",
  ],
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    // Typescript setup
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    // Jest
    "plugin:jest/recommended",
    "plugin:jest/style",
    // Opinionated default settings - quite strict :)
    "plugin:unicorn/recommended",
    // Yo dawg, we like eslint so we put your eslint in your eslint
    "plugin:eslint-comments/recommended",
    // React stuff
    "plugin:react/recommended",
  ],
  rules: {
    "tsdoc/syntax": "warn",
    // Use the config file instead so you get proper typings
    "no-process-env": "error",
    // Maybe turn this on in the future, atm its just annoying with typescript
    "react/prop-types": 0,
    // Weird rule conflicts force us to turn this back on
    camelcase: ["error", {}],
    // Try and make this run slightly less annoying
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      },
    ],
    "@typescript-eslint/explicit-module-boundary-types": [
      "off", // Turning this off until it works better with graphql-tools
      {
        allowTypedFunctionExpressions: true,
      },
    ],
    // Support ReactComponent.tsx style names.
    "unicorn/filename-case": [
      "error",
      {
        cases: {
          kebabCase: true,
          pascalCase: true,
        },
      },
    ],
    // Don't understand why this isn't the default
    "eslint-comments/disable-enable-pair": ["error", { allowWholeFile: true }],
    "eslint-comments/require-description": ["error", { ignore: [] }],

    /**
     * Currently buggy - probably should be turned off in the future. Looks like PR has been merge but no updated released
     */
    "import/default": 0,
  },
};
