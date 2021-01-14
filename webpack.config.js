/* eslint-disable tsdoc/syntax -- Conflicts with TS comment tags */
/* eslint-disable @typescript-eslint/no-var-requires -- Keep this as commonjs */

"use strict";

// eslint-disable-next-line no-undef -- CommonJS module
const path = require("path");

/**@type {import('webpack').Configuration}*/
const extensionConfig = {
  target: "node",

  entry: "./src/extension.ts",
  output: {
    // eslint-disable-next-line no-undef -- NodeJS module
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]",
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins: [],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                module: "es6", // override `tsconfig.json` so that TypeScript emits native JavaScript modules.
              },
            },
          },
        ],
      },
      {
        test: /\.node$/,
        use: "node-loader",
      },
    ],
  },
};

/**
 * Placeholder for when we need webviews in the future
 */

// const webviews = ["cat", "login"];

// const entry = Object.fromEntries(
//   webviews.map((key) => {
//     return [key, `./src/views/${key}/app.ts`];
//   })
// );

// /**@type {import('webpack').Configuration}*/
// const viewConfig = {
//   entry,
//   output: {
//     // eslint-disable-next-line no-undef -- webpack already defines this
//     path: path.resolve(__dirname, "dist", "public"),
//     filename: "[name]/app.js",
//     devtoolModuleFilenameTemplate: "../../[resource-path]",
//   },
//   devtool: "source-map",
//   externals: {
//     vscode: "commonjs vscode",
//   },
//   resolve: {
//     extensions: [".ts", ".tsx", ".js"],
//   },
//   plugins: [new CleanWebpackPlugin()],
//   module: {
//     rules: [
//       {
//         test: /\.ts$/,
//         exclude: /node_modules/,
//         use: [
//           {
//             loader: "ts-loader",
//             options: {
//               compilerOptions: {
//                 module: "commonjs", // override `tsconfig.json` so that TypeScript emits native JavaScript modules.
//               },
//             },
//           },
//         ],
//       },
//     ],
//   },
// };

// eslint-disable-next-line no-undef -- CommonJS export
module.exports = [extensionConfig];
