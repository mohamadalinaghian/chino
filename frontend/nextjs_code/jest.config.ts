import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"\\.(css|less|sass|scss)$": "identity-obj-proxy",
		"\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.ts",
	},
	transform: {
		"^.+\\.(ts|tsx)$": [
			"ts-jest",
			{
				tsconfig: "tsconfig.jest.json",
				babelConfig: true,
				diagnostics: {
					ignoreCodes: [1343],
				},
			},
		],
		"^.+\\.(js|jsx)$": "babel-jest",
	},
	testPathIgnorePatterns: [
		"<rootDir>/node_modules/",
		"<rootDir>/.next/",
		"<rootDir>/cypress/",
	],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	// ✅ بخش globals حذف شد
};

export default config;
