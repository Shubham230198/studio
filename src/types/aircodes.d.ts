declare module "aircodes" {
  interface Airline {
    iata: string;
    icao: string;
    name: string;
    logo: string;
  }

  interface Airport {
    iata: string;
    icao: string;
    name: string;
    city: string;
    state: string;
    country: string;
  }

  export function getAirlineByIata(iataCode: string): Airline | null;
  export function getAirlineByIcao(icaoCode: string): Airline | null;
  export function getAirportByIata(iataCode: string): Airport | null;
  export function getAirportByIcao(icaoCode: string): Airport | null;
  export function findAirport(query: string): Airport[];
  export function findAirline(query: string): Airline[];
}
