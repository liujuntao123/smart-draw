import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores:
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Disable overly strict React Compiler rules (Next.js 16+ defaults)
  {
    rules: {
      // React Compiler rules - too strict for existing codebase
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      // Common patterns that work fine
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
