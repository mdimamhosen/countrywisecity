import {
  countryCodeToFlag,
  safeCountryCodeToFlag,
} from "./flags.js";
import type {
  City,
  Country,
  CountryWithStates,
  FullCountryData,
  LocationSearchOptions,
  State,
  StateWithCities,
} from "./types.js";

export {
  countryCodeToFlag,
  safeCountryCodeToFlag,
};

export type {
  City,
  Country,
  CountryWithStates,
  FullCountryData,
  LocationSearchOptions,
  State,
  StateWithCities,
};

type SourceRecord = Record<string, unknown>;

interface DataManifest {
  countries: Record<
    string,
    {
      directory: string;
      states: Record<string, string>;
    }
  >;
}

export interface BrowserLocationClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
}

export interface BrowserLocationClient {
  clearLocationCache(): void;
  getCitiesOfState(countryCode: string, stateCode: string): Promise<City[]>;
  getCountries(): Promise<Country[]>;
  getCountryByCode(countryCode: string): Promise<Country | undefined>;
  getCountryWithStates(countryCode: string): Promise<CountryWithStates | undefined>;
  getFullCountryData(countryCode: string): Promise<FullCountryData | undefined>;
  getStateByCode(countryCode: string, stateCode: string): Promise<State | undefined>;
  getStatesOfCountry(countryCode: string): Promise<State[]>;
  getStateWithCities(countryCode: string, stateCode: string): Promise<StateWithCities | undefined>;
  searchCities(
    countryCode: string,
    stateCode: string,
    query: string,
    options?: LocationSearchOptions,
  ): Promise<City[]>;
  searchCountries(query: string, options?: LocationSearchOptions): Promise<Country[]>;
  searchStates(
    countryCode: string,
    query: string,
    options?: LocationSearchOptions,
  ): Promise<State[]>;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

function normalizeLimit(limit?: number): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new TypeError("Search limit must be a positive integer.");
  }

  return Math.min(limit, MAX_LIMIT);
}

function validateQuery(query: string): string {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    throw new TypeError("Search query cannot be empty.");
  }

  return normalizedQuery;
}

