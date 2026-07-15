import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { safeCountryCodeToFlag } from "./flags.js";
import type {
  City,
  Country,
  CountryWithStates,
  FullCountryData,
  State,
  StateWithCities,
} from "./types.js";

type SourceRecord = Record<string, unknown>;

const dataDirectory = join(__dirname, "data");

let countryDirectoryCache: Map<string, string> | null = null;
const stateDirectoryCache = new Map<string, Map<string, string>>();

async function readJsonFile<T>(...pathSegments: string[]): Promise<T> {
  const filePath = join(dataDirectory, ...pathSegments);
  const content = await readFile(filePath, "utf8");

  return JSON.parse(content) as T;
}

async function getCountryDirectory(countryCode: string): Promise<string | undefined> {
  if (!countryDirectoryCache) {
    const entries = await readdir(dataDirectory, {
      withFileTypes: true,
    });

    countryDirectoryCache = new Map(
      entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => {
          const code = entry.name.split("-").at(-1)?.toUpperCase() ?? "";

          return [code, entry.name] as const;
        })
        .filter(([code]) => code.length > 0),
    );
  }

  return countryDirectoryCache.get(countryCode);
}

async function getStateDirectory(
  countryCode: string,
  stateCode: string,
): Promise<string | undefined> {
  const countryDirectory = await getCountryDirectory(countryCode);

  if (!countryDirectory) {
    return undefined;
  }

  const cachedStateDirectories = stateDirectoryCache.get(countryCode);

  if (cachedStateDirectories) {
    return cachedStateDirectories.get(stateCode);
  }

  const entries = await readdir(join(dataDirectory, countryDirectory), {
    withFileTypes: true,
  });

  const stateDirectories = new Map(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const code = entry.name.split("-").at(-1)?.toUpperCase() ?? "";

        return [code, entry.name] as const;
      })
      .filter(([code]) => code.length > 0),
  );

  stateDirectoryCache.set(countryCode, stateDirectories);

  return stateDirectories.get(stateCode);
}

function stringValue(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function numberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCountryCode(code: string, fieldName: string): string {
  const normalized = code.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new TypeError(
      `${fieldName} must contain exactly two letters. Received "${code}".`,
    );
  }

  return normalized;
}

function normalizeSubdivisionCode(code: string, fieldName: string): string {
  const normalized = code.trim().toUpperCase();

  if (!/^[A-Z0-9-]{1,10}$/.test(normalized)) {
    throw new TypeError(
      `${fieldName} must contain 1 to 10 letters, numbers or hyphens. Received "${code}".`,
    );
  }

  return normalized;
}

function mapCountry(source: SourceRecord): Country {
  const iso2 = stringValue(source.iso2)?.toUpperCase() ?? "";

  return {
    id: numberValue(source.id),
    name: stringValue(source.name) ?? "",
    iso2,
    iso3: stringValue(source.iso3)?.toUpperCase(),
    numericCode:
      stringValue(source.numericCode) ??
      stringValue(source.numeric_code),
    phoneCode:
      stringValue(source.phoneCode) ??
      stringValue(source.phonecode),
    capital: stringValue(source.capital),
    currency: stringValue(source.currency),
    currencyName:
      stringValue(source.currencyName) ??
      stringValue(source.currency_name),
    currencySymbol:
      stringValue(source.currencySymbol) ??
      stringValue(source.currency_symbol),
    topLevelDomain:
      stringValue(source.topLevelDomain) ??
      stringValue(source.tld),
    native: stringValue(source.native),
    region: stringValue(source.region),
    subregion: stringValue(source.subregion),
    nationality: stringValue(source.nationality),
    latitude: stringValue(source.latitude),
    longitude: stringValue(source.longitude),
    emoji:
      stringValue(source.emoji) ??
      safeCountryCodeToFlag(iso2),
    emojiUnicode:
      stringValue(source.emojiUnicode) ??
      stringValue(source.emojiU),
    timezones: Array.isArray(source.timezones)
      ? source.timezones
      : undefined,
  };
}

function mapState(source: SourceRecord, countryCode: string): State {
  return {
    id: numberValue(source.id),
    name: stringValue(source.name) ?? "",
    iso2:
      stringValue(source.iso2)?.toUpperCase() ??
      stringValue(source.stateCode)?.toUpperCase() ??
      stringValue(source.state_code)?.toUpperCase(),
    type: stringValue(source.type),
    countryCode,
    countryName:
      stringValue(source.countryName) ??
      stringValue(source.country_name),
    latitude: stringValue(source.latitude),
    longitude: stringValue(source.longitude),
  };
}

function mapCity(
  source: SourceRecord,
  countryCode: string,
  stateCode: string,
): City {
  return {
    id: numberValue(source.id),
    name: stringValue(source.name) ?? "",
    stateCode:
      stringValue(source.stateCode)?.toUpperCase() ??
      stringValue(source.state_code)?.toUpperCase() ??
      stateCode,
    stateName:
      stringValue(source.stateName) ??
      stringValue(source.state_name),
    countryCode,
    countryName:
      stringValue(source.countryName) ??
      stringValue(source.country_name),
    latitude: stringValue(source.latitude),
    longitude: stringValue(source.longitude),
    timezone: stringValue(source.timezone),
  };
}

