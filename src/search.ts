import {
  getCitiesOfState,
  getCountries,
  getStatesOfCountry,
} from "./locations.js";

import type {
  City,
  Country,
  LocationSearchOptions,
  State,
} from "./types.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizeLimit(limit?: number): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new TypeError("Search limit must be a positive integer.");
  }

  return Math.min(limit, MAX_LIMIT);
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

function validateQuery(query: string): string {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    throw new TypeError("Search query cannot be empty.");
  }

  return normalizedQuery;
}

/**
 * Searches countries by name, ISO2, ISO3, capital or nationality.
 */
export async function searchCountries(
  query: string,
  options: LocationSearchOptions = {},
): Promise<Country[]> {
  const normalizedQuery = validateQuery(query);
  const limit = normalizeLimit(options.limit);
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
        matchesText(value, normalizedQuery, options),
      );
    })
    .slice(0, limit);
}

/**
 * Searches states inside one country.
 */
export async function searchStates(
  countryCode: string,
  query: string,
  options: LocationSearchOptions = {},
): Promise<State[]> {
  const normalizedQuery = validateQuery(query);
  const limit = normalizeLimit(options.limit);
  const states = await getStatesOfCountry(countryCode);

  return states
    .filter((state) => {
      const searchableValues = [
        state.name,
        state.iso2,
        state.type,
      ].filter((value): value is string => Boolean(value));

      return searchableValues.some((value) =>
        matchesText(value, normalizedQuery, options),
      );
    })
    .slice(0, limit);
}

/**
 * Searches cities inside one state.
 */
export async function searchCities(
  countryCode: string,
  stateCode: string,
  query: string,
  options: LocationSearchOptions = {},
): Promise<City[]> {
  const normalizedQuery = validateQuery(query);
  const limit = normalizeLimit(options.limit);

  const cities = await getCitiesOfState(
    countryCode,
    stateCode,
  );

  return cities
    .filter((city) =>
      matchesText(city.name, normalizedQuery, options),
    )
    .slice(0, limit);
}
