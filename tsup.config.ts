import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["esm"],
    target: "es2022",
    sourcemap: true,
    clean: false,
    banner: {
      js: [
        'import { dirname as __countrywiseDirname } from "node:path";',
        'import { fileURLToPath as __countrywiseFileURLToPath } from "node:url";',
        "const __dirname = __countrywiseDirname(__countrywiseFileURLToPath(import.meta.url));",
      ].join("\n"),
    },
  },
  {
    entry: {
      browser: "src/browser.ts",
    },
    format: ["esm"],
    target: "es2022",
    sourcemap: true,
    clean: false,
  },
  {
    entry: {
      index: "src/index.ts",
    },
    format: ["cjs"],
    target: "es2022",
    sourcemap: true,
    clean: false,
  },
]);