function matchesText(
  value: string,
  query: string,
  options: LocationSearchOptions,
): boolean {
  const source = options.caseSensitive
    ? value
    : value.toLocaleLowerCase();

  const searchQuery = options.caseSensitive
    ? query
    : query.toLocaleLowerCase();

  return options.exact
    ? source === searchQuery
    : source.includes(searchQuery);
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

function createDataUrl(baseUrl: string, pathSegments: string[]): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const path = pathSegments
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${normalizedBaseUrl}/${path}`;
}

export function createLocationClient(
  options: BrowserLocationClientOptions,
): BrowserLocationClient {
  const fetcher = options.fetcher ?? globalThis.fetch;

  if (!fetcher) {
    throw new TypeError(
      "A fetch implementation is required to use countrycity-js/browser.",
    );
  }

  let manifestCache: DataManifest | null = null;
  let countriesCache: Country[] | null = null;
  const statesCache = new Map<string, State[]>();
  const citiesCache = new Map<string, City[]>();

  async function readJson<T>(...pathSegments: string[]): Promise<T> {
    const response = await fetcher(createDataUrl(options.baseUrl, pathSegments));

    if (!response.ok) {
      throw new Error(
        `Failed to load location data "${pathSegments.join("/")}". Received HTTP ${response.status}.`,
      );
    }

    return await response.json() as T;
  }

  async function getManifest(): Promise<DataManifest> {
    if (!manifestCache) {
      manifestCache = await readJson<DataManifest>("manifest.json");
    }

    return manifestCache;
  }

  async function getCountries(): Promise<Country[]> {
    if (countriesCache) {
      return [...countriesCache];
    }

    const sourceCountries = await readJson<SourceRecord[]>("countries.json");

    countriesCache = sourceCountries
      .map(mapCountry)
      .filter((country) => country.name && country.iso2)
      .sort((first, second) => first.name.localeCompare(second.name));

    return [...countriesCache];
  }

  async function getCountryByCode(
    countryCode: string,
  ): Promise<Country | undefined> {
    const normalizedCode = normalizeCountryCode(countryCode, "Country code");
    const countries = await getCountries();

    return countries.find((country) => country.iso2 === normalizedCode);
  }

  async function getStatesOfCountry(countryCode: string): Promise<State[]> {
    const normalizedCountryCode = normalizeCountryCode(
      countryCode,
      "Country code",
    );

    const cachedStates = statesCache.get(normalizedCountryCode);

    if (cachedStates) {
      return [...cachedStates];
    }

    const manifest = await getManifest();
    const countryDirectory =
      manifest.countries[normalizedCountryCode]?.directory;

    if (!countryDirectory) {
      statesCache.set(normalizedCountryCode, []);

      return [];
    }

    const sourceStates = await readJson<SourceRecord[]>(
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

  async function getStateByCode(
    countryCode: string,
    stateCode: string,
  ): Promise<State | undefined> {
    const normalizedStateCode = normalizeSubdivisionCode(
      stateCode,
      "State code",
    );
    const states = await getStatesOfCountry(countryCode);

    return states.find((state) => state.iso2 === normalizedStateCode);
  }

  async function getCitiesOfState(
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

    const manifest = await getManifest();
    const country = manifest.countries[normalizedCountryCode];
    const stateDirectory = country?.states[normalizedStateCode];

    if (!country || !stateDirectory) {
      citiesCache.set(cacheKey, []);

      return [];
    }

    const sourceCities = await readJson<SourceRecord[]>(
      country.directory,
      stateDirectory,
      "cities.json",
    );

    const cities = sourceCities
      .map((city) =>
        mapCity(city, normalizedCountryCode, normalizedStateCode),
      )
      .filter((city) => city.name)
      .sort((first, second) => first.name.localeCompare(second.name));

    citiesCache.set(cacheKey, cities);

    return [...cities];
  }

  async function getCountryWithStates(
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

  async function getStateWithCities(
    countryCode: string,
    stateCode: string,
  ): Promise<StateWithCities | undefined> {
    const state = await getStateByCode(countryCode, stateCode);

    if (!state || !state.iso2) {
      return undefined;
    }

    const cities = await getCitiesOfState(countryCode, state.iso2);

    return {
      ...state,
      cities,
    };
  }

  async function getFullCountryData(
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

  async function searchCountries(
    query: string,
    searchOptions: LocationSearchOptions = {},
  ): Promise<Country[]> {
    const normalizedQuery = validateQuery(query);
    const limit = normalizeLimit(searchOptions.limit);
    const countries = await getCountries();

    return countries
      .filter((country) => {
        const searchableValues = [
          country.name,
          country.iso2,
          country.iso3,
          country.capital,
          country.native,
          country.nationality,
          country.region,
          country.subregion,
        ].filter((value): value is string => Boolean(value));

        return searchableValues.some((value) =>
          matchesText(value, normalizedQuery, searchOptions),
        );
      })
      .slice(0, limit);
  }

  async function searchStates(
    countryCode: string,
    query: string,
    searchOptions: LocationSearchOptions = {},
  ): Promise<State[]> {
    const normalizedQuery = validateQuery(query);
    const limit = normalizeLimit(searchOptions.limit);
    const states = await getStatesOfCountry(countryCode);

    return states
      .filter((state) => {
        const searchableValues = [
          state.name,
          state.iso2,
          state.type,
        ].filter((value): value is string => Boolean(value));

        return searchableValues.some((value) =>
          matchesText(value, normalizedQuery, searchOptions),
        );
      })
      .slice(0, limit);
  }

  async function searchCities(
    countryCode: string,
    stateCode: string,
    query: string,
    searchOptions: LocationSearchOptions = {},
  ): Promise<City[]> {
    const normalizedQuery = validateQuery(query);
    const limit = normalizeLimit(searchOptions.limit);
    const cities = await getCitiesOfState(countryCode, stateCode);

    return cities
      .filter((city) =>
        matchesText(city.name, normalizedQuery, searchOptions),
      )
      .slice(0, limit);
  }

  function clearLocationCache(): void {
    manifestCache = null;
    countriesCache = null;
    statesCache.clear();
    citiesCache.clear();
  }

  return {
    clearLocationCache,
    getCitiesOfState,
    getCountries,
    getCountryByCode,
    getCountryWithStates,
    getFullCountryData,
    getStateByCode,
    getStatesOfCountry,
    getStateWithCities,
    searchCities,
    searchCountries,
    searchStates,
  };
}
