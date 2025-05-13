import aircodes from "aircodes";

console.log("Aircodes library:", aircodes);

export function getAirlineIcon(airlineCode: string): string {
  try {
    const airline = aircodes.getAirlineByIata(airlineCode);
    if (!airline) {
      console.log(`No airline found for code: ${airlineCode}`);
      return "";
    }
    return airline.logo;
  } catch (error) {
    console.error("Error fetching airline icon:", error);
    return "";
  }
}

export function getAirlineName(airlineCode: string): string {
  try {
    const airline = aircodes.getAirlineByIata(airlineCode);
    if (!airline) {
      console.log(`No airline found for code: ${airlineCode}`);
      return airlineCode;
    }
    return airline.name;
  } catch (error) {
    console.error("Error fetching airline name:", error);
    return airlineCode;
  }
}
