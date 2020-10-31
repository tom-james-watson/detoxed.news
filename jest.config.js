module.exports = {
  projects: [
    {
      preset: "ts-jest",
      testEnvironment: "node",
      watchPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.git"],
      reporters: ["default"],
    },
  ],
};
