# CountryCity JS

CountryCity JS is a TypeScript package for reliable country-wise location data
in one place: countries, states/provinces, cities, flags, ISO codes,
currencies, phone codes, coordinates and location search.

The package ships local JSON data with the npm package. It does not require a
runtime dependency on another country-state-city npm package.

## Features

- 250+ countries
- 5,000+ states, provinces and regions
- 150,000+ cities
- Country flag emojis
- ISO2 and ISO3 country codes
- State/province codes where available
- Phone codes, currencies, capitals and regions
- Latitude and longitude values
- Country, state and city search helpers
- TypeScript types
- ESM and CommonJS builds
- Lazy data loading from packaged JSON files
- Backend usage through Node.js file-system loading
- Frontend usage through the browser-safe fetch client

## Data Coverage

CountryCity JS is intended to cover the common location fields needed when
building production forms, dashboards, directories, marketplace onboarding,
shipping flows and search experiences.

| Level | Covered data |
| --- | --- |
| Countries | Name, ISO2, ISO3, numeric code, flag emoji, phone code, capital, currency code, currency name, currency symbol, top-level domain, native name, region, subregion, nationality, latitude, longitude and timezones where available |
| States/provinces | Name, state/province code, subdivision type, country code, country name, latitude and longitude |
| Cities | Name, state/province code, state/province name, country code, country name, latitude, longitude and timezone |
| Search | Country search, state/province search and city search with limit, exact-match and case-sensitivity options |
| Runtimes | Node.js, backend APIs, server-side rendering, scripts, CLIs and frontend/browser apps through `countrycity-js/browser` |

## Requirements

- Node.js 20 or newer
- npm, pnpm, yarn or another Node package manager

The default entrypoint is designed for Node.js runtimes such as servers,
scripts, CLIs, build tools and server-side rendering.

Frontend applications can use the browser entrypoint, `countrycity-js/browser`,
with the packaged JSON files served as static assets.

## Installation

```bash
npm install countrycity-js
```

## Quick Start

### Node.js And Backend

```typescript
import {
  countryCodeToFlag,
  getCitiesOfState,
  getCountryByCode,
  getStatesOfCountry,
  searchCountries,
} from "countrycity-js";

const bangladesh = await getCountryByCode("BD");
const usStates = await getStatesOfCountry("US");
const californiaCities = await getCitiesOfState("US", "CA");
const matches = await searchCountries("bangla");

console.log(bangladesh?.name); // Bangladesh
console.log(bangladesh?.iso3); // BGD
console.log(bangladesh?.currency); // BDT
console.log(bangladesh?.phoneCode); // 880
console.log(bangladesh?.latitude, bangladesh?.longitude);
console.log(countryCodeToFlag("BD"));
console.log(usStates.length);
console.log(californiaCities.some((city) => city.name === "Los Angeles"));
console.log(matches);
```

## CommonJS

```javascript
const {
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
} = require("countrycity-js");

async function main() {
  const countries = await getCountries();
  const country = await getCountryByCode("BD");
  const states = await getStatesOfCountry("BD");

  console.log(countries.length);
  console.log(country);
  console.log(states);
}

main();
```

## Browser And Frontend Usage

Use `countrycity-js/browser` in browser code. It does not import Node.js
modules. It loads JSON with `fetch()` from a public static data directory.

### 1. Copy Data To Public Assets

Copy the package data into your app's public/static folder.

macOS or Linux:

