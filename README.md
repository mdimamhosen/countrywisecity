# Countrywise City

Countrywise City is a TypeScript package for country, state/province, city,
flag, ISO, currency, phone-code, coordinate and location search data.

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

## Requirements

- Node.js 20 or newer
- npm, pnpm, yarn or another Node package manager

This package reads packaged JSON files from disk, so it is designed for Node.js
runtime environments such as servers, scripts, CLIs, build tools and server-side
rendering. It is not intended as a direct browser bundle.

## Installation

```bash
npm install @mdimamkhan/countrywisecity
```

## Quick Start

```typescript
import {
  countryCodeToFlag,
  getCitiesOfState,
  getCountryByCode,
  getStatesOfCountry,
  searchCountries,
} from "@mdimamkhan/countrywisecity";

const bangladesh = await getCountryByCode("BD");
const usStates = await getStatesOfCountry("US");
const californiaCities = await getCitiesOfState("US", "CA");
const matches = await searchCountries("bangla");

console.log(bangladesh?.name); // Bangladesh
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
} = require("@mdimamkhan/countrywisecity");

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

Countrywise City is designed around predictable server-side data access instead
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

1. `getCountries()` loads `dist/data/countries.json`.
2. `getStatesOfCountry("US")` finds the country folder ending in `-US` and
   loads that country's `states.json`.
3. `getCitiesOfState("US", "CA")` finds the state folder ending in `-CA` and
   loads that state's `cities.json`.
4. Results are normalized into stable public TypeScript interfaces.
5. Loaded results are cached in memory for repeated calls.

### Why This Design

- Avoids one huge JavaScript bundle.
- Keeps npm consumers independent from upstream runtime packages.
- Allows lazy city loading.
- Keeps the public API stable even if raw data fields vary.
- Supports both ESM and CommonJS consumers.

### Tradeoffs

- The npm package is larger because data is shipped with it.
- The package depends on Node.js file-system APIs at runtime.
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

Because the package is scoped, public publishing requires `--access public` on
the first publish.

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
