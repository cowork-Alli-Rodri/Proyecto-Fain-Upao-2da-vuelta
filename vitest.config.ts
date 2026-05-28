import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    // Los tests de integración comparten una sola DB Supabase local y mutan
    // estado global (app_settings, anonimización de TODOS los perfiles). Deben
    // correr en serie para no interferir entre archivos. Los unit son rápidos,
    // así que el costo de serializar todo es despreciable.
    fileParallelism: false,
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    exclude: [
      "node_modules/**",
      "tests/e2e/**",
      "tests/load/**",
      ".next/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "tests/**",
        "**/*.config.{ts,mjs,js}",
        "**/*.d.ts",
        ".next/**",
        "supabase/**",
        "scripts/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
