import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "public/js/**",
    "server.js",
    "motion/**",
    "artifacts/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
