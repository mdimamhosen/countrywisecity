import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createLocationClient } from "../src/browser.js";

const baseUrl = "https://example.test/countrycity-data";

async function fixtureFetcher(input: string | URL | Request): Promise<Response> {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url,
  );
  const relativePath = url.pathname.replace("/countrycity-data/", "");
  const pathSegments = relativePath.split("/").map(decodeURIComponent);

  try {
    const content = await readFile(
      join(process.cwd(), "src", "data", ...pathSegments),
      "utf8",
    );

    return new Response(content, {
      headers: {
        "content-type": "application/json",
      },
      status: 200,
    });
  } catch {
    return new Response("Not found", {
      status: 404,
    });
  }
}

describe("browser client", () => {
  it("loads countries, states and cities through fetch", async () => {
    const locations = createLocationClient({
      baseUrl,
      fetcher: fixtureFetcher as typeof fetch,
    });

    const country = await locations.getCountryByCode("BD");
    const states = await locations.getStatesOfCountry("US");
    const cities = await locations.getCitiesOfState("US", "CA");
    const losAngeles = cities.find((city) => city.name === "Los Angeles");

    expect(country).toMatchObject({
      name: "Bangladesh",
      iso2: "BD",
      iso3: "BGD",
      phoneCode: "880",
      currency: "BDT",
      latitude: "24.00000000",
      longitude: "90.00000000",
    });
    expect(states.length).toBeGreaterThan(0);
    expect(losAngeles).toMatchObject({
      name: "Los Angeles",
      stateCode: "CA",
      countryCode: "US",
      latitude: "34.05223000",
      longitude: "-118.24368000",
    });
  });

  it("searches through the browser client", async () => {
    const locations = createLocationClient({
      baseUrl,
      fetcher: fixtureFetcher as typeof fetch,
    });

    const countries = await locations.searchCountries("Bangla");
    const states = await locations.searchStates("US", "california");
    const cities = await locations.searchCities("US", "CA", "los");

    expect(countries.some((country) => country.iso2 === "BD")).toBe(true);
    expect(states.some((state) => state.iso2 === "CA")).toBe(true);
    expect(cities.length).toBeGreaterThan(0);
  });
});
