import nextConfig from "eslint-config-next";
import nextTypescriptConfig from "eslint-config-next/typescript";
import nextWebVitalsConfig from "eslint-config-next/core-web-vitals";
import prettierConfig from "eslint-config-prettier";

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "supabase/.branches/**",
      "supabase/.temp/**",
      "next-env.d.ts",
      "lib/supabase/database.types.ts",
    ],
  },
  ...nextConfig,
  ...nextTypescriptConfig,
  ...nextWebVitalsConfig,
  prettierConfig,
  {
    rules: {
      // Constitución VI: cero `console.log` en producción — usar Sentry/logger
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "no-console": "off",
    },
  },
];

export default eslintConfig;