```bash
mkdir -p public/countrycity-data
cp -R node_modules/countrycity-js/dist/data/* public/countrycity-data/
```

Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force public/countrycity-data
Copy-Item -Recurse node_modules/countrycity-js/dist/data/* public/countrycity-data/
```

Your app should serve:

```text
/countrycity-data/manifest.json
/countrycity-data/countries.json
/countrycity-data/United_States-US/states.json
/countrycity-data/United_States-US/California-CA/cities.json
```

### 2. Use The Browser Client

```typescript
import { createLocationClient } from "countrycity-js/browser";

const locations = createLocationClient({
  baseUrl: "/countrycity-data",
});

const countries = await locations.getCountries();
const states = await locations.getStatesOfCountry("US");
const cities = await locations.getCitiesOfState("US", "CA");

console.log(countries.length);
console.log(states.length);
console.log(cities.some((city) => city.name === "Los Angeles"));
```

### Browser API

`createLocationClient()` returns browser-safe versions of the same async API:

```typescript
const locations = createLocationClient({
  baseUrl: "/countrycity-data",
});

await locations.getCountries();
await locations.getCountryByCode("BD");
await locations.getStatesOfCountry("US");
await locations.getCitiesOfState("US", "CA");
await locations.searchCountries("bangla");
await locations.searchStates("US", "california");
await locations.searchCities("US", "CA", "los");
locations.clearLocationCache();
```

### React Example

```tsx
import { useEffect, useMemo, useState } from "react";
import { createLocationClient, type Country } from "countrycity-js/browser";

export function CountrySelect() {
  const locations = useMemo(
    () =>
      createLocationClient({
        baseUrl: "/countrycity-data",
      }),
    [],
  );
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    void locations.getCountries().then(setCountries);
  }, [locations]);

  return (
    <select>
      {countries.map((country) => (
        <option key={country.iso2} value={country.iso2}>
          {country.emoji} {country.name}
        </option>
      ))}
    </select>
  );
}
```

### Cascading Select Pattern

For frontend forms, load data in this order:

1. Load countries when the form opens.
2. When a country is selected, load states/provinces for that country.
3. When a state/province is selected, load cities for that state/province.
4. Store the final label in the shape your product needs, for example
   `"City, State, Country"`.

This keeps the browser bundle small and avoids loading every city into the
client at once.

## Backend API Pattern

You can also use the Node/backend entrypoint to expose your own API routes.
This is useful when you do not want to copy static data into the frontend app.

### Express Example

```typescript
import express from "express";
import {
  getCitiesOfState,
  getCountries,
  getStatesOfCountry,
} from "countrycity-js";

const app = express();

app.get("/api/locations/countries", async (_request, response) => {
  response.json(await getCountries());
});

app.get("/api/locations/states/:countryCode", async (request, response) => {
  response.json(await getStatesOfCountry(request.params.countryCode));
});

app.get(
  "/api/locations/cities/:countryCode/:stateCode",
  async (request, response) => {
    response.json(
      await getCitiesOfState(
        request.params.countryCode,
        request.params.stateCode,
      ),
    );
  },
);
```

Recommended route shape:

```text
GET /api/locations/countries
GET /api/locations/states/:countryCode
GET /api/locations/cities/:countryCode/:stateCode
```

## API Overview

All data-loading and search functions are asynchronous.

### Countries

#### `getCountries(): Promise<Country[]>`

Returns all countries sorted by country name.

```typescript
const countries = await getCountries();
```

#### `getCountryByCode(countryCode: string): Promise<Country | undefined>`

Returns one country by ISO2 country code.

```typescript
const country = await getCountryByCode("US");
```

#### `getCountryWithStates(countryCode: string): Promise<CountryWithStates | undefined>`

Returns one country plus all of its states/provinces.

```typescript
const country = await getCountryWithStates("BD");
```

#### `getFullCountryData(countryCode: string): Promise<FullCountryData | undefined>`

Returns one country, its states/provinces and each state's cities.

```typescript
const fullData = await getFullCountryData("BD");
```

This can load a large amount of data for countries with many states and cities.
Prefer `getStatesOfCountry()` and `getCitiesOfState()` for normal request-time
workflows.

### States And Provinces

#### `getStatesOfCountry(countryCode: string): Promise<State[]>`

Returns states, provinces, districts or regions for a country.

```typescript
const states = await getStatesOfCountry("US");
```

#### `getStateByCode(countryCode: string, stateCode: string): Promise<State | undefined>`

Returns one state/province by country code and state code.

```typescript
const california = await getStateByCode("US", "CA");
```

#### `getStateWithCities(countryCode: string, stateCode: string): Promise<StateWithCities | undefined>`

Returns one state/province plus its cities.

```typescript
const california = await getStateWithCities("US", "CA");
```

### Cities

#### `getCitiesOfState(countryCode: string, stateCode: string): Promise<City[]>`

Returns cities for one state/province.

```typescript
const cities = await getCitiesOfState("US", "CA");
```

### Search

#### `searchCountries(query: string, options?: LocationSearchOptions): Promise<Country[]>`

Searches countries by name, ISO codes, capital, native name, nationality,
region and subregion.

```typescript
const results = await searchCountries("bangla");
```

#### `searchStates(countryCode: string, query: string, options?: LocationSearchOptions): Promise<State[]>`

Searches states/provinces inside one country.

```typescript
const results = await searchStates("US", "california");
```

#### `searchCities(countryCode: string, stateCode: string, query: string, options?: LocationSearchOptions): Promise<City[]>`

Searches cities inside one state/province.

```typescript
const results = await searchCities("US", "CA", "los");
```

Search options:

```typescript
interface LocationSearchOptions {
  limit?: number;
  caseSensitive?: boolean;
  exact?: boolean;
}
```

Defaults:

- `limit`: `20`
- maximum limit: `100`
- `caseSensitive`: `false`
- `exact`: `false`

### Flags

#### `countryCodeToFlag(iso2: string): string`

Converts a two-letter ISO2 country code to a flag emoji. Invalid codes throw a
`TypeError`.

```typescript
countryCodeToFlag("BD");
countryCodeToFlag("US");
```

#### `safeCountryCodeToFlag(iso2?: string | null): string`

Converts a two-letter ISO2 country code to a flag emoji. Invalid or missing
codes return an empty string.

```typescript
safeCountryCodeToFlag("BD");
safeCountryCodeToFlag(null);
```

### Cache

#### `clearLocationCache(): void`

Clears the in-memory cache used for loaded countries, states, cities and data
directory indexes.

```typescript
clearLocationCache();
```

## Types

```typescript
interface Country {
  id: number;
  name: string;
  iso2: string;
  iso3?: string;
  numericCode?: string;
  phoneCode?: string;
  capital?: string;
  currency?: string;
  currencyName?: string;
  currencySymbol?: string;
  topLevelDomain?: string;
  native?: string;
  region?: string;
  subregion?: string;
  nationality?: string;
  latitude?: string;
  longitude?: string;
  emoji: string;
  emojiUnicode?: string;
  timezones?: unknown[];
}

interface State {
  id: number;
  name: string;
  iso2?: string;
  type?: string;
  countryCode: string;
  countryName?: string;
  latitude?: string;
  longitude?: string;
}

interface City {
  id: number;
  name: string;
  stateCode?: string;
  stateName?: string;
  countryCode: string;
  countryName?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
}
```

## System Design

CountryCity JS is designed around predictable server-side data access instead
of bundling all city data into JavaScript.

### Data Layout

The package stores data as JSON files:

```text
dist/data/
  countries.json
  Bangladesh-BD/
    states.json
    Dhaka-13/
      cities.json
  United_States-US/
    states.json
    California-CA/
      cities.json
```

This keeps the JavaScript entry point small and lets the package load only the
country, state or city files needed by a function call.

### Runtime Flow

Node/backend entrypoint:

1. `getCountries()` loads `dist/data/countries.json`.
2. `getStatesOfCountry("US")` finds the country folder ending in `-US` and
   loads that country's `states.json`.
3. `getCitiesOfState("US", "CA")` finds the state folder ending in `-CA` and
   loads that state's `cities.json`.
4. Results are normalized into stable public TypeScript interfaces.
5. Loaded results are cached in memory for repeated calls.

Browser entrypoint:

1. `createLocationClient({ baseUrl })` creates a fetch-based client.
2. `getCountries()` fetches `${baseUrl}/countries.json`.
3. `getStatesOfCountry("US")` fetches `${baseUrl}/manifest.json`, resolves the
   country folder, then fetches that country's `states.json`.
4. `getCitiesOfState("US", "CA")` uses the manifest to resolve the state folder,
   then fetches that state's `cities.json`.
5. Loaded results are cached in memory for repeated calls.

### Why This Design

- Avoids one huge JavaScript bundle.
- Keeps npm consumers independent from upstream runtime packages.
- Allows lazy city loading.
- Keeps the public API stable even if raw data fields vary.
- Supports Node, backend, frontend and browser consumers.

### Tradeoffs

- The npm package is larger because data is shipped with it.
- The default Node entrypoint depends on Node.js file-system APIs at runtime.
- The browser entrypoint requires the data files to be served from a public URL.
- Data accuracy depends on the packaged dataset version.
- Full-country loading can be expensive for large countries.

## Error Handling

Invalid country codes must contain exactly two letters:

```typescript
await getCountryByCode("USA"); // throws TypeError
```

State codes may contain letters, numbers or hyphens:

```typescript
await getCitiesOfState("US", "CA");
```

Empty search queries throw `TypeError`:

```typescript
await searchCountries("");
```

## Development

Install dependencies:

```bash
npm install
```

Run type checking:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Build the package:

```bash
npm run build
```

Run all checks:

```bash
npm run check
```

## Build Output

The build creates:

```text
dist/
  index.js
  index.cjs
  index.d.ts
  browser.js
  browser.d.ts
  data/
```

`dist/data` is copied from `src/data` during `npm run build`.

## Publishing

Before publishing, run:

```bash
npm run check
npm pack --dry-run
```

Publish:

```bash
npm publish --access public
```

Use `--access public` for public publishing.

## Contributing

Contributions are welcome. For maintainable changes:

- Keep public API changes backward compatible where possible.
- Add or update tests for behavior changes.
- Keep data-loading lazy; do not bundle all cities into the JavaScript entry.
- Keep TypeScript strictness intact.
- Run `npm run check` before opening a pull request.

## Data And License

The package currently ships an adapted copy of geographic data from the
CountryStateCity project:

- https://github.com/dr5hn/countries-states-cities-database
- https://github.com/dr5hn/countrystatecity-npm

The geographic data is licensed under ODbL 1.0. Adapted database files remain
under the same data license and require attribution.

Runtime code in this package is independent from the upstream npm package, but
the packaged data still follows the upstream data license.

## License

ODbL-1.0
