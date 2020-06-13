module.exports = {
  root: true,
  plugins: ["@hundredpoints/eslint-plugin-hundredpoints"],
  extends: ["plugin:@hundredpoints/eslint-plugin-hundredpoints/recommended"],
  parserOptions: {
    project: "./tsconfig.json", // Used by typescript
    tsconfigRootDir: __dirname, // Used by typescript
  },
  rules: {
    "import/no-unresolved": [
      "error",
      {
        ignore: ["vscode"],
      },
    ],
  },
};
