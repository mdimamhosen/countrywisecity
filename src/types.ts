export interface Country {
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

export interface State {
  id: number;
  name: string;
  iso2?: string;
  type?: string;
  countryCode: string;
  countryName?: string;
  latitude?: string;
  longitude?: string;
}

export interface City {
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

export interface LocationSearchOptions {
  limit?: number;
  caseSensitive?: boolean;
  exact?: boolean;
}

export interface CountryWithStates extends Country {
  states: State[];
}

export interface StateWithCities extends State {
  cities: City[];
}

export interface FullCountryData extends Country {
  states: StateWithCities[];
}
