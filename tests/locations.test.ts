import { describe, expect, it } from "vitest";

import {
  countryCodeToFlag,
  getCitiesOfState,
  getCountries,
  getCountryByCode,
  getStatesOfCountry,
  searchCountries,
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
});
