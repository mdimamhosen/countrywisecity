import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    target: "es2022",
    sourcemap: true,
    clean: true,
    banner: {
      js: [
        'import { dirname as __countrywiseDirname } from "node:path";',
        'import { fileURLToPath as __countrywiseFileURLToPath } from "node:url";',
        "const __dirname = __countrywiseDirname(__countrywiseFileURLToPath(import.meta.url));",
      ].join("\n"),
    },
  },
  {
    entry: ["src/index.ts"],
    format: ["cjs"],
    target: "es2022",
    sourcemap: true,
    clean: false,
  },
]);
