import { ConfigAPI } from "@babel/core";

const config = (api: ConfigAPI) => {
	// این خط برای کش کردن پیکربندی استفاده میشود
	api.cache.forever();

	return {
		presets: [
			["@babel/preset-env", { targets: { node: "current" } }],
			"@babel/preset-typescript",
			[
				"@babel/preset-react",
				{
					runtime: "automatic",
					importSource: "@emotion/react", // اگر از emotion استفاده میکنید
				},
			],
		],
		plugins: [
			"@babel/plugin-transform-runtime",
			"@babel/plugin-proposal-class-properties",
			"@babel/plugin-proposal-object-rest-spread",
			// اگر از CSS-in-JS استفاده میکنید:
			["@emotion/babel-plugin", { autoLabel: "always" }],
		],
	};
};

export default config;
