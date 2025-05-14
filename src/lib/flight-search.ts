import type { FlightOption, TravelQuery } from "@/types/travel";

interface SearchAPIResponse {
  cards: Array<
    Array<{
      id: string;
      sectorKeys: string[];
      airlineCodes: string[];
      priceBreakup: {
        pr: number;
        fare: {
          fk: string;
          fb: string;
        };
      };
      firstDeparture: {
        time: string;
        date: string;
        timestamp: number;
      };
      lastArrival: {
        time: string;
        date: string;
        timestamp: number;
      };
      totalDurationInMinutes: number;
      maxStopsInSectors: number;
    }>
  >;
  sectors: Record<
    string,
    {
      stops: number;
      flights: {
        segments: Array<{
          flightNumber: string;
          airlineCodes: string[];
          departure: {
            airportCode: string;
            time: string;
            date: string;
          };
          arrival: {
            airportCode: string;
            time: string;
            date: string;
          };
        }>;
      };
    }
  >;
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
    depart_date: query.departDate || "",
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

  return data.cards[0].map((card: any) => {
    console.log("card: ", card);
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

    console.log("flightNumbers: ", flightNumbers);

    return {
      id: card.id,
      price: card.priceBreakup.pr,
      currency: "AED", // Assuming AED as default currency
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
}
