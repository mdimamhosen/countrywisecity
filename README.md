# Countrywise City

A TypeScript library for countries, country flags, states, provinces,
cities, ISO codes, currencies and geographic search.

This package ships its own local country, state and city JSON data. It does
not require a runtime dependency on another country-state-city npm package.

## Features

- 250+ countries
- 5,000+ states and regions
- 150,000+ cities
- Country flag emojis
- ISO2 and ISO3 codes
- Currency and phone information
- Latitude and longitude
- Country, state and city search
- TypeScript support
- ESM and CommonJS support

## Installation

```bash
npm install @mdimamkhan/countrywisecity
```

Replace the GitHub and author metadata in `package.json` with your real
repository details before publishing.

## Usage

```typescript
import {
  countryCodeToFlag,
  getCitiesOfState,
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
  searchCountries,
} from "@mdimamkhan/countrywisecity";

const countries = await getCountries();
const bangladesh = await getCountryByCode("BD");
const states = await getStatesOfCountry("BD");
const cities = await getCitiesOfState("US", "CA");
const searchResults = await searchCountries("bangla");

console.log(countries.length);
console.log(bangladesh);
console.log(states);
console.log(cities);
console.log(searchResults);
console.log(countryCodeToFlag("BD"));
```

## API

### Country functions

- `getCountries()`
- `getCountryByCode(countryCode)`
- `getCountryWithStates(countryCode)`
- `getFullCountryData(countryCode)`

### State functions

- `getStatesOfCountry(countryCode)`
- `getStateByCode(countryCode, stateCode)`
- `getStateWithCities(countryCode, stateCode)`

### City functions

- `getCitiesOfState(countryCode, stateCode)`

### Search functions

- `searchCountries(query, options)`
- `searchStates(countryCode, query, options)`
- `searchCities(countryCode, stateCode, query, options)`

Search options:

```typescript
interface LocationSearchOptions {
  limit?: number;
  caseSensitive?: boolean;
  exact?: boolean;
}
```

### Flag functions

- `countryCodeToFlag(iso2)`
- `safeCountryCodeToFlag(iso2)`

## CommonJS

```javascript
const {
  getCountries,
  getStatesOfCountry,
  getCitiesOfState,
} = require("@mdimamkhan/countrywisecity");

async function main() {
  const countries = await getCountries();
  console.log(countries);
}

main();
```

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

Run all checks:

```bash
npm run check
```

## Publishing

Before publishing, update these fields in `package.json` and this README:

- `name`
- `author`
- `homepage`
- `repository`
- `bugs`

Then verify:

```bash
npm run check
npm pack --dry-run
npm publish --access public
```

## Data Attribution

The packaged geographic data is adapted from the CountryStateCity project:

- https://github.com/dr5hn/countries-states-cities-database
- https://github.com/dr5hn/countrystatecity-npm

The geographic data is licensed under ODbL 1.0. Adapted database files remain
under the same data license.

## License

ODbL-1.0
