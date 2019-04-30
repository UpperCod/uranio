import pkg from "./package.json";
import size from "rollup-plugin-bundle-size";
import sucrase from "rollup-plugin-sucrase";
//import resolve from "rollup-plugin-node-resolve";

let plugins = [
	//	resolve(),
	sucrase({
		production: true,
		exclude: ["node_modules/**"],
		jsxPragma: "h",
		transforms: ["typescript", "jsx"]
	}),
	size()
];

export default [
	{
		input: pkg.source,
		output: [
			{
				file: pkg.module,
				format: "esm"
			}
		],
		plugins
	},
	{
		input: "src/browser.js",
		output: [
			{
				file: "browser.js",
				format: "esm"
			}
		],
		plugins
	}
];
