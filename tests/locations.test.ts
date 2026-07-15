import { describe, expect, it } from "vitest";

import {
  countryCodeToFlag,
  getCitiesOfState,
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
  searchCountries,
  searchCities,
  searchStates,
} from "../src/index.js";

describe("countryCodeToFlag", () => {
  it("creates the Bangladesh flag", () => {
    expect(countryCodeToFlag("BD")).toBe(String.fromCodePoint(127463, 127465));
  });

  it("accepts lowercase country codes", () => {
    expect(countryCodeToFlag("us")).toBe(String.fromCodePoint(127482, 127480));
  });

  it("throws for invalid codes", () => {
    expect(() => countryCodeToFlag("BAN")).toThrow(TypeError);
  });
});

describe("country functions", () => {
  it("returns countries", async () => {
    const countries = await getCountries();

    expect(countries.length).toBeGreaterThan(200);
  });

  it("returns Bangladesh by ISO2 code", async () => {
    const bangladesh = await getCountryByCode("BD");

    expect(bangladesh).toBeDefined();
    expect(bangladesh?.name).toBe("Bangladesh");
    expect(bangladesh?.emoji).toBe(String.fromCodePoint(127463, 127465));
  });

  it("returns country metadata for flags, ISO, currency, phone and coordinates", async () => {
    const bangladesh = await getCountryByCode("BD");

    expect(bangladesh).toMatchObject({
      name: "Bangladesh",
      iso2: "BD",
      iso3: "BGD",
      numericCode: "050",
      phoneCode: "880",
      capital: "Dhaka",
      currency: "BDT",
      currencyName: "Bangladeshi taka",
      region: "Asia",
      subregion: "Southern Asia",
      nationality: "Bangladeshi",
      latitude: "24.00000000",
      longitude: "90.00000000",
      emoji: String.fromCodePoint(127463, 127465),
    });
  });

  it("searches countries", async () => {
    const results = await searchCountries("Bangla");

    expect(
      results.some(
        (country) => country.iso2 === "BD",
      ),
    ).toBe(true);
  });
});

describe("state and city functions", () => {
  it("returns states or divisions", async () => {
    const states = await getStatesOfCountry("BD");

    expect(Array.isArray(states)).toBe(true);
    expect(states.length).toBeGreaterThan(0);
  });

  it("returns state metadata with codes and coordinates", async () => {
    const states = await getStatesOfCountry("US");
    const california = states.find((state) => state.iso2 === "CA");

    expect(california).toMatchObject({
      name: "California",
      iso2: "CA",
      type: "state",
      countryCode: "US",
      latitude: "36.70146310",
      longitude: "-118.75599700",
    });
  });

  it("returns cities for a valid state", async () => {
    const states = await getStatesOfCountry("US");
    const california = states.find(
      (state) => state.iso2 === "CA",
    );

    expect(california).toBeDefined();

    const cities = await getCitiesOfState("US", "CA");

    expect(cities.length).toBeGreaterThan(0);
    expect(
      cities.some((city) => city.name === "Los Angeles"),
    ).toBe(true);
  });

  it("returns city metadata with country, state, coordinates and timezone", async () => {
    const cities = await getCitiesOfState("US", "CA");
    const losAngeles = cities.find((city) => city.name === "Los Angeles");

    expect(losAngeles).toMatchObject({
      name: "Los Angeles",
      stateCode: "CA",
      countryCode: "US",
      latitude: "34.05223000",
      longitude: "-118.24368000",
      timezone: "America/Los_Angeles",
    });
  });

  it("searches countries, states and cities", async () => {
    const countries = await searchCountries("Bangla");
    const states = await searchStates("US", "california");
    const cities = await searchCities("US", "CA", "Los Angeles", {
      exact: true,
    });

    expect(countries.some((country) => country.iso2 === "BD")).toBe(true);
    expect(states.some((state) => state.iso2 === "CA")).toBe(true);
    expect(cities.some((city) => city.name === "Los Angeles")).toBe(true);
  });
});
