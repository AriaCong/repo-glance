import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "\\?inline$": "<rootDir>/tests/__mocks__/cssInline.ts",
  },
};

export default config;
