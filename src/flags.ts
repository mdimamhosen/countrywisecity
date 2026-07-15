const REGIONAL_INDICATOR_OFFSET = 127397;

/**
 * Converts an ISO 3166-1 alpha-2 country code to a flag emoji.
 */
export function countryCodeToFlag(iso2: string): string {
  const normalizedCode = iso2.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizedCode)) {
    throw new TypeError(
      `Invalid ISO2 country code "${iso2}". Expected exactly two letters.`,
    );
  }

  return String.fromCodePoint(
    ...normalizedCode
      .split("")
      .map((character) => character.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET),
  );
}

/**
 * Safely converts an ISO2 code to a flag.
 * Returns an empty string instead of throwing an error.
 */
export function safeCountryCodeToFlag(iso2?: string | null): string {
  if (!iso2) {
    return "";
  }

  try {
    return countryCodeToFlag(iso2);
  } catch {
    return "";
  }
}
