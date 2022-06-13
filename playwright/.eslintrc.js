module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  env: { node: true },
  overrides: [
    {
      // enable the rule specifically for TypeScript files
      files: ["*.ts", "*.js"],
      rules: {
        "@typescript-eslint/explicit-module-boundary-types": [0],
        "@typescript-eslint/no-floating-promises": ["error"],
        "@typescript-eslint/ban-ts-comment": 0,
        "@typescript-eslint/no-var-requires": 0,
        "@typescript-eslint/no-empty-function": 0,
        "@typescript-eslint/no-non-null-assertion": 0,
        "@typescript-eslint/no-non-null-asserted-optional-chain": 0,
        complexity: ["error", 6], // if a function is getting too complex it should be broken down
        curly: ["error", "all"], // use curly brace even for single line functions
        "comma-dangle": ["error", "always-multiline"], // easier to see git diff
        "prefer-template": ["error"], // easier to read code when variables are used,
        "prettier/prettier": [
          "error",
          {
            endOfLine: "auto", // This is need to handle different end-of-line in windows/mac
          },
        ],
        "no-case-declarations": "warn",
        "no-empty": ["error", { allowEmptyCatch: true }],
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            vars: "all",
            args: "after-used",
            ignoreRestSiblings: false,
            argsIgnorePattern: "^_",
          },
        ],
        "@typescript-eslint/no-explicit-any": 0,
      },
    },
  ],
  ignorePatterns: ["**/playwright-report/**", "**/build/**"],
  parserOptions: {
    project: "./tsconfig.json",
  },
};
