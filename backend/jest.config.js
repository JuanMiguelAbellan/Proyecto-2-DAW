/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  forceExit: true,
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
};