module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended"
  ],
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["node_modules/", "dist/", "build/"],
  rules: {
    // Relaxed rules for existing project - focus on critical issues only
    "react/display-name": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-empty-function": "warn",
    "no-useless-escape": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/no-inferrable-types": "warn",
    "react/no-unescaped-entities": "warn"
  }
}