let countriesCache: Country[] | null = null;
const statesCache = new Map<string, State[]>();
const citiesCache = new Map<string, City[]>();

/**
 * Returns all available countries.
 */
export async function getCountries(): Promise<Country[]> {
  if (countriesCache) {
    return [...countriesCache];
  }

  const sourceCountries = await readJsonFile<SourceRecord[]>("countries.json");

  countriesCache = sourceCountries
    .map(mapCountry)
    .filter((country) => country.name && country.iso2)
    .sort((first, second) => first.name.localeCompare(second.name));

  return [...countriesCache];
}

/**
 * Returns a country by its ISO2 code.
 */
export async function getCountryByCode(
  countryCode: string,
): Promise<Country | undefined> {
  const normalizedCode = normalizeCountryCode(countryCode, "Country code");
  const countries = await getCountries();

  return countries.find(
    (country) => country.iso2 === normalizedCode,
  );
}

/**
 * Returns the states or provinces belonging to a country.
 */
export async function getStatesOfCountry(
  countryCode: string,
): Promise<State[]> {
  const normalizedCountryCode = normalizeCountryCode(
    countryCode,
    "Country code",
  );

  const cachedStates = statesCache.get(normalizedCountryCode);

  if (cachedStates) {
    return [...cachedStates];
  }

  const countryDirectory = await getCountryDirectory(normalizedCountryCode);

  if (!countryDirectory) {
    statesCache.set(normalizedCountryCode, []);

    return [];
  }

  const sourceStates = await readJsonFile<SourceRecord[]>(
    countryDirectory,
    "states.json",
  );

  const states = sourceStates
    .map((state) => mapState(state, normalizedCountryCode))
    .filter((state) => state.name)
    .sort((first, second) => first.name.localeCompare(second.name));

  statesCache.set(normalizedCountryCode, states);

  return [...states];
}

/**
 * Returns a state by country code and state code.
 */
export async function getStateByCode(
  countryCode: string,
  stateCode: string,
): Promise<State | undefined> {
  const normalizedStateCode = normalizeSubdivisionCode(
    stateCode,
    "State code",
  );

  const states = await getStatesOfCountry(countryCode);

  return states.find(
    (state) => state.iso2 === normalizedStateCode,
  );
}

/**
 * Returns the cities belonging to a state.
 */
export async function getCitiesOfState(
  countryCode: string,
  stateCode: string,
): Promise<City[]> {
  const normalizedCountryCode = normalizeCountryCode(
    countryCode,
    "Country code",
  );

  const normalizedStateCode = normalizeSubdivisionCode(
    stateCode,
    "State code",
  );

  const cacheKey = `${normalizedCountryCode}:${normalizedStateCode}`;
  const cachedCities = citiesCache.get(cacheKey);

  if (cachedCities) {
    return [...cachedCities];
  }

  const countryDirectory = await getCountryDirectory(normalizedCountryCode);
  const stateDirectory = await getStateDirectory(
    normalizedCountryCode,
    normalizedStateCode,
  );

  if (!countryDirectory || !stateDirectory) {
    citiesCache.set(cacheKey, []);

    return [];
  }

  const sourceCities = await readJsonFile<SourceRecord[]>(
    countryDirectory,
    stateDirectory,
    "cities.json",
  );

  const cities = sourceCities
    .map((city) =>
      mapCity(
        city,
        normalizedCountryCode,
        normalizedStateCode,
      ),
    )
    .filter((city) => city.name)
    .sort((first, second) => first.name.localeCompare(second.name));

  citiesCache.set(cacheKey, cities);

  return [...cities];
}

/**
 * Returns one country with all its states.
 */
export async function getCountryWithStates(
  countryCode: string,
): Promise<CountryWithStates | undefined> {
  const country = await getCountryByCode(countryCode);

  if (!country) {
    return undefined;
  }

  const states = await getStatesOfCountry(country.iso2);

  return {
    ...country,
    states,
  };
}

/**
 * Returns one state with all its cities.
 */
export async function getStateWithCities(
  countryCode: string,
  stateCode: string,
): Promise<StateWithCities | undefined> {
  const state = await getStateByCode(countryCode, stateCode);

  if (!state || !state.iso2) {
    return undefined;
  }

  const cities = await getCitiesOfState(
    countryCode,
    state.iso2,
  );

  return {
    ...state,
    cities,
  };
}

/**
 * Returns a complete country hierarchy: country -> states -> cities.
 *
 * This may return a large object.
 */
export async function getFullCountryData(
  countryCode: string,
): Promise<FullCountryData | undefined> {
  const country = await getCountryByCode(countryCode);

  if (!country) {
    return undefined;
  }

  const states = await getStatesOfCountry(country.iso2);

  const statesWithCities = await Promise.all(
    states.map(async (state): Promise<StateWithCities> => {
      const cities = state.iso2
        ? await getCitiesOfState(country.iso2, state.iso2)
        : [];

      return {
        ...state,
        cities,
      };
    }),
  );

  return {
    ...country,
    states: statesWithCities,
  };
}

/**
 * Clears the internal memory cache.
 */
export function clearLocationCache(): void {
  countriesCache = null;
  countryDirectoryCache = null;
  statesCache.clear();
  citiesCache.clear();
  stateDirectoryCache.clear();
}
