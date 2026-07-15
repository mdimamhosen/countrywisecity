const { cpSync, existsSync, rmSync } = require("node:fs");
const { join } = require("node:path");

const source = join(process.cwd(), "src", "data");
const destination = join(process.cwd(), "dist", "data");

if (!existsSync(source)) {
  throw new Error(
    "Missing src/data. Generate or copy the local data files before building.",
  );
}

rmSync(destination, {
  recursive: true,
  force: true,
});

cpSync(source, destination, {
  recursive: true,
});
