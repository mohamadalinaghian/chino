// jest.config.ts

import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",

  testEnvironment: "jsdom",

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // اگر alias داری
  },

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  transform: {
    "^.+\\.tsx?$": ["ts-jest", { useESM: true }],
  },

  extensionsToTreatAsEsm: [".ts", ".tsx"],
};

export default config;
