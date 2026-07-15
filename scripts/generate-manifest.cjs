const { readdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const dataDirectory = join(process.cwd(), "src", "data");
const manifestPath = join(dataDirectory, "manifest.json");

const countries = {};
const countryEntries = readdirSync(dataDirectory, {
  withFileTypes: true,
}).filter((entry) => entry.isDirectory());

for (const countryEntry of countryEntries) {
  const countryCode = countryEntry.name.split("-").at(-1)?.toUpperCase();

  if (!countryCode) {
    continue;
  }

  const countryDirectory = join(dataDirectory, countryEntry.name);
  const stateEntries = readdirSync(countryDirectory, {
    withFileTypes: true,
  }).filter((entry) => entry.isDirectory());

  const states = {};

  for (const stateEntry of stateEntries) {
    const stateCode = stateEntry.name.split("-").at(-1)?.toUpperCase();

    if (stateCode) {
      states[stateCode] = stateEntry.name;
    }
  }

  countries[countryCode] = {
    directory: countryEntry.name,
    states,
  };
}

writeFileSync(
  manifestPath,
  `${JSON.stringify({ countries }, null, 2)}\n`,
  "utf8",
);
