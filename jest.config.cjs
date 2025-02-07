/** @format */

module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.ts?$": "ts-jest",
    "^.+\\.js?$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(sc-base-database|sc-number-game-base|sc-common|sc-game-base|sc-base-apis|sc-api-client|jest-auto-fixture|nanoid|crypto-random-string|sc-game-service-integration-utils|sc-game-management-client|prom-client)/.*)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  coverageDirectory: "coverage",
  collectCoverageFrom: ["src/**/*.{ts,tsx,js,jsx}", "!src/**/*.d.ts"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: ".",
        outputName: "test-report.xml",
      },
    ],
  ],
  setupFilesAfterEnv: ["jest-extended"],
  testTimeout: 30000,
};
