import type { FlightOption, TravelQuery } from "@/types/travel";

// Filter functions
function filterByStops(flight: FlightOption, maxStops: number): boolean {
  return flight.stops <= maxStops;
}

function filterByAirline(flight: FlightOption, airlines: string[]): boolean {
  // Extract airline codes from flight numbers (e.g., "EY-5427" -> "EY")
  const flightAirlines = flight.flightNumbers.map((fn) => fn.split("-")[0]);
  // Check if any of the flight's airlines are in the allowed airlines list
  return flightAirlines.some((airline) => airlines.includes(airline));
}

function filterByDepartureTime(
  flight: FlightOption,
  timeSlot: string
): boolean {
  const departureDate = new Date(flight.departTime);
  const istHour = parseInt(
    departureDate.toLocaleString('en-IN', {
      hour: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    }),
    10
  );

  switch (timeSlot) {
    case "EARLY_MORNING":
      return istHour >= 0 && istHour < 8;
    case "MORNING":
      return istHour >= 8 && istHour < 12;
    case "AFTERNOON":
      return istHour >= 12 && istHour < 16;
    case "EVENING":
      return istHour >= 16 && istHour < 20;
    case "NIGHT":
      return istHour >= 20 || istHour < 0;
    default:
      return true;
  }
}

export async function flightSearchFn(
  query: TravelQuery
): Promise<FlightOption[]> {
  if (!process.env.CLEARTRIP_BASE_URL) {
    throw new Error("Flight API base URL not configured");
  }

  // Validate required parameters
  if (!query.originAirport || !query.destinationAirport) {
    throw new Error("Origin and destination airports are required");
  }

  const queryParams = new URLSearchParams({
    from: query.originAirport,
    to: query.destinationAirport,
    depart_date: query.departDate || new Date().toLocaleDateString("en-GB"),
    return_date: query.returnDate || "",
    adults: (query.passengerCount || 1).toString(),
  });

  console.log("queryParams: ", queryParams.toString());

  const res = await fetch(
    `${
      process.env.CLEARTRIP_BASE_URL
    }/node/flight/search?${queryParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
        referer:
          "https://www.cleartrip.ae/flights/international/results?adults=1&childs=0&infants=0&depart_date=13/05/2025&return_date=&intl=y&from=DXB&to=RUH&airline=&carrier=&sd=1747129807379&page=&sellingCountry=AE&ssfi=&flexi_search=&ssfc=&origin=DXB%20-%20Dubai,%20AE&destination=RUH%20-%20Riyadh,%20SA&class=Economy&sft=",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Flight API error: ${res.statusText}`);
  }

  const data = await res.json();

  // Transform the API response to match our FlightOption interface
  if (!data.cards?.length || !data.cards[0]?.length) {
    return []; // Return empty array if no flights found
  }

  let flights = data.cards[0].map((card: any) => {
    const firstFlight = card.sectorKeys[0].split("|")[0];
    const lastFlight =
      card.sectorKeys[card.sectorKeys.length - 1].split("|").pop() || "";
    const [origin, , , firstFlightInfo] = firstFlight.split("_");
    const [, dest] = lastFlight.split("_");

    // Extract all flight numbers from all sectors
    const flightNumbers = card.sectorKeys.flatMap((sector: string) =>
      sector.split("|").map((flight: string) => {
        const [, , , flightInfo] = flight.split("_");
        return flightInfo;
      })
    );

    return {
      id: card.id,
      price: card.priceBreakup.pr,
      currency: "OMR", // Assuming OMR as default currency
      flightNumbers: flightNumbers,
      departTime: card.firstDeparture.timestamp,
      arriveTime: card.lastArrival.timestamp,
      durationMinutes: card.totalDurationInMinutes,
      stops: card.maxStopsInSectors,
      bookingUrl: card.promos?.[0]?.plink || "#", // Using promo link as booking URL
      fareKey: card.priceBreakup.fare.fk,
      fareBasisCode: card.priceBreakup.fare.fb,
      originAirport: origin,
      destinationAirport: dest,
      couponData: card.priceBreakup.fare?.coupon_detail || null,
    };
  });

  // Apply filters if they exist in the query
  if (query.filters) {
    query.filters.forEach((filter) => {
      switch (filter.type) {
        case "STOPS":
          const maxStops = parseInt(filter.value);
          flights = flights.filter((flight: FlightOption) =>
            filterByStops(flight, maxStops)
          );
          break;
        case "AIRLINE":
          const airlines = filter.value.split(",").map((code) => code.trim());
          flights = flights.filter((flight: FlightOption) =>
            filterByAirline(flight, airlines)
          );
          break;
        case "DEPARTURE_TIME":
          flights = flights.filter((flight: FlightOption) =>
            filterByDepartureTime(flight, filter.value)
          );
          break;
      }
    });
  }

  return flights;
}
