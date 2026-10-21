import tseslint from "typescript-eslint";
export default tseslint.config(
  { ignores: ["node_modules/**", ".next/**", "next-env.d.ts"] },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
);
